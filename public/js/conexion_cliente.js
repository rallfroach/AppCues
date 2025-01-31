// ID-NOMBRE2: Almacenar nombre y apellido del usuario en localStorage
document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  console.log('Datos enviados:', { username, password });

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();

      // Guardar el ID del usuario, rol, nombre y apellido en localStorage
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('apellido', data.apellido);

      // Redirigir al rol correspondiente
      window.location.href = data.redirect;
    } else {
      alert('Credenciales incorrectas');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});
