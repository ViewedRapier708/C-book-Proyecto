// middlewares/verificacionMiddleware.js

const { ObtenerSolicitudesActivasPorBoleta } = require('../models/ModeloSolicitudes.js');
const { VerificarDisponibilidadRecurso } = require('../models/ModeloSolicitudes.js');
// Middleware para verificar restirador
async function verificarDisponibilidad(req, res, next) {
    console.log("Middleware Verificacion de Recursos activado");
    console.log("Cuerpo de la solicitud:", req.body);
    //Variable que se necesita para saber que tipo de material se esta solicitando
   const {tipo,recurso_id,boleta} = req.body;

   //Variables que se deben de verificar para que se pueda hacer la solicitud
    console.log(`TipoMaterial recibido: ${tipo}`);
if (!recurso_id || !boleta || !tipo) {
        return res.status(400).json({
            success: false,
            error: 'Se requieren mas datos para procesar la solicitud porfavor verifique y vuelve a intentarlo'
        });
    }
    
 
    if (tipo === 'computadora' || tipo === 'restirador') {
        const numeroBoleta = Number(boleta);
        if (!Number.isInteger(numeroBoleta)) {
            return res.status(400).json({
                success: false,
                error: 'La boleta del usuario es inválida'
            });
        }
        const pendientes = await ObtenerSolicitudesActivasPorBoleta(tipo,numeroBoleta);

        if (!pendientes.success) {
            return res.status(500).json({
                success: false,
                error: pendientes.error || 'No se pudo validar las solicitudes activas'
            });
        }

        if (pendientes.total > 0) {
            return res.status(400).json({
                success: false,
                error: 'Ya tienes una solicitud activa pendiente. Debes concluirla antes de generar otra.'
            });
        }
    }
//Verificar disponibilidad del recurso segun el tipo
    const disponibilidad = await VerificarDisponibilidadRecurso(tipo, recurso_id);
    if(disponibilidad.success === true && disponibilidad.message == null){
        res.locals.idRecurso = disponibilidad.idRecurso ;
        next();
    }
    if (disponibilidad.success === false) {
        return res.status(400).json({
            success: false,
            error: disponibilidad.message || 'Recurso no disponible'
        });
    }
}

module.exports = { verificarDisponibilidad };