const toggles = document.querySelectorAll('.btn-toggle');

toggles.forEach(button => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.getAttribute('data-target'));
    if (target.classList.contains('show')) {
      target.classList.remove('show'); 
    } else {
      document.querySelectorAll('.nav .collapse').forEach(menu => {
        menu.classList.remove('show');
      });
      target.classList.add('show'); 
    }
  });
});






let idQuizz = ''; 
let nombreTitulo = '';
let tiempoLimiteGlobal = ''; 
let departamentosSeleccionados = []; // Nueva variable global
let contenido = '';
let vigencia = '';
let departamentosSeleccionadosID = [];



function generarIdCuestionario() {
  const prefijo = "HC"; 
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
  const longitudRandom = 8; 
  let parteAleatoria = "";

  for (let i = 0; i < longitudRandom; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    parteAleatoria += caracteres[indiceAleatorio];
  }

  return `${prefijo}${parteAleatoria}`; 
}




/* Crear Cuestionario */
const mainContent = document.getElementById('main-content');

function loadForm1() {

  mainContent.innerHTML = `
    <div class="progress-container mb-4">
      <div class="step active" id="step-1">
        <div class="circle">1</div>
        <p>Cabecera de Cuestionario</p>
      </div>
      <div class="step" id="step-2">
        <div class="circle">2</div>
        <p>Detalle de Cabecera</p>
      </div>
    </div>
    <div id="form-container">
      <form id="form-step-1" enctype="multipart/form-data">
        <div class="row mb-3">
          <div class="col-md-7">
            <label for="nombreCuestionario" class="form-label">Nombre de Cuestionario</label>
            <input type="text" id="nombreCuestionario" class="form-control" placeholder="Ingrese el nombre">
          </div>
          <div class="col-md-2">
            <label for="tiempoCuestionario" class="form-label">Tiempo (min)</label>
            <input type="number" id="tiempoCuestionario" class="form-control" placeholder="Tiempo">
          </div>
          <div class="col-md-3">
            <label for="vigencia" class="form-label">vigencia</label>
            <input type="date" id="vigencia" class="form-control" placeholder="vigencia">
          </div>
        </div>
        <div class="mb-3">
          <label for="departamentos" class="form-label">Seleccionar Departamentos</label>
          <div id="departamentos-container" class="mb-3" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
            <!-- Checkboxes cargados dinámicamente -->
          </div>
          <button type="button" id="add-departments" class="btn btn-secondary">Añadir</button>
          <div id="selected-departments" class="mt-2 d-flex flex-wrap gap-2">
            <!-- Contenedor para mostrar departamentos seleccionados -->
          </div>
        </div>
        <div class="mb-3">
          <label for="materialCuestionario" class="form-label">Material de Apoyo (PDF)</label>
          <input type="file" id="materialCuestionario" class="form-control" accept="application/pdf">
        </div>
        <div class="mb-3">
        <label for="comentarios" class="form-label">Comentarios</label>
        <textarea id="comentarios" class="form-control" rows="4" placeholder="Escribe tus comentarios aquí..."></textarea>
      </div>
        <button type="button" class="btn btn-primary" id="next-step">Siguiente</button>
      </form>
    </div>
  `;

// Cargar los departamentos desde el backend
// Cargar los departamentos desde el backend
fetch('http://localhost:3000/api/admin/departamentos')
  .then((response) => response.json())
  .then((departamentos) => {
    const departamentosContainer = document.getElementById('departamentos-container');
    departamentos.forEach((dep) => {
      const checkbox = document.createElement('div');
      checkbox.className = 'form-check';
      checkbox.innerHTML = `
        <input class="form-check-input" type="checkbox" id="dep-${dep.ID}" value="${dep.ID}">
        <label class="form-check-label" for="dep-${dep.ID}">${dep.descripcion}</label>
      `;
      departamentosContainer.appendChild(checkbox);
    });
  })
  .catch((error) => {
    console.error('Error al cargar los departamentos:', error);
  });

// Manejador para añadir departamentos seleccionados
document.getElementById('add-departments').addEventListener('click', () => {
  const departamentosContainer = document.getElementById('departamentos-container');
  const selectedDepartmentsContainer = document.getElementById('selected-departments');
  const selectedDepartments = departamentosContainer.querySelectorAll('input[type="checkbox"]:checked');

  if (selectedDepartments.length === 0) {
    alert('Por favor, seleccione al menos un departamento.');
    return;
  }

  selectedDepartments.forEach((checkbox) => {
    const descripcion = checkbox.nextElementSibling.textContent.trim(); // Obtiene la descripción del departamento
    const dataId = checkbox.value; // Obtiene el ID del departamento

    // Verifica si ya existe el departamento en la lista seleccionada
    if ([...selectedDepartmentsContainer.children].some((child) => child.dataset.id === dataId)) {
      return; // Si ya existe, no lo añadimos
    }

    // Crear etiqueta del departamento seleccionado
    const departmentTag = document.createElement('div');
    departmentTag.className = 'badge bg-primary text-white d-flex align-items-center me-2 mb-2';
    departmentTag.dataset.id = dataId;
    departmentTag.innerHTML = `
      ${descripcion}
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Cerrar"></button>
    `;

    // Evento para eliminar el departamento del contenedor
    departmentTag.querySelector('.btn-close').addEventListener('click', () => {
      departmentTag.remove();

      const indexDescripcion = departamentosSeleccionados.indexOf(descripcion);
      const indexID = departamentosSeleccionadosID.indexOf(dataId);

      if (indexDescripcion !== -1) {
        departamentosSeleccionados.splice(indexDescripcion, 1);
      }

      if (indexID !== -1) {
        departamentosSeleccionadosID.splice(indexID, 1);
      }

      console.log('Departamentos seleccionados tras eliminación:', departamentosSeleccionados);
      console.log('Departamentos seleccionados (ID) tras eliminación:', departamentosSeleccionadosID);
    });

    // Añade la etiqueta y actualiza las variables
    selectedDepartmentsContainer.appendChild(departmentTag);
    checkbox.checked = false;
    departamentosSeleccionados.push(descripcion); // Agrega la descripción
    departamentosSeleccionadosID.push(dataId); // Agrega el ID
  });

  console.log('Departamentos seleccionados:', departamentosSeleccionados);
  console.log('Departamentos seleccionados (ID):', departamentosSeleccionadosID);
});

  document.getElementById('next-step').addEventListener('click', () => {
    const nombreCuestionario = document.getElementById('nombreCuestionario').value.trim();
    const tiempoCuestionario = document.getElementById('tiempoCuestionario').value.trim();
    const materialCuestionario = document.getElementById('materialCuestionario').files[0];
    const contenidoCuestionario = document.getElementById('comentarios').value.trim();
    const fvigencia = document.getElementById('vigencia').value.trim();
    
    if (!nombreCuestionario ) {
      Swal.fire({
          title: "Nombre de Cuestionario",
        text: "Este valor no puede estar vacio",
        icon: "warning",
      });
      return;
    }

    if (!tiempoCuestionario || isNaN(tiempoCuestionario) || tiempoCuestionario <= 0) {
      Swal.fire({
        title: "Tiempo (min) vacio",
        text: "Este valor no puede estar vacio",
        icon: "warning",
      });
      return;
    }

    if (!fvigencia) {
      Swal.fire({
        title: "Fehca de vigencia vacio",
        text: "Este valor no puede estar vacio debe ser ",
        icon: "warning",
      });
      return;
    }

    if (departamentosSeleccionados.length === 0) {
      Swal.fire({
        title: "Departamento sin seleccionar",
        text: "Este valor no puede estar vacio, seleccione y añada al menos uno",
        icon: "warning",
       
      });
      return;
    }

    if (!materialCuestionario) {
      Swal.fire({
        title: "Material de Apoyo (PDF no cargado",
        text: "Este valor no puede estar vacio",
        icon: "warning",
        
      });
      return;
    }

    if (!contenidoCuestionario) {
      Swal.fire({
        title: "Contenido de Cuestionario",
        text: "Este valor no puede estar vacio",
        icon: "warning",
      });
      return;
    }


  
    idQuizz = generarIdCuestionario();
    tiempoLimiteGlobal = parseInt(tiempoCuestionario);
    nombreTitulo = nombreCuestionario;
    archivoPDF = materialCuestionario;
    contenido = contenidoCuestionario;
    vigencia = fvigencia;

    console.log('ID generado para el cuestionario:', idQuizz);
    console.log('Nombre del cuestionario:', nombreCuestionario);
    console.log('Tiempo del cuestionario:', tiempoCuestionario);
    console.log('Departamentos seleccionados:', departamentosSeleccionados);
    console.log('Contenido curso:', contenido);
  
    loadForm2();
  });
}


