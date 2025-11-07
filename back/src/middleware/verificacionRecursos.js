// middlewares/verificacionMiddleware.js
const { parse } = require('dotenv');
const { modeloVerificacion } = require('../models/modeloVerificacionRecursos.js');
// Middleware para verificar restirador
function verificarDisponibilidad(req, res, next) {
    console.log("Middleware Verificacion de Recursos activado");
    console.log("Cuerpo de la solicitud:", req.body);
    //Variable que se necesita para saber que tipo de material se esta solicitando
   const {tipo} = req.body;

   //Variables que se deben de verificar para que se pueda hacer la solicitud
   const {registro_id, semestre, grupo, carrera, recurso_id,id} = req.body;
    console.log(`TipoMaterial recibido: ${tipo}`);
if (!registro_id || !semestre || !grupo || !carrera || !recurso_id) {
        return res.status(400).json({
            success: false,
            error: 'Se requieren mas datos para procesar la solicitud porfavor verifique y vuelve a intentarlo'
        });
    }
 
    if (!tipo) {
        return res.status(400).json({
            success: false,
            error: 'TipoMaterial es requerido'
        });
    }
    switch (tipo) {
        case 'restirador':
            return verificarRestirador(req, res, next);
        case 'computadora':
            return verificarComputadora(req, res, next);
        case 'libro':
            return verificarLibro(req, res, next);
        default:
            return res.status(400).json({
                success: false,
                error: 'TipoMaterial no válido'
            });
    }
}
const verificarRestirador = async (req, res, next) => {
    try {
        const { id } = req.body;
        console.log("req body id:"+id);
        console.log("Middleware Verificar Restirador ID:"+id);
        // Validar que el ID de restirador esté presente
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de restirador requerido'
            });
        }

        console.log(`Verificando restirador: ${id}`+'linea 54');
        
        // Verificar disponibilidad en la base de datos
        const resultado = await modeloVerificacion.verificarSolicitudRestirador({id});
        console.log("Resultado Verificacion Restirador:",resultado);
        if (!resultado.success) {
            console.log('Restirador no disponible:', resultado.error);
            return res.status(400).json({ 
                success: false, 
                error: resultado.error.message || resultado.error 
            });
        }

        // Si la verificación es exitosa, adjuntar datos a la request
        req.restiradorData = resultado.data;
        console.log('Restirador disponible, continuando...');
        next();
        
    } catch (error) {
        console.error('Error en middleware verificarRestirador:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor durante la verificación' 
        });
    }
};

// Middleware para verificar computadora
const verificarComputadora = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de computadora requerido' 
            });
        }

        const resultado = await modeloVerificacion.verificarSolicitudComputadora({id});
        if (!resultado.success) {
            console.log('Computadora no disponible:', resultado.error);
            return res.status(400).json({ 
                success: false, 
                error: resultado.error.message || resultado.error 
            });
        }

        req.data = resultado.data;
        console.log('Computadora disponible, continuando...');
        next();
        
    } catch (error) {
        console.error('Error en middleware verificarComputadora:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor durante la verificación' 
        });
    }
};

// Middleware para verificar libro
const verificarLibro = async (req, res, next) => {
    try {
        const { id } = req.body;
        console.log("Middleware Verificar Libro ID:"+id);
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de libro requerido' 
            });
        }

        console.log(`Verificando libro: ${id}`);

        const resultado = await modeloVerificacion.verificarSolicitudLibro({id});
        console.log("Resultado Verificacion Libro:",resultado);
        console.log("aver is")
        if (!resultado.success) {
            console.log('Libro no disponible:', resultado.error);
            return res.status(400).json({ 
                success: false, 
                message:"Libro no disponible",
            });
        }

        req.libroData = resultado.data;
        console.log('Libro disponible, continuando...');
        next();
        
    } catch (error) {
        console.error('Error en middleware verificarLibro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor durante la verificación' 
        });
    }
};
module.exports = { verificarDisponibilidad };