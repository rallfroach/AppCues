const express = require('express');
const router = express.Router();
const connection = require('../public/js/conexion');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs'); // Asegúrate de importar 'fs'

// Endpoint GET para obtener los cuestionarios asignados a un usuario
router.get('/cuestionarios/:usuario_id', (req, res) => {
  const usuarioId = req.params.usuario_id;

  const query = `
    SELECT A.IDCuestionario, B.Titulo,B.material_apoyo, A.fecha_asignacion,A.estado_cuestionario, A.estado_resultados, A.numero_intentos FROM asignaciones_cuestionarios as A 
    INNER JOIN idcuestionarios as B 
    ON B.IDCuestionario = A.IDCuestionario
    WHERE A.usuario_id = ? AND (
      A.estado_cuestionario IS NULL 
      OR A.estado_cuestionario != 'COMPLETADO'
      OR (A.estado_cuestionario = 'COMPLETADO' AND A.estado_resultados = 'Reprobado' )
    )
  `;

  connection.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay cuestionarios asignados para este usuario' });
    }

    res.json(results);
  });
});



router.get('/cuestionarios/:IDCuestionario/preguntas', (req, res) => {
    const { IDCuestionario } = req.params;
  
    const query = `
      SELECT 
        B.TituloPregunta, 
        B.Opcion1, 
        B.Opcion2, 
        B.Opcion3, 
        B.Opcion4 
      FROM asignaciones_cuestionarios AS A
      INNER JOIN cuestionarios AS B ON B.IDCuestionario = A.IDCuestionario
      WHERE A.IDCuestionario = ? 
    `;
  
    connection.query(query, [IDCuestionario], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'No se encontraron preguntas para este cuestionario' });
      }
  
      res.json(results);
    });
  });
  




router.get('/cuestionariosID/:IDCuestionario/:usuario_id', (req, res) => {
  const { IDCuestionario, usuario_id } = req.params;

  const query = `
    SELECT c.IDCuestionario, COUNT(DISTINCT c.TituloPregunta) AS totalPreguntas, 
           ic.tiempo_limite, ac.tiempo_restante, ic.material_apoyo, ac.numero_intentos
    FROM cuestionarios AS c
    INNER JOIN idcuestionarios AS ic ON c.IDCuestionario = ic.IDCuestionario
    INNER JOIN asignaciones_cuestionarios AS ac ON c.IDCuestionario = ac.IDCuestionario
    WHERE c.IDCuestionario = ? AND ac.usuario_id = ?
    GROUP BY c.IDCuestionario, ic.tiempo_limite, ac.tiempo_restante, ic.material_apoyo, ac.numero_intentos;
  `;

  connection.query(query, [IDCuestionario, usuario_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontraron datos para este cuestionario y usuario' });
    }

    res.json(results[0]); // Devuelve los resultados de la consulta
  });
});
  




