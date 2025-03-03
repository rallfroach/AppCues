const express = require('express');
const router = express.Router();
const connection = require('../public/js/conexion.js'); 
const multer = require("multer");
const path = require("path");
const enviarCorreo = require('./mailer');


/* Endpoint para guardar los registros en la tbla de cuestiionarios */
router.post('/save-quiz', (req, res) => {
  const { quizData } = req.body;

  if (!quizData || !quizData.preguntas || quizData.preguntas.length === 0) {
    return res.status(400).json({ success: false, message: 'No hay datos para guardar.' });
  }

 
  const insertQuery =
    'INSERT INTO cuestionarios (IDCuestionario, TituloPregunta, Opcion1, Opcion2, Opcion3, Opcion4, Valida) VALUES ?';

  const values = quizData.preguntas.map((question) => [
    quizData.idCuestionario, 
    question.tituloPregunta,
    question.opcion1,
    question.opcion2,
    question.opcion3,
    question.opcion4,
    question.valida,
  ]);
  connection.query(insertQuery, [values], (err, results) => {
    if (err) {
      console.error('Error al guardar el cuestionario en la base de datos:', err);
      return res.status(500).json({ success: false, message: 'Error al guardar en la base de datos.' });
    }
    res.json({ success: true, message: 'Cuestionario guardado exitosamente.', results });
  });
});



router.post('/save-departamento-cuestionario', (req, res) => {
  const { idCuestionario, departamentos, fecha_vigencia, tiempolimite } = req.body;

  if (!idCuestionario || !Array.isArray(departamentos) || departamentos.length === 0 || !fecha_vigencia || !tiempolimite) {
    return res.status(400).json({ error: 'Datos incompletos. Se requiere idCuestionario, departamentos, fecha_vigencia y tiempolimite.' });
  }

  // Construimos las consultas SQL dinámicamente
  const values = departamentos.map(dept => [dept, idCuestionario, fecha_vigencia, tiempolimite]);
  const query = `
    INSERT INTO departamento_cuestionario (ID_departamento, ID_cuestionario, fecha_creacion, tiempo_limite)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      fecha_creacion = VALUES(fecha_creacion),
      tiempo_limite = VALUES(tiempo_limite);
  `;

  connection.query(query, [values], (err, results) => {
    if (err) {
      console.error('Error al guardar los departamentos asociados al cuestionario:', err);
      return res.status(500).json({ error: 'Error en el servidor al guardar los departamentos.' });
    }
    res.json({ success: true, message: 'Departamentos asociados correctamente al cuestionario.' });
  });
});




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "C:/MaterialPDF"); // Carpeta para guardar PDFs
  },
  filename: (req, file, cb) => {
    const idCuestionario = req.body.idCuestionario || "sin-id"; // Usar el ID del cuestionario o un valor por defecto
    const originalName = file.originalname;
    cb(null, `${Date.now()}-${idCuestionario}-${file.originalname}`);
  },
});
const upload = multer({ storage }); // Configuración de multer

