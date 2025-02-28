
function eliminarCronometro() {
  if (intervalCronometro) {
    clearInterval(intervalCronometro); 
    intervalCronometro = null;
    const cronometroElement = document.getElementById('seccionAdicional');
    if (cronometroElement) {
      cronometroElement.remove(); 
    }
  }
}


function cuestionarioBloquead(){
  Swal.fire({
    title: "Cuestionario Bloqueado",
    text: "Ha agotado los intentos o ha superado el tiempo, contacte con el Administrador",
    icon: "warning",
  });
}


let cuestionarioEnCurso = null; 
let intervalCronometro = null; 
let tiempoRestanteActual = null;
let tiempoRestante = null;
let intentosDefinidos = 3;
let intentosConsumidos = null;


function guardarTiempoRestante(IDCuestionario, tiempoRestante) {
  // Asegurarse de que tiempoRestanteActual está actualizado realizando Cambios GTI
  const usuarioId = localStorage.getItem('userId');
  tiempoRestante = tiempoRestanteActual; // Forzar uso del valor más reciente del cronómetro
  const minutosRestantes = Math.ceil(tiempoRestante / 60); // Convertir a minutos

  console.log(`Guardando tiempo restante: ${tiempoRestante} segundos (${minutosRestantes} minutos) para el cuestionario ${IDCuestionario}, usuario ${usuarioId}`);

  return fetch('http://localhost:3000/api/usuario/cuestionarios/guardar-tiempo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      IDCuestionario,
      usuario_id: usuarioId,
      tiempo_restante: minutosRestantes,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al guardar el tiempo restante');
      }
      console.log('Tiempo restante guardado correctamente en la base de datos');
    })
    .catch((error) => {
      console.error('Error al guardar el tiempo restante:', error);
    });
}





/* Mostrar Cronometro despues de iniciar cuestionario */
function mostrarSeccionAdicional(tiempoLimite, IDCuestionario, usuarioId) {
  console.log('Tiempo límite pasado a mostrarSeccionAdicional: funcion mostrarSeccionAdicional', tiempoLimite);

  const mainContentUsersclook = document.getElementById('main-contenclook');

  if (!mainContentUsersclook) {
    console.error("No se encontró el contenedor 'main-contenclook'");
    return;
  }
  const nuevaSeccion = document.createElement('div');
  nuevaSeccion.id = 'seccionAdicional';
  nuevaSeccion.classList.add('mt-4', 'p-4', 'bg-light', 'rounded', 'shadow');
  nuevaSeccion.style.position = 'fixed';
  nuevaSeccion.style.bottom = '20px';
  nuevaSeccion.style.right = '20px';
  nuevaSeccion.style.width = '300px';
  nuevaSeccion.style.zIndex = '1000';

  nuevaSeccion.innerHTML = `
    <div class="wrapper text-center">
      <h5 class="mb-3">Tiempo Restante</h5>
      <div class="time">
        <span id="minutes">${String(Math.floor(tiempoLimite)).padStart(2, '0')}</span>
        <span class="colon ms-colon">:</span>
        <span class ="seconds" id="seconds">00</span>
      </div>
    </div>
  `;
  mainContentUsersclook.appendChild(nuevaSeccion);
  nuevaSeccion.scrollIntoView({ behavior: 'smooth' });
  iniciarCronometro(tiempoLimite, IDCuestionario, usuarioId);


}


