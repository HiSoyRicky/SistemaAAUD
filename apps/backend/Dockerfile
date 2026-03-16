# server/Dockerfile
FROM node:22-alpine

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json de la RAÍZ del proyecto
COPY package*.json ./

# Instalamos dependencias (solo producción si quieres)
RUN npm install --omit=dev

# Copiamos el backend y el schema de Prisma desde la raíz
COPY server ./server
COPY prisma ./prisma

# Generamos Prisma Client dentro del contenedor
RUN npx prisma generate --schema=./prisma/schema.prisma

# Variables y puertos
ENV NODE_ENV=production
EXPOSE 3000

# Arranque del servidor
CMD ["node", "server/Server.js"]
