const {
    CrearLibro,
    CrearEjemplar,
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
    actualizarDatosEjemplar,
    ObtenerUsuarios,
    HabilitarDocumentacionUsuario,
    ObtenerMateriales,
    ObtenerSolicitudesLibros,
    ActualizarEstadoSolicitudLibro,
    EntregarLibro,
    ObtenerPrestamosLibros,
    MarcarPrestamoDevuelto
} = require('../models/ModeloAdministrador.js');
const { enviarCorreo } = require('../utils/servicioCorreo.js');
const {
    agregarDiasHabiles,
    formatearFechaMexico,
    obtenerFechaMexico
} = require('../utils/fechaUtils.js');
const { getClient } = require("../config/db");

const REGEX_TEXTO_GENERAL = /^[\p{L}\p{N}\s\-\.,;:¿?¡!'"()&@#$%*+=_\\/]*$/u;
const REGEX_INVENTARIO = /^[\p{L}\p{N}\s\-_.#/]+$/u;

const validarCampoTexto = ({ valor, campo, required = true, min = 1, max = 255, regex = REGEX_TEXTO_GENERAL }) => {
    const texto = valor === undefined || valor === null ? '' : String(valor).trim();

    if (required && !texto) {
        return `El campo ${campo} es requerido`;
    }

    if (!texto) return null;

    if (texto.length < min || texto.length > max) {
        return `El campo ${campo} debe tener entre ${min} y ${max} caracteres`;
    }

    if (regex && !regex.test(texto)) {
        return `El campo ${campo} contiene caracteres no permitidos`;
    }

    return null;
};

const validarEnteroPositivo = ({ valor, campo, required = true }) => {
    if (required && (valor === undefined || valor === null || valor === '')) {
        return `El campo ${campo} es requerido`;
    }

    if (valor === undefined || valor === null || valor === '') return null;

    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
        return `El campo ${campo} debe ser un número entero positivo`;
    }

    return null;
};

const validarBooleano = ({ valor, campo }) => {
    if (valor !== undefined && typeof valor !== 'boolean') {
        return `El campo ${campo} debe ser un valor booleano (true/false)`;
    }
    return null;
};

const validarComputadoraPayload = (payload, { requireAll = true } = {}) => {
    const errores = [];

    errores.push(validarCampoTexto({ valor: payload.procesador, campo: 'procesador', required: requireAll, max: 255 }));
    errores.push(validarCampoTexto({ valor: payload.programas, campo: 'programas', required: requireAll, max: 255 }));
    errores.push(validarCampoTexto({ valor: payload.carrera, campo: 'carrera', required: requireAll, max: 255 }));
    errores.push(validarCampoTexto({ valor: payload.Observacion, campo: 'Observacion', required: requireAll, max: 500 }));
    errores.push(validarCampoTexto({ valor: payload.no_inventario, campo: 'no_inventario', required: requireAll, max: 50, regex: REGEX_INVENTARIO }));
    errores.push(validarEnteroPositivo({ valor: payload.no_computadora, campo: 'no_computadora', required: requireAll }));
    errores.push(validarBooleano({ valor: payload.Disponible, campo: 'Disponible' }));
    errores.push(validarBooleano({ valor: payload.En_funcionamiento, campo: 'En_funcionamiento' }));

    return errores.find(Boolean) || null;
};

const validarRestiradorPayload = (payload, { requireAll = true } = {}) => {
    const errores = [];

    errores.push(validarCampoTexto({ valor: payload.no_inventario, campo: 'no_inventario', required: requireAll, max: 50, regex: REGEX_INVENTARIO }));
    errores.push(validarEnteroPositivo({ valor: payload.no_restirador, campo: 'no_restirador', required: requireAll }));
    errores.push(validarCampoTexto({ valor: payload.Observacion, campo: 'Observacion', required: requireAll, max: 500 }));
    errores.push(validarBooleano({ valor: payload.Disponible, campo: 'Disponible' }));
    errores.push(validarBooleano({ valor: payload.estado_de_material ?? payload.estado_material, campo: 'estado_de_material' }));

    return errores.find(Boolean) || null;
};

const validarLibroPayload = (payload, { requireAll = true } = {}) => {
    const {
        titulo,
        clasificacion,
        isbn,
        tipo_material,
        autor,
        codigo_barras,
        numero_ejemplar,
        anio,
        estatus_item,
        Disponible,
        coleccion
    } = payload || {};

    if (requireAll) {
        if (!titulo || !clasificacion || !isbn || !tipo_material || !autor) {
            return 'Todos los campos son requeridos';
        }

        if (!numero_ejemplar || !anio || !estatus_item || !coleccion || !codigo_barras) {
            return 'Todos los campos del ejemplar son requeridos';
        }
    }

    if (numero_ejemplar !== undefined) {
        const numeroEjemplar = Number(numero_ejemplar);
        if (!Number.isInteger(numeroEjemplar) || numeroEjemplar < 0) {
            return 'El número de ejemplar debe ser un número entero no negativo';
        }
    }

    if (anio !== undefined) {
        const anioNumero = Number(anio);
        if (!Number.isInteger(anioNumero)) {
            return 'El año debe ser un número entero';
        }
        if (anioNumero < 1000 || anioNumero > 2100) {
            return 'El año debe estar entre 1000 y 2100';
        }
    }

    const regex = {
        titulo: /^[\p{L}\p{N}\s\-\.,;:¿?¡!'"()\[\]{}«»–—&@#$%*+=_\\/]*$/u,
        clasificacion: /^[\p{L}\p{N}\s\.\-]*$/u,
        isbn: /^(?:\d{3}-)?\d{1,5}-\d{1,7}-\d{1,7}-\d{1}$|^\d{9}[\dX]$/,
        tipo_material: /^[\p{L}\s]+$/u,
        autor: /^[\p{L}\s'\-\.]+$/u,
        codigo_barras: /^[\p{L}\p{N}\-]+$/u,
        coleccion: /^[\p{L}\p{N}\s\-\.,;:¿?¡!'"()&]*$/u,
        estatus_item: /^[\p{L}\p{N}\s_\-]+$/u
    };

    if (titulo && !regex.titulo.test(titulo)) {
        return 'El título contiene caracteres no permitidos (no se permiten emojis)';
    }
    if (clasificacion && !regex.clasificacion.test(clasificacion)) {
        return 'La clasificación solo puede contener letras, números, espacios, puntos y guiones';
    }
    if (isbn && !regex.isbn.test(isbn)) {
        return 'El ISBN no tiene un formato válido (ejemplo: 978-3-16-148410-0 o 0-306-40615-2)';
    }
    if (isbn) {
        const isbnLimpio = isbn.replace(/-/g, '');
        if (!(isbnLimpio.length === 10 || isbnLimpio.length === 13)) {
            return 'El ISBN debe tener 10 o 13 dígitos (sin contar guiones)';
        }
    }
    if (tipo_material && !regex.tipo_material.test(tipo_material)) {
        return 'El tipo de material solo puede contener letras y espacios';
    }
    if (autor && !regex.autor.test(autor)) {
        return 'El autor solo puede contener letras, espacios, apóstrofes, puntos y guiones';
    }
    if (codigo_barras && !regex.codigo_barras.test(codigo_barras)) {
        return 'El código de barras contiene caracteres no permitidos';
    }
    if (codigo_barras && String(codigo_barras).length < 3) {
        return 'El código de barras debe tener al menos 3 caracteres';
    }
    if (coleccion && !regex.coleccion.test(coleccion)) {
        return 'La colección contiene caracteres no permitidos';
    }
    if (estatus_item && !regex.estatus_item.test(estatus_item)) {
        return 'El estatus del item contiene caracteres no permitidos';
    }

    if (Disponible !== undefined && typeof Disponible !== 'boolean') {
        return 'El campo Disponible debe ser un valor booleano (true/false)';
    }

    const longitudes = {
        titulo: { min: 1, max: 500 },
        clasificacion: { min: 1, max: 50 },
        isbn: { min: 10, max: 17 },
        tipo_material: { min: 1, max: 50 },
        autor: { min: 1, max: 200 },
        codigo_barras: { min: 3, max: 50 },
        coleccion: { min: 1, max: 200 },
        estatus_item: { min: 1, max: 50 }
    };

    for (const [campo, limites] of Object.entries(longitudes)) {
        if (payload?.[campo] !== undefined && payload?.[campo] !== null) {
            const valorTexto = String(payload[campo]);
            if (valorTexto.length < limites.min || valorTexto.length > limites.max) {
                return `El campo ${campo} debe tener entre ${limites.min} y ${limites.max} caracteres`;
            }
        }
    }

    return null;
};

// ==================== CREAR MATERIALES ====================

async function crearLibro(req, res) {
    try {
      const {
    titulo,
    clasificacion,
    isbn,
    tipo_material,
    autor,
    codigo_barras,
    numero_ejemplar,
    anio,
    estatus_item,
    Disponible,
    coleccion
} = req.body;

// Validación de campos requeridos
if (!titulo || !clasificacion || !isbn || !tipo_material || !autor) {
    return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
    });
}

if (!numero_ejemplar || !anio || !estatus_item || !coleccion || !codigo_barras) {
    return res.status(400).json({
        success: false,
        message: 'Todos los campos del ejemplar son requeridos'
    });
}

// Validaciones numéricas
if (numero_ejemplar < 0) {
    return res.status(400).json({
        success: false,
        message: 'El número de ejemplar no puede ser negativo'
    });
}

if (anio < 0) {
    return res.status(400).json({
        success: false,
        message: 'El año no puede ser negativo'
    });
}

if (!Number.isInteger(numero_ejemplar)) {
    return res.status(400).json({
        success: false,
        message: 'El número de ejemplar debe ser un número entero'
    });
}

if (!Number.isInteger(anio)) { 
    return res.status(400).json({
        success: false,
        message: 'El año debe ser un número entero'
    });
}

// Validación del año (rango razonable: 1000-2100)
const anioActual = new Date().getFullYear();
if (anio < 1000 || anio > 2100) {
    return res.status(400).json({
        success: false,
        message: 'El año debe estar entre 1000 y 2100'
    });
}

// Expresiones regulares para validaciones
const regex = {
    // Título: letras, números, espacios, acentos y signos de puntuación comunes, pero sin emojis
    titulo: /^[\p{L}\p{N}\s\-\.,;:¿?¡!'"()\[\]{}«»–—&@#$%*+=_\\/]*$/u,
    
    // Clasificación: letras, números, espacios y puntos (ej: "823.5 M123")
    clasificacion: /^[\p{L}\p{N}\s\.\-]*$/u,
    
    // ISBN-13 o ISBN-10: formato estándar con guiones
    isbn: /^(?:\d{3}-)?\d{1,5}-\d{1,7}-\d{1,7}-\d{1}$|^\d{9}[\dX]$/,
    
    // Tipo de material: solo letras (incluyendo acentos) y espacios
    tipo_material: /^[\p{L}\s]+$/u,
    
    // Autor: letras, espacios, apóstrofes, guiones y acentos
    autor: /^[\p{L}\s'\-\.]+$/u,
    
    // Código de barras: típicamente números, pero algunos sistemas usan letras
    codigo_barras: /^[\p{L}\p{N}\-]+$/u,
    
    // Colección: similar al título pero más restrictivo
    coleccion: /^[\p{L}\p{N}\s\-\.,;:¿?¡!'"()&]*$/u,
    
    // Estatus item: letras, números y guiones bajos
    estatus_item: /^[\p{L}\p{N}\s_\-]+$/u
};

// Aplicar validaciones con expresiones regulares
if (!regex.titulo.test(titulo)) {
    return res.status(400).json({
        success: false,
        message: 'El título contiene caracteres no permitidos (no se permiten emojis)'
    });
}

if (!regex.clasificacion.test(clasificacion)) {
    return res.status(400).json({
        success: false,
        message: 'La clasificación solo puede contener letras, números, espacios, puntos y guiones'
    });
}

if (!regex.isbn.test(isbn)) {
    return res.status(400).json({
        success: false,
        message: 'El ISBN no tiene un formato válido (ejemplo: 978-3-16-148410-0 o 0-306-40615-2)'
    });
}

// Validación adicional para ISBN: eliminar guiones y verificar longitud
const isbnLimpio = isbn.replace(/-/g, '');
if (!(isbnLimpio.length === 10 || isbnLimpio.length === 13)) {
    return res.status(400).json({
        success: false,
        message: 'El ISBN debe tener 10 o 13 dígitos (sin contar guiones)'
    });
}

if (!regex.tipo_material.test(tipo_material)) {
    return res.status(400).json({
        success: false,
        message: 'El tipo de material solo puede contener letras y espacios'
    });
}

if (!regex.autor.test(autor)) {
    return res.status(400).json({
        success: false,
        message: 'El autor solo puede contener letras, espacios, apóstrofes, puntos y guiones'
    });
}

if (!regex.codigo_barras.test(codigo_barras)) {
    return res.status(400).json({
        success: false,
        message: 'El código de barras contiene caracteres no permitidos'
    });
}

// Validación adicional: longitud mínima para código de barras
if (codigo_barras.length < 3) {
    return res.status(400).json({
        success: false,
        message: 'El código de barras debe tener al menos 3 caracteres'
    });
}

if (!regex.coleccion.test(coleccion)) {
    return res.status(400).json({
        success: false,
        message: 'La colección contiene caracteres no permitidos'
    });
}

if (!regex.estatus_item.test(estatus_item)) {
    return res.status(400).json({
        success: false,
        message: 'El estatus del item contiene caracteres no permitidos'
    });
}

// Validación adicional para Disponible (si se envía)
if (Disponible !== undefined && typeof Disponible !== 'boolean') {
    return res.status(400).json({
        success: false,
        message: 'El campo Disponible debe ser un valor booleano (true/false)'
    });
}

// Validación de longitud de campos
const longitudes = {
    titulo: { min: 1, max: 500 },
    clasificacion: { min: 1, max: 50 },
    isbn: { min: 10, max: 17 }, // Con guiones puede ser más largo
    tipo_material: { min: 1, max: 50 },
    autor: { min: 1, max: 200 },
    codigo_barras: { min: 3, max: 50 },
    coleccion: { min: 1, max: 200 },
    estatus_item: { min: 1, max: 50 }
};

for (const [campo, limites] of Object.entries(longitudes)) {
    if (req.body[campo].length < limites.min || req.body[campo].length > limites.max) {
        return res.status(400).json({
            success: false,
            message: `El campo ${campo} debe tener entre ${limites.min} y ${limites.max} caracteres`
        });
    }
}


        const resultadoLibro = await CrearLibro(titulo, clasificacion, isbn, tipo_material, autor);

        if (!resultadoLibro.success) {
            return res.status(400).json(resultadoLibro);
        }

        const libroCreado = Array.isArray(resultadoLibro.data) ? resultadoLibro.data[0] : null;
        const libroId = libroCreado?.id;

        if (!libroId) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo obtener el id del libro creado'
            });
        }

        const resultadoEjemplar = await CrearEjemplar(
            libroId,
            codigo_barras,
            numero_ejemplar,
            anio,
            estatus_item,
            Disponible,
            coleccion
        );

        if (!resultadoEjemplar.success) {
            return res.status(400).json(resultadoEjemplar);
        }

        return res.status(201).json({
            success: true,
            data: {
                libro: resultadoLibro.data,
                ejemplar: resultadoEjemplar.data
            }
        });
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

        const errorValidacion = validarComputadoraPayload({
            procesador,
            programas,
            carrera,
            Disponible,
            En_funcionamiento,
            Observacion,
            no_inventario,
            no_computadora
        }, { requireAll: true });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
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

        const errorValidacion = validarRestiradorPayload({
            Disponible,
            estado_de_material: estadoMaterial,
            Observacion,
            no_inventario,
            no_restirador
        }, { requireAll: true });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
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

/*async function crearGuardarropa(req, res) {
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
*/
// ==================== ELIMINAR MATERIALES ====================

async function eliminarMaterial(req, res) {
    try {
        const { tipo } = req.params;
        const { id: idParam } = req.params;

        const id = Number(idParam);

        if (!idParam || Number.isNaN(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido y debe ser numérico' 
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
        const {
            id,
            titulo,
            clasificacion,
            isbn,
            tipo_material,
            autor,
            ejemplar_id,
            codigo_barras,
            numero_ejemplar,
            anio,
            estatus_item,
            Disponible,
            coleccion
        } = req.body;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'El id es requerido' 
            });
        }

        const errorValidacion = validarLibroPayload({
            titulo,
            clasificacion,
            isbn,
            tipo_material,
            autor,
            codigo_barras,
            numero_ejemplar,
            anio,
            estatus_item,
            Disponible,
            coleccion
        }, { requireAll: true });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
            });
        }

        const resultadoLibro = await actualizarDatosLibro(id, titulo, clasificacion, isbn, tipo_material, autor);

        if (!resultadoLibro.success) {
            return res.status(400).json(resultadoLibro);
        }

        if (ejemplar_id) {
            const resultadoEjemplar = await actualizarDatosEjemplar(
                ejemplar_id,
                codigo_barras,
                numero_ejemplar,
                anio,
                estatus_item,
                Disponible,
                coleccion
            );

            if (!resultadoEjemplar.success) {
                return res.status(400).json(resultadoEjemplar);
            }

            return res.status(200).json({
                success: true,
                data: {
                    libro: resultadoLibro.data,
                    ejemplar: resultadoEjemplar.data
                }
            });
        }

        return res.status(200).json(resultadoLibro);
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

        const errorValidacion = validarComputadoraPayload({
            procesador,
            programas,
            carrera,
            Disponible,
            En_funcionamiento,
            Observacion,
            no_inventario,
            no_computadora
        }, { requireAll: true });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
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

        const errorValidacion = validarRestiradorPayload({
            Disponible,
            estado_de_material: estadoMaterial,
            Observacion,
            no_inventario,
            no_restirador
        }, { requireAll: true });

        if (errorValidacion) {
            return res.status(400).json({
                success: false,
                message: errorValidacion
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
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 25;
        
        const resultado = await ObtenerMateriales(tipo, { page, limit });
        
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

// ==================== USUARIOS ====================

async function obtenerUsuarios(req, res) {
    try {
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 25;

        const resultado = await ObtenerUsuarios({ page, limit });

        if (resultado.success) {
            return res.status(200).json(resultado);
        }

        return res.status(400).json(resultado);
    } catch (error) {
        console.error('Error en obtenerUsuarios:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

async function habilitarDocumentacion(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'El id es requerido'
            });
        }

        const resultado = await HabilitarDocumentacionUsuario(id);

        if (resultado.success) {
            return res.status(200).json(resultado);
        }

        return res.status(400).json(resultado);
    } catch (error) {
        console.error('Error en habilitarDocumentacion:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

// ==================== SOLICITUDES Y PRÉSTAMOS ====================

async function obtenerSolicitudesLibros(req, res) {
    try {
        const resultado = await ObtenerSolicitudesLibros();
        if (resultado.success) {
            return res.status(200).json(resultado);
        }
        return res.status(400).json(resultado);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}

async function gestionarSolicitud(req, res) {
    try {
        const { id } = req.params;
        const { estado, boletaUser, motivo } = req.body; 
        // estado: 2 (Aprobar), 3 (Rechazar)

        if (!id || !estado || !boletaUser) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        const estadoNumero = Number(estado);
        let fechaAprobacion = null;
        let fechaLimiteRecoleccion = null;

        if (estadoNumero === 2) {
            fechaAprobacion = obtenerFechaMexico();
            fechaLimiteRecoleccion = agregarDiasHabiles(fechaAprobacion, 1);
            const supabase = getClient();
            const { data: usuarioDoc, error: errorDoc } = await supabase
                .from('usuarios_web_movil')
                .select('tiene_documentos')
                .eq('boleta', boletaUser)
                .single();

            if (errorDoc || !usuarioDoc) {
                return res.status(400).json({ success: false, message: 'El alumno no tiene documentación aprobada' });
            }

            if (!usuarioDoc.tiene_documentos) {
                return res.status(400).json({ success: false, message: 'El alumno no tiene documentación aprobada' });
            }
        }

        const resultado = await ActualizarEstadoSolicitudLibro(
            id,
            estadoNumero,
            motivo,
            fechaLimiteRecoleccion,
            fechaAprobacion
        );

        if (resultado.success) {
            // Enviar correo
            try {
                const supabase = getClient();
                const { data: usuario } = await supabase
                    .from('usuarios_web_movil')
                    .select('correo')
                    .eq('boleta', boletaUser)
                    .single();

                if (usuario && usuario.correo) {
                    const estatusTexto = estadoNumero === 2 ? "Aprobada" : "Rechazada";
                    const fechaLimiteTexto = fechaLimiteRecoleccion
                        ? formatearFechaMexico(fechaLimiteRecoleccion)
                        : '-';
                    const mensaje = estadoNumero === 2
                        ? `Tu solicitud ha sido aprobada. Tienes 1 día hábil para pasar a biblioteca a recoger el libro. Fecha límite de recolección: <b>${fechaLimiteTexto}</b>.`
                        : `Lamentablemente tu solicitud ha sido rechazada. Motivo: ${motivo || 'No especificado'}`;

                    await enviarCorreo(
                        usuario.correo, 
                        `Actualización de Solicitud: ${estatusTexto}`, 
                        `<p>${mensaje}</p>`
                    );
                }
            } catch (emailErr) {
                console.error("Error enviando correo update:", emailErr);
            }

            return res.status(200).json({ success: true, message: "Estado actualizado" });
        }
        return res.status(400).json(resultado);
    } catch (error) {
        console.error("Error gestionando solicitud:", error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}

async function registrarEntrega(req, res) {
    try {
        const { id } = req.params;
        const { boleta, idEjemplar } = req.body;

        let boletaValidacion = boleta;
        if (!boletaValidacion) {
            const supabase = getClient();
            const { data: solicitud, error: errorSolicitud } = await supabase
                .from('solicitudes_libros')
                .select('usuario_boleta')
                .eq('id', id)
                .single();

            if (!errorSolicitud && solicitud?.usuario_boleta) {
                boletaValidacion = solicitud.usuario_boleta;
            }
        }

        if (boletaValidacion) {
            const supabase = getClient();
            const { data: usuarioDoc, error: errorDoc } = await supabase
                .from('usuarios_web_movil')
                .select('tiene_documentos')
                .eq('boleta', boletaValidacion)
                .single();

            if (errorDoc || !usuarioDoc || !usuarioDoc.tiene_documentos) {
                return res.status(400).json({ success: false, message: 'El alumno no tiene documentación aprobada' });
            }
        }

        const resultado = await EntregarLibro(id, boleta, idEjemplar);

        if (resultado.success) {
             return res.status(200).json({ success: true, message: "Libro entregado, préstamo activo." });
        }
        return res.status(400).json(resultado);
    } catch (error) {
        console.error("Error registrando entrega:", error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}

async function obtenerPrestamosLibros(req, res) {
    try {
        const resultado = await ObtenerPrestamosLibros();
        if (resultado.success) {
            return res.status(200).json(resultado);
        }
        return res.status(400).json(resultado);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}

async function marcarPrestamoDevuelto(req, res) {
    try {
        const { id } = req.params;
        const { observaciones } = req.body || {};
        if (!id) {
            return res.status(400).json({ success: false, message: 'Faltan datos' });
        }

        const fechaDevolucionReal = obtenerFechaMexico();
        const resultado = await MarcarPrestamoDevuelto(id, fechaDevolucionReal, observaciones);
        if (resultado.success) {
            return res.status(200).json({ success: true, message: 'Préstamo marcado como devuelto.' });
        }

        return res.status(400).json(resultado);
    } catch (error) {
        console.error("Error marcando préstamo devuelto:", error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}


module.exports = {
    crearLibro,
    crearComputadora,
    crearRestirador,
 
    eliminarMaterial,
    actualizarLibro,
    actualizarComputadora,
    actualizarRestirador,
    obtenerMateriales,
    obtenerUsuarios,
    habilitarDocumentacion,
    obtenerSolicitudesLibros,
    gestionarSolicitud,
    registrarEntrega,
    obtenerPrestamosLibros,
    marcarPrestamoDevuelto
};
