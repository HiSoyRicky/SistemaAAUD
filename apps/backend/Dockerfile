FROM node:22-alpine

WORKDIR /app

# Copiamos solo lo necesario para instalar dependencias primero
# (aprovecha cache de Docker si no cambia package.json)
COPY apps/backend/package*.json ./

RUN npm install --omit=dev

# Copiamos el código del backend
COPY apps/backend/src ./src
COPY apps/backend/prisma ./prisma

# Generamos Prisma Client (solo el cliente, NO migrate)
RUN npx prisma generate --schema=./prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/Server.js"]
