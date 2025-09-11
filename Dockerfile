# Stage 1: Build React con Vite
FROM node:22-bullseye AS build
WORKDIR /app

# Copiamos dependencias
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install --legacy-peer-deps

# Copiamos todo el código
COPY . .

# Build
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
