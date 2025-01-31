function alertaSatisfactoria(){
  Swal.fire({
    position: "center",
    icon: "success",
    title: "Actualización Exitosa",
    showConfirmButton: false,
    timer: 1500,
    width:'25rem',
    timerProgressBar:true
  });
}

window.alertaSatisfactoria = alertaSatisfactoria;

function confirmacionEliminarUsuario(){
  Swal.fire({
    title: "Seguro desea eliminar?",
    text: "Esta accion no se puede revertir",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "Deleted!",
        text: "Your file has been deleted.",
        icon: "success"
      });
    }
  });

}

window.confirmacionEliminarUsuario = confirmacionEliminarUsuario;