const mysql = require("mysql");

const connection  = mysql.createConnection({
  host: "localhost",
  database: "cuestionarios_db",
  user: "Admin",
  password: "Hausmann2024+"

});

connection.connect((err) => {
  if (err) {
      console.error('Error conectando a la base de datos: ', err);
      return;
  }
  console.log('Conectado a la base de datos cuestionarios_bd MySQL');
});

module.exports = connection;




