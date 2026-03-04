// Sistema AAUD
// Server.js
// Autor: Ricardo Vargas
// Fecha de inicio 07/07/2025

import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import helmet from 'helmet';
import compression from 'compression';
import { prisma } from './Prisma.js';
import jwt from 'jsonwebtoken';

import { fileURLToPath } from 'url';

const FRONTEND_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP para Express y Socket.IO
const server = createServer(app);

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://system.aaud.local',
  'http://172.25.30.26',
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Para cosas tipo Postman / sin origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origen no permitido: ${origin}`), false);
    },
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
});

// Importar rutas
import errorHandler from './middleware/errorHandler.js';
import routes from './modules/routes.js';

// Confiar en proxies (si aplica)
app.set('trust proxy', 1);

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
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));

// Limite de peticiones
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const retryAfterSec = Math.ceil(res.getHeader('Retry-After') || 5 * 60);

    res.status(429).json({
      error: "Demasiados intentos fallidos.",
      retryAfter: retryAfterSec
    });
  }
});

//Aplicar el límite solo a login
app.use('/api/auth/login', loginLimiter);

// Rutas
app.use('/api', routes);

// Redirigir raíz hacia /login
app.get("/", (req, res) => {
  return res.redirect("/login");
});

// SERVIR FRONTEND DE PRODUCCIÓN
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicPath = join(__dirname, '../dist');

app.use(express.static(publicPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(join(publicPath, "index.html"));
});

// Manejar errores
app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("No autorizado"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.role) {
      return next(new Error("Token mal formado"));
    }

    socket.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
    
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("Token expirado"));
    }

    return next(new Error("Token inválido"));
  }
});

// Manejar conexiones de Socket.IO
io.on('connection', (socket) => {

  const userId = socket.user.id;

  if (userId) {
    socket.join(`user_${userId}`);
  }

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

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a base de datos con Prisma establecida');

    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Servidor escuchando en http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor por error de base de datos:', error);
    process.exit(1);
  }
}

startServer();
