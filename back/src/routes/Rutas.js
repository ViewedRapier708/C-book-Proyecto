const express = require('express');
const router = express.Router();
const { registro, verificarCorreo, login, verificarSesion, cerrarSesion } = require('../controllers/ControladorUsuario.js');
const { obtenerRecursosPorTipo } = require('../controllers/ControladorRecursos.js');
const middlewareAutenticacion = require('../middleware/verificacionPeticiones.js');
const controladorSolicitudes = require('../controllers/ControladorSolicitudes.js');
const sessionGuard = require('../middleware/sessionGuard.js');


// Rutas de autenticación
router.post('/registro', registro);
router.post('/verificar', verificarCorreo);
router.post('/login', login);
router.get('/session', verificarSesion);
router.post('/logout', sessionGuard, cerrarSesion);


//Rutas de recursos y solicitudes
router.get('/recursos', obtenerRecursosPorTipo);
// router.get('/solicitudes', sessionGuard, controladorSolicitudes.obtenerSolicitudesUsuario); // TODO: Implementar esta función en el controlador
router.post('/solicitud', sessionGuard,middlewareAutenticacion.verificarDisponibilidad,controladorSolicitudes.crearSolicitud);
router.delete('/solicitud/:tipo/:id', sessionGuard, controladorSolicitudes.cancelarSolicitud);
router.get('/solicitudes', sessionGuard, controladorSolicitudes.obtenerSolicitudesUsuario);
//Lo que hace esta ruta es primero verificar la disponibilidad del recurso y despues manda a llamar al controlador de solicitudes para que registre la solicitud en la base de datos
//cuando se ingresa el dato a la base de datos se activa un trigger que cambia el estado del recurso a ocupado ,
//datos necesarios para la solicitud: ID_registro,ID_Material,tipo,carrera,grupo,semestre


//Se necesita una funcion que haga que al momento de que el alumno no se presente a los materiales se libere el espacio automaticamente esto se va
//a hacer en una funcion de la base de datos que haga que se libere el material despues de cierto tiempo de inactividad, esta se va a ejecutar cada cierto tiempo
//y va a revisar las solicitudes que esten en estado 'activo' y que hayan pasado mas de 30 minutos desde la hora de solicitud, si es asi se libera el material
//y se cambia el estado de la solicitud a 'cancelado' o 'finalizado' dependiendo de la logica que se quiera implementar

//Se tiene que hacer una validacion que no se puedan hacer mas de una solicitud de un material, o diferentes.
module.exports = router;