function loadForm2() {
    mainContent.innerHTML = `
    <div class="progress-container mb-4">
      <div class="step" id="step-1">
        <div class="circle">1</div>
        <p>Cabecera de Cuestionario</p>
      </div>
      <div class="step active" id="step-2">
        <div class="circle">2</div>
        <p>Detalle de Cabecera</p>
      </div>
    </div>

    <div id="form-container">
      <form id="form-step-2">
        <h2>Detalle de Preguntas</h2>
        <div class="mb-3">
          <label for="tituloPregunta" class="form-label">Título de Pregunta</label>
          <input type="text" id="tituloPregunta" class="form-control" placeholder="Ingrese el título">
        </div>
        <div class="row mt-2">
        <div class="col-md-10"> <!-- Mayor espacio para el input -->
          <label for="opcion1" class="form-label">Opción 1</label>
          <input type="text" id="opcion1" class="form-control" placeholder="Ingrese la opción">
        </div>
        <div class="col-md-2 d-flex align-items-center"> <!-- Menor espacio para el radio -->
          <input type="radio" name="valida" value="Opción 1" id="valida1" class="form-check-input">
          <label for="valida1" class="form-check-label ms-2">¿Válida?</label>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-md-10">
          <label for="opcion2" class="form-label">Opción 2</label>
          <input type="text" id="opcion2" class="form-control" placeholder="Ingrese la opción">
        </div>
        <div class="col-md-2 d-flex align-items-center">
          <input type="radio" name="valida" value="Opción 2" id="valida2" class="form-check-input">
          <label for="valida2" class="form-check-label ms-2">¿Válida?</label>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-md-10">
          <label for="opcion3" class="form-label">Opción 3</label>
          <input type="text" id="opcion3" class="form-control" placeholder="Ingrese la opción">
        </div>
        <div class="col-md-2 d-flex align-items-center">
          <input type="radio" name="valida" value="Opción 3" id="valida3" class="form-check-input">
          <label for="valida3" class="form-check-label ms-2">¿Válida?</label>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-md-10">
          <label for="opcion4" class="form-label">Opción 4</label>
          <input type="text" id="opcion4" class="form-control" placeholder="Ingrese la opción">
        </div>
        <div class="col-md-2 d-flex align-items-center">
          <input type="radio" name="valida" value="Opción 4" id="valida4" class="form-check-input">
          <label for="valida4" class="form-check-label ms-2">¿Válida?</label>
        </div>
      </div>
        
        <button type="button" class="btn btn-secondary mt-3" id="add-question">Agregar Pregunta</button>
        <button type="button" class="btn btn-primary mt-3" id="finalize">Finalizar Cuestionario</button>
      </form>
      <div id="question-list" class="mt-4 sticky-container">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Título de Pregunta</th>
              <th>Opción 1</th>
              <th>Opción 2</th>
              <th>Opción 3</th>
              <th>Opción 4</th>
              <th>Opción Válida</th>
              <th>Editar</h>
              <th>Eliminar</h>
            </tr>
          </thead>
          <tbody id="question-list-body">
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('add-question').addEventListener('click', addQuestionToList);
  document.getElementById('finalize').addEventListener('click', finalizeCuestionario);
}

function addQuestionToList() {
  const tituloPregunta = document.getElementById('tituloPregunta').value;
  const opcion1 = document.getElementById('opcion1').value;
  const opcion2 = document.getElementById('opcion2').value;
  const opcion3 = document.getElementById('opcion3').value;
  const opcion4 = document.getElementById('opcion4').value;
  const valida = document.querySelector('input[name="valida"]:checked');

  if (!tituloPregunta ) {
    Swal.fire({
      title: "Nombre de Pregunta vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }

  if(!opcion1){
    Swal.fire({
      title: "Opcion1 vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }

  if(!opcion2){
    Swal.fire({
      title: "Opcion2 vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }

  if(!opcion3){
    Swal.fire({
      title: "Opcion3 vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }

  if(!opcion4){
    Swal.fire({
      title: "Opcion4 vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }
  
  if(!valida){
    Swal.fire({
      title: "Respuesta correcta  vacio",
      text: "Este valor no puede estar vacio",
      icon: "warning",
    });
    return;
  }

  const questionListBody = document.getElementById('question-list-body');

  const row = document.createElement('tr');
  row.innerHTML = `
  
    <td class="table-light">${tituloPregunta}</td>
    <td class="table-light">${opcion1}</td>
    <td class="table-light">${opcion2}</td>
    <td class="table-light">${opcion3}</td>
    <td class="table-light">${opcion4}</td>
    <td class="table-light">${valida.value}</td>
    <td><button type="button" class="btn btn-primary mt-3 btn-edit">Editar</button></td>
    <td><button type="button" class="btn btn-danger mt-3 btn-delete">Eliminar</button></td>

  `;

  questionListBody.appendChild(row);
  

  
  row.querySelector(".btn-delete").addEventListener("click", () => {
    row.remove();
  });
  
  row.querySelector(".btn-edit").addEventListener("click", () => {
    toggleEdit(row);
  });

  document.getElementById('tituloPregunta').value = '';
  document.getElementById('opcion1').value = '';
  document.getElementById('opcion2').value = '';
  document.getElementById('opcion3').value = '';
  document.getElementById('opcion4').value = '';
  document.querySelector('input[name="valida"]:checked').checked = false;


  
}



function toggleEdit(row) {
  const isEditing = row.classList.contains("editing"); 
  const cells = row.querySelectorAll("td"); 
  if (isEditing) {
    cells.forEach((cell, index) => {
      if (index < cells.length - 2) { 
        const input = cell.querySelector("input"); 
        if (input) {
          cell.textContent = input.value; 
        }
      }
    });
    const editButton = row.querySelector(".btn-edit");
    editButton.textContent = "Editar";
    editButton.classList.remove("btn-success");
    editButton.classList.add("btn-primary");
    row.classList.remove("editing"); 

  } else {
    cells.forEach((cell, index) => {
      if (index < cells.length - 2) { 
        const currentValue = cell.textContent.trim(); 
        cell.innerHTML = `<input type="text" class="form-control" value="${currentValue}">`; 
      }
    });
    const editButton = row.querySelector(".btn-edit");
    editButton.textContent = "Guardar";
    editButton.classList.remove("btn-primary");
    editButton.classList.add("btn-success");
    row.classList.add("editing"); 
  }
}


/* GENERACION DEL JSON AL FINALIZAR */

function finalizeCuestionario() {
  const tableRows = document.querySelectorAll("#question-list-body tr");
  const quizData = {
    idCuestionario: idQuizz,
    preguntas: [],
    departamentos: departamentosSeleccionados,
  };
  

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const questionData = {
      tituloPregunta: cells[0].textContent.trim(),
      opcion1: cells[1].textContent.trim(),
      opcion2: cells[2].textContent.trim(),
      opcion3: cells[3].textContent.trim(),
      opcion4: cells[4].textContent.trim(),
      valida: cells[5].textContent.trim(),
    };
    quizData.preguntas.push(questionData);
  });

  const formData = new FormData();
  formData.append("idCuestionario", idQuizz);
  formData.append("titulo", nombreTitulo);
  formData.append("fecha_creacion", new Date().toISOString().split("T")[0]);
  formData.append("tiempo_limite", tiempoLimiteGlobal);
  formData.append("materialCuestionario", archivoPDF); // Archivo PDF
  formData.append("contenido", contenido); // Archivo PDF
  formData.append("preguntas", JSON.stringify(quizData.preguntas));
  formData.append("vigencia", vigencia);

  // Guardar ID y título del cuestionario
  fetch("http://localhost:3000/api/admin/save-idcuestionario", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log(data)
        console.log("ID y título del cuestionario guardados correctamente.");
      } else {
        console.error("Error al guardar el ID y título del cuestionario.");
      }
    })
    .catch((error) => {
      console.error("Error al enviar el ID y título del cuestionario:", error);
    });
  

    fetch("http://localhost:3000/api/admin/save-departamento-cuestionario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idCuestionario: idQuizz,
        departamentos: Array.from(departamentosSeleccionadosID),
        fecha_vigencia: vigencia, 
        tiempolimite: tiempoLimiteGlobal,
      })
    })
    
    .then(response => response.json())
    .then(deptData => {
      if (deptData.success) {
        console.log('Validar departamento',deptData)
        console.log("Departamentos asociados correctamente al cuestionario.");
      } else {
        console.error("Error al asociar departamentos:", deptData.message);
      }
    })
    .catch(error => {
      console.error("Error en la solicitud de departamentos:", error);
    });

  // Guardar preguntas del cuestionario
  fetch("http://localhost:3000/api/admin/save-quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quizData }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Preguntas del cuestionario guardadas correctamente.");

        // Nueva llamada para asignar cuestionarios a usuarios
        fetch("http://localhost:3000/api/admin/assign-quizzes-to-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idCuestionarios: [idQuizz], tiempo_limite: tiempoLimiteGlobal ,departamentos: departamentosSeleccionados,}), // Pasamos el ID del cuestionario actual
        })
          .then((response) => response.json())
          .then((assignData) => {
            if (assignData.success) {
              console.log("Cuestionario asignado correctamente a los usuarios.");
              alert("Cuestionario y asignaciones completadas exitosamente.");
              
              departamentosSeleccionados = [];
              selectedDepartmentsContainer = '';
            } else {
              console.error("Error al asignar cuestionarios:", assignData.message);
              alert("Error al asignar los cuestionarios.");
            }
          })
          .catch((assignError) => {
            console.error("Error al asignar cuestionarios:", assignError);
          });
      } else {
        console.error("Error al guardar las preguntas del cuestionario.");
      }
    })
    .catch((error) => {
      console.error("Error al enviar las preguntas del cuestionario:", error);
    });

  mainContent.innerHTML =
    '<h2 class="mb-4">Bienvenido al Panel de Administración</h2>';
  console.log(idQuizz);
  console.log(nombreTitulo);
}
document.querySelector('a.crearCuestionario').addEventListener('click', loadForm1);







/* Modal  */

function fetchQuizData(idCuestionario) {
  fetch(`http://localhost:3000/api/admin/get-cuestionario/${idCuestionario}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderQuizModal(data.data);
      } else {
        alert('No se encontraron datos para este cuestionario.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener los datos del cuestionario:', error);
    });
}


