const db     = require('../config/db');
const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

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
  'image/jpeg',
  'image/png'
];

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    tiposPermitidos.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Tipo de archivo no permitido'));
  }
});

exports.upload = subida.single('archivo');

exports.listar = async (req, res, next) => {
  try {
    const { categoria, q } = req.query;
    let consulta = `
      SELECT d.*, c.nombre AS categoria_nombre
      FROM documentos d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      WHERE d.usuario_id = $1`;
    const params = [req.usuario.id];

    if (categoria) {
      consulta += ` AND d.categoria_id = $${params.length + 1}`;
      params.push(categoria);
    }
    if (q) {
      consulta += ` AND d.nombre ILIKE $${params.length + 1}`;
      params.push(`%${q}%`);
    }
    consulta += ' ORDER BY d.fecha_carga DESC';

    const { rows } = await db.query(consulta, params);
    res.json({ exito: true, datos: rows });
  } catch (err) { next(err); }
};

exports.subir = async (req, res, next) => {
  try {
    if (!req.file)
      throw Object.assign(new Error('No se recibió ningún archivo'), { status: 400 });
    const { categoriaId, descripcion } = req.body;
    const { rows } = await db.query(
      `INSERT INTO documentos
         (nombre, ruta, tipo_mime, categoria_id, usuario_id, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.file.originalname, req.file.filename, req.file.mimetype,
       categoriaId || null, req.usuario.id, descripcion || null]
    );
    res.status(201).json({ exito: true, datos: rows[0] });
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    await db.query('DELETE FROM documentos WHERE id=$1 AND usuario_id=$2',
      [req.params.id, req.usuario.id]);
    res.json({ exito: true, mensaje: 'Documento eliminado' });
  } catch (err) { next(err); }
};