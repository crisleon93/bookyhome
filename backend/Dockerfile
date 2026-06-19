# 1. Usamos una imagen oficial de Python ligera basada en Linux Alpine o Slim
FROM python:3.10-slim

# 2. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos el archivo de requerimientos primero para aprovechar la caché de Docker
COPY requirements.txt .

# 4. Instalamos las dependencias de Python sin guardar caché para que pese menos
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiamos todo el contenido de la carpeta backend/app hacia el contenedor
COPY . .

# 6. Exponemos el puerto típico que usa tu backend (comúnmente el 8000)
EXPOSE 8000

# 7. Comando para arrancar el servidor (Asumiendo FastAPI con uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
