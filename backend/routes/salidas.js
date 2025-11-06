const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/salidas - Registrar una nueva salida
router.post('/', async (req, res) => {
  const {
    id_producto,
    cantidad,
    motivo,
    fecha,
    responsable
  } = req.body;

  // Validaciones básicas
  if (!id_producto || !cantidad || !motivo || !fecha || !responsable) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    // Iniciar transacción
    await db.promise().beginTransaction();

    // Verificar stock actual
    const [stockResult] = await db.promise().query(
      'SELECT stock FROM productos WHERE id = ? FOR UPDATE',
      [id_producto]
    );

    if (stockResult.length === 0) {
      await db.promise().rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stockActual = stockResult[0].stock;

    if (stockActual < cantidad) {
      await db.promise().rollback();
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Registrar la salida
    const [salidaResult] = await db.promise().query(
      `INSERT INTO salidas (
        id_producto,
        cantidad,
        motivo,
        fecha,
        responsable,
        fecha_registro
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_producto, cantidad, motivo, fecha, responsable]
    );

    // Actualizar el stock
    await db.promise().query(
      'UPDATE productos SET stock = stock - ? WHERE id = ?',
      [cantidad, id_producto]
    );

    // Confirmar transacción
    await db.promise().commit();

    res.status(201).json({
      mensaje: 'Salida registrada exitosamente',
      id: salidaResult.insertId
    });

  } catch (error) {
    await db.promise().rollback();
    console.error('Error al registrar salida:', error);
    res.status(500).json({ error: 'Error al registrar la salida' });
  }
});

// GET /api/salidas - Obtener historial de salidas
router.get('/', (req, res) => {
  const query = `
    SELECT 
      s.id,
      s.id_producto,
      p.nombre as producto_nombre,
      p.codigo as producto_codigo,
      s.cantidad,
      s.motivo,
      s.fecha,
      s.responsable,
      s.fecha_registro
    FROM salidas s
    INNER JOIN productos p ON s.id_producto = p.id
    ORDER BY s.fecha_registro DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener salidas:', err);
      return res.status(500).json({ error: 'Error al obtener salidas' });
    }
    res.json(results);
  });
});

module.exports = router;