router.post('/cuestionarios/:IDCuestionario/guardar', (req, res) => {
  const { IDCuestionario } = req.params;
  const { usuarioId, respuestas } = req.body;

  console.log('Datos recibidos del frontend:', {
    IDCuestionario,
    usuarioId,
    respuestas,
  });

  if (!usuarioId || !respuestas || respuestas.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Iterar sobre las respuestas para determinar la opción seleccionada
  const queryGetPreguntas = `
    SELECT TituloPregunta, Opcion1, Opcion2, Opcion3, Opcion4 
    FROM cuestionarios 
    WHERE IDCuestionario = ?
  `;

  connection.query(queryGetPreguntas, [IDCuestionario], (err, questions) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener preguntas del cuestionario' });
    }

    const values = respuestas.map((respuesta) => {
      const pregunta = questions.find(
        (q) => q.TituloPregunta === respuesta.TituloPregunta
      );

      if (!pregunta) {
        console.error(`No se encontró la pregunta para ${respuesta.TituloPregunta}`);
        return null;
      }

      // Determinar la opción seleccionada
      let opcionSeleccionada = null;
      if (pregunta.Opcion1 === respuesta.respuesta) {
        opcionSeleccionada = 'Opción 1';
      } else if (pregunta.Opcion2 === respuesta.respuesta) {
        opcionSeleccionada = 'Opción 2';
      } else if (pregunta.Opcion3 === respuesta.respuesta) {
        opcionSeleccionada = 'Opción 3';
      } else if (pregunta.Opcion4 === respuesta.respuesta) {
        opcionSeleccionada = 'Opción 4';
      }

      return [
        usuarioId,
        IDCuestionario,
        respuesta.TituloPregunta,
        respuesta.respuesta,
        opcionSeleccionada,
        new Date(), // Fecha actual
      ];
    });

    // Filtrar valores nulos (por si alguna pregunta no coincidió)
    const filteredValues = values.filter((v) => v !== null);

    // Procesar cada respuesta individualmente
    const queryCheck = `
      SELECT 1 FROM respuestas_usuarios
      WHERE usuario_id = ? AND IDCuestionario = ? AND TituloPregunta = ?
    `;

    const queryUpdate = `
      UPDATE respuestas_usuarios
      SET respuesta_usuario = ?, opcion_seleccionada = ?, fecha_respuesta = ?
      WHERE usuario_id = ? AND IDCuestionario = ? AND TituloPregunta = ?
    `;

    const queryInsert = `
      INSERT INTO respuestas_usuarios (usuario_id, IDCuestionario, TituloPregunta, respuesta_usuario, opcion_seleccionada, fecha_respuesta)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const promises = filteredValues.map((respuesta) => {
      return new Promise((resolve, reject) => {
        const [usuarioId, IDCuestionario, TituloPregunta, respuestaUsuario, opcionSeleccionada, fechaRespuesta] = respuesta;

        // Verificar si ya existe el registro
        connection.query(queryCheck, [usuarioId, IDCuestionario, TituloPregunta], (err, results) => {
          if (err) return reject(err);

          if (results.length > 0) {
            // Actualizar el registro existente
            connection.query(
              queryUpdate,
              [respuestaUsuario, opcionSeleccionada, fechaRespuesta, usuarioId, IDCuestionario, TituloPregunta],
              (err) => {
                if (err) return reject(err);
                resolve('updated');
              }
            );
          } else {
            // Insertar un nuevo registro
            connection.query(
              queryInsert,
              [usuarioId, IDCuestionario, TituloPregunta, respuestaUsuario, opcionSeleccionada, fechaRespuesta],
              (err) => {
                if (err) return reject(err);
                resolve('inserted');
              }
            );
          }
        });
      });
    });

    // Esperar a que todas las respuestas sean procesadas
    Promise.all(promises)
      .then(() => {
        // Actualizar el estado del cuestionario a "COMPLETADO"
        const queryUpdateEstado = `
          UPDATE asignaciones_cuestionarios
          SET estado_cuestionario = 'COMPLETADO'
          WHERE IDCuestionario = ? AND usuario_id = ?
        `;

        connection.query(queryUpdateEstado, [IDCuestionario, usuarioId], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar el estado del cuestionario' });
          }

          res.json({
            message: 'Respuestas guardadas y estado del cuestionario actualizado correctamente',
          });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Error al procesar las respuestas' });
      });
  });
});







router.get('/cuestionarios/:IDCuestionario/preguntas-validar', (req, res) => {
  const { IDCuestionario } = req.params;
  const { usuarioId } = req.query;
  
  console.log('IDCuestionario:', IDCuestionario);
  console.log('Usuario ID:', usuarioId);

  const query = `
    SELECT 
      B.IDCuestionario,
      B.TituloPregunta, 
      B.Opcion1, 
      B.Opcion2, 
      B.Opcion3, 
      B.Opcion4,
      B.Valida
    FROM asignaciones_cuestionarios AS A
    INNER JOIN cuestionarios AS B ON B.IDCuestionario = A.IDCuestionario
    WHERE A.IDCuestionario = ? AND A.usuario_id = ?;
  `;

  connection.query(query, [IDCuestionario, usuarioId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontraron preguntas para este cuestionario' });
    }

    res.json(results);
  });
});
   




router.post('/cuestionarios/guardar-tiempo', (req, res) => {
  const { IDCuestionario, usuario_id, tiempo_restante } = req.body;

  console.log('Solicitud recibida en /guardar-tiempo:', req.body);

  const query = `
    UPDATE asignaciones_cuestionarios
    SET tiempo_restante = ?
    WHERE IDCuestionario = ? AND usuario_id = ?;
  `;

  connection.query(query, [tiempo_restante, IDCuestionario, usuario_id], (err) => {
    if (err) {
      console.error('Error al guardar tiempo restante:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    res.status(200).json({ message: 'Tiempo restante actualizado correctamente' });
  });
});






router.post('/cuestionarios/:IDCuestionario/actualizar-intentos', (req, res) => {
  const { usuarioId, estadoResultados } = req.body;

  if (!usuarioId || !estadoResultados) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }

  const queryGetIntentos = `
    SELECT numero_intentos 
    FROM asignaciones_cuestionarios 
    WHERE usuario_id = ? AND IDCuestionario = ?
  `;

  connection.query(queryGetIntentos, [usuarioId, req.params.IDCuestionario], (err, results) => {
    if (err) {
      console.error('Error al consultar intentos:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar intentos' });
    }

    let numeroIntentos = 1; // Valor inicial
    if (results.length > 0) {
      numeroIntentos = results[0].numero_intentos + 1; // Incrementar intentos
    }

    const queryUpdate = `
      UPDATE asignaciones_cuestionarios
      SET estado_resultados = ?, numero_intentos = ?
      WHERE usuario_id = ? AND IDCuestionario = ?
    `;

    connection.query(queryUpdate, [estadoResultados, numeroIntentos, usuarioId, req.params.IDCuestionario], (err) => {
      if (err) {
        console.error('Error al actualizar:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar el cuestionario' });
      }

      res.json({ success: true, message: 'Estado y número de intentos actualizados correctamente' });
    });
  });
});








router.post('/cuestionarios/:IDCuestionario/bloquear', (req, res) => {
  const { IDCuestionario } = req.params;
  const { usuarioId, estado } = req.body;

  if (!usuarioId || !estado) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  // Primero consulta el número actual de intentos
  const queryGetIntentos = `
    SELECT numero_intentos 
    FROM asignaciones_cuestionarios 
    WHERE usuario_id = ? AND IDCuestionario = ?
  `;

  connection.query(queryGetIntentos, [usuarioId, IDCuestionario], (err, results) => {
    if (err) {
      console.error('Error al consultar intentos:', err);
      return res.status(500).json({ error: 'Error al consultar intentos' });
    }

    let numeroIntentos = 1; // Valor inicial por defecto
    if (results.length > 0) {
      numeroIntentos = results[0].numero_intentos + 1; // Incrementa los intentos
    }

    // Actualiza el estado y el número de intentos
    const queryUpdate = `
      UPDATE asignaciones_cuestionarios
      SET estado_resultados = ?, numero_intentos = ?
      WHERE usuario_id = ? AND IDCuestionario = ?
    `;

    connection.query(queryUpdate, [estado, numeroIntentos, usuarioId, IDCuestionario], (err) => {
      if (err) {
        console.error('Error al actualizar estado y número de intentos:', err);
        return res.status(500).json({ error: 'Error al actualizar el cuestionario' });
      }

      res.json({ success: true, message: 'Estado del cuestionario actualizado a BLOQUEADO y número de intentos incrementado.' });
    });
  });
});







router.post('/generar-diploma', async (req, res) => {
  const { nombreUsuario, dniUsuario, tituloCuestionario, duracion, fecha, contenido,IDCuestionario,fechaInicio, fechaFin} = req.body;

  try {
    const templatePath = path.join(__dirname, 'templates', 'diploma_template.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar marcadores en la plantilla
    htmlContent = htmlContent
      .replace('{{nombreUsuario}}', nombreUsuario)
      .replace('{{dniUsuario}}', dniUsuario)
      .replace('{{tituloCuestionario}}', tituloCuestionario)
      .replace('{{duracion}}', duracion)
      .replace('{{duracion2}}', duracion)
      .replace('{{duracion3}}', duracion)
      .replace('{{fecha}}', fecha)
      .replace('{{contenido}}', contenido)
      .replace('{{finicio}}', fechaInicio)
      .replace('{{ffin}}', fechaFin)
      

      
      


      
      

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();  

    // Cargar contenido directamente
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generar PDF
    const pdfPath = path.join('C:/MaterialPDF/Diplomas', `${nombreUsuario}-${tituloCuestionario}-${IDCuestionario}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      landscape: true,
      preferCSSPageSize: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    res.json({
      success: true,
      pdfUrl: `http://localhost:3000/pdf/${nombreUsuario}-${tituloCuestionario}-${IDCuestionario}.pdf`,
    });
  } catch (error) {
    console.error('Error al generar el diploma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el diploma.',
    });
  }
});