function iniciarCronometro(tiempoLimite, IDCuestionario, usuarioId) {
  if (!IDCuestionario || !usuarioId) {
    console.error("IDCuestionario o usuarioId no están definidos:", {
      IDCuestionario,
      usuarioId,
    });
    return; 
  }
  tiempoRestanteActual = tiempoLimite * 60; // Inicializar tiempo restante en segundos
  console.log(`Cronómetro iniciado con ${tiempoRestanteActual} segundos`);
  console.log(`IDCuestionario: ${IDCuestionario}`);
  console.log(`usuarioId: ${usuarioId}`);

  intervalCronometro = setInterval(() => {
    if (tiempoRestanteActual > 0) {
      tiempoRestanteActual--; // Reducir en 1 segundo

      // Mostrar tiempo restante en el DOM
      const minutos = Math.floor(tiempoRestanteActual / 60);
      const segundos = tiempoRestanteActual % 60;

      const minutosElement = document.getElementById('minutes');
      const segundosElement = document.getElementById('seconds');

      if (minutosElement && segundosElement) {
        minutosElement.textContent = String(minutos).padStart(2, '0');
        segundosElement.textContent = String(segundos).padStart(2, '0');
      }
      console.log(`Tiempo restante: ${tiempoRestanteActual} segundos`);
    } else {
      clearInterval(intervalCronometro);
      
      alert('El tiempo del cuestionario ha terminado');
      console.log(IDCuestionario,usuarioId)
      bloquearCuestionario(IDCuestionario, usuarioId); // Llamar a la nueva función
    }
  }, 1000);
}



function mostrarCuestionario(IDCuestionario, Titulo) {
  console.log(IDCuestionario);
  // Verificar si ya se está en el cuestionario actual
  if (cuestionarioEnCurso === IDCuestionario) {
    console.log('Ya estás en este curso. Continuando...');
    Swal.fire("¡Cuestionario en curso, Por favor continua con el!");;
    return; // Salimos de la función
  }

  if (cuestionarioEnCurso && cuestionarioEnCurso !== IDCuestionario) {
    Swal.fire({
      title: 'No has terminado el cuestionario actual',
      text: '¿Quieres continuar con este cuestionario o guardar el tiempo restante?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Continuar con este cuestionario',
      cancelButtonText: 'Guardar y cambiar',
    }).then((result) => {
      if (result.isConfirmed) {
        // El usuario elige continuar con el cuestionario actual
        console.log('Seguir seleccionado. Continuando con el cuestionario actual.');
      } else {
        // El usuario elige guardar y cambiar de cuestionario
        console.log('Cancelar seleccionado. Guardando tiempo restante...');
        guardarTiempoRestante(cuestionarioEnCurso, tiempoRestanteActual)
          .then(() => {
            console.log('Tiempo restante guardado. Refrescando la página.');
            eliminarCronometro();
            cuestionarioEnCurso = null;
            tiempoRestanteActual = 0;
            location.reload(); // Refrescar la pantalla solo después de guardar
          })
          .catch((error) => {
            console.error('Error al guardar el tiempo restante:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo guardar el tiempo restante. Intenta nuevamente.',
              icon: 'error',
            });
          });
      }
    });
  
    return; // Evita que el código continúe mientras el usuario decide
  }
  

  // Actualizar el cuestionario en curso
  /* cuestionarioEnCurso = IDCuestionario; */

  const mainContentUsers = document.getElementById('main-contentUsers');
  
  if (!mainContentUsers) {
    console.error("No se encontró el contenedor 'main-contentUsers'");
    return;
  }

  const usuarioId = localStorage.getItem('userId')
  
  const url = `http://localhost:3000/api/usuario/cuestionariosID/${IDCuestionario}/${usuarioId}`;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al obtener el número de preguntas');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Datos recibidos del backend:', data);
      const totalPreguntas = data.totalPreguntas || 0; 
      const tiempoLimite = parseInt(data.tiempo_restante);
      const materialApoyo = data.material_apoyo; // Extraer material_apoyo
      const numero_intentos = data.numero_intentos;


      console.log('Tiempo límite recibido: función mostrarCuestionario', tiempoLimite);

      mainContentUsers.innerHTML = `
        <div class="col-9 d-flex justify-content-center align-items-center">
          <div class="text-center quizz">
            <img src="/public/img/quizz-100.png" alt="Quiz Illustration" class="img-fluid mb-4" style="max-width: 200px;">
            <h3 class="mb-3 TituloCuestionario">${IDCuestionario} - ${Titulo}</h3>
            <p class="text-muted mb-4">Lea cuidadosamente cada pregunta y seleccione la respuesta correcta</p>
            <p class="text-muted">${totalPreguntas} Preguntas - ${tiempoLimite} minutos</p>
            <p class="text-muted">Numero de intentos consumidos ${numero_intentos} </p>
            <button class="btn btn-secondary" onclick="mostrarPDF('${materialApoyo}', '${IDCuestionario}', '${Titulo}', ${totalPreguntas})">Mostrar PDF</button>
            <button class="btn btn-primary Comenzar" onclick="cargarQuizz('${IDCuestionario}', ${JSON.stringify(tiempoLimite)})">Comenzar</button>
          </div>
        </div>
      `;
    })

    .catch((error) => {
      console.error(error);
      alert('Error al cargar el número de preguntas');
    });

    
}







