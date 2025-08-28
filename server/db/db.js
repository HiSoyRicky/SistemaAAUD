// server/db.js
const sql = require('mssql');
require('dotenv').config({ path: __dirname + '/../.env' });

// Validar variables de entorno
const { DB_USER, DB_PASSWORD, DB_SERVER, DB_NAME } = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
    throw new Error("❌ Faltan variables de entorno para la conexión a la base de datos");
}

const baseConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const pools = {};

async function getPool(dbName) {
    if (!pools[dbName]) {
        try {
            pools[dbName] = await new sql.ConnectionPool({ ...baseConfig, database: dbName }).connect();
            console.log(`✅ Conectado a DB: ${dbName}`);
        } catch (err) {
            console.error(`❌ Error al conectar a ${dbName}:`, err.message);
            throw err;
        }
    }
    return pools[dbName];
}

const getPoolDB = () => getPool(process.env.DB_NAME);

module.exports = { getPool, getPoolDB };