const express = require('express');
const router = express.Router();
const { LoginUser, RegisterUser } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo } = require('../controllers/ControladorRecursos.js');
router.post('/login', LoginUser);
router.post('/register', RegisterUser);
router.get('/recursos', obtenerRecursosPorTipo);

module.exports = router;