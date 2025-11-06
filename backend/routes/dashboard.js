const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Cache en memoria simple para /stats (mejora tiempos percibidos)
let lastStats = null;
let lastStatsTime = 0;
const STATS_TTL_MS = 10_000; // 10s

function monthRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  const first = new Date(Date.UTC(year, month, 1));
  const nextMonthFirst = new Date(Date.UTC(year, month + 1, 1));
  const last = new Date(nextMonthFirst.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(first), to: fmt(last) };
}

function prevMonthRange() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 1);
  return monthRange(d);
}

router.get('/stats', (req, res) => {
  // responder desde cache si está fresco
  const now = Date.now();
  if (lastStats && (now - lastStatsTime) < STATS_TTL_MS) {
    return res.json(lastStats);
  }
  const curr = monthRange();
  const prev = prevMonthRange();

  const sql = `
    SELECT
      -- valor total del inventario actual (precio_unitario * stock_actual)
      (
        SELECT COALESCE(SUM(p.precio_unitario * p.stock_actual), 0)
        FROM productos p
        WHERE p.estado = 'Activo'
      ) AS ingresos_mes,
      0 AS ingresos_mes_anterior,
      -- salidas actuales (sum cantidad)
      (
        SELECT COALESCE(SUM(m.cantidad), 0)
        FROM movimientos_inventario m
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.afecta_stock = 'Decrementa'
          AND m.fecha_movimiento BETWEEN ? AND ?
      ) AS salidas_mes,
      (
        SELECT COALESCE(SUM(m.cantidad), 0)
        FROM movimientos_inventario m
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.afecta_stock = 'Decrementa'
          AND m.fecha_movimiento BETWEEN ? AND ?
      ) AS salidas_mes_anterior,
      -- productos activos
      (
        SELECT COUNT(*) FROM productos WHERE estado = 'Activo'
      ) AS productos_activos,
      -- stock crítico (stock <= mínimo)
      (
        SELECT COUNT(*) FROM productos WHERE estado = 'Activo' AND stock_actual <= stock_minimo
      ) AS stock_critico
  `;

  const params = [
    curr.from, curr.to,
    prev.from, prev.to
  ];

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Error al obtener stats del dashboard:', err);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
    const payload = rows[0] || {};
    lastStats = payload;
    lastStatsTime = Date.now();
    res.json(payload);
  });
});

module.exports = router;
