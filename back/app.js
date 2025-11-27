const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./src/routes/Rutas.js');
const session = require('express-session');
require('dotenv').config();

// Middleware para leer JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS para permitir cookies de sesión
app.use(cors({
  origin:  ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Configuración de la sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'cbook_secreto_seguro_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hora
    httpOnly: true,
    secure: false, // true en producción con HTTPS
    sameSite: 'lax'
  }
}));
// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});