function bloquearCuestionario(IDCuestionario, usuarioId) {
  fetch(`http://localhost:3000/api/usuario/cuestionarios/${IDCuestionario}/bloquear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      usuarioId,
      estado: "BLOQUEADO", // Estado que queremos asignar
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al actualizar el estado del cuestionario.");
      }
      return response.json();
    })
    .then(() => {
      console.log(`El cuestionario ${IDCuestionario} y ${usuarioId} ha sido bloqueado.`);
      location.reload();
    })
    .catch((error) => {
      console.error("Error al bloquear el cuestionario:", error);
    });
}




/* Mostrar el PDF */
function reiniciarCuestionarioEnCurso() {
  cuestionarioEnCurso = null; // Restablecer el cuestionario actual
  localStorage.removeItem("cuestionarioEnCurso"); // Eliminar del almacenamiento local
}

function mostrarPDF(materialPath, IDCuestionario, titulo, totalPreguntas) {
  const mainContentUsers = document.getElementById("main-contentUsers");

  if (!materialPath) {
    mainContentUsers.innerHTML =
      '<p class="text-danger">No se encontró el material de apoyo para este cuestionario.</p>';
    return;
  }

  mainContentUsers.innerHTML = `
    <div id="pdfViewerContainer" class="text-center">
      <h3 class="mb-4">Material de apoyo: ${titulo}</h3>
      <div id="pdfScrollableContainer" style="width: 100%; height: 500px; overflow-y: auto; border: 1px solid #ccc; margin: auto;">
        <canvas id="pdfViewer"></canvas>
      </div>
      <div class="mt-4">
        <button id="prevPage" class="btn btn-danger me-2">Anterior</button>
        <button id="nextPage" class="btn btn-success">Siguiente</button>
      </div>
      <div class="mt-4">
        <p id="pageInfo" class="text-muted">Página <span id="currentPage"></span> de <span id="totalPages"></span></p>
      </div>
      <button class="btn btn-primary mt-4" id="terminarPDF">Terminar</button>
    </div>
  `;

  const canvas = document.getElementById("pdfViewer");
  const ctx = canvas.getContext("2d");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const terminarPDFBtn = document.getElementById("terminarPDF");
  const scrollableContainer = document.getElementById("pdfScrollableContainer");
  let pdfDoc = null;
  let currentPage = 1;

  const url = `http://localhost:3000/uploads/${materialPath}`;
  pdfjsLib
    .getDocument(url)
    .promise.then((doc) => {
      pdfDoc = doc;
      renderPage(currentPage);
    })
    .catch((error) => {
      console.error("Error al cargar el PDF:", error);
      mainContentUsers.innerHTML =
        '<p class="text-danger">Error al cargar el material de apoyo. Intenta nuevamente.</p>';
    });

  function renderPage(pageNum) {
    pdfDoc.getPage(pageNum).then((page) => {
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      page.render(renderContext).promise.then(() => {
        // Restablecer la posición de desplazamiento al inicio
        scrollableContainer.scrollTop = 0;
        document.getElementById("currentPage").textContent = pageNum;
        document.getElementById("totalPages").textContent = pdfDoc.numPages;
        prevPageBtn.disabled = pageNum === 1;
        nextPageBtn.disabled = pageNum === pdfDoc.numPages;
      });
    });
  }

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });

    
  nextPageBtn.addEventListener("click", () => {
    if (currentPage < pdfDoc.numPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });

  // Evento para terminar el PDF y volver al resumen
  terminarPDFBtn.addEventListener("click", () => {
    reiniciarCuestionarioEnCurso(); // Restablecer el cuestionario actual
    mostrarCuestionario(IDCuestionario, titulo); // Volver al resumen
  });
}