function renderQuizModal(data) {
  quizData.ID_Cuestionario = data[0].IdCuestionario;
  console.log(quizData.ID_Cuestionario)
  const modalHTML = `
    <div id="quizModal" class="modal fade" tabindex="-1" aria-labelledby="quizModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="quizModalLabel">Detalles del Cuestionario</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
          <div class="d-flex align-items-center">
          <h5 class="mb-0 me-3">ID Cuestionario: ${data[0].IdCuestionario}</h5>
          <h5 class="mb-0"><strong>Título:</strong> ${data[0].titulo}</h5>
        </div>
            <h6>Preguntas:</h6>
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Título de la Pregunta</th>
                  <th>Opción 1</th>
                  <th>Opción 2</th>
                  <th>Opción 3</th>
                  <th>Opción 4</th>
                  <th>Opción Válida</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody class="table-group-divider">
                ${data
                  .map(
                    (pregunta) => `
                      <tr>
                        <td>${pregunta.TituloPregunta}</td>
                        <td>${pregunta.Opcion1}</td>
                        <td>${pregunta.Opcion2}</td>
                        <td>${pregunta.Opcion3}</td>
                        <td>${pregunta.Opcion4}</td>
                        <td>${pregunta.Valida}</td>
                        <td class="edit-exclude">
                          <button type="button" class="btn btn-primary btn-edit" >
                            Editar
                          </button>
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-success" id="saveQuizData">Sobreescribir</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);


  new bootstrap.Modal(document.getElementById('quizModal')).show();
  

  /* GENERACION DE ARCHIVO JSON */
  document.getElementById("saveQuizData").addEventListener("click", async () => {
    const idCuestionarioElement = document.querySelectorAll("#quizModal h5")[1];
    const idCuestionario = idCuestionarioElement
      ? idCuestionarioElement.textContent.split(":")[1].trim()
      : null;
  
    if (!idCuestionario) {
      console.error("No se encontró el ID del Cuestionario en el modal.");
      return;
    }
  
    const quizData = {
      ID_Cuestionario: idCuestionario,
      preguntas: [],
    };
  
    const rows = document.querySelectorAll("#quizModal .table tbody tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      /* console.log("Validar",cells[0].textContent);
      console.log("Validar",cells[1].textContent);
      console.log("Validar",cells[2].textContent);
      console.log("Validar",cells[3].textContent);
      console.log("Validar",cells[4].textContent);
      console.log("Validar",cells[5].textContent);
   */
      const pregunta = {
        texto: cells[0].textContent.trim(), 
        opciones: [
          cells[1].textContent.trim(), 
          cells[2].textContent.trim(), 
          cells[3].textContent.trim(), 
          cells[4].textContent.trim(), 
        ],
        valida: cells[5].textContent.trim(), 
      };
  
      quizData.preguntas.push(pregunta);
    });
  
    console.log("JSON generado:", JSON.stringify(quizData, null, 2));
  
    
    try {
      const response = await fetch("http://localhost:3000/api/admin/update-cuestionarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert("Cuestionarios actualizados correctamente.");
      } else {
        console.error("Error al actualizar cuestionarios:", result.message);
        alert("Error al actualizar los cuestionarios: " + result.message);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Hubo un problema al conectar con el servidor.");
    }
  });
  



  
  const rows = document.querySelectorAll("#quizModal .table tbody tr");
  rows.forEach((row) => {
    const editButton = row.querySelector(".btn-edit");
    editButton.addEventListener("click", () => editarFilas(row));
  });


  const modalElement = document.getElementById('quizModal');
  modalElement.addEventListener('hidden.bs.modal', () => {
    modalElement.remove();
  });
}






