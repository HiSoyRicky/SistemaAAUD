// Sistema AAUD
// server/Server.js
// Autor: Ricardo Vargas
// Fecha de inicio 07/07/2025

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const FRONTEND_URL = process.env.FRONTEND_BASE_URL;
const { prisma } = require('../src/generated/prisma');
require('dotenv').config();

const app = express();

// Puerto
const port = process.env.PORT || 3000;

// Crear servidor HTTP para Express y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Importar rutas
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

//AAUD
const departmentsRouter = require('./routes/AAUD/departments');
const ubicationsRouter = require('./routes/AAUD/ubications');
const usersRouter = require('./routes/users');
const tonersRouter = require('./routes/AAUD/toners');

//Incidencias
const incidentsRouter = require('./routes/incidents');

//Inventario
const inventoryRouter = require('./routes/inventory');
const brandsRouter = require('./routes/inventory/brands');
const devicesRouter = require('./routes/inventory/devices');
const modelsRouter = require('./routes/inventory/models');
const statusRouter = require('./routes/AAUD/status');

// Seguridad HTTP con Helmet
app.use(helmet());

//Compresión gzip
app.use(compression());

// Logs de peticiones (solo en dev)
if (process.env.NODE_ENV === "development") {
  app.use(morgan('tiny', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:5173"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Limite de peticiones
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    // Obtenemos el tiempo restante en milisegundos
    const retryAfterSec = Math.ceil(res.getHeader('Retry-After') || 5 * 60);

    res.status(429).json({
      error: "Demasiados intentos fallidos.",
      retryAfter: retryAfterSec
    });
  }
});

//Aplicar el límite solo a login
app.use('/api/login', loginLimiter);

// Rutas
app.use('/api', authRouter);

//AAUD
app.use('/api/departments', departmentsRouter);
app.use('/api/ubications', ubicationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/toners', tonersRouter);

//Incidencias
app.use('/api/incidents', incidentsRouter);

//Inventario
app.use('/api/inventory', inventoryRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/models', modelsRouter);
app.use('/api/statuses', statusRouter);

app.use(errorHandler);

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejar conexiones de Socket.IO
io.on('connection', (socket) => {

  // Unirse a una sala por ID
  socket.on('joinIncidentRoom', (id_incident) => {
    socket.join(`incident_${id_incident}`);
  });

  // Unirse a una sala por token público
  socket.on('joinIncidentRoomByToken', (token) => {
    socket.join(`token_${token}`);
  });

  socket.on('disconnect', () => {

  });
});

// Hacer que io esté disponible en las rutas
app.set('io', io);

// Servidor
server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${port}`);
});
