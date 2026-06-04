const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const authRoutes = require('./src/routes/Rutas.js');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET no está configurado en producción. El servidor no puede arrancar de forma segura.');
  process.exit(1);
}

const sessionSecret = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
const rawSameSite = (process.env.SESSION_COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')).toLowerCase();
const configuredSameSite = ['lax', 'strict', 'none'].includes(rawSameSite) ? rawSameSite : 'lax';
const configuredSecure = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === 'true'
  : isProduction;

// If SameSite=None is used, Secure must be enabled by browsers.
const cookieSecure = configuredSameSite === 'none' ? true : configuredSecure;

if (isProduction) {
  // Necesario para cookies secure detras de proxies como Azure App Service/Vercel.
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// Middleware para leer JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser(sessionSecret));

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

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? parseOrigins(process.env.CORS_ALLOWED_ORIGINS)
  : [...defaultOrigins, ...parseOrigins(process.env.FRONTEND_URL)];

const allowedOriginPatterns = [
  /^https:\/\/c-book-proyecto(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/c-book-proyecto-git-[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/i
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return allowedOrigins.includes(origin) || allowedOriginPatterns.some(pattern => pattern.test(origin));
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set session config variables for other modules
app.locals.cookieSettings = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: configuredSameSite,
  maxAge: 1000 * 60 * 60 * 2 // 2h por defecto
};
app.locals.sessionSecret = sessionSecret;

// ===============================
//   ARCHIVOS ESTÁTICOS
// ===============================
// Servir archivos estáticos desde la raíz del proyecto
app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API de C-Book funcionando' });
}
);

// Health check para Azure App Service.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'c-book-api',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
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
