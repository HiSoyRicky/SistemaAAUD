// Página Web de Incidencia AAUD
// server/Server.js
// Descripción: Lógica de la aplicación para gestionar incidencias
// Autor: Ricardo Vargas
// Fecha de inicio 07/07/2025
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP para Express y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Importar rutas
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

//AAUD
const departmentsRouter = require('./routes/AAUD/departments');
const ubicationsRouter = require('./routes/AAUD/ubications');
const usersRouter = require('./routes/users');

//Incidencias
const incidentsRouter = require('./routes/incidents');

//Inventario
const inventoryRouter = require('./routes/inventory');
const brandsRouter = require('./routes/inventory/brands');
const devicesRouter = require('./routes/inventory/devices');
const modelsRouter = require('./routes/inventory/models');
const statusRouter = require('./routes/inventory/status');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rutas
app.use('/api', authRouter);

//AAUD
app.use('/api/departments', departmentsRouter);
app.use('/api/ubications', ubicationsRouter);
app.use('/api/users', usersRouter);

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
  socket.on('joinIncidentRoom', (incidentId) => {
    socket.join(`incident_${incidentId}`);
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
