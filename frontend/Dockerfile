# 1. Traemos una base de Linux ultra ligera que ya viene con Node 20 instalado
FROM node:20-alpine

# 2. Instalamos pnpm de forma global dentro de la caja de Docker (versión fija para reproducibilidad)
RUN npm install -g pnpm@12.21.0

# 3. Creamos la carpeta interna donde vivirá el proyecto dentro de la caja
WORKDIR /app

# 4. Copiamos el package.json, el pnpm-lock.yaml y los patches necesarios
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/

# 5. Instalamos las dependencias de forma exacta y segura dentro de la caja
RUN pnpm install --frozen-lockfile

# 6. Copiamos todo el resto del código de tu frontend hacia adentro
COPY . .

# 7. Avisamos que el contenedor va a exponer el puerto 5173 (el que usa Vite)
EXPOSE 5173

# 8. El comando final que encenderá el servidor de desarrollo dentro de Docker
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8000", "--reload"]