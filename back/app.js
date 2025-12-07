const cors = require('cors');
const express = require('express');
const session = require('express-session');
const { render } = require('ejs');
const path = require('path');
require('dotenv').config();

const app = express();
const authRoutes = require('./src/routes/Rutas.js');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - localhost
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://viewedrapier708.github.io/C-book-Proyecto/'
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
//  STORE PARA VER SESIONES
// ===============================
const MemoryStore = session.MemoryStore;
const sessionStore = new MemoryStore();

if (isProduction) {
  app.set('trust proxy', 1); // Necesario si se usa proxy/Heroku para secure cookies
}

// Configuración de sesión
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: Number(process.env.SESSION_MAX_AGE_MS) || 1000 * 60 * 60 * 2 // 2h por defecto
  }
}));

// ===============================
//   ARCHIVOS ESTÁTICOS
// ===============================
// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

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

// Ruta raíz - servir index.html
console.log(path.join(__dirname,'..', 'index.html'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
