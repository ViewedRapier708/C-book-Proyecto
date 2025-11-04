// middlewares/verificacionMiddleware.js
const { parse } = require('dotenv');
const { modeloVerificacion } = require('../models/modeloVerificacionRecursos.js');
// Middleware para verificar restirador
function verificarDisponibilidad(req, res, next) {
    const { TipoMaterial } = req.body;
    console.log(`TipoMaterial recibido: ${TipoMaterial}`);
    if (!TipoMaterial) {
        return res.status(400).json({
            success: false,
            error: 'TipoMaterial es requerido'
        });
    }
    switch (TipoMaterial) {
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
        const { ID } = req.body;
        console.log("Middleware Verificar Restirador ID:"+ID);
        // Validar que el ID de restirador esté presente
        if (!ID) {
            return res.status(400).json({
                success: false,
                error: 'ID de restirador requerido'
            });
        }

        console.log(`Verificando restirador: ${ID}`);
        
        // Verificar disponibilidad en la base de datos
        const resultado = await modeloVerificacion.verificarSolicitudRestirador({ID});
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
        const { ID } = req.body;
        
        if (!ID) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de computadora requerido' 
            });
        }

        const resultado = await modeloVerificacion.verificarSolicitudComputadora({ID});
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
        const { ID } = req.body;
        console.log("Middleware Verificar Libro ID:"+ID);
        if (!ID) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de libro requerido' 
            });
        }

        console.log(`Verificando libro: ${ID}`);

        const resultado = await modeloVerificacion.verificarSolicitudLibro({ID});
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