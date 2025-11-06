const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener todas las categorías
router.get('/', (req, res) => {
  const query = 'SELECT * FROM categorias WHERE activo = TRUE';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener categorías:', err);
      return res.status(500).json({ error: 'Error al obtener categorías' });
    }
    res.json(results);
  });
});

// Crear nueva categoría
router.post('/', (req, res) => {
  const { nombre_categoria, descripcion } = req.body;
  const query = 'INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)';
  
  db.query(query, [nombre_categoria, descripcion], (err, result) => {
    if (err) {
      console.error('Error al crear categoría:', err);
      return res.status(500).json({ error: 'Error al crear categoría' });
    }
    res.json({ mensaje: 'Categoría creada exitosamente', id: result.insertId });
  });
});

// Actualizar categoría
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { nombre_categoria, descripcion } = req.body;
  const query = 'UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ? AND activo = TRUE';
  
  db.query(query, [nombre_categoria, descripcion, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar categoría:', err);
      return res.status(500).json({ error: 'Error al actualizar categoría' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ mensaje: 'Categoría actualizada exitosamente' });
  });
});

// Eliminar categoría (soft delete)
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const query = 'UPDATE categorias SET activo = FALSE WHERE id_categoria = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar categoría:', err);
      return res.status(500).json({ error: 'Error al eliminar categoría' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ mensaje: 'Categoría eliminada exitosamente' });
  });
});

module.exports = router;