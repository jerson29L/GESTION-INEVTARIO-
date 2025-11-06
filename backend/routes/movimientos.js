const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/movimientos/tipos - Obtener tipos de movimiento
router.get('/tipos', (req, res) => {
  const query = `
    SELECT id_tipo_movimiento as id, 
           nombre_tipo, 
           descripcion, 
           afecta_stock
    FROM tipos_movimiento 
    WHERE activo = TRUE
    ORDER BY nombre_tipo
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener tipos de movimiento:', err);
      return res.status(500).json({ error: 'Error al obtener tipos de movimiento' });
    }
    res.json(results);
  });
});

// GET /api/movimientos - Obtener movimientos de inventario
router.get('/', (req, res) => {
  const { tipo } = req.query;
  let query = `
    SELECT 
      m.id_movimiento,
      m.id_producto,
      p.nombre_producto,
      p.codigo_producto,
      m.id_tipo_movimiento,
      tm.nombre_tipo as tipo_movimiento,
      m.cantidad,
      m.fecha_movimiento,
      m.id_usuario_responsable,
      u.nombre_completo as responsable,
      m.motivo,
      m.lote_afectado,
      m.observaciones,
      m.fecha_registro
    FROM movimientos_inventario m
    INNER JOIN productos p ON m.id_producto = p.id_producto
    INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
    INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
  `;

  if (tipo) {
    query += ` WHERE tm.afecta_stock = ?`;
  }
  
  query += ` ORDER BY m.fecha_registro DESC`;

  db.query(query, tipo ? [tipo] : [], (err, results) => {
    if (err) {
      console.error('Error al obtener movimientos:', err);
      return res.status(500).json({ error: 'Error al obtener movimientos' });
    }
    res.json(results);
  });
});

// GET /api/movimientos/top-salidas - productos con mayor cantidad salida
router.get('/top-salidas', (req, res) => {
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const { from, to } = req.query;

  let where = `tm.afecta_stock = 'Decrementa'`;
  const params = [];
  if (from && to) {
    where += ' AND m.fecha_movimiento BETWEEN ? AND ?';
    params.push(from, to);
  }

  const query = `
    SELECT 
      p.id_producto AS id_producto,
      p.codigo_producto AS codigo_producto,
      p.nombre_producto AS nombre_producto,
      SUM(m.cantidad) AS total_salidas
    FROM movimientos_inventario m
    INNER JOIN productos p ON m.id_producto = p.id_producto
    INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE ${where}
    GROUP BY p.id_producto, p.codigo_producto, p.nombre_producto
    ORDER BY total_salidas DESC
    LIMIT ?
  `;
  params.push(limit);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error al obtener top salidas:', err);
      return res.status(500).json({ error: 'Error al obtener top de productos salidos' });
    }
    res.json(results);
  });
});

// POST /api/movimientos - Registrar nuevo movimiento
router.post('/', async (req, res) => {
  const {
    id_tipo_movimiento,
    fecha_movimiento,
    id_usuario_responsable,
    motivo,
    observaciones,
    detalles
  } = req.body;

  // Validaciones básicas
  if (!id_tipo_movimiento || !fecha_movimiento || !id_usuario_responsable || !detalles || !detalles.length) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    // Obtener una conexión dedicada para transacción
    const conn = await db.promise().getConnection();
    try {
      // Iniciar transacción
      await conn.beginTransaction();

      // Obtener información del tipo de movimiento
      const [tipoMovimiento] = await conn.query(
        'SELECT afecta_stock FROM tipos_movimiento WHERE id_tipo_movimiento = ? AND activo = TRUE',
        [id_tipo_movimiento]
      );

      if (tipoMovimiento.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Tipo de movimiento no válido' });
      }

      // Verificar stock actual de todos los productos si es una salida
      if (tipoMovimiento[0].afecta_stock === 'Decrementa') {
        for (const detalle of detalles) {
          const cantidad = Number(detalle.cantidad);
          if (!detalle.id_producto || !Number.isFinite(cantidad) || cantidad <= 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'Detalle de movimiento inválido' });
          }

          const [stockResult] = await conn.query(
            'SELECT stock_actual FROM productos WHERE id_producto = ? FOR UPDATE',
            [detalle.id_producto]
          );

          if (stockResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: `Producto ${detalle.id_producto} no encontrado` });
          }

          if (stockResult[0].stock_actual < cantidad) {
            await conn.rollback();
            return res.status(400).json({ error: `Stock insuficiente para el producto ${detalle.producto_nombre || detalle.id_producto}` });
          }
        }
      }

      // Registrar cada detalle del movimiento
      for (const detalle of detalles) {
        const cantidad = Number(detalle.cantidad);
        // Registrar el movimiento
        await conn.query(
          `INSERT INTO movimientos_inventario (
            id_producto,
            id_tipo_movimiento,
            cantidad,
            fecha_movimiento,
            id_usuario_responsable,
            motivo,
            lote_afectado,
            observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            detalle.id_producto,
            id_tipo_movimiento,
            cantidad,
            fecha_movimiento,
            id_usuario_responsable,
            motivo || null,
            detalle.lote_afectado || null,
            observaciones || null,
          ]
        );

        // Actualizar el stock según el tipo de movimiento
        if (tipoMovimiento[0].afecta_stock === 'Incrementa') {
          await conn.query(
            'UPDATE productos SET stock_actual = stock_actual + ? WHERE id_producto = ?',
            [cantidad, detalle.id_producto]
          );
        } else if (tipoMovimiento[0].afecta_stock === 'Decrementa') {
          await conn.query(
            'UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?',
            [cantidad, detalle.id_producto]
          );
        }
      }

      // Confirmar transacción
      await conn.commit();

      res.status(201).json({
        mensaje: 'Movimiento registrado exitosamente',
        productos_afectados: detalles.length
      });
    } catch (error) {
      try { await conn.rollback(); } catch (_) {}
      console.error('Error al registrar movimiento:', error);
      return res.status(500).json({ error: 'Error al registrar el movimiento' });
    } finally {
      conn.release();
    }

  } catch (outerErr) {
    console.error('Error al iniciar transacción o conexión:', outerErr);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;