const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// JWT Secret - DEBE configurarse en variables de entorno en producción
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  ADVERTENCIA: Usando secreto JWT por defecto. Configure JWT_SECRET en producción.');
  return 'default-jwt-secret-change-in-production';
})();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    // Consulta para obtener usuario activo con sus datos de rol
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre_completo,
        u.email,
        u.password_hash,
        u.estado,
        r.nombre_rol,
        r.permisos
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = ? AND u.estado = 'Activo'
    `;

    console.log('[auth] login attempt for email:', email);
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (results.length === 0) {
        console.warn('[auth] no user found or inactive for email:', email);
        return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
      }

      const user = results[0];
      console.log('[auth] user found:', { id: user.id_usuario, email: user.email, estado: user.estado, hasPassword: !!user.password_hash });

      // Verificar contraseña con soporte de migración:
      // - Si password_hash es bcrypt ($2a/$2b/$2y), comparar con bcrypt
      // - Si NO es bcrypt y coincide en texto plano (bases antiguas), actualizar a bcrypt y permitir login
      let validPassword = false;
      const stored = user.password_hash || '';
      const isBcrypt = /^\$2[aby]\$/.test(stored);
      if (isBcrypt) {
        validPassword = await bcrypt.compare(password, stored).catch(e => {
          console.error('[auth] bcrypt.compare error:', e);
          return false;
        });
      } else {
        // posible almacenamiento en texto plano (no recomendado) en DBs antiguas
        if (stored && stored === password) {
          validPassword = true;
          try {
            const newHash = await bcrypt.hash(password, 10);
            db.query('UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?', [newHash, user.id_usuario], (e2) => {
              if (e2) console.warn('[auth] no se pudo migrar password a bcrypt para usuario', user.id_usuario, e2.message);
              else console.log('[auth] password migrado a bcrypt para usuario', user.id_usuario);
            });
          } catch (e3) {
            console.warn('[auth] fallo generando nuevo hash bcrypt para migración:', e3?.message || e3);
          }
        } else {
          // no hay hash o no coincide en texto plano
          validPassword = false;
        }
      }

      if (!validPassword) {
        console.warn('[auth] invalid password for user id:', user.id_usuario);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Actualizar último acceso
      db.query('UPDATE usuarios SET fecha_ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id_usuario,
          email: user.email,
          rol: user.nombre_rol
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      console.log('[auth] login successful for user id:', user.id_usuario, 'generating token');

      // Enviar respuesta
      res.json({
        token,
        user: {
          id: user.id_usuario,
          nombre_completo: user.nombre_completo,
          email: user.email,
          rol_nombre: user.nombre_rol
        }
      });
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;