const express = require('express');
const app = express();
const authRoutes = require('./src/routes/authroutes.js'); // ajusta la ruta según tu proyecto
// Middleware para leer JSON
app.use(express.json());

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