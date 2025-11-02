// middlewares/verificacionMiddleware.js
const { modeloVerificacion } = require('../models/ModeloSolicitudes');
// Middleware para verificar restirador
const verificarRestirador = async (req, res, next) => {
    try {
        const { numeroRestirador } = req.body;
        
        // Validar que el número de restirador esté presente
        if (!numeroRestirador) {
            return res.status(400).json({ 
                success: false, 
                error: 'Número de restirador requerido' 
            });
        }

        console.log(`Verificando restirador: ${numeroRestirador}`);
        
        // Verificar disponibilidad en la base de datos
        const resultado = await modeloVerificacion.verificarSolicitudRestirador(numeroRestirador);
        
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

verificarRestirador();
// Middleware para verificar computadora
const verificarComputadora = async (req, res, next) => {
    try {
        const { computadoraID } = req.body;
        
        if (!computadoraID) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de computadora requerido' 
            });
        }

        console.log(`Verificando computadora: ${computadoraID}`);
        
        const resultado = await modeloVerificacion.verificarSolicitudComputadora(computadoraID);
        
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
        const { libroID } = req.body;
        
        if (!libroID) {
            return res.status(400).json({ 
                success: false, 
                error: 'ID de libro requerido' 
            });
        }

        console.log(`Verificando libro: ${libroID}`);
        
        const resultado = await modeloVerificacion.verificarLibro(libroID);
        
        if (!resultado.success) {
            console.log('Libro no disponible:', resultado.error);
            return res.status(400).json({ 
                success: false, 
                error: resultado.error.message || resultado.error 
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

module.exports = {
    verificarRestirador,
    verificarComputadora,
    verificarLibro
};
