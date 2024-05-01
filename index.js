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

  app.get('/eventosPorUsuario', (req, res) => {
    const { idUsuario } = req.query;
    const query = 'SELECT * FROM evento WHERE usuario_usuario_id = $1';
    pool.query(query, [idUsuario], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });

  app.get('/eventosAdmin', (req, res) => {

    const query = 'SELECT * FROM evento';
    pool.query(query, [], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });


  app.post('/eventos', async (req, res) => {
    const { date, title, description,id_usuario } = req.body;
    try {
      const query = 'INSERT INTO evento (titulo, descripcion,fecha, usuario_usuario_id) VALUES ($1, $2, $3,$4) RETURNING *';
      const values = [title, description,date,id_usuario];
      const result = await pool.query(query, values);
  
      // El nuevo evento se devuelve como parte de la respuesta
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ success: false, message: 'Error creating event' });
    }
  });
  
  app.delete('/eventos/:idEvento', async (req, res) => {
    const idEvento = req.params.idEvento;
    try {
      // Verificar si el evento pertenece al usuario antes de eliminarlo
      const eventoQuery = 'SELECT * FROM evento WHERE evento_id = $1';
      const eventoResult = await pool.query(eventoQuery, [idEvento]);
      if (eventoResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado para este usuario' });
      }
  
      // Si el evento pertenece al usuario, eliminarlo
      const deleteQuery = 'DELETE FROM evento WHERE evento_id = $1';
      await pool.query(deleteQuery, [idEvento]);
  
      res.json({ success: true, message: 'Evento eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando evento:', error);
      res.status(500).json({ success: false, message: 'Error eliminando evento' });
    }
  });

  app.delete('/eventosAdmin/:idEvento', async (req, res) => {
    const idEvento = req.params.idEvento;
    try {
      // Verificar si el evento pertenece al usuario antes de eliminarlo
      const eventoQuery = 'SELECT * FROM evento WHERE evento_id = $1';
      const eventoResult = await pool.query(eventoQuery, [idEvento]);
      if (eventoResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado para este usuario' });
      }
  
      // Si el evento pertenece al usuario, eliminarlo
      const deleteQuery = 'DELETE FROM evento WHERE evento_id = $1';
      await pool.query(deleteQuery, [idEvento]);
  
      res.json({ success: true, message: 'Evento eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando evento:', error);
      res.status(500).json({ success: false, message: 'Error eliminando evento' });
    }
  });
  
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await pool.query("SELECT * FROM usuario WHERE user_name = $1 and flag_activo=true", [username]);
  
      if (user.rows.length > 0) { // Si el usuario existe
        const userValid = await pool.query("SELECT * FROM usuario WHERE user_name = $1 and password = $2", [username,password]);
        if (userValid.rows.length > 0) { // Si encontramos el usuario y su clave nos logeamos
          const userData = userValid.rows[0];
          // Aquí puedes seleccionar los campos específicos que deseas devolver en la respuesta
          const { usuario_id, user_name, id_rol, nombre, apellido, email } = userData;
         
          res.json({ success: true, message: "Login exitoso" ,user: {
            usuario_id,
            user_name,
            nombre,
            apellido,
            email,
            id_rol
          }});//devolver idUsuario, Rol , datos personales , etc
        } else {
          res.status(401).json({ success: false, message: "Credenciales Invalidas" }); // Usuario existe pero no corresponde la clave
        }
      } else {
        res.status(404).json({ success: false, message: "Usuario no Encontrado o Inactivo" }); // Usuario no encontrado
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Database error" });
    }
  });
  

  app.get('/publicaciones/publicas', (req, res) => {
    const query = 'SELECT * FROM mensaje where publico = true';
    pool.query(query, [], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });
  app.get('/publicaciones/privadas', (req, res) => {
    const query = 'SELECT * FROM mensaje';
    pool.query(query, [], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });

  app.get('/publicaciones/propias', (req, res) => {
    const { idUsuario } = req.query;
    const query = 'SELECT * FROM mensaje where usuario_usuario_id=$1';
    pool.query(query, [idUsuario], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });
  
  app.post('/publicaciones', (req, res) => {
    const { remitente, titulo_mensaje, mensaje, usuario_usuario_id, publico } = req.body;
    const fecha = new Date(); // Asignar la fecha actual
    
    const query = 'INSERT INTO mensaje (remitente, titulo_mensaje, mensaje, usuario_usuario_id, fecha, publico) VALUES ($1, $2, $3, $4, $5, $6)';
    const values = [remitente, titulo_mensaje, mensaje, usuario_usuario_id, fecha, publico];
    
    pool.query(query, values, (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.status(201).json({ message: 'Publicación creada correctamente' });
    });
  });


  app.delete('/publicaciones/:idMensaje', async (req, res) => {
    const idMensaje = req.params.idMensaje;
    try {
      // Verificar si el evento pertenece al usuario antes de eliminarlo
      const eventoQuery = 'SELECT * FROM mensaje WHERE mensaje_id = $1';
      const eventoResult = await pool.query(eventoQuery, [idMensaje]);
      if (eventoResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'mensaje no encontrado para este usuario' });
      }
  
      // Si el evento pertenece al usuario, eliminarlo
      const deleteQuery = 'DELETE FROM mensaje WHERE mensaje_id = $1';
      await pool.query(deleteQuery, [idMensaje]);
  
      res.json({ success: true, message: 'mensaje eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      res.status(500).json({ success: false, message: 'Error eliminando mensaje' });
    }
  });

  app.get('/usuarios', (req, res) => {
    const query = 'SELECT * FROM usuario';
    pool.query(query, [], (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.json(results.rows);
    });
  });

  app.post('/usuarios', (req, res) => {
    const { nombre, apellido, email, user_name, password, id_rol, flag_activo } = req.body;
    const query = 'INSERT INTO usuario (nombre, apellido, email, user_name, password, id_rol, flag_activo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const values = [nombre, apellido, email, user_name, password, id_rol, flag_activo];
    
    pool.query(query, values, (error, results) => {
      if (error) {
        return res.status(400).json({ error });
      }
      res.status(201).json(results.rows[0]);
    });
  });
// UPDATE para realizar un borrado lógico de un usuario por su ID
app.put('/usuariosDes/:id', (req, res) => {
  const id = req.params.id;
  const query = 'UPDATE usuario SET flag_activo = false WHERE usuario_id = $1';
  
  pool.query(query, [id], (error, results) => {
    if (error) {
      return res.status(400).json({ error });
    }
    res.status(200).json({ message: 'Usuario borrado lógicamente correctamente' });
  });
});

app.put('/usuariosAct/:id', (req, res) => {
  const id = req.params.id;
  const query = 'UPDATE usuario SET flag_activo = true WHERE usuario_id = $1';
  
  pool.query(query, [id], (error, results) => {
    if (error) {
      return res.status(400).json({ error });
    }
    res.status(200).json({ message: 'Usuario borrado lógicamente correctamente' });
  });
});

app.listen(3001, () => {
  console.log('API service is running on port', 3001);
});
