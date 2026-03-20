const cors = require('cors');
const express = require('express');
const session = require('express-session');
require('dotenv').config();

const app = express();
const authRoutes = require('./src/routes/Rutas.js');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
const rawSameSite = (process.env.SESSION_COOKIE_SAME_SITE || 'lax').toLowerCase();
const configuredSameSite = ['lax', 'strict', 'none'].includes(rawSameSite) ? rawSameSite : 'lax';
const configuredSecure = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === 'true'
  : isProduction;

// If SameSite=None is used, Secure must be enabled by browsers.
const cookieSecure = configuredSameSite === 'none' ? true : configuredSecure;

if (isProduction) {
  // Necesario para cookies secure detrás de proxy (Vercel)
  app.set('trust proxy', 1);
}

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - localhost
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://c-book-proyecto.vercel.app'
];

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===============================
//  STORE PARA SESIONES
// ===============================
let sessionStore;

function buildSessionStore() {
  // En Serverless (Vercel) MemoryStore se pierde entre invocaciones.
  // Si se proporciona DATABASE_URL, usar Postgres.
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const PgSession = require('connect-pg-simple')(session);
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined
    });

    return new PgSession({
      pool,
      tableName: process.env.SESSION_TABLE || 'session',
      createTableIfMissing: true
    });
  }

  if (isProduction) {
    console.warn('[session] DATABASE_URL no esta configurada. En entornos serverless la sesion en memoria puede perderse entre peticiones.');
  }

  const MemoryStore = session.MemoryStore;
  return new MemoryStore();
}

sessionStore = buildSessionStore();

// Configuración de sesión
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: configuredSameSite,
    maxAge: 1000 * 60 * 60 * 2 // 2h por defecto
  }
}));

// ===============================
//   ARCHIVOS ESTÁTICOS
// ===============================
// Servir archivos estáticos desde la raíz del proyecto
app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API de C-Book funcionando' });
}
);

// ===============================
//   RUTA PARA VER SESIONES ACTIVAS
// ===============================
app.get('/debug/sesiones', (req, res) => {//Quitar en produccion
  sessionStore.all((err, sesiones) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener sesiones' });
    }
    res.json(sesiones);
  });
});

// Rutas de autenticación
app.use('/auth', authRoutes);

module.exports = app;

// Puerto (solo para ejecución local)
if (require.main === module) {
  // Inicia los cron jobs solo cuando se ejecuta como servidor (node app.js)
  require('./cron');

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}