/* Listar Cuersos asignados */
document.addEventListener('DOMContentLoaded', () => {
  const usuarioId = localStorage.getItem('userId');
  
  if (!usuarioId) {
    alert('Usuario no autenticado. Redirigiendo al inicio de sesión.');
    window.location.href = '/index.html';
    return;
  }



  const url = `http://localhost:3000/api/usuario/cuestionarios/${usuarioId}`;
  fetch(url)
    .then((response) => {
      if (response.status === 404) {
        document.querySelector('.listaCuestionarios').innerHTML = '<p class="text-muted px-3">No hay cuestionarios pendientes.</p>';
        return [];
      }
      if (!response.ok) {
        throw new Error('No se pudieron obtener los cuestionarios');
      }
      return response.json();
    })
    .then((data) => {
      console.log('listar cuestionarios', data);

      const listaCuestionarios = document.querySelector('.listaCuestionarios');
      const listaCuestionariosBloqueados = document.createElement('div'); // Sección para bloqueados
      listaCuestionarios.innerHTML = '';

      if (data.length === 0) {
        listaCuestionarios.innerHTML = '<h3 class="text-muted px-3">No hay cuestionarios pendientes.</h3>';
        return;
      }

      let tieneCuestionariosBloqueados = false;

      data.forEach((cuestionario) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        const estado = cuestionario.estado_cuestionario === 'COMPLETADO' && cuestionario.estado_resultados === 'Reprobado'
          ? `<span class="text-danger">(Reprobado)</span>`
          : '';

        if (cuestionario.numero_intentos > 3) {
          // Si tiene más de 3 intentos, lo agregamos a la sección de bloqueados
          tieneCuestionariosBloqueados = true;
          const bloqueado = document.createElement('div');
          bloqueado.classList.add('list-group-item', 'bg-danger', 'text-white', 'd-flex', 'justify-content-between', 'align-items-center');
          bloqueado.innerHTML = `
            <span class="flex-grow-1">${cuestionario.Titulo} (Bloqueado)</span>
            <button class="btn btn-warning btn-sm ms-auto" onclick="cuestionarioBloquead()">Solicitar Desbloqueo</button>
          `;
          listaCuestionariosBloqueados.appendChild(bloqueado);
        } else {
          // Agregar cuestionario disponible
          li.innerHTML = `
            <div class="d-flex justify-content-between w-100">
              <span class="flex-grow-1"> ${cuestionario.Titulo} ${estado} </span>
              <button class="btn btn-primary btn-sm ms-auto" onclick="mostrarCuestionario('${cuestionario.IDCuestionario}', '${cuestionario.Titulo}', ${cuestionario.totalPreguntas})">Seleccionar</button>
            </div>
          `;
          listaCuestionarios.appendChild(li);
        }
      });

      // Si hay cuestionarios bloqueados, los agregamos debajo de la lista de disponibles
      if (tieneCuestionariosBloqueados) {
        const bloqueadosSection = document.createElement('div');
        bloqueadosSection.classList.add('bloqueado')
        bloqueadosSection.innerHTML = `
          <h4 class="mt-4 text-danger">Cuestionarios Bloqueados</h4>
          <p class="text-muted">Estos cuestionarios han excedido el número de intentos permitidos.</p>
        `;
        bloqueadosSection.appendChild(listaCuestionariosBloqueados);
        listaCuestionarios.appendChild(bloqueadosSection);
      }
    })
    .catch((error) => {
      console.error(error);
      alert('Error al cargar los cuestionarios');
    });
});





