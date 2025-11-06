const jwt = require('jsonwebtoken');

// Middleware simple para validar JWT desde el header Authorization: Bearer <token>
module.exports = function authMiddleware(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      const token = parts[1];
      const secret = process.env.JWT_SECRET || 'tu-secreto-seguro';
      try {
        const payload = jwt.verify(token, secret);
        req.user = payload;
        return next();
      } catch (e) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
    }
    return res.status(401).json({ error: 'No autenticado' });
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
};
