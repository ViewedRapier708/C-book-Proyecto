const express = require('express');
const app = express();
app.use(express.json());

const authRoutes = require('./src/routes/authroutes');

app.use('/auth', authRoutes);   // todas las rutas bajo /auth

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
