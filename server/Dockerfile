FROM node:22-alpine
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar todo el backend y Prisma
COPY ./server ./server
COPY ./prisma ./prisma

# Generar Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Exponer puerto del backend
EXPOSE 3000

# Comando de inicio del backend
CMD ["node", "server/Server.js"]
