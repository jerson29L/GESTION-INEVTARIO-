const mysql = require('mysql2');
require('dotenv').config();

// Usar un pool para soportar transacciones (getConnection) y mejor rendimiento
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  connectionLimit: 10,
  multipleStatements: true,
});

// Probar conexión inicial
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err.message);
  } else {
    console.log('Conexión exitosa a MySQL (pool)');
    conn.release();
  }
});

module.exports = pool;
