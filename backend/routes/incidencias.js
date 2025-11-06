const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/incidencias/tipos - listar tipos de incidencia activos
router.get('/tipos', (req, res) => {
  const sql = `
    SELECT id_tipo_incidencia AS id, nombre_tipo, descripcion
    FROM tipos_incidencia
    WHERE activo = TRUE
    ORDER BY nombre_tipo
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Error al obtener tipos de incidencia:', err);
      return res.status(500).json({ error: 'Error al obtener tipos de incidencia' });
    }
    res.json(rows);
  });
});

// GET /api/incidencias - historial (opcional limit)
router.get('/', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const sql = `
    SELECT 
      i.id_incidencia,
      i.id_producto,
      p.codigo_producto,
      p.nombre_producto,
      p.lote,
      i.id_tipo_incidencia,
      t.nombre_tipo AS tipo_incidencia,
      i.cantidad_afectada,
      i.fecha_incidencia,
      i.id_usuario_registro,
      i.descripcion_detallada,
      i.accion_tomada,
      i.fecha_registro
    FROM incidencias i
    INNER JOIN productos p ON i.id_producto = p.id_producto
    INNER JOIN tipos_incidencia t ON i.id_tipo_incidencia = t.id_tipo_incidencia
    ORDER BY i.fecha_registro DESC
    LIMIT ?
  `;
  db.query(sql, [limit], (err, rows) => {
    if (err) {
      console.error('Error al obtener incidencias:', err);
      return res.status(500).json({ error: 'Error al obtener incidencias' });
    }
    res.json(rows);
  });
});

// POST /api/incidencias - registrar incidencia y actualizar stock (decrementa)
router.post('/', async (req, res) => {
  const {
    id_producto,
    id_tipo_incidencia,
    cantidad_afectada,
    fecha_incidencia,
    id_usuario_registro,
    descripcion_detallada,
    accion_tomada
  } = req.body;

  if (!id_producto || !id_tipo_incidencia || !cantidad_afectada || !fecha_incidencia || !id_usuario_registro || !descripcion_detallada) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const conn = await db.promise().getConnection();
    try {
      await conn.beginTransaction();

      // Validar existencia de producto y usuario para evitar FK 500s tempranas
      const [[prod]] = await conn.query('SELECT id_producto FROM productos WHERE id_producto = ? LIMIT 1', [id_producto]);
      if (!prod) {
        await conn.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      const [[usr]] = await conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ? LIMIT 1', [id_usuario_registro]);
      if (!usr) {
        await conn.rollback();
        return res.status(400).json({ error: 'Usuario no válido' });
      }
      const [[tipo]] = await conn.query('SELECT id_tipo_incidencia FROM tipos_incidencia WHERE id_tipo_incidencia = ? AND activo = TRUE LIMIT 1', [id_tipo_incidencia]);
      if (!tipo) {
        await conn.rollback();
        return res.status(400).json({ error: 'Tipo de incidencia no válido' });
      }

      await conn.query(
        `INSERT INTO incidencias (
          id_producto,
          id_tipo_incidencia,
          cantidad_afectada,
          fecha_incidencia,
          id_usuario_registro,
          descripcion_detallada,
          accion_tomada
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_producto, id_tipo_incidencia, cantidad_afectada, fecha_incidencia, id_usuario_registro, descripcion_detallada, accion_tomada || null]
      );

      await conn.commit();
      res.status(201).json({ mensaje: 'Incidencia registrada correctamente' });
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      console.error('Error al registrar incidencia:', err);
      res.status(500).json({ error: 'Error al registrar la incidencia' });
    } finally {
      conn.release();
    }
  } catch (outerErr) {
    console.error('Error de conexión/tx en incidencias:', outerErr);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
