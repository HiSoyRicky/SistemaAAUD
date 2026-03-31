FROM node:22-alpine AS builder

WORKDIR /app

COPY apps/frontend/package*.json ./
RUN npm install

COPY apps/frontend ./
RUN npm run build
# El resultado queda en /app/dist

FROM nginx:alpine

# Copiamos el build al nginx del contenedor
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx interno del contenedor
COPY infrastructure/docker/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]