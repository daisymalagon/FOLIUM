const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// Solo admin puede usar estas rutas
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin')
    return res.status(403).json({ mensaje: 'Acceso solo para administradores.' });
  next();
};

// Listar todos los usuarios
router.get('/', auth, soloAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY creado_en DESC'
    );
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

// Cambiar rol de un usuario
router.put('/:id/rol', auth, soloAdmin, async (req, res, next) => {
  try {
    const { rol } = req.body;
    if (!['admin','colaborador','lector'].includes(rol))
      return res.status(400).json({ mensaje: 'Rol no válido.' });
    if (parseInt(req.params.id) === req.usuario.id)
      return res.status(400).json({ mensaje: 'No puedes cambiar tu propio rol.' });
    const { rows } = await db.query(
      'UPDATE usuarios SET rol=$1 WHERE id=$2 RETURNING id, nombre, email, rol',
      [rol, req.params.id]
    );
    res.json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
});

// Historial de actividad de un usuario
router.get('/:id/historial', auth, soloAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT l.*, d.nombre AS documento_nombre, u.nombre AS usuario_nombre
       FROM log_actividad l
       LEFT JOIN documentos d ON l.documento_id = d.id
       LEFT JOIN usuarios   u ON l.usuario_id   = u.id
       WHERE l.usuario_id = $1
       ORDER BY l.realizado_en DESC
       LIMIT 100`,
      [req.params.id]
    );
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

// Historial de TODOS los usuarios
router.get('/historial/todos', auth, soloAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT l.*, d.nombre AS documento_nombre, u.nombre AS usuario_nombre
       FROM log_actividad l
       LEFT JOIN documentos d ON l.documento_id = d.id
       LEFT JOIN usuarios   u ON l.usuario_id   = u.id
       ORDER BY l.realizado_en DESC
       LIMIT 200`
    );
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

// Permisos de un documento
router.get('/permisos/:documentoId', auth, soloAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.nombre, u.email, u.rol
       FROM permisos_documento p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.documento_id = $1`,
      [req.params.documentoId]
    );
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
});

// Asignar o actualizar permiso de usuario sobre un documento
router.post('/permisos', auth, soloAdmin, async (req, res, next) => {
  try {
    const { documento_id, usuario_id, puede_ver, puede_editar } = req.body;
    const { rows } = await db.query(
      `INSERT INTO permisos_documento (documento_id, usuario_id, puede_ver, puede_editar)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (documento_id, usuario_id)
       DO UPDATE SET puede_ver=$3, puede_editar=$4
       RETURNING *`,
      [documento_id, usuario_id, puede_ver, puede_editar]
    );
    res.json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
});

// Eliminar permiso
router.delete('/permisos/:documentoId/:usuarioId', auth, soloAdmin, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM permisos_documento WHERE documento_id=$1 AND usuario_id=$2',
      [req.params.documentoId, req.params.usuarioId]
    );
    res.json({ exito: true, mensaje: 'Permiso eliminado.' });
  } catch (err) { next(err); }
});

module.exports = router;