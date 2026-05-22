const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES ($1,$2,$3) RETURNING id, nombre, email, rol`,
      [nombre, email, hash]
    );
    res.status(201).json({ exito: true, datos: rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email=$1', [email]
    );
    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash)))
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      exito: true,
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    });
  } catch (err) { next(err); }
};