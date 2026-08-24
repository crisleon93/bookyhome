# Manual de instalacion de BookyHome

## 1. Proposito

Este manual explica como instalar y ejecutar BookyHome en un equipo Windows para desarrollo, pruebas y presentacion local.

## 2. Requisitos

- Windows 10 u 11.
- Docker Desktop con el motor Linux iniciado.
- Git.
- 4 GB de RAM como minimo tecnico; 8 GB recomendados para ejecutar MySQL, backend, frontend, VS Code y navegador.
- Procesador de 64 bits con 2 nucleos como minimo. Se recomiendan Intel Core i3/i5 o AMD Ryzen 3/Ryzen 5.
- Virtualizacion habilitada en BIOS/UEFI para Docker Desktop.
- 10 GB de espacio libre como minimo; 20 GB o mas y almacenamiento SSD recomendados.
- Puertos 3306, 5173 y 8000 disponibles.
- Conexion a internet para descargar imagenes y dependencias.

Para la app movil tambien se requiere Node.js, `pnpm`, Expo Go y un celular conectado a la misma red WiFi.

## 3. Instalacion con Docker

1. Clonar el repositorio y entrar a su carpeta:

```powershell
git clone URL_DEL_REPOSITORIO
cd BKH
```

2. Crear `backend/.env` a partir de `backend/.env.example` y completar las variables de correo y seguridad necesarias.

3. Iniciar los servicios:

```powershell
docker compose up -d --build
```

4. Verificar el estado:

```powershell
docker compose ps
```

MySQL debe aparecer como `healthy` y los servicios deben estar activos.

5. Abrir las aplicaciones:

- Frontend web: `http://localhost:5173`
- API y documentacion: `http://localhost:8000/docs`

## 4. Base de datos

La primera inicializacion usa `database/bookyhome.sql`. Las migraciones incrementales se encuentran en `database/migrations/`. Para aplicar una migracion concreta en PowerShell:

```powershell
Get-Content database/migrations/NOMBRE.sql | docker compose exec -T mysql mysql -uroot -proot bookyhome
```

No se deben borrar los volumenes de Docker sin un backup. El comando `docker compose down -v` elimina el volumen de MySQL y puede causar perdida de datos.

## 5. Comandos utiles

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
docker compose up -d --build backend
```

## 6. Solucion de problemas

- Si no carga el frontend, verificar que el puerto `5173` no este ocupado.
- Si la API no responde, revisar `docker compose logs backend` y que MySQL este saludable.
- Si la base no inicia, revisar el volumen y los mensajes de MySQL antes de ejecutar `down -v`.
- Si se cambia el codigo del frontend o backend, los contenedores actuales usan el modo de desarrollo con recarga automatica.

## 7. Backup inicial

Antes de trabajar con datos importantes, crear una copia:

```powershell
.\scripts\backups\backup-db.ps1
```

La guia detallada esta en [la guia de backups](../../scripts/backups/README.md).
