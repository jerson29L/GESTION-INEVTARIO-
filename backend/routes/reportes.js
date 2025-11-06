const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');

// GET /api/reportes - listar reportes recientes
router.get('/', (req, res) => {
  const limit = Math.max(parseInt(req.query.limit) || 20, 1);
  const sql = `
    SELECT id_reporte, tipo_reporte, id_usuario_generador, parametros, fecha_generacion, nombre_archivo, tamaño_bytes
    FROM reportes
    ORDER BY fecha_generacion DESC
    LIMIT ?
  `;
  db.query(sql, [limit], (err, rows) => {
    if (err) {
      console.error('Error al listar reportes:', err);
      return res.status(500).json({ error: 'Error al listar reportes' });
    }
    res.json(rows);
  });
});

// GET /api/reportes/ultimos?limit=20&tipo=Reporte_Productos&subtipo=Movimientos
router.get('/ultimos', (req, res) => {
  const limit = Math.max(parseInt(req.query.limit) || 20, 1);
  const tipo = req.query.tipo ? String(req.query.tipo) : null;
  const subtipo = req.query.subtipo ? String(req.query.subtipo) : null;

  let sql = `
    SELECT id_reporte, tipo_reporte, id_usuario_generador, parametros, fecha_generacion, nombre_archivo, tamaño_bytes
    FROM reportes
    WHERE 1=1
  `;
  const params = [];
  if (tipo) {
    sql += ` AND tipo_reporte = ?`;
    params.push(tipo);
  }
  if (subtipo) {
    // comparar subtipo dentro del JSON parametros
    sql += ` AND JSON_UNQUOTE(JSON_EXTRACT(parametros, '$.subtipo')) = ?`;
    params.push(subtipo);
  }
  sql += ` ORDER BY fecha_generacion DESC LIMIT ?`;
  params.push(limit);

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Error al listar últimos reportes:', err);
      return res.status(500).json({ error: 'Error al listar últimos reportes' });
    }
    res.json(rows);
  });
});

// Acepta { filename: string, dataBase64: string, tipo_reporte, id_usuario_generador, parametros }
// y guarda el PDF en la tabla 'reportes' como BLOB
router.post('/upload', (req, res) => {
  try {
    const { filename, dataBase64, tipo_reporte, id_usuario_generador, parametros } = req.body || {};
    if (!filename || !dataBase64) {
      return res.status(400).json({ error: 'filename y dataBase64 son requeridos' });
    }
    const safeName = String(filename).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const buffer = Buffer.from(String(dataBase64), 'base64');

    // Asegurar valores por defecto y mapear tipos al enum definido
    let tipo = tipo_reporte || 'Reporte_Productos';
    const allowed = new Set(['Reporte_Productos', 'Reporte_Incidencia', 'Reporte_Productos_Mayor_Salida']);
    if (!allowed.has(tipo)) {
      // intentar mapear desde etiquetas antiguas
      const map = {
        'Inventario Actual': 'Reporte_Productos',
        'Movimientos': 'Reporte_Productos', // se distingue por parametros.subtipo
        'Reporte Estadístico': 'Reporte_Incidencia',
        'Top Productos (Salidas)': 'Reporte_Productos_Mayor_Salida'
      };
      tipo = map[tipo_reporte] || 'Reporte_Productos';
    }

    const paramsJson = parametros ? JSON.stringify(parametros) : null;
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const size = buffer.length;
    const mime = 'application/pdf';

    const sql = `
      INSERT INTO reportes (
        tipo_reporte, id_usuario_generador, parametros, nombre_archivo, archivo_pdf, tipo_mime, tamaño_bytes, hash_archivo, estado_generacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Completado')
    `;
    db.query(sql, [tipo, id_usuario_generador || 1, paramsJson, safeName, buffer, mime, size, hash], (dberr, result) => {
      if (dberr) {
        console.error('Error al registrar reporte en DB:', dberr);
        return res.status(500).json({ error: 'No se pudo guardar el reporte' });
      }
      return res.status(201).json({ mensaje: 'Reporte guardado', id_reporte: result.insertId });
    });
  } catch (e) {
    console.error('Excepción en upload reporte:', e);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Descargar PDF de un reporte por id
router.get('/:id/pdf', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Id inválido' });
  const sql = `
    SELECT nombre_archivo, archivo_pdf, tipo_mime, tamaño_bytes
    FROM reportes WHERE id_reporte = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Error al obtener PDF:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Reporte no encontrado' });
    const r = rows[0];
    res.setHeader('Content-Type', r.tipo_mime || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${r.nombre_archivo || 'reporte.pdf'}"`);
    if (r.tamaño_bytes) res.setHeader('Content-Length', r.tamaño_bytes);
    res.end(r.archivo_pdf);
  });
});

module.exports = router;
