const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// Listar todas las etiquetas
router.get('/', auth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM etiquetas ORDER BY nombre ASC');
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

// Crear etiqueta (solo admin)
router.post('/', auth, async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin')
      return res.status(403).json({ mensaje: 'Solo los administradores pueden crear etiquetas.' });
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es requerido.' });
    const { rows } = await db.query(
      'INSERT INTO etiquetas (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING *',
      [nombre.trim()]
    );
    res.status(201).json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;