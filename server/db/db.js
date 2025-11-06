const { Pool } = require('pg');
require('dotenv').config();

// Validar variables de entorno
const { POSTGRES_USER, POSTGRES_PASSWORD, DB_SERVER, POSTGRES_DB, DB_PORT } = process.env;

if (!POSTGRES_USER || !POSTGRES_PASSWORD || !DB_SERVER || !POSTGRES_DB || !DB_PORT) {
    throw new Error("❌ Faltan variables de entorno para la conexión a la base de datos");
}

const pool = new Pool({
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    host: DB_SERVER,
    database: POSTGRES_DB,
    port: parseInt(DB_PORT, 10),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Manejo de errores con retry simple
pool.on('error', (err) => {
    console.error('❌ Error inesperado en la conexión a PostgreSQL', err);
    // Intenta reconectar en lugar de exit
    setTimeout(() => {
        console.log('🔄 Intentando reconectar...');
        // Lógica de reconexión (puedes usar pg-reconnect o manual)
    }, 5000);
});

// Test inicial de conexión
async function initPool() {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión a PostgreSQL establecida');
        client.release();
    } catch (err) {
        console.error('❌ Error al conectar a PostgreSQL', err);
        process.exit(-1); // Solo exit si falla inicial
    }
}

initPool();

module.exports = { pool };