let quizData = {
  ID_Cuestionario: "",
  preguntas: []
};

function editarFilas(row) {
  const isEditing = row.classList.contains("editing");
  const cells = row.querySelectorAll("td");

  if (isEditing) {
    
    cells.forEach((cell, index) => {
      
      if (!cell.classList.contains("edit-exclude")) {
        const input = cell.querySelector("input");
        if (input) {
          cell.textContent = input.value; 
        }
      }
    });

    const editButton = row.querySelector(".btn-edit");
    editButton.textContent = "Editar";
    editButton.classList.remove("btn-success");
    editButton.classList.add("btn-primary");

    row.classList.remove("editing");
  } else {
    
    cells.forEach((cell, index) => {
      
      if (!cell.classList.contains("edit-exclude")) {
        const currentValue = cell.textContent.trim();
        cell.innerHTML = `<input type="text" class="form-control" value="${currentValue}">`;
      }
    });

    const editButton = row.querySelector(".btn-edit");
    editButton.textContent = "Guardar";
    editButton.classList.remove("btn-primary");
    editButton.classList.add("btn-success");

    row.classList.add("editing");
  }
}






/* Lista de Cuestionarios */

const mainContentListarCuestionario = document.getElementById('main-content');


function formatFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); 
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`; 
}

function loadFormListarCuestionario() {
  mainContentListarCuestionario.innerHTML = `
    <h2>Lista de Cuestionarios</h2>
    <div class="search-container mb-3">
      <div class="row">
        <div class="col-md-3">
          <input type="text" id="searchById" class="form-control" placeholder="Buscar por ID">
        </div>
        <div class="col-md-3">
          <input type="date" id="searchByDate" class="form-control">
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-primary" id="searchButton">Buscar</button>
        </div>
        <div class="col-md-3">
          <button type="button" class="btn btn-primary" id="cleanchButton">limpiar</button>
        </div>
      </div>
  </div>
    <table class="table table-striped table-hover table-ListaCuesionarios">
      <thead>
        <tr>
          <th>ID Cuestionario</th>
          <th>Título Cuestionario</th>
          <th>Fecha Creacion</th>
          <th>Estado Cuestionario</th>
          <th>Editar</h>
          <th>Ver Cuestionario</th>
        </tr>
      </thead>
      <tbody id="listar-cuestionarios-body">
        <tr><td colspan="2">Cargando...</td></tr>
      </tbody>
    </table>
  `;


  
  fetch('http://localhost:3000/api/admin/listar-cuestionarios')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderTable(data.data);
      } else {
        alert('Error al cargar los cuestionarios.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener los cuestionarios:', error);
      const tableBody = document.getElementById('listar-cuestionarios-body');
      tableBody.innerHTML = '<tr><td colspan="5">Error al cargar los datos.</td></tr>';
    });

    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('cleanchButton').addEventListener('click', clearSearchFields);
}



function clearSearchFields() {
  document.getElementById('searchById').value = ''; 
  document.getElementById('searchByDate').value = ''; 
  loadFormListarCuestionario() 
 
}



function handleSearch() {
  const id = document.getElementById('searchById').value.trim();
  const date = document.getElementById('searchByDate').value;
  console.log(id, date)
  let url = 'http://localhost:3000/api/admin/listar-cuestionarios';

  if (id) {
    url += `?id=${id}`;
  } else if (date) {
    url += `?date=${date}`;
  }

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderTable(data.data);
      } else {
        alert('No se encontraron resultados.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener los cuestionarios:', error);
      const tableBody = document.getElementById('listar-cuestionarios-body');
      tableBody.innerHTML = '<tr><td colspan="5">Error al cargar los datos.</td></tr>';
    });
}





function renderTable(data) {
  const tableBody = document.getElementById('listar-cuestionarios-body');
  tableBody.innerHTML = '';

  if (data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No se encontraron resultados.</td></tr>';
    return;
  }

  data.forEach((cuestionario) => {
    const row = `
      <tr>
        <td>${cuestionario.IdCuestionario}</td>
        <td>${cuestionario.titulo}</td>
        <td>${formatFecha(cuestionario.fecha_creacion)}</td>
        <td>
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault" checked>
            <label class="form-check-label" for="flexSwitchCheckDefault">Activo</label>
          </div>
        </td>
        <td><button type="button" class="btn btn-primary mt-3 btn-edit">Editar</button></td>
        <td><button type="button" class="btn btn-success mt-3 btn-view-quiz" data-id="${cuestionario.IdCuestionario}">Ver Cuestionario</button></td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });

  document.querySelectorAll('.btn-view-quiz').forEach((button) => {
    button.addEventListener('click', (event) => {
      const idCuestionario = event.target.getAttribute('data-id');

      fetchQuizData(idCuestionario); 
    });
  });
  
}

