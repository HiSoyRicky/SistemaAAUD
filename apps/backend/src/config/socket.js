// socket.js

import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { prisma } from './prisma.js';
import { env } from './env.js';

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No autorizado'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const userId = Number(decoded.id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return next(new Error('Token inválido'));
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, id_rol: true, active: true },
      });

      if (!user?.active) return next(new Error('Usuario inactivo o no válido'));

      socket.user = { id: user.id };

      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  return io;
}
