const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use('/archivos', express.static(path.join(__dirname, 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/documentos', require('./routes/documentos'));
app.use('/api/categorias', require('./routes/categorias'));

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const estado = err.status || 500;
  res.status(estado).json({
    exito: false,
    mensaje: estado === 500 ? 'Error interno del servidor' : err.message
  });
});

const PUERTO = process.env.PORT || 4000;
app.listen(PUERTO, () =>
  console.log(`Folium API corriendo en puerto ${PUERTO}`)
);