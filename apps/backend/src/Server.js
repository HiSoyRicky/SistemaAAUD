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

process.on("unhandledRejection", (err) => {
  logger.error(err, "Unhandled Promise Rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error(err, "Uncaught Exception");
  process.exit(1);
});

startServer();