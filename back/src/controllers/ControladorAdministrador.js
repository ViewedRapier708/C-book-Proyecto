const {
    CrearLibro,
    CrearComputadora,
    CrearRestirador,
    CrearGuardarropa,
    eliminarComputadora,
    eliminarRestirador,
    eliminarLibro,
    eliminarGuardarropa,
    actualizarDatosComputadora,
    actualizarDatosRestirador,
    actualizarDatosLibro,
    ObtenerMateriales
} = require('../models/ModeloAdministrador.js');

// ==================== CREAR MATERIALES ====================

async function crearLibro(req, res) {
    try {
        const { titulo, clasificacion, isbn, tipo_material, autor } = req.body;
        
        if (!titulo || !clasificacion || !isbn || !tipo_material || !autor) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }

        const resultado = await CrearLibro(titulo, clasificacion, isbn, tipo_material, autor);
        
        if (resultado.success) {
            return res.status(201).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en crearLibro:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

async function crearComputadora(req, res) {
    try {
        const { 
            procesador, programas, carrera, 
            Disponible, En_funcionamiento, Observacion, 
            no_inventario, no_computadora 
        } = req.body;
        
        if (!procesador || !programas || !carrera || !no_inventario || !no_computadora) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos requeridos deben estar presentes' 
            });
        }

        const resultado = await CrearComputadora(
            procesador, programas, carrera, 
            Disponible, En_funcionamiento, Observacion, 
            no_inventario, no_computadora
        );
        
        if (resultado.success) {
            return res.status(201).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en crearComputadora:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

async function crearRestirador(req, res) {
    try {
        const { 
            Disponible, estado_de_material, estado_material, 
            Observacion, no_inventario, no_restirador 
        } = req.body;

        const estadoMaterial = estado_de_material ?? estado_material;
        
        if (!no_inventario || !no_restirador) {
            return res.status(400).json({ 
                success: false, 
                message: 'Los campos no_inventario y no_restirador son requeridos' 
            });
        }

        const resultado = await CrearRestirador(
            Disponible, estadoMaterial, 
            Observacion, no_inventario, no_restirador
        );
        
        if (resultado.success) {
            return res.status(201).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en crearRestirador:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

async function crearGuardarropa(req, res) {
    try {
        const { ocupado, estado } = req.body;

        const resultado = await CrearGuardarropa(ocupado, estado);
        
        if (resultado.success) {
            return res.status(201).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en crearGuardarropa:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

// ==================== ELIMINAR MATERIALES ====================

async function eliminarMaterial(req, res) {
    try {
        const { tipo } = req.params;
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido' 
            });
        }

        let resultado;
        
        switch (tipo) {
            case 'libros':
                resultado = await eliminarLibro(id);
                break;
            case 'computadoras':
                resultado = await eliminarComputadora(id);
                break;
            case 'restiradores':
                resultado = await eliminarRestirador(id);
                break;
            case 'guardarropas':
                resultado = await eliminarGuardarropa(id);
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tipo de material no válido' 
                });
        }
        
        if (resultado.success) {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en eliminarMaterial:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

// ==================== ACTUALIZAR MATERIALES ====================

async function actualizarLibro(req, res) {
    try {
        const { id, titulo, clasificacion, isbn, tipo_material, autor } = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido' 
            });
        }

        const resultado = await actualizarDatosLibro(id, titulo, clasificacion, isbn, tipo_material, autor);
        
        if (resultado.success) {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en actualizarLibro:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

async function actualizarComputadora(req, res) {
    try {
        const { 
            id, procesador, programas, carrera, 
            Disponible, En_funcionamiento, Observacion, 
            no_inventario, no_computadora 
        } = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido' 
            });
        }

        const resultado = await actualizarDatosComputadora(
            id, procesador, programas, carrera, 
            Disponible, En_funcionamiento, Observacion, 
            no_inventario, no_computadora
        );
        
        if (resultado.success) {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en actualizarComputadora:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

async function actualizarRestirador(req, res) {
    try {
        const { 
            id, Disponible, estado_de_material, estado_material, 
            Observacion, no_inventario, no_restirador 
        } = req.body;

        const estadoMaterial = estado_de_material ?? estado_material;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido' 
            });
        }

        const resultado = await actualizarDatosRestirador(
            id, Disponible, estadoMaterial, 
            Observacion, no_inventario, no_restirador
        );
        
        if (resultado.success) {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en actualizarRestirador:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

// ==================== OBTENER MATERIALES ====================

async function obtenerMateriales(req, res) {
    try {
        const { tipo } = req.params;
        
        const resultado = await ObtenerMateriales(tipo);
        
        if (resultado.success) {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado);
        }
    } catch (error) {
        console.error('Error en obtenerMateriales:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
}

module.exports = {
    crearLibro,
    crearComputadora,
    crearRestirador,
    crearGuardarropa,
    eliminarMaterial,
    actualizarLibro,
    actualizarComputadora,
    actualizarRestirador,
    obtenerMateriales
};