document.querySelector('a.listarCuestionario').addEventListener('click', loadFormListarCuestionario);






/* LISTA DE USUARIOS */

const mainListarUsuarios = document.getElementById('main-content');

function mostrarUsuarios() {
  fetch('http://localhost:3000/api/admin/listar-usuarios')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log(data)
        renderUsuariosTable(data.data);
      } else {
        alert('Error al cargar los usuarios.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener los usuarios:', error);
    });
}

function renderUsuariosTable(data) {
  mainListarUsuarios.innerHTML = `
    <h2>Lista de Usuarios</h2>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Password</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Departamento</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (user) => `
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.apellido || ''}</td>
            <td>${user.password}</td>
            <td>${user.correo}</td>
            <td>${user.role}</td>
            <td>${user.descripcion}</td>
            <td>
              <div class="botones-editar">
                <button type="button" class="btn btn-primary btn-edit" data-id="${user.id}">Editar</button>
                <button type="button" class="btn btn-danger btn-delete" data-id="${user.id}">Eliminar</button>
              </div>
            </td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  document.querySelectorAll('.btn-edit').forEach((button) => {
    button.addEventListener('click', (event) => {
      const userId = event.target.getAttribute('data-id');
      fetchUserData(userId);
    });
  });

  document.querySelectorAll('.btn-delete').forEach((button) => {
    button.addEventListener('click', (event) => {
      const userId = event.target.getAttribute('data-id');
      deleteUser(userId);
    });
  });
}

