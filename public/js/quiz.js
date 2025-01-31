
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    console.log(userId)
    if (!userId) {
      alert('Debes iniciar sesión para acceder a esta página.');
      window.location.href = '/index.html';
    }
  });

  // ID-LOGOUT: Función para desconectar al usuario
document.getElementById('logoutButton')?.addEventListener('click', () => {
  // Eliminar datos de sesión almacenados
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');

  // Redirigir a la página de inicio de sesión
  window.location.href = '/index.html';
});


// ID-NOMBRE3: Mostrar nombre y apellido del usuario conectado
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const apellido = localStorage.getItem('apellido');
  const userFullNameElement = document.getElementById('userFullName');

  if (username || apellido || userFullNameElement) {
    userFullNameElement.textContent = `${username} ${apellido}`;
  }
});