/* Endpoint para guardar ID en tabla idcuestionarios */
router.post("/save-idcuestionario", upload.single("materialCuestionario"), (req, res) => {
  const { idCuestionario, titulo, fecha_creacion, tiempo_limite ,contenido, vigencia } = req.body;
  const materialPath = req.file ? req.file.filename : null; // Ruta del archivo subido

  console.log("Datos recibidos:", { idCuestionario, titulo, fecha_creacion, tiempo_limite, materialPath, contenido, vigencia });

  if (!idCuestionario || !titulo || !fecha_creacion || !tiempo_limite ||!contenido ||!vigencia) {
    return res.status(400).json({ success: false, message: "Faltan datos para guardar." });
  }
  const insertQuery = `
    INSERT INTO idcuestionarios (IDCuestionario, Titulo, fecha_creacion, tiempo_limite, material_apoyo, Contenido, vigencia)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  connection.query(insertQuery, [idCuestionario, titulo, fecha_creacion, tiempo_limite, materialPath, contenido, vigencia], (err, results) => {
    if (err) {
      console.error("Error al guardar el ID del cuestionario:", err);
      return res.status(500).json({ success: false, message: "Error al guardar en la base de datos." });
    }
    res.json({ success: true, message: "ID, título y material de apoyo guardados exitosamente.", results });
  });
});










router.get('/listar-cuestionarios', (req, res) => {
  const { id, date } = req.query;
  let query = 'SELECT IdCuestionario, titulo, fecha_creacion FROM idcuestionarios';
  const params = [];

  if (id) {
    query += ' WHERE IdCuestionario = ?';
    params.push(id);
  } else if (date) {
    query += ' WHERE fecha_creacion = ?';
    params.push(date);
  }
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Error al obtener los cuestionarios:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener los cuestionarios' });
    }
    res.json({ success: true, data: results });
  });
});




router.get('/get-cuestionario/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      idcuestionarios.IdCuestionario, 
      idcuestionarios.titulo, 
      cuestionarios.TituloPregunta, 
      cuestionarios.Opcion1, 
      cuestionarios.Opcion2, 
      cuestionarios.Opcion3, 
      cuestionarios.Opcion4, 
      cuestionarios.Valida 
    FROM idcuestionarios
    JOIN cuestionarios ON idcuestionarios.IdCuestionario = cuestionarios.IdCuestionario
    WHERE idcuestionarios.IdCuestionario = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el cuestionario:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener el cuestionario.' });
    }
    res.json({ success: true, data: results });
  });
});






router.post("/update-cuestionarios", async (req, res) => {
  const { ID_Cuestionario, preguntas } = req.body;

  if (!ID_Cuestionario || !preguntas || preguntas.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos en la solicitud.",
    });
  }
  try {
    const updates = preguntas.map((pregunta) => {
      const query = `
        UPDATE cuestionarios
        SET TituloPregunta = ?, Opcion1 = ?, Opcion2 = ?, Opcion3 = ?, Opcion4 = ?, Valida = ?
        WHERE IdCuestionario = ? AND TituloPregunta = ?
      `;
      const values = [
        pregunta.texto,
        pregunta.opciones[0],
        pregunta.opciones[1],
        pregunta.opciones[2],
        pregunta.opciones[3],
        pregunta.valida,
        ID_Cuestionario,
        pregunta.texto, 
      ];
      return connection.query(query, values);
    });
    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: "Cuestionario actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error al actualizar el cuestionario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el cuestionario.",
    });
  }
});




router.post('/create-user', async (req, res) => {
  const { name, apellido, correo, departamento, password, role } = req.body;

  // Validación básica
  if (!name || !apellido || !correo || !departamento || !password || !role) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
  }
  try {
    // Lógica para crear el usuario en la base de datos
    const query = 'INSERT INTO users (username, apellido, correo, id_departamento, password, role) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [name, apellido, correo, departamento, password, role];

    connection.query(query, values, async (err, results) => {
      if (err) {
        console.error('Error al crear el usuario:', err);
        return res.status(500).json({ success: false, message: 'Error al crear el usuario.' });
      }

      // Enviar correo de notificación
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h1 style="background-color: #007BFF; color: white; padding: 10px; text-align: center;">
            Bienvenido a la Plataforma
          </h1>
          <p style="font-size: 16px;">
            Hola <strong>${name} ${apellido}</strong>,
          </p>
          <p style="font-size: 16px;">
            Tu usuario ha sido creado con éxito en nuestra plataforma, tus datos para ingresar son los siguientes:
          </p>
          <p style="font-size: 16px;">
            <strong>Usuario:</strong> ${name}<br>
            <strong>Password:</strong> ${password}
          </p>
          <p style="font-size: 16px; margin-top: 20px;">
            Gracias por formar parte de nuestro equipo.
          </p>
        </div>
      `;

      try {
        await enviarCorreo(
          correo,
          'Bienvenido a la plataforma',
          null,
          htmlContent
        );

        res.status(200).json({ success: true, message: 'Usuario creado y correo enviado exitosamente.' });
      } catch (emailError) {
        console.error('Error al enviar el correo:', emailError);
        res.status(500).json({ success: false, message: 'Usuario creado, pero no se pudo enviar el correo.' });
      }
    });
  } catch (error) {
    console.error('Error en la creación del usuario:', error);
    res.status(500).json({ success: false, message: 'Error en la creación del usuario.' });
  }
});





// Obtener lista de usuarios
router.get('/listar-usuarios', (req, res) => {
  connection.query(`SELECT us.id, us.username, us.apellido, us.password, us.correo, us.role, de.descripcion
	from departamento as de 
    RIGHT JOIN users as us 
    on us.id_departamento = de.ID`, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener usuarios.' });
    }
    res.json({ success: true, data: results });
  });
});




