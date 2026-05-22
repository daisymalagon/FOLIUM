const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/documentoController');
const auth    = require('../middleware/auth');

/**
 * @swagger
 * /api/documentos:
 *   get:
 *     summary: Lista los documentos del usuario
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos
 */
router.get('/',      auth, ctrl.listar);
router.post('/',     auth, ctrl.upload, ctrl.subir);
router.delete('/:id', auth, ctrl.eliminar);

module.exports = router;