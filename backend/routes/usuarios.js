const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/usuarios - Listar usuarios (con info de rol)
router.get('/', (req, res) => {
  const query = `
    SELECT 
      u.id_usuario AS id,
      u.nombre_completo,
      u.email,
      u.id_rol,
      r.nombre_rol AS rol_nombre,
        CASE WHEN u.estado = 'Activo' THEN 1 ELSE 0 END as estado,
      u.fecha_creacion,
      r.permisos as rol_permisos
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.estado = 'Activo'
    ORDER BY u.fecha_creacion DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
    res.json(results);
  });
});

// GET /api/usuarios/roles - Obtener roles disponibles
router.get('/roles', (req, res) => {
  const query = `
    SELECT 
      id_rol as id,
      nombre_rol as nombre,
      descripcion,
      permisos,
      activo
    FROM roles 
    WHERE activo = TRUE
    ORDER BY id_rol
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener roles:', err);
      return res.status(500).json({ error: 'Error al obtener roles' });
    }
    res.json(results);
  });
});

// POST /api/usuarios - Crear usuario
router.post('/', async (req, res) => {
  const {
    nombre_completo,
    email,
    password,
    id_rol
  } = req.body;

  // Validaciones básicas
  if (!nombre_completo || !email || !password || !id_rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    // Verificar si el email ya existe
    const checkEmail = 'SELECT id_usuario FROM usuarios WHERE email = ?';
    db.query(checkEmail, [email], async (err, results) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({ error: 'Error al crear usuario' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Hash del password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insertar usuario
      const query = `
        INSERT INTO usuarios (
          nombre_completo,
          email,
          password_hash,
          id_rol,
          estado,
          fecha_creacion
        ) VALUES (?, ?, ?, ?, 1, NOW())
      `;

      db.query(query, [
        nombre_completo,
        email,
        hashedPassword,
        id_rol
      ], (err, result) => {
        if (err) {
          console.error('Error al crear usuario:', err);
          return res.status(500).json({ error: 'Error al crear usuario' });
        }

        res.status(201).json({
          mensaje: 'Usuario creado exitosamente',
          id: result.insertId
        });
      });
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre_completo,
    email,
    id_rol,
    estado,
    password // opcional
  } = req.body;

  try {
    // Verificar si el email ya existe (excluyendo el usuario actual)
    if (email) {
      const checkEmail = 'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?';
      const [emailResults] = await db.promise().query(checkEmail, [email, id]);
      
      if (emailResults.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
      }
    }

    // Construir query dinámicamente según campos proporcionados
    let updateFields = [];
    let queryParams = [];

    if (nombre_completo) {
      updateFields.push('nombre_completo = ?');
      queryParams.push(nombre_completo);
    }
    
    if (email) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    if (id_rol) {
      updateFields.push('id_rol = ?');
      queryParams.push(id_rol);
    }
    
    if (estado) {
      updateFields.push('estado = ?');
      queryParams.push(estado);
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password_hash = ?');
      queryParams.push(hashedPassword);
    }

    // Añadir ID al final de los parámetros
    queryParams.push(id);

    const query = `
      UPDATE usuarios 
      SET ${updateFields.join(', ')}
      WHERE id_usuario = ?
    `;

    const [result] = await db.promise().query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario (soft delete)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = "UPDATE usuarios SET estado = 'Inactivo' WHERE id_usuario = ?";
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  });
});

module.exports = router;