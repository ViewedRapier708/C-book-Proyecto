const cors = require('cors');
const express = require('express');
const path = require('path');
const app = express();
const authRoutes = require('./src/routes/Rutas.js');
const session = require('express-session');
require('dotenv').config();

// Detectar entorno (Render, Railway, etc. configuran NODE_ENV=production)
const isProduction = process.env.NODE_ENV === 'production';

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - localhost y GitHub Pages
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://viewedrapier708.github.io'  // GitHub Pages
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    } else {
      console.log('CORS bloqueado para:', origin);
      return callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'cbook_secreto_seguro_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hora
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  }
}));

// En desarrollo, servir archivos estáticos del frontend
if (!isProduction) {
  app.use(express.static(path.join(__dirname, '..')));
  console.log('Modo desarrollo: sirviendo archivos estáticos desde', path.join(__dirname, '..'));
}
// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas de administrador


// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});