function fetchUserData(userId) {
  fetch(`http://localhost:3000/api/admin/get-user/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderEditUserModal(data.user);
        console.log(data);
      } else {
        alert('No se encontró el usuario.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener el usuario:', error);
    });
}

function renderEditUserModal(user) {
  // Obtener departamentos antes de construir el modal
  fetch('http://localhost:3000/api/admin/departamentos')
    .then((response) => response.json())
    .then((departamentos) => {
      const departamentosOptions = departamentos
        .map(
          (dep) =>
            `<option value="${dep.ID}" ${
              user.descripcion === dep.descripcion ? 'selected' : ''
            }>${dep.descripcion}</option>`
        )
        .join('');

      const modalHTML = `
        <div id="userModal" class="modal fade" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="userModalLabel">Editar Usuario</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="editUserForm">
                  <div class="mb-3">
                    <label for="username" class="form-label">Nombre</label>
                    <input type="text" id="username" class="form-control" value="${user.username}" required>
                  </div>
                  <div class="mb-3">
                    <label for="apellido" class="form-label">Apellido</label>
                    <input type="text" id="apellido" class="form-control" value="${user.apellido || ''}" required>
                  </div>
                  <div class="mb-3 d-flex align-items-center gap-2">
                    <div style="flex: 1;">
                      <label for="password" class="form-label">Contraseña</label>
                      <input type="password" id="modalpassword" class="form-control" value="${user.password}" required>
                    </div>
                      <div>
                        <button type="button" class="btn btn-secondary mt-4" id="generatePasswordButtonModal" title="Generar contraseña">
                        <i class="fas fa-key"></i>
                      </div>
                  </div>
                  <div class="mb-3">
                    <label for="departamento" class="form-label">Departamento</label>
                    <select id="modaldepartamento" class="form-select" required>
                      ${departamentosOptions}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="Correo" class="form-label">Correo</label>
                    <input type="email" id="modalcorreo" class="form-control" value="${user.correo}" required>
                  </div>
                  <div class="mb-3">
                    <label for="role" class="form-label">Rol</label>
                    <select id="role" class="form-select">
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                      <option value="usuario" ${user.role === 'usuario' ? 'selected' : ''}>Usuario</option>
                    </select>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" class="btn btn-success" id="saveUserButton" data-id="${user.id}">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = new bootstrap.Modal(document.getElementById('userModal'));
      modal.show();

      // Agregar funcionalidad para generar contraseña
      document.getElementById('generatePasswordButtonModal').addEventListener('click', () => {
        const passwordModal = document.getElementById('modalpassword');
        passwordModal.value = generatePasswordModal();
      });

      document.getElementById('saveUserButton').addEventListener('click', () => {
        const updatedUser = {
          id: user.id,
          username: document.getElementById('username').value.trim(),
          apellido: document.getElementById('apellido').value.trim(),
          correo: document.getElementById('modalcorreo').value.trim(),
          password: document.getElementById('modalpassword').value.trim(),
          role: document.getElementById('role').value,
          departamento: document.getElementById('modaldepartamento').value,
        };
        updateUser(updatedUser, modal);
      });

      document.getElementById('userModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('userModal').remove();
      });
    })
    .catch((error) => {
      console.error('Error al obtener los departamentos:', error);
      alert('Error al cargar los departamentos. Inténtelo más tarde.');
    });
}

// Función para generar contraseñas
function generatePasswordModal() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 15; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}



function updateUser(user, modal) {
  fetch('http://localhost:3000/api/admin/update-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Swal.fire({
          title: "Datos Actualizados",
          icon: "success",
          draggable: true
        });
        modal.hide();
        mostrarUsuarios();
      } else {
        alert('Error al actualizar el usuario.');
      }
    })
    .catch((error) => {
      console.error('Error al actualizar el usuario:', error);
    });
}

function deleteUser(userId) {
  Swal.fire({
    title: '¿Seguro deseas eliminar el usuario?',
    text: 'Esta acción no se puede revertir',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`http://localhost:3000/api/admin/delete-user/${userId}`, {
        method: 'DELETE',
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El usuario ha sido eliminado correctamente.',
              icon: 'success',
            });
            mostrarUsuarios(); // Recargar la lista de usuarios
          } else {
            Swal.fire({
              title: 'Error',
              text: 'Hubo un error al eliminar el usuario.',
              icon: 'error',
            });
          }
        })
        .catch((error) => {
          console.error('Error al eliminar el usuario:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo conectar con el servidor.',
            icon: 'error',
          });
        });
    }
  });
}


document.querySelector('a.listarUsuariosCuestionario').addEventListener('click', mostrarUsuarios);










/* CREAR USUARIOS */
const mainCrearUsuarios = document.getElementById('main-content');

function loadCreateUserForm() {
  mainCrearUsuarios.innerHTML = `
    <h2>Crear Usuario</h2>
    <form id="createUserForm" class="mt-4">
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="userName" class="form-label">Nombre</label>
          <input type="text" id="userName" class="form-control" placeholder="Ingrese nombre" required>
        </div>
        <div class="col-md-6">
          <label for="userApellido" class="form-label">Apellido</label>
          <input type="text" id="userApellido" class="form-control" placeholder="Ingrese apellido" required>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="userCorreo" class="form-label">Correo</label>
          <input type="email" id="userCorreo" class="form-control" placeholder="Ingrese correo" required>
        </div>
        <div class="col-md-6">
          <label for="userDepartamento" class="form-label">Departamento</label>
          <select id="userDepartamento" class="form-select" required>
            <option value="" disabled selected>Seleccione un departamento</option>
          </select>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6 d-flex align-items-end">
          <div class="w-75 me-2">
            <label for="userPassword" class="form-label">Contraseña</label>
            <input type="password" id="userPassword" class="form-control" placeholder="Ingrese contraseña" required>
          </div>
          <div>
            <button type="button" class="btn btn-secondary mt-2" id="generatePasswordButton" title="Generar contraseña">
            <i class="fas fa-key"></i>
          </div>
        </div>
        <div class="col-md-6">
          <label for="userRole" class="form-label">Rol</label>
          <select id="userRole" class="form-select" required>
            <option value="usuario">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div class="text-center">
        <button type="button" class="btn btn-primary mt-3" id="createUserButton">Crear Usuario</button>
      </div>
    </form>
  `;

  fetchDepartamentos();
  document.getElementById('createUserButton').addEventListener('click', handleCreateUser);
  document.getElementById('generatePasswordButton').addEventListener('click', generatePassword);
}