router.get('/get-user/:id', (req, res) => {
  const { id } = req.params;
  connection.query(`SELECT us.id, us.username, us.apellido, us.password, us.correo, us.role, de.descripcion
	from departamento as de 
    RIGHT JOIN users as us 
    on us.id_departamento = de.ID WHERE us.id = ?`, [id], (err, results) => {
    if (err || results.length === 0) {
      console.error('Error al obtener el usuario:', err);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    res.json({ success: true, user: results[0] });
  });
});




// Actualizar un usuario
router.post('/update-user', (req, res) => {
  const { id, username, apellido, correo, password, role, departamento } = req.body;
  connection.query(
    'UPDATE users SET username = ?, apellido = ?, correo = ?, password = ?, role = ?, id_departamento = ? WHERE id = ?',
    [username, apellido, correo, password, role, departamento,id],
    (err, results) => {
      if (err) {
        console.error('Error al actualizar el usuario:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar el usuario.' });
      }
      res.json({ success: true });
    }
  );
});




// Eliminar un usuario
router.delete('/delete-user/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el usuario:', err);
      return res.status(500).json({ success: false, message: 'Error al eliminar el usuario.' });
    }
    res.json({ success: true });
  });
});






router.post('/assign-quizzes-to-users', async (req, res) => {
  const { idCuestionarios,tiempo_limite, departamentos  } = req.body; // Recibir los IDs de los cuestionarios desde el cliente
  console.log("Datos recibidos en el backend:", idCuestionarios, tiempo_limite, departamentos);

  if (!idCuestionarios || idCuestionarios.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un ID de cuestionario.' });
  }

  if (!departamentos || departamentos.length === 0) {
    return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un departamento.' });
  }
  try {
    // Obtener los usuarios con rol "usuario"
    connection.query(
      `SELECT users.id 
       FROM users 
       JOIN departamento ON users.id_departamento = departamento.ID 
       WHERE users.role = ? AND departamento.descripcion IN (?)`,
      ['usuario', departamentos],
      (err, users) => {
        if (err) {
          console.error('Error al obtener usuarios:', err);
          return res.status(500).json({ success: false, message: 'Error al obtener usuarios.' });
        }

        if (users.length === 0) {
          return res.status(404).json({ success: false, message: 'No hay usuarios que coincidan con los departamentos seleccionados.' });
        }

      // Preparar las asignaciones
      const assignments = [];
      users.forEach((user) => {
        idCuestionarios.forEach((idCuestionario) => {
          assignments.push([user.id, idCuestionario, new Date(), tiempo_limite]);
        });
      });

      // Insertar las asignaciones en la tabla asignaciones_cuestionarios
      connection.query(
        'INSERT INTO asignaciones_cuestionarios (usuario_id, IDCuestionario, fecha_asignacion, tiempo_restante) VALUES ?',
        [assignments],
        (err, results) => {
          if (err) {
            console.error('Error al insertar asignaciones:', err);
            return res.status(500).json({ success: false, message: 'Error al insertar asignaciones en la base de datos.' });
          }

          res.json({ success: true, message: 'Cuestionarios asignados correctamente a los usuarios.' });
        }
      );
    });
  } catch (error) {
    console.error('Error al asignar cuestionarios:', error);
    res.status(500).json({ success: false, message: 'Error al asignar cuestionarios.' });
  }
});





