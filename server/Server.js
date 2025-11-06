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
    origin: [FRONTEND_URL, "http://localhost:5173"],
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Importar rutas
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const AllRoutes = require('./routes/AllRoutes');

const allowedOrigins = [
    'http://localhost:5173', // Para cuando usas el servidor de desarrollo de Vite (npm run dev)
    'http://localhost:3000', // Para cuando tu propio Express server sirve el HTML del frontend
    // Agrega aquí la IP 172.23.98.103 si es un servidor de red, aunque es mejor evitar IPs fijas en producción
];

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como Postman o peticiones del mismo servidor)
        if (!origin) return callback(null, true); 
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); // Origen permitido
        } else {
            callback(new Error('Not allowed by CORS'), false); // Origen denegado
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

// Seguridad HTTP y compresión
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://172.23.98.103:3000",],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);
app.use(compression());

// Middleware
app.use(express.json());
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:5173", "http://172.23.98.103:3000"],
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
app.use('/api', AllRoutes);

// Manejar errores
app.use(errorHandler);


// Servir frontend compilado
const publicPath = path.join(__dirname, '..', 'dist');
app.use(express.static(publicPath));

// Catch-all para SPA (debe ir al final, después de todas las rutas)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
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

// Servidor con manejo de error de puerto en uso
const startServer = (port) => {
  server.listen(port, '0.0.0.0');

  server.on('listening', () => {
    console.log(`✅ Servidor escuchando en http://0.0.0.0:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  El puerto ${port} está en uso. Intentando con ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Error al iniciar el servidor:', err);
      process.exit(1);
    }
  });
};

// Iniciar servidor
startServer(parseInt(port, 10));
