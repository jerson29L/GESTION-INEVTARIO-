const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todas las marcas
router.get('/', (req, res) => {
  const query = 'SELECT * FROM marcas WHERE activo = TRUE';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener marcas:', err);
      return res.status(500).json({ error: 'Error al obtener marcas' });
    }
    res.json(results);
  });
});

// Crear nueva marca
router.post('/', (req, res) => {
  const { nombre_marca, contacto, telefono, email, direccion } = req.body;
  const query = `
    INSERT INTO marcas (nombre_marca, contacto, telefono, email, direccion) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(query, [nombre_marca, contacto, telefono, email, direccion], (err, result) => {
    if (err) {
      console.error('Error al crear marca:', err);
      return res.status(500).json({ error: 'Error al crear marca' });
    }
    res.json({ mensaje: 'Marca creada exitosamente', id: result.insertId });
  });
});

// Actualizar marca
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { nombre_marca, contacto, telefono, email, direccion } = req.body;
  const query = `
    UPDATE marcas 
    SET nombre_marca = ?, contacto = ?, telefono = ?, email = ?, direccion = ? 
    WHERE id_marca = ? AND activo = TRUE
  `;
  
  db.query(query, [nombre_marca, contacto, telefono, email, direccion, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar marca:', err);
      return res.status(500).json({ error: 'Error al actualizar marca' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json({ mensaje: 'Marca actualizada exitosamente' });
  });
});

// Eliminar marca (soft delete)
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const query = 'UPDATE marcas SET activo = FALSE WHERE id_marca = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar marca:', err);
      return res.status(500).json({ error: 'Error al eliminar marca' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json({ mensaje: 'Marca eliminada exitosamente' });
  });
});

module.exports = router;