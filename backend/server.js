const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
// Cargar .env del directorio backend
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware básico
app.use(cors());
// Aumentar límite por carga de PDFs en base64 desde el dashboard
app.use(express.json({ limit: '20mb' }));
app.use(compression()); // gzip/br para respuestas más rápidas

// Ruta de prueba
app.get('/api/test', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) {
      console.error('Error DB:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ result: results[0].result, message: 'DB connected' });
  });
});

// Importar rutas
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const marcasRoutes = require('./routes/marcas');
const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const movimientosRoutes = require('./routes/movimientos');
const incidenciasRoutes = require('./routes/incidencias');
const reportesRoutes = require('./routes/reportes');
const dashboardRoutes = require('./routes/dashboard');
const authMiddleware = require('./middleware/authMiddleware');

// Registrar rutas
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Rutas de usuarios (temporalmente públicas)
app.use('/api/usuarios', usuariosRoutes);
// Registrar la misma funcionalidad con el nombre `modulo_user`
app.use('/api/modulo_user', usuariosRoutes);
app.use('/api/auth', authRoutes);

// Servir archivos de reportes (PDFs) estáticos con cache
app.use('/reportes', express.static(path.join(__dirname, 'reportes'), {
  maxAge: '7d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, must-revalidate');
  }
}));

// Servir archivos estáticos del frontend (Angular build)
const frontendPath = path.join(__dirname, '..', 'dist', 'proyecto-yerb-amazon', 'browser');
app.use(express.static(frontendPath));

// Ruta básica para API
app.get('/api', (req, res) => {
  res.json({ message: 'Backend Yerb Amazon funcionando' });
});

// Todas las demás rutas devuelven el index.html de Angular (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Seed inicial opcional (habilitar con SEED_ADMIN=true): crear rol Administrador y usuario admin si no existen
if (process.env.SEED_ADMIN === 'true') {
  (async function seedAdmin() {
    try {
      const [userCountRows] = await db.promise().query('SELECT COUNT(*) AS c FROM usuarios');
      const userCount = userCountRows[0]?.c || 0;
      if (userCount > 0) {
        console.log('Seed admin: ya existen usuarios, no se aplica.');
        return;
      }

      // asegurar rol Administrador
      let [rolRows] = await db.promise().query("SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador' LIMIT 1");
      let rolId;
      if (!rolRows || rolRows.length === 0) {
        const permisos = JSON.stringify({ all: true });
        const [insertRol] = await db.promise().query(
          'INSERT INTO roles (nombre_rol, descripcion, permisos, activo) VALUES (?,?,?,TRUE)',
          ['Administrador', 'Acceso completo al sistema', permisos]
        );
        rolId = insertRol.insertId;
      } else {
        rolId = rolRows[0].id_rol;
      }

      const password = 'admin123';
      const hash = await bcrypt.hash(password, 10);
      await db.promise().query(
        `INSERT INTO usuarios (nombre_completo, email, password_hash, id_rol, estado)
         VALUES (?,?,?,?, 'Activo')`,
        ['Administrador Sistema', 'admin@sistema.com', hash, rolId]
      );
      console.log('Seed admin creado: admin@sistema.com / admin123');
    } catch (e) {
      console.warn('Seed admin omitido o fallido:', e?.message || e);
    }
  })();
} else {
  console.log('Seed admin desactivado (SEED_ADMIN != true)');
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});