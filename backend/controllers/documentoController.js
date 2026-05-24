const db     = require('../config/db');
const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

// ── Configuración de Multer ──────────────────────────────────────────────────
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const tiposPermitidos = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png'
];

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    tiposPermitidos.includes(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Tipo de archivo no permitido.'), { status: 400 }));
  }
});

exports.upload = subida.single('archivo');

// ── Listar documentos con filtros ────────────────────────────────────────────
exports.listar = async (req, res, next) => {
  try {
    const { q, categoria, autor, fechaDesde, fechaHasta } = req.query;

    let consulta = `
      SELECT d.*, 
             c.nombre  AS categoria_nombre,
             u.nombre  AS autor_nombre,
             COALESCE(
               json_agg(e.nombre) FILTER (WHERE e.nombre IS NOT NULL), '[]'
             ) AS etiquetas
      FROM documentos d
      LEFT JOIN categorias c   ON d.categoria_id = c.id
      LEFT JOIN usuarios u     ON d.usuario_id   = u.id
      LEFT JOIN documento_etiqueta de ON d.id = de.documento_id
      LEFT JOIN etiquetas e    ON de.etiqueta_id = e.id
      WHERE 1=1`;

    const params = [];

    // Filtro por rol: lector y colaborador solo ven sus propios documentos
    if (req.usuario.rol !== 'admin') {
      params.push(req.usuario.id);
      consulta += ` AND d.usuario_id = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      consulta += ` AND d.nombre ILIKE $${params.length}`;
    }
    if (categoria) {
      params.push(categoria);
      consulta += ` AND d.categoria_id = $${params.length}`;
    }
    if (autor) {
      params.push(`%${autor}%`);
      consulta += ` AND u.nombre ILIKE $${params.length}`;
    }
    if (fechaDesde) {
      params.push(fechaDesde);
      consulta += ` AND d.fecha_carga >= $${params.length}`;
    }
    if (fechaHasta) {
      params.push(fechaHasta);
      consulta += ` AND d.fecha_carga <= $${params.length}`;
    }

    consulta += ' GROUP BY d.id, c.nombre, u.nombre ORDER BY d.fecha_carga DESC';

    const { rows } = await db.query(consulta, params);
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
};

// ── Subir documento ──────────────────────────────────────────────────────────
exports.subir = async (req, res, next) => {
  try {
    if (!req.file)
      throw Object.assign(new Error('No se recibió ningún archivo.'), { status: 400 });

    const { categoriaId, descripcion, etiquetas } = req.body;

    const { rows } = await db.query(
      `INSERT INTO documentos (nombre, ruta, tipo_mime, categoria_id, usuario_id, descripcion, autor)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.file.originalname, req.file.filename, req.file.mimetype,
       categoriaId || null, req.usuario.id, descripcion || null, req.usuario.nombre]
    );

    const documento = rows[0];

    // Asociar etiquetas si se enviaron
    if (etiquetas) {
      const lista = JSON.parse(etiquetas);
      for (const nombre of lista) {
        // Crear etiqueta si no existe
        const et = await db.query(
          `INSERT INTO etiquetas (nombre) VALUES ($1)
           ON CONFLICT (nombre) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING id`,
          [nombre.trim()]
        );
        await db.query(
          'INSERT INTO documento_etiqueta (documento_id, etiqueta_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [documento.id, et.rows[0].id]
        );
      }
    }

    res.status(201).json({ exito: true, datos: documento });
  } catch (err) { next(err); }
};

// ── Eliminar documento ───────────────────────────────────────────────────────
exports.eliminar = async (req, res, next) => {
  try {
    // Solo el dueño o el admin pueden eliminar
    const { rows } = await db.query('SELECT usuario_id FROM documentos WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Documento no encontrado.' });
    if (req.usuario.rol !== 'admin' && rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este documento.' });

    await db.query('DELETE FROM documentos WHERE id=$1', [req.params.id]);
    res.json({ exito: true, mensaje: 'Documento eliminado correctamente.' });
  } catch (err) { next(err); }
};