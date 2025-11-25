FROM node:22-alpine
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar server y prisma
COPY ./server ./server
COPY ./prisma ./prisma

# Generar Prisma Client dentro de Docker
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000

CMD ["node", "server/Server.js"]