// Nuevo endpoint para obtener datos necesarios para generar diploma
router.get('/obtener-datos-diploma/:IDCuestionario/:usuarioId', (req, res) => {
  const { usuarioId, IDCuestionario } = req.params;
  console.log('Parámetros recibidos para el diploma:', { IDCuestionario, usuarioId });
  const query = `
      SELECT 
      us.username, 
      us.apellido, 
      ac.estado_resultados, 
      id.IDCuestionario, 
      id.Titulo, 
      id.tiempo_limite,
      id.Contenido,
      ac.fecha_asignacion,
      ru.fecha_respuesta
    FROM 
      users as us
    INNER JOIN 
      asignaciones_cuestionarios as ac ON ac.usuario_id = us.id
    INNER JOIN 
      idcuestionarios as id ON id.IDCuestionario = ac.IDCuestionario
    INNER JOIN 
      (SELECT DISTINCT usuario_id, IDCuestionario, fecha_respuesta
    FROM respuestas_usuarios) as ru ON ru.usuario_id = ac.usuario_id AND ru.IDCuestionario = id.IDCuestionario
    WHERE 
      us.id = ? AND id.IDCuestionario = ? AND ac.estado_resultados = 'Aprobado';
  `;
  console.log('Ejecutando consulta SQL con parámetros:', [usuarioId, IDCuestionario]);
  connection.query(query, [usuarioId, IDCuestionario], (err, results) => { 
    if (err) {
      console.error('Error al obtener los datos del diploma:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener los datos.' });
    }
    if (results.length === 0) {
      console.log('No se encontraron datos para los parámetros:', { usuarioId, IDCuestionario });
      return res.status(404).json({ success: false, message: 'No se encontraron datos para generar el diploma.' });
    }
    res.json({ success: true, data: results[0] });
  });
});



module.exports = router;
