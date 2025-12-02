const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./src/routes/Rutas.js');
const session = require('express-session');
require('dotenv').config();

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS - localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://viewedrapier708.github.io/C-book-Proyecto/',
  'https://viewedrapier708.github.io/C-book-Proyecto/'
];

app.use(cors({
  origin: allowedOrigins,
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
    secure: false,
  }
}));

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