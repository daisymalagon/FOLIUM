const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// ── Listar carpetas accesibles para el usuario ───────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    let carpetas = [];

    if (req.usuario.rol === 'admin') {
      const { rows } = await db.query(`
        SELECT c.*, u.nombre AS creador_nombre,
          (SELECT COUNT(*) FROM documentos d WHERE d.carpeta_id = c.id) AS total_docs
        FROM carpetas c
        JOIN usuarios u ON c.creado_por = u.id
        ORDER BY c.creado_en DESC
      `);
      carpetas = rows;
    } else {
      const { rows } = await db.query(`
        SELECT DISTINCT c.*, u.nombre AS creador_nombre,
          cu.puede_ver, cu.puede_editar,
          (SELECT COUNT(*) FROM documentos d WHERE d.carpeta_id = c.id) AS total_docs
        FROM carpetas c
        JOIN usuarios u ON c.creado_por = u.id
        LEFT JOIN carpeta_usuario cu ON cu.carpeta_id = c.id AND cu.usuario_id = $1
        WHERE c.creado_por = $1 OR cu.usuario_id = $1
        ORDER BY c.creado_en DESC
      `, [req.usuario.id]);
      carpetas = rows;
    }

    res.json({ exito: true, datos: carpetas });
  } catch (err) { next(err); }
});

// ── Crear carpeta ────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res, next) => {
  try {
    const { nombre, descripcion, tipo } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre es requerido.' });

    const tipoCarpeta = req.usuario.rol === 'admin' ? (tipo || 'compartida') : 'privada';

    const { rows } = await db.query(
      `INSERT INTO carpetas (nombre, descripcion, tipo, creado_por)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nombre.trim(), descripcion || null, tipoCarpeta, req.usuario.id]
    );

    // Si es admin y compartida, dar acceso de ver a todos los usuarios
    if (req.usuario.rol === 'admin' && tipoCarpeta === 'compartida') {
      const usuarios = await db.query(
        'SELECT id FROM usuarios WHERE id != $1', [req.usuario.id]
      );
      for (const u of usuarios.rows) {
        await db.query(
          `INSERT INTO carpeta_usuario (carpeta_id, usuario_id, puede_ver, puede_editar)
           VALUES ($1,$2,true,false) ON CONFLICT DO NOTHING`,
          [rows[0].id, u.id]
        );
      }
    }

    res.status(201).json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
});

// ── Obtener documentos de una carpeta ────────────────────────────────────────
router.get('/:id/documentos', auth, async (req, res, next) => {
  try {
    const acceso = await db.query(
      `SELECT c.*, cu.puede_ver, cu.puede_editar
       FROM carpetas c
       LEFT JOIN carpeta_usuario cu ON cu.carpeta_id = c.id AND cu.usuario_id = $2
       WHERE c.id = $1`,
      [req.params.id, req.usuario.id]
    );

    const carpeta = acceso.rows[0];
    if (!carpeta) return res.status(404).json({ mensaje: 'Carpeta no encontrada.' });

    const tieneAcceso = req.usuario.rol === 'admin' ||
                        carpeta.creado_por === req.usuario.id ||
                        carpeta.puede_ver;

    if (!tieneAcceso)
      return res.status(403).json({ mensaje: 'No tienes acceso a esta carpeta.' });

    const { rows } = await db.query(
      `SELECT d.*, c.nombre AS categoria_nombre, u.nombre AS autor_nombre
       FROM documentos d
       LEFT JOIN categorias c ON d.categoria_id = c.id
       LEFT JOIN usuarios u   ON d.usuario_id   = u.id
       WHERE d.carpeta_id = $1
       ORDER BY d.fecha_carga DESC`,
      [req.params.id]
    );

    res.json({ exito: true, carpeta, datos: rows });
  } catch (err) { next(err); }
});

// ── Mover documento a carpeta ────────────────────────────────────────────────
router.put('/mover/:documentoId', auth, async (req, res, next) => {
  try {
    const { carpeta_id } = req.body;

    const docRes = await db.query(
      'SELECT * FROM documentos WHERE id=$1', [req.params.documentoId]
    );
    if (!docRes.rows[0])
      return res.status(404).json({ mensaje: 'Documento no encontrado.' });
    if (req.usuario.rol !== 'admin' && docRes.rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ mensaje: 'No puedes mover este documento.' });

    await db.query(
      'UPDATE documentos SET carpeta_id=$1 WHERE id=$2',
      [carpeta_id || null, req.params.documentoId]
    );

    res.json({ exito: true, mensaje: 'Documento movido correctamente.' });
  } catch (err) { next(err); }
});

// ── Gestionar permisos de carpeta (solo admin) ───────────────────────────────
router.post('/:id/permisos', auth, async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'admin')
      return res.status(403).json({ mensaje: 'Solo administradores.' });

    const { usuario_id, puede_ver, puede_editar } = req.body;
    await db.query(
      `INSERT INTO carpeta_usuario (carpeta_id, usuario_id, puede_ver, puede_editar)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (carpeta_id, usuario_id)
       DO UPDATE SET puede_ver=$3, puede_editar=$4`,
      [req.params.id, usuario_id, puede_ver, puede_editar]
    );

    res.json({ exito: true, mensaje: 'Permiso actualizado.' });
  } catch (err) { next(err); }
});

// ── Eliminar carpeta ─────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM carpetas WHERE id=$1', [req.params.id]
    );
    if (!rows[0])
      return res.status(404).json({ mensaje: 'Carpeta no encontrada.' });
    if (req.usuario.rol !== 'admin' && rows[0].creado_por !== req.usuario.id)
      return res.status(403).json({ mensaje: 'No puedes eliminar esta carpeta.' });

    // Los documentos quedan sin carpeta, no se eliminan
    await db.query(
      'UPDATE documentos SET carpeta_id=NULL WHERE carpeta_id=$1', [req.params.id]
    );
    await db.query('DELETE FROM carpetas WHERE id=$1', [req.params.id]);

    res.json({ exito: true, mensaje: 'Carpeta eliminada. Los documentos siguen disponibles.' });
  } catch (err) { next(err); }
});

module.exports = router;