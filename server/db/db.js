// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Validar variables de entorno
const { DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME, DB_PORT } = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME || !DB_PORT) {
    throw new Error("❌ Faltan variables de entorno para la conexión a la base de datos");
}

const poolDB = new Pool({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_SERVER,
    database: DB_NAME,
    port: parseInt(DB_PORT, 10),
});

// Manejo de errores global de conexión
poolDB.on('error', (err) => {
    console.error('❌ Error inesperado en la conexión a PostgreSQL', err);
    process.exit(-1);
});

module.exports = { poolDB };