function generatePassword() {
  const length = 15; 
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  const passwordInput = document.getElementById('userPassword');
  passwordInput.value = password;
}


function fetchDepartamentos() {
  fetch('http://localhost:3000/api/admin/departamentos')
    .then((response) => response.json())
    .then((departamentos) => {
      const userDepartamento = document.getElementById('userDepartamento');
      departamentos.forEach((dep) => {
        const option = document.createElement('option');
        option.value = dep.ID;
        option.textContent = dep.descripcion;
        userDepartamento.appendChild(option);
      });
    })
    .catch((error) => {
      console.error('Error al cargar los departamentos:', error);
    });
}

async function handleCreateUser() {
  const name = document.getElementById('userName').value.trim();
  const apellido = document.getElementById('userApellido').value.trim();
  const correo = document.getElementById('userCorreo').value.trim();
  const departamento = document.getElementById('userDepartamento').value;
  const password = document.getElementById('userPassword').value.trim();
  const role = document.getElementById('userRole').value;

  
  if (!name || !apellido || !correo || !departamento || !password || !role) {
    alert('Por favor, complete todos los campos.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, apellido, correo, departamento, password, role }),
    });

    const result = await response.json();
    if (result.success) {
      alert('Usuario creado exitosamente.');
      loadCreateUserForm(); // Recargar el formulario si es necesario
    } else {
      alert(`Error al crear el usuario: ${result.message}`);
    }
  } catch (error) {
    console.error('Error al enviar los datos:', error);
    alert('Hubo un problema al conectar con el servidor.');
  }
}



document.querySelector('a.CrearUsuarios').addEventListener('click', loadCreateUserForm);












/* Listar usuarios Aprobados */

const mainListarCuestionariosUsuarios = document.getElementById('main-content');

function loadConsultarQuizzUsuarios() {
  mainListarCuestionariosUsuarios.innerHTML = `
    <h2>Consulta de Cuestionario por ID Usuario</h2>
    <form id="createUserForm" class="mt-4">
      <div class="mb-2">
        <label for="autocompleteName" class="form-label">Nombre de usuario</label>
        <input type="text" id="autocompleteName" class="form-control" placeholder="Ingrese el nombre del usuario" autocomplete="off">
        <ul id="autocompleteResults" class="list-group mt-2" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto;"></ul>
      </div>
      <div class="mb-2">
        <label for="useriD" class="form-label">ID de usuario</label>
        <input type="text" id="useriD" class="form-control" placeholder="Ingrese ID Usuario" required>
      </div>
      <button type="button" class="btn btn-success" id="consultarUserButton">Consultar Usuario</button>
    </form>
    <div class="mt-4">
      <table class="table table-striped" id="resultsTable" style="display:none;">
        <thead>
          <tr>
            <th>ID Usuario</th>
            <th>ID Cuestionario</th>
            <th>Título Cuestionario</th>
            <th>Correctas</th>
            <th>Total Preguntas</th>
            <th>Porcentaje Correcto</th>
            <th>Estado</th>
            <th>Ver Cuestionario</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;


  document.getElementById('autocompleteName').addEventListener('input', handleAutocomplete);
  async function handleAutocomplete(event) {
    const query = event.target.value.trim();
    const autocompleteResults = document.getElementById('autocompleteResults');
    autocompleteResults.innerHTML = ''; 
  
    if (!query) {
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3000/api/admin/autocomplete-users?query=${query}`);
      const users = await response.json();
  
      if (users.length === 0) {
        autocompleteResults.innerHTML = '<li class="list-group-item">No se encontraron resultados</li>';
        return;
      }
  
      users.forEach((user) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item list-group-item-action';
        listItem.textContent = `${user.username} ${user.apellido}`;
        listItem.dataset.userId = user.id;
  
        
        listItem.addEventListener('click', () => {
          document.getElementById('autocompleteName').value = `${user.username} ${user.apellido}`;
          document.getElementById('useriD').value = user.id;
          autocompleteResults.innerHTML = ''; 
        });
  
        autocompleteResults.appendChild(listItem);
      });
    } catch (error) {
      console.error('Error al obtener usuarios para autocompletado:', error);
    }
  }
  
  
  document.getElementById('consultarUserButton').addEventListener('click', () => {
    const userId = document.getElementById('useriD').value.trim();


    if (!userId) {
      alert('Por favor, ingrese un ID de usuario.');
      return;
    }

    // Llamar al endpoint original para obtener los cuestionarios
    fetch(`http://localhost:3000/api/admin/get-quiz-results/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const resultsTable = document.getElementById('resultsTable');
          const tbody = resultsTable.querySelector('tbody');
          tbody.innerHTML = ''; // Limpiar la tabla antes de mostrar los resultados

          data.results.forEach((result) => {
            const row = `
              <tr>
                <td>${result.usuario_id}</td>
                <td>${result.IDCuestionario}</td>
                <td>${result.titulo_cuestionario}</td>
                <td>${result.correctas}</td>
                <td>${result.total_preguntas}</td>
                <td>${result.porcentaje_correcto.toFixed(2)}%</td>
                <td>${result.estado}</td>
                <td>
                  <button 
                    type="button" 
                    class="btn btn-primary mt-1 btn-view-cuestionario" 
                    data-usuario-id="${result.usuario_id}" 
                    data-id-cuestionario="${result.IDCuestionario}">
                    Ver Cuestionario
                  </button>
                </td>
              </tr>
            `;
            tbody.innerHTML += row;
          });

          // Agregar eventos para los botones "Ver Cuestionario"
          document.querySelectorAll('.btn-view-cuestionario').forEach((button) => {
            button.addEventListener('click', (event) => {
              const usuarioId = button.getAttribute('data-usuario-id');
              const idCuestionario = button.getAttribute('data-id-cuestionario');
              fetchQuizDetails(usuarioId, idCuestionario);
            });
          });

          resultsTable.style.display = 'table'; // Mostrar la tabla
        } else {
          alert(data.message || 'Error al obtener los resultados.');
        }
      })
      .catch((error) => {
        console.error('Error al consultar los resultados:', error);
        alert('Error al consultar los resultados.');
      });
  });
}

function fetchQuizDetails(usuarioId, idCuestionario) {
  // Llamar al nuevo endpoint para obtener los detalles del cuestionario
  fetch(`http://localhost:3000/api/admin/get-cuestionario-detalles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuario_id: usuarioId, IDCuestionario: idCuestionario }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderQuizDetailsModal(data.results);
      } else {
        alert(data.message || 'Error al obtener los detalles del cuestionario.');
      }
    })
    .catch((error) => {
      console.error('Error al obtener los detalles del cuestionario:', error);
      alert('Error al obtener los detalles del cuestionario.');
    });
}

