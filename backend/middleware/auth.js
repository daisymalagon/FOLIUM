const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const encabezado = req.headers['authorization'];
  if (!encabezado)
    return res.status(401).json({ mensaje: 'Token requerido' });

  const token = encabezado.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
};