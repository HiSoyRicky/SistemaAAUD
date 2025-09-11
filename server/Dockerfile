# Dockerfile backend
FROM node:18-bullseye

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY ./server ./
EXPOSE 3000
CMD ["node", "Server.js"]
