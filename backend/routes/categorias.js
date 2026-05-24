const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin')
      return res.status(403).json({ mensaje: 'Solo los administradores pueden crear categorías.' });
    const { nombre, padre_id } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es requerido.' });
    const { rows } = await db.query(
      'INSERT INTO categorias (nombre, padre_id) VALUES ($1,$2) RETURNING *',
      [nombre, padre_id || null]
    );
    res.status(201).json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin')
      return res.status(403).json({ mensaje: 'Solo los administradores pueden eliminar categorías.' });
    await db.query('DELETE FROM categorias WHERE id=$1', [req.params.id]);
    res.json({ exito: true, mensaje: 'Categoría eliminada.' });
  } catch (err) { next(err); }
});

module.exports = router;