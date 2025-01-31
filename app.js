const express = require('express');
const path = require('path');
const cors = require('cors');
const connection = require('./public/js/conexion');
const bodyParser = require('body-parser');
const adminRoutes = require('./rutas/admin');
const usuarioRoutes = require('./rutas/usuario');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: 'http://127.0.0.1:5501', 
  methods: ['GET', 'POST'], 
  credentials: true, 
}));



app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT id, role, username, apellido FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }

    if (results.length > 0) {
      const { id, role, username, apellido } = results[0];
      if (role === 'admin') {
        res.json({ success: true, userId: id, role, username, apellido, redirect: 'admin.html' });
      } else if (role === 'usuario') {
        res.json({ success: true, userId: id, role, username, apellido, redirect: 'usuario.html' });
      }
    } else {
      res.status(401).json({ message: 'Credenciales incorrectas' });
    }
  });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    
});

app.use('/uploads', express.static(path.join('C:/MaterialPDF')));

app.use('/pdf', express.static(path.join('C:/MaterialPDF/Diplomas')));

app.use('/api/admin', adminRoutes);

app.use('/api/usuario', usuarioRoutes);

app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