function finalizarCuestionario(IDCuestionario, respuestas, usuarioId) {
  alert("Función llamada");
  const url = `http://localhost:3000/api/usuario/cuestionarios/${IDCuestionario}/guardar`; // Metodo POST Guardar resultados de usuario
  const resultUrl = `http://localhost:3000/api/admin/get-quiz-results/${usuarioId}`; // METODO GET para conocer si es Apto o no
  const intentosUrl = `http://localhost:3000/api/usuario/cuestionarios/${IDCuestionario}/actualizar-intentos`; // Nuevo endpoint para actualizar intentos
  const datosDiplomaUrl = `http://localhost:3000/api/usuario/obtener-datos-diploma/${IDCuestionario}/${usuarioId}`; // Nuevo endpoint para obtener datos del diploma

  console.log('URL:', url);

  console.log('Datos enviados:', { 
    usuarioId, 
    respuestas 
  });

  console.log('Formato JSON de respuestas:', JSON.stringify(respuestas, null, 2)); // Imprime las respuestas en formato JSON bonito

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      usuarioId,
      respuestas,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al guardar las respuestas del cuestionario');
      }
      return response.json();
    })
    .then(() => {
      console.log('Respuestas guardadas correctamente. Consultando resultados...');
      return fetch(resultUrl); // Consultar los resultados
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al obtener los resultados del cuestionario');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Resultados del cuestionario:', data);

      if (data.success && data.results.length > 0) {
        const result = data.results[0];
        
        console.log('Datos para enviar al servidor:', result);
        const { porcentaje_correcto, estado } = result;

        const mensajeHTML = `
          <div class="text-center">
            <h3>¡Cuestionario enviado correctamente!</h3>
            <p>Gracias por participar.</p>
            <p>Tu resultado: ${porcentaje_correcto.toFixed(2)}%
              <div class="estatus_quizz">
                <h1 class="${estado === 'Aprobado' ? 'text-success' : 'text-danger'}">${estado}</h1>
              </div>
              
            </p>
          </div>
        `;
        
        const mainContentUsers = document.getElementById('main-contentUsers');
        mainContentUsers.innerHTML = mensajeHTML;

        // Generar diploma si el cuestionario está aprobado
        if (estado === 'Aprobado') {
          guardarTiempoRestante(IDCuestionario, tiempoRestante);

          fetch(intentosUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usuarioId,
              estadoResultados: estado,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Error al actualizar el estado y los intentos');
              }
              return response.json();
            })
            .then(() => {
              console.log('Estado y número de intentos actualizados correctamente');
              
              return fetch(datosDiplomaUrl);
            })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Error al obtener datos del diploma');
              }
              return response.json();
            })
            .then((data) => {
              if (data.success) {
                const diplomaData = data.data;
                if (!diplomaData || !diplomaData.username || !diplomaData.Titulo || !diplomaData.Contenido) {
                  throw new Error('Faltan datos necesarios para generar el diploma');
                }
                console.log('Datos para enviar al diploma:', diplomaData);
                generarDiploma({
                  nombreUsuario: diplomaData.username + ' ' + diplomaData.apellido,
                  dniUsuario: '60255378R', 
                  tituloCuestionario: diplomaData.Titulo,
                  duracion: diplomaData.tiempo_limite, 
                  fecha: new Date().toLocaleDateString('es-ES'),
                  contenido: diplomaData.Contenido,
                  IDCuestionario:diplomaData.IDCuestionario,
                  fechaInicio:new Date(diplomaData.fecha_asignacion).toISOString().split("T")[0],
                  fechaFin:new Date(diplomaData.fecha_respuesta).toISOString().split("T")[0]
                  
                });

              } else {
                throw new Error('No se encontraron datos para generar el diploma.');
              }
            })
            .catch((error) => {
              console.error('Error en el proceso de generación del diploma o actualización:', error);
            });
        }else{
          //Actualiza estado e intentos si es aprobado
          fetch(intentosUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usuarioId,
              estadoResultados: estado,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Error al actualizar el estado y los intentos');
              }
              return response.json();
            })
            .then(() => {
              console.log('Estado y número de intentos actualizados correctamente');
              setTimeout(() => {
                location.reload();
              }, 1500); 
            })
        }
        eliminarCronometro();
       
      } else {
        throw new Error('No se encontraron resultados para este cuestionario');
      }
    })
    .catch((error) => {
      console.error(error);
      alert('Error al procesar el cuestionario. Intenta nuevamente.');
    });
}

