// Sistema AAUD
// Server.js
// Autor: Ricardo Vargas
// Fecha de inicio 07/07/2025

import { createServer } from "http";
import app from "./app.js";
import { prisma } from "./config/prisma.js";
import { initSocket } from "./config/socket.js";
import { env } from "./config/env.js";
import { logger } from "./common/logger.js";

const server = createServer(app);

async function startServer() {

  try {

    await prisma.$connect();
    logger.info("Conexión a base de datos establecida");

    const io = initSocket(server);
    app.set("io", io);
    app.set('trust proxy', 1);

    server.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        { port: env.PORT },
        "Servidor escuchando"
      );
    });

  } catch (error) {

    logger.error(error, "Error iniciando servidor");
    process.exit(1);

  }
}

async function shutdown(signal) {
  try {
    logger.info(`Señal ${signal} recibida. Cerrando aplicación...`);

    // Forzar cierre si algo se queda colgado
    const forceExit = setTimeout(() => {
      logger.error("Forzando cierre de la aplicación...");
      process.exit(1);
    }, 5000);

    // Cerrar servidor HTTP
    server.close(async () => {
      logger.info("Servidor HTTP cerrado");

      try {
        await prisma.$disconnect();
        logger.info("Prisma desconectado");
      } catch (err) {
        logger.error(err, "Error cerrando Prisma");
      }

      clearTimeout(forceExit);
      process.exit(0);
    });

  } catch (error) {
    logger.error(error, "Error durante shutdown");
    process.exit(1);
  }
}

// Manejo de errores globales
process.on("unhandledRejection", (err) => {
  logger.error(err, "Unhandled Promise Rejection");
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.error(err, "Uncaught Exception");
  shutdown("uncaughtException");
});

// Señales del sistema
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();