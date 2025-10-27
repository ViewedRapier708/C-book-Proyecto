# Backend (back)

Este directorio contiene la parte de servidor (backend) del proyecto. Aquí tienes la estructura inicial y una guía rápida de qué va en cada carpeta, buenas prácticas y comandos para arrancar el servidor.

Contenido y propósito de carpetas

- `src/`
  - Carpeta raíz del código fuente del backend.
  - Contiene el entrypoint (`index.js`) y las subcarpetas descritas abajo.

- `src/controllers/`
  - Controladores que manejan las peticiones HTTP (reciben `req` y `res`).
  - Ejemplos: `authController.js`, `userController.js`, `solicitudesController.js`.
  - Deben mantener la lógica de respuesta y delegar la lógica de negocio a `services`.

- `src/routes/`
  - Definición y agrupación de rutas por recursos (ej. `/api/auth`, `/api/users`).
  - Cada archivo exporta un router de Express que enlaza rutas con controladores.

- `src/models/`
  - Definición de esquemas / modelos para la base de datos (Mongoose, Sequelize, TypeORM, etc.).
  - Ejemplo: `User.js`, `Solicitud.js`.

- `src/services/`
  - Lógica de negocio reutilizable y operaciones complejas (consultas a la BD, transacciones).
  - Los controladores llaman a los servicios para mantenerlos delgados.

- `src/config/`
  - Configuraciones y helpers de entorno (conexión a BD, variables, configuración de CORS, etc.).
  - Ejemplo: `db.js`, `index.js` que exponga la configuración por entorno.

- `src/middleware/`
  - Middlewares de Express reutilizables (auth, validación, logging, manejo de errores).
  - Ejemplo: `authMiddleware.js`, `errorHandler.js`.

- `src/utils/`
  - Utilitarios y helpers puros (logger, formateadores, helpers de email).
  - Ejemplo: `logger.js`, `formatDate.js`.

- `tests/`
  - Pruebas unitarias/integración organizadas por módulo.
  - Recomendado: `jest` o `mocha`+`chai`.

- `scripts/`
  - Scripts de utilidad (seed, migraciones, tareas ajenas al servidor).

Archivos importantes en la raíz de `back/`

- `package.json` — aquí se deben añadir scripts útiles (`start`, `dev`, `test`).
- `.env` / `.env.example` — variables de entorno (NO subir `.env` al repositorio público).
- `README.md` — (este archivo) guía rápida para desarrolladores.

Buenas prácticas y recomendaciones

- Mantener los controladores delgados: mover la lógica compleja a `services`.
- Manejar errores centralizadamente con un middleware (`errorHandler`).
- Validar entrada (usando `Joi` o `express-validator`) desde middleware o servicios.
- Usar async/await y capturar errores con try/catch, delegando al middleware de errores.
- Centralizar la configuración (leer `process.env` en `src/config/index.js`).

Comandos rápidos para arrancar el backend (PowerShell)

1) Ir a la carpeta `back`:

```powershell
cd c:\Users\jbeto\OneDrive\Escritorio\ProyectoLDS\back
```

2) Instalar dependencias mínimas:

```powershell
npm install express dotenv
```

3) Ejecutar el servidor (entrypoint `src/index.js`):

```powershell
node src/index.js
```

4) Recomendado en desarrollo (con `nodemon`):

```powershell
npm install --save-dev nodemon
# y en package.json agregar:
# "scripts": { "start": "node src/index.js", "dev": "nodemon src/index.js" }

npm run dev
```

Comprobación rápida
- Después de ejecutar `node src/index.js` o `npm run dev`, la ruta `http://localhost:3000/health` (o `GET /api/health` si montas rutas con prefijo `/api`) debería devolver un JSON con estado.

Sugerencias para siguientes pasos (puedo implementarlas si quieres):

- Añadir `dotenv` y cargar variables de entorno en `src/index.js`.
- Añadir scripts `start` y `dev` en `package.json` y opcionalmente `lint` y `test`.
- Instalar y configurar una base de datos (MongoDB con Mongoose o Postgres con Sequelize/pg), y crear modelos básicos (`User`).
- Crear endpoints de `auth` (registro/login) y conectar el front (validación de boleta/contraseña).
- Añadir tests básicos con Jest y un pipeline de CI.

Contacto rápido
Si quieres que implemente alguno de los pasos anteriores (p. ej. `dotenv` + `package.json` scripts o un endpoint `auth` básico), dime cuál y lo hago.

---
Actualizado automáticamente por la herramienta de scaffolding del proyecto.