function renderQuizDetailsModal(results) {
  const modalHTML = `
    <div id="quizModal" class="modal fade" tabindex="-1" aria-labelledby="quizModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="quizModalLabel">Detalles del Cuestionario</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Pregunta</th>
                  <th>Opción 1</th>
                  <th>Opción 2</th>
                  <th>Opción 3</th>
                  <th>Opción 4</th>
                  <th>Respuesta Correcta</th>
                  <th>Respuesta Usuario</th>
                  <th>Opción Seleccionada</th>
                </tr>
              </thead>
              <tbody class="table-group-divider">
              ${results
                .map((row) => {
                  const isCorrect = row.opcion_seleccionada === row.Valida;
                  return `
                    <tr>
                      <td>${row.TituloPregunta}</td>
                      <td>${row.Opcion1}</td>
                      <td>${row.Opcion2}</td>
                      <td>${row.Opcion3}</td>
                      <td>${row.Opcion4}</td>
                      <td>${row.Valida}</td>
                      <td>${row.respuesta_usuario}</td>
                      <td class="${isCorrect ? 'correct-answer':'incorrect-answer'}">${row.opcion_seleccionada}</td>
                    </tr>
              `;
                })
                  .join('')}
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = new bootstrap.Modal(document.getElementById('quizModal'));
  modal.show();

  document.getElementById('quizModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('quizModal').remove();
  });
}

document.querySelector('a.ListarCuestionariosUsuarios').addEventListener('click', loadConsultarQuizzUsuarios);













const mainContentUsuariosBloqueados = document.getElementById('main-content');

function listarUsuariosBloqueados() {
  console.log('Cargando usuarios bloqueados...');

  // Encabezado para la sección
  mainContentUsuariosBloqueados.innerHTML = `
    <h2>Consulta de Cuestionarios Bloqueados por Usuario</h2>
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th scope="col"><input type="checkbox" id="select-all"></th>
            <th scope="col">ID Usuario</th>
            <th scope="col">Nombre</th>
            <th scope="col">Apellido</th>
            <th scope="col">ID Cuestionario</th>
            <th scope="col">Titulo</th>
            <th scope="col">Departamento</th>
          </tr>
        </thead>
        <tbody id="usuarios-bloqueados-body"></tbody>
      </table>
    </div>
    <button id="liberar-usuarios" class="btn btn-primary mt-3">Liberar Seleccionados</button>
  `;

  fetch('http://localhost:3000/api/admin/usuarios-bloqueados')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al obtener usuarios bloqueados');
      }
      return response.json();
    })
    .then((data) => {
      const usuariosBody = document.getElementById('usuarios-bloqueados-body');
      usuariosBody.innerHTML = '';

      data.forEach((usuario) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="usuario-checkbox" value="${usuario.usuario_id}|${usuario.IDCuestionario}"></td>
          <td>${usuario.usuario_id}</td>
          <td>${usuario.username}</td>
          <td>${usuario.apellido}</td>
          <td>${usuario.IDCuestionario}</td>
          <td>${usuario.Titulo}</td>
          <td>${usuario.descripcion}</td>
        `;
      
        usuariosBody.appendChild(row);
      });

      // Manejo del checkbox "Seleccionar todo"
      const selectAllCheckbox = document.getElementById('select-all');
      selectAllCheckbox.addEventListener('change', (event) => {
        const checkboxes = document.querySelectorAll('.usuario-checkbox');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = event.target.checked;
        });
      });
    })
    .catch((error) => {
      console.error('Error al cargar usuarios bloqueados:', error);
    });

  // Manejo del botón "Liberar seleccionados"
 document.getElementById('liberar-usuarios').addEventListener('click', () => {
  const selectedCheckboxes = document.querySelectorAll('.usuario-checkbox:checked');
  
  // Crear un array con objetos que incluyan usuario_id y IDCuestionario
  const selectedData = Array.from(selectedCheckboxes).map((checkbox) => {
    
    const [usuario_id, IDCuestionario] = checkbox.value.split('|');
    return { usuario_id, IDCuestionario };
  });

  if (selectedData.length === 0) {
    alert('Por favor, seleccione al menos un usuario para liberar.');
    return;
  }

  console.log(selectedData); // Verifica que los datos sean correctos

  fetch('http://localhost:3000/api/admin/liberar-usuarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuarios: selectedData }),
  })
     
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al liberar usuarios');
      }
      return response.json();
    })
    .then((result) => {
      alert(result.message || 'Usuarios liberados correctamente.');
      listarUsuariosBloqueados(); // Recargar la tabla después de liberar
    })
    .catch((error) => {
      console.error('Error al liberar usuarios:', error);
    });
});

}

document.querySelector('a.listarUsuariosBloqueados').addEventListener('click', listarUsuariosBloqueados);

