const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
  
app.use(cors());
app.use(morgan('combined'));
app.use(express.json()); // Si deseas usar el método POST con cuerpo JSON.
app.use(express.urlencoded({ extended: true })); // Para poder interpretar datos de formularios si lo necesitas.
 
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '010200',
    database: 'escuela',
    port: '5432', // El puerto predeterminado de PostgreSQL  
  
  });
 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('¡Algo salió mal!');
});

app.get('/all', (req, res) => {
    const query = 'SELECT * FROM evento'; // Consulta que obtiene todos los eventos
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error ejecutando la consulta:', error); // Loguear el error en la consola del servidor
        return res.status(400).json({
          error: 'Error al consultar la base de datos',
          detail: error.message // Proporcionar detalles del error en la respuesta
        });
      }
      res.json(results.rows);
    });
  });

  app.get('/eventos', (req, res) => {
    const { fecha } = req.query; // Asume que la fecha viene como 'YYYY-MM-DD'
    const query = 'SELECT * FROM evento WHERE fecha = $1';
    pool.query(query, [fecha], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });

  

  
  app.post('/login', async (req, res) => {
    const { user_name, password } = req.body;
  
    try {
      const user = await pool.query("SELECT * FROM usuario WHERE user_name = $1", [user_name]);
  
      if (user.rows.length > 0) { // Si el usuario existe
        const userValid = await pool.query("SELECT * FROM usuario WHERE user_name = $1 and password = $2", [user_name,password]);
        if (userValid.rows.length > 0) { // Si encontramos el usuario y su clave nos logeamos
          res.json({ success: true, message: "Login successful" });
        } else {
          res.status(401).json({ success: false, message: "Invalid credentials" }); // Usuario existe pero no corresponde la clave
        }
      } else {
        res.status(404).json({ success: false, message: "User not found" }); // Usuario no encontrado
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Database error" });
    }
  });
  

app.listen(3001, () => {
  console.log('API service is running on port', 3001);
});
