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
const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';;
const { prisma } = require('../src/generated/prisma');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP para Express y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://system.aaud.local",
      "http://172.25.30.26"
    ],
    methods: ['GET', 'POST'],
    credentials: false
  },
  transports: ['websocket', 'polling'],
});


// Importar rutas
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const AllRoutes = require('./routes/AllRoutes');

// Seguridad HTTP y compresión
app.use(
  helmet({
    contentSecurityPolicy: false,   
    crossOriginEmbedderPolicy: false,
    hsts: false
  })
);


app.use(compression());

// Middleware
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: false
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
app.use('/api', AllRoutes);

// Redirigir raíz hacia /login
app.get("/", (req, res) => {
  return res.redirect("/login");
});

// ========= SERVIR FRONTEND DE PRODUCCIÓN =========
const publicPath = path.join(__dirname, "public");

// Servir archivos estáticos
app.use(express.static(publicPath));

// SPA fallback para React (Express 5 requiere regex)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
// ================================================

// Manejar errores
app.use(errorHandler);

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

// Iniciar servidor en puerto fijo
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor escuchando en http://0.0.0.0:${port}`);
});