router.get('/get-quiz-results/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
        r.usuario_id,
        r.IDCuestionario,
        ic.Titulo AS titulo_cuestionario,
        COUNT(CASE WHEN r.opcion_seleccionada = q.Valida THEN 1 END) AS correctas,
        COUNT(*) AS total_preguntas,
        (COUNT(CASE WHEN r.opcion_seleccionada = q.Valida THEN 1 END) / COUNT(*)) * 100 AS porcentaje_correcto,
        CASE 
            WHEN (COUNT(CASE WHEN r.opcion_seleccionada = q.Valida THEN 1 END) / COUNT(*)) * 100 >= 70 
            THEN 'Apto' 
            ELSE 'No Apto' 
        END AS estado
    FROM 
        respuestas_usuarios r
    JOIN 
        cuestionarios q
    ON 
        r.IDCuestionario = q.IDCuestionario 
        AND r.TituloPregunta = q.TituloPregunta
    JOIN 
        idcuestionarios ic
    ON 
        r.IDCuestionario = ic.IDCuestionario
    WHERE 
        r.usuario_id = ?
    GROUP BY 
        r.usuario_id, 
        r.IDCuestionario,
        ic.Titulo;
  `;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      return res.status(500).json({ success: false, message: 'Error al ejecutar la consulta.' });
    }

    res.json({ success: true, results });
  });
});





router.post('/get-cuestionario-detalles', (req, res) => {
  const { usuario_id, IDCuestionario } = req.body;

  const query = `
    SELECT 
        r.usuario_id,
        r.IDCuestionario,
        r.TituloPregunta,
        q.Opcion1,
        q.Opcion2,
        q.Opcion3,
        q.Opcion4,
        q.Valida,
        r.respuesta_usuario,
        r.opcion_seleccionada
    FROM 
        respuestas_usuarios r
    JOIN 
        cuestionarios q
    ON 
        r.IDCuestionario = q.IDCuestionario 
        AND r.TituloPregunta = q.TituloPregunta
    WHERE 
        r.usuario_id = ? 
        AND r.IDCuestionario = ?`;

  connection.query(query, [usuario_id, IDCuestionario], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error en la consulta.' });
    }

    res.json({ success: true, results });
  });
});




router.get('/autocomplete-users', (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ success: false, message: 'Query es requerido' });
  }

  const searchQuery = `
    SELECT id, username, apellido 
    FROM users 
    WHERE username LIKE ? OR apellido LIKE ? 
    LIMIT 10
  `;
  connection.query(searchQuery, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error('Error al buscar usuarios:', err);
      return res.status(500).json({ success: false, message: 'Error al buscar usuarios' });
    }
    res.json(results);
  });
});




// Endpoint para obtener departamentos
router.get('/departamentos', (req, res) => {
  const query = 'SELECT ID, descripcion FROM departamento';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los departamentos:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener los departamentos' });
    }
    res.json(results);
  });
});



router.post('/enviar-correo', async (req, res) => {
  const { to, subject, text, html } = req.body;
  try {
      const info = await enviarCorreo(to, subject, text, html);
      res.status(200).json({ success: true, message: 'Correo enviado', info });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error al enviar correo', error });
  }
});


// Ruta para obtener usuarios bloqueados
router.get('/usuarios-bloqueados', (req, res) => {
  const query = `
    SELECT us.id as usuario_id, us.username, us.apellido, ac.IDCuestionario, ic.Titulo,ac.estado_cuestionario, ac.numero_intentos, dp.descripcion
    FROM users as us
    INNER JOIN asignaciones_cuestionarios as ac
    ON ac.usuario_id = us.id
    INNER JOIN departamento as dp
    ON dp.ID = us.id_departamento
    INNER JOIN idcuestionarios as ic
    ON ic.IDCuestionario = ac.IDCuestionario
    WHERE ac.numero_intentos >3;`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios bloqueados:', err);
      return res.status(500).json({ error: 'Error al obtener usuarios bloqueados' });
    }
    res.json(results);
  });
});



// Ruta para liberar un cuestionario
router.post('/liberar-usuarios', (req, res) => {
  const { usuarios } = req.body;

  if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).json({ error: 'No se enviaron usuarios para liberar' });
  }

  const queries = usuarios.map(({ usuario_id, IDCuestionario }) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE asignaciones_cuestionarios
        SET estado_cuestionario = 'NULL', numero_intentos = 3, estado_resultados = 'NULL'
        WHERE usuario_id = ? AND IDCuestionario = ? AND numero_intentos >3;
      `;

      connection.query(query, [usuario_id, IDCuestionario], (err) => {
        if (err) {
          console.error('Error al liberar cuestionario:', err);
          return reject(err);
        }
        resolve();
      });
    });
  });

  // Ejecutar todas las consultas de forma concurrente
  Promise.all(queries)
    .then(() => {
      res.json({ success: true, message: 'Cuestionarios liberados correctamente.' });
    })
    .catch((err) => {
      console.error('Error al liberar cuestionarios:', err);
      res.status(500).json({ error: 'Error al liberar cuestionarios.' });
    });
});



module.exports = router; 
