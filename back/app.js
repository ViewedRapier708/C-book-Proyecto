const cors = require('cors');
const express = require('express');
const app = express();
const authRoutes = require('./src/routes/Rutas.js'); // ajusta la ruta según tu proyecto
const adminRoutes = require('./src/routes/RutasAdmin.js'); // Rutas de administrador
require('dotenv').config();

// Middleware para leer JSON
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas de administrador
app.use('/api/admin', adminRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});