function generarDiploma({ nombreUsuario, dniUsuario, tituloCuestionario, duracion,fecha, contenido,IDCuestionario, fechaInicio, fechaFin }) {
  fetch('http://localhost:3000/api/usuario/generar-diploma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreUsuario, dniUsuario, tituloCuestionario, duracion,fecha , contenido,IDCuestionario,fechaInicio, fechaFin }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        
        window.open(data.pdfUrl, '_blank'); 
        location.reload();
      } else {
        alert('Error al generar el diploma.');
      }
    })
    .catch((error) => {
      console.error('Error al generar el diploma:', error);
    });
}

// Recuperar el mensaje al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const mainContentUsers = document.getElementById('main-contentUsers');
 
  // Limpiar cualquier mensaje en la interfaz si existe al recargar
  mainContentUsers.innerHTML = '';

  // Agregar evento para limpiar el mensaje al seleccionar otro cuestionario
  document.querySelectorAll('.btn-cuestionario').forEach((boton) => {
    boton.addEventListener('click', () => {
      mainContentUsers.innerHTML = ''; // Limpia el contenido
    });
  });
});















function cargarQuizz(IDCuestionario, tiempoLimite) {
  console.log('Cargando cuestionario con tiempo límite, funcion cargarQuizz :', tiempoLimite);
  console.log(cuestionarioEnCurso);
  console.log(intervalCronometro);
  console.log(tiempoRestanteActual);
  console.log(IDCuestionario);

  if (intervalCronometro) {
    clearInterval(intervalCronometro); // Reinicia cualquier cronómetro previo
  }
  cuestionarioEnCurso = IDCuestionario;
  tiempoRestanteActual = tiempoLimite * 60; // Convertir minutos a segundos

  const usuarioId = localStorage.getItem('userId');

  mostrarSeccionAdicional(tiempoLimite, IDCuestionario, usuarioId);
  const mainContentUsers = document.getElementById('main-contentUsers');
  mainContentUsers.innerHTML = '<p>Cargando preguntas...</p>';

  console.log(usuarioId);
  const url = `http://localhost:3000/api/usuario/cuestionarios/${IDCuestionario}/preguntas-validar?usuarioId=${usuarioId}`;

  // Función para barajar las preguntas
  function barajarPreguntas(preguntas) {
    const preguntasMezcladas = [...preguntas]; // Copia para no modificar el arreglo original
    for (let i = preguntasMezcladas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preguntasMezcladas[i], preguntasMezcladas[j]] = [preguntasMezcladas[j], preguntasMezcladas[i]];
    }
    return preguntasMezcladas;
  }

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('No se pudieron cargar las preguntas');
      }
      return response.json();
    })
    .then((preguntas) => {
      if (preguntas.length === 0) {
        mainContentUsers.innerHTML = '<p>No hay preguntas disponibles para este cuestionario.</p>';
        return;
      }

      // Barajar las preguntas antes de mostrarlas
      const preguntasBarajadas = barajarPreguntas(preguntas);
      let preguntaActual = 0; // Índice de la pregunta actual
      const respuestas = Array(preguntasBarajadas.length).fill(null); // Arreglo para almacenar las respuestas seleccionadas

      const actualizarBarraProgreso = () => {
        const progreso = (preguntaActual / preguntasBarajadas.length) * 100;
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${progreso}%`;
        progressBar.textContent = `${Math.round(progreso)}% completado`;
      };

      const mostrarPregunta = () => {
        const pregunta = preguntasBarajadas[preguntaActual];
        mainContentUsers.innerHTML = `
          <div class="progress mb-4" style="height: 20px; max-width: 600px; margin: auto;">
            <div class="progress-bar bg-primary" id="progressBar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <div class="text-center quiz-container">
            <h3 class="quiz-title">Pregunta ${preguntaActual + 1}:</h3>
            <p class="quiz-question">${pregunta.TituloPregunta}</p>
            <form id="formPregunta" class="quiz-form">
              <div class="form-check">
                <input class="form-check-input" type="radio" name="respuesta" value="${pregunta.Opcion1}" id="opcion1">
                <label class="form-check-label quiz-option" for="opcion1">
                  <strong>Opción 1:</strong> ${pregunta.Opcion1}
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="respuesta" value="${pregunta.Opcion2}" id="opcion2">
                <label class="form-check-label quiz-option" for="opcion2">
                  <strong>Opción 2:</strong> ${pregunta.Opcion2}
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="respuesta" value="${pregunta.Opcion3}" id="opcion3">
                <label class="form-check-label quiz-option" for="opcion3">
                  <strong>Opción 3:</strong> ${pregunta.Opcion3}
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="respuesta" value="${pregunta.Opcion4}" id="opcion4">
                <label class="form-check-label quiz-option" for="opcion4">
                  <strong>Opción 4:</strong> ${pregunta.Opcion4}
                </label>
              </div>
              <div class="quiz-buttons mt-4">
                <button class="btn btn-secondary me-2" type="button" id="btnAnterior" ${preguntaActual === 0 ? 'disabled' : ''}>Anterior</button>
                <button class="btn btn-primary" type="button" id="btnSiguiente">Siguiente</button>
              </div>
            </form>
          </div>
        `;

        if (respuestas[preguntaActual]) {
          const opcionSeleccionada = document.querySelector(`input[value="${respuestas[preguntaActual].respuesta}"]`);
          if (opcionSeleccionada) {
            opcionSeleccionada.checked = true;
          }
        }

        actualizarBarraProgreso();

        const btnSiguiente = document.getElementById('btnSiguiente');
        btnSiguiente.addEventListener('click', () => {
          const respuestaSeleccionada = document.querySelector('input[name="respuesta"]:checked');

          if (!respuestaSeleccionada) {
            alert('Por favor selecciona una opción antes de continuar.');
            return;
          }

          respuestas[preguntaActual] = {
            TituloPregunta: preguntasBarajadas[preguntaActual].TituloPregunta,
            respuesta: respuestaSeleccionada.value,
          };

          preguntaActual++;
          if (preguntaActual < preguntasBarajadas.length) {
            mostrarPregunta();
          } else {
            mainContentUsers.innerHTML = `
              <div class="text-center">
                <h3>¿Qué desea hacer ahora?</h3>
                <button class="btn btn-secondary me-2" id="btnVerificarRespuestas">Verificar Respuestas</button>
                <button class="btn btn-success" id="btnEnviarCuestionario">Enviar Cuestionario</button>
              </div>
            `;
            const btnEnviarCuestionario = document.getElementById('btnEnviarCuestionario');
            btnEnviarCuestionario.addEventListener('click', () => {
              const usuarioId = localStorage.getItem('userId');
              finalizarCuestionario(IDCuestionario, respuestas, usuarioId);
              mainContentUsers.innerHTML = `
              <div class="text-center">
                <h3>¡Has completado el cuestionario!</h3>
              </div>
            `;
            });
            const btnVerificarRespuestas = document.getElementById('btnVerificarRespuestas');
            btnVerificarRespuestas.addEventListener('click', () => {
              preguntaActual = 0; // Reiniciar para permitir navegación nuevamente
              mostrarPregunta(); // Mostrar la primera pregunta
            });
          }
        });

        const btnAnterior = document.getElementById('btnAnterior');
        btnAnterior.addEventListener('click', () => {
          if (preguntaActual > 0) {
            preguntaActual--;
            mostrarPregunta();
          }
        });
      };

      mostrarPregunta();
    })
    .catch((error) => {
      console.error(error);
      mainContentUsers.innerHTML = '<p>Error al cargar las preguntas.</p>';
    });
}




