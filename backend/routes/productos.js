const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Constantes para consultas SQL reutilizables
const PRODUCTO_BASE_FIELDS = `
  p.id_producto AS id,
  p.codigo_producto AS sku,
  p.nombre_producto AS name,
  p.descripcion,
  p.precio_unitario AS price,
  m.nombre_marca AS provider,
  p.stock_actual AS stock,
  p.stock_minimo AS stockminimo,
  p.fecha_creacion AS date,
  p.id_categoria AS idcategoria,
  CASE WHEN p.estado = 'Activo' THEN 1 ELSE 0 END AS estado,
  c.nombre_categoria AS categoria_nombre,
  p.id_marca,
  p.lote,
  p.estado AS estado_stock,
  CASE
    WHEN p.stock_actual > 10 THEN 'Disponible'
    WHEN p.stock_actual > 0 AND p.stock_actual <= 10 THEN 'Pocas unidades'
    ELSE 'Sin Stock'
  END AS estado_stock_display
`;

const PRODUCTO_BASE_JOINS = `
  FROM productos p
  INNER JOIN categorias c ON p.id_categoria = c.id_categoria
  INNER JOIN marcas m ON p.id_marca = m.id_marca
`;

router.get('/', (req, res) => {
  const query = `
    SELECT ${PRODUCTO_BASE_FIELDS}
    ${PRODUCTO_BASE_JOINS}
    WHERE p.estado = 'Activo'
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta SQL:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(results);
  });
});

router.get('/categorias', (req, res) => {
  const query = 'SELECT id_categoria AS idcategoria, nombre_categoria as nombre FROM categorias WHERE activo = TRUE';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener categorías:', err);
      return res.status(500).json({ error: 'Error al obtener categorías' });
    }
    res.json(results);
  });
});

router.get('/proveedores', (req, res) => {
  const query = 'SELECT id_marca, nombre_marca FROM marcas WHERE activo = TRUE';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener marcas:', err);
      return res.status(500).json({ error: 'Error al obtener marcas' });
    }
    const nombres = results.map(r => r.nombre_marca);
    res.json(nombres);
  });
});

router.post('/', (req, res) => {
  const {
    sku,
    name,
    descripcion,
    price,
    provider,
    stock,
    stockminimo,
    idcategoria
  } = req.body;

  // Primero buscar el id_marca basado en el nombre de la marca
  const findProviderQuery = 'SELECT id_marca FROM marcas WHERE nombre_marca = ? AND activo = TRUE';
  db.query(findProviderQuery, [provider], (err, providerResults) => {
    if (err || providerResults.length === 0) {
      console.error('Error al encontrar marca:', err);
      return res.status(400).json({ error: 'Marca no encontrada o inactiva' });
    }

    const idMarca = providerResults[0].id_marca;
    const query = `
      INSERT INTO productos (
        codigo_producto,
        nombre_producto,
        descripcion,
        precio_unitario,
        stock_actual,
        stock_minimo,
        id_categoria,
        id_marca,
        estado,
        lote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo', CONCAT('L-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 1000), 3, '0')))
    `;

    db.query(query, [
      sku,
      name,
      descripcion,
      price,
      stock,
      stockminimo || 5,
      idcategoria,
      idMarca
    ], (err, result) => {
      if (err) {
        console.error('Error al insertar producto:', err);
        return res.status(500).json({ error: 'Error al guardar producto' });
      }
      res.json({ mensaje: 'Producto guardado exitosamente', id: result.insertId });
    });
  });
});

// Actualizar producto por ID
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const {
    sku,
    name,
    descripcion,
    price,
    provider,
    stock,
    stockminimo,
    idcategoria
  } = req.body;

  // Primero buscar el id_marca
  const findProviderQuery = 'SELECT id_marca FROM marcas WHERE nombre_marca = ? AND activo = TRUE';
  db.query(findProviderQuery, [provider], (err, providerResults) => {
    if (err || providerResults.length === 0) {
      console.error('Error al encontrar marca:', err);
      return res.status(400).json({ error: 'Marca no encontrada o inactiva' });
    }

    const idMarca = providerResults[0].id_marca;
    // Actualizamos sólo los campos permitidos y mantenemos 'estado' como 'Activo' a menos que el stock sea 0
    const query = `
      UPDATE productos 
      SET 
        codigo_producto = ?,
        nombre_producto = ?,
        descripcion = ?,
        precio_unitario = ?,
        stock_actual = ?,
        stock_minimo = ?,
        id_categoria = ?,
        id_marca = ?,
        estado = CASE WHEN ? = 0 THEN 'Inactivo' ELSE 'Activo' END
      WHERE id_producto = ? AND estado != 'Inactivo'
    `;

    db.query(query, [
      sku,           // codigo_producto
      name,          // nombre_producto
      descripcion,   // descripcion
      price,         // precio_unitario
      stock,         // stock_actual
      stockminimo || 5,
      idcategoria,
      idMarca,
      stock,         // para determinar si pasa a 'Inactivo'
      id
    ], (err, result) => {
      if (err) {
        console.error('Error al actualizar producto:', err);
        return res.status(500).json({ error: 'Error al actualizar producto' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
      }
      res.json({ mensaje: 'Producto actualizado exitosamente' });
    });
  });
});

// Eliminar producto (soft delete)
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const query = "UPDATE productos SET estado = 'Inactivo' WHERE id_producto = ?";
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto marcado como inactivo exitosamente' });
  });
});

module.exports = router;