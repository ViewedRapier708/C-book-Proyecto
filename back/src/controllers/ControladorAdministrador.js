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
const REGEX_SOLO_LETRAS = /^[\p{L}\s]+$/u;
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

const validarEnteroPositivo = ({ valor, campo, required = true, maxDigits }) => {
    if (required && (valor === undefined || valor === null || valor === '')) {
        return `El campo ${campo} es requerido`;
    }

    if (valor === undefined || valor === null || valor === '') return null;

    const valorTexto = String(valor).trim();
    if (maxDigits && valorTexto.length > maxDigits) {
        return `El campo ${campo} supera la longitud máxima permitida (${maxDigits} dígitos)`;
    }

    if (!/^\d+$/.test(valorTexto)) {
        return `El campo ${campo} debe ser un número entero positivo`;
    }

    const numero = Number(valorTexto);
    if (!Number.isSafeInteger(numero) || numero <= 0) {
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

    errores.push(validarCampoTexto({ valor: payload.procesador, campo: 'procesador', required: requireAll, max: 50 }));
    errores.push(validarCampoTexto({ valor: payload.programas, campo: 'programas', required: requireAll, max: 50 }));
    errores.push(validarCampoTexto({ valor: payload.carrera, campo: 'carrera', required: requireAll, max: 50, regex: REGEX_SOLO_LETRAS }));
    errores.push(validarCampoTexto({ valor: payload.Observacion, campo: 'Observacion', required: requireAll, max: 50 }));
    errores.push(validarCampoTexto({ valor: payload.no_inventario, campo: 'no_inventario', required: requireAll, max: 50, regex: REGEX_INVENTARIO }));
    errores.push(validarEnteroPositivo({ valor: payload.no_computadora, campo: 'no_computadora', required: requireAll, maxDigits: 20 }));
    errores.push(validarBooleano({ valor: payload.Disponible, campo: 'Disponible' }));
    errores.push(validarBooleano({ valor: payload.En_funcionamiento, campo: 'En_funcionamiento' }));

    return errores.find(Boolean) || null;
};

const validarRestiradorPayload = (payload, { requireAll = true } = {}) => {
    const errores = [];

    errores.push(validarCampoTexto({ valor: payload.no_inventario, campo: 'no_inventario', required: requireAll, max: 50, regex: REGEX_INVENTARIO }));
    errores.push(validarEnteroPositivo({ valor: payload.no_restirador, campo: 'no_restirador', required: requireAll, maxDigits: 20 }));
    errores.push(validarCampoTexto({ valor: payload.Observacion, campo: 'Observacion', required: requireAll, max: 50 }));
    errores.push(validarBooleano({ valor: payload.Disponible, campo: 'Disponible' }));
    errores.push(validarBooleano({ valor: payload.estado_de_material ?? payload.estado_material, campo: 'estado_de_material' }));

    return errores.find(Boolean) || null;
};

const esVacio = (valor) => valor === undefined || valor === null || valor === '';

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
        if (esVacio(titulo) || esVacio(clasificacion) || esVacio(isbn) || esVacio(tipo_material) || esVacio(autor)) {
            return 'Todos los campos son requeridos';
        }

        if (esVacio(numero_ejemplar) || esVacio(anio) || esVacio(estatus_item) || esVacio(coleccion) || esVacio(codigo_barras)) {
            return 'Todos los campos del ejemplar son requeridos';
        }
    }

    if (!esVacio(numero_ejemplar)) {
        const numeroEjemplar = Number(numero_ejemplar);
        if (!Number.isInteger(numeroEjemplar) || numeroEjemplar < 0) {
            return 'El número de ejemplar debe ser un número entero no negativo';
        }
    }

    if (!esVacio(anio)) {
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

    if (!esVacio(titulo) && !regex.titulo.test(titulo)) {
        return 'El título contiene caracteres no permitidos (no se permiten emojis)';
    }
    if (!esVacio(clasificacion) && !regex.clasificacion.test(clasificacion)) {
        return 'La clasificación solo puede contener letras, números, espacios, puntos y guiones';
    }
    if (!esVacio(isbn) && !regex.isbn.test(isbn)) {
        return 'El ISBN no tiene un formato válido (ejemplo: 978-3-16-148410-0 o 0-306-40615-2)';
    }
    if (!esVacio(isbn)) {
        const isbnLimpio = String(isbn).replace(/-/g, '');
        if (!(isbnLimpio.length === 10 || isbnLimpio.length === 13)) {
            return 'El ISBN debe tener 10 o 13 dígitos (sin contar guiones)';
        }
    }
    if (!esVacio(tipo_material) && !regex.tipo_material.test(tipo_material)) {
        return 'El tipo de material solo puede contener letras y espacios';
    }
    if (!esVacio(autor) && !regex.autor.test(autor)) {
        return 'El autor solo puede contener letras, espacios, apóstrofes, puntos y guiones';
    }
    if (!esVacio(codigo_barras) && !regex.codigo_barras.test(codigo_barras)) {
        return 'El código de barras contiene caracteres no permitidos';
    }
    if (!esVacio(codigo_barras) && String(codigo_barras).length < 3) {
        return 'El código de barras debe tener al menos 3 caracteres';
    }
    if (!esVacio(coleccion) && !regex.coleccion.test(coleccion)) {
        return 'La colección contiene caracteres no permitidos';
    }
    if (!esVacio(estatus_item) && !regex.estatus_item.test(estatus_item)) {
        return 'El estatus del item contiene caracteres no permitidos';
    }

    if (Disponible !== undefined && typeof Disponible !== 'boolean') {
        return 'El campo Disponible debe ser un valor booleano (true/false)';
    }

    const longitudes = {
        titulo: { min: 1, max: 50 },
        clasificacion: { min: 1, max: 50 },
        isbn: { min: 10, max: 50 },
        tipo_material: { min: 1, max: 50 },
        autor: { min: 1, max: 50 },
        codigo_barras: { min: 3, max: 50 },
        coleccion: { min: 1, max: 50 },
        estatus_item: { min: 1, max: 50 }
    };

    for (const [campo, limites] of Object.entries(longitudes)) {
        if (!esVacio(payload?.[campo])) {
            const valorTexto = String(payload[campo]);
            if (valorTexto.length < limites.min || valorTexto.length > limites.max) {
                return `El campo ${campo} debe tener entre ${limites.min} y ${limites.max} caracteres`;
            }
        }
    }

    return null;
};

const validarDuplicado = async ({ tabla, columna, valor, mensaje, excluirId = null }) => {
    const supabase = getClient();
    let query = supabase
        .from(tabla)
        .select('id')
        .eq(columna, valor)
        .limit(1);

    if (excluirId !== null && excluirId !== undefined && excluirId !== '') {
        query = query.neq('id', excluirId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error(`Error validando duplicado en ${tabla}.${columna}:`, error);
        return { success: false, message: 'Error interno al validar duplicados' };
    }

    if (data?.id) {
        return { success: false, message: mensaje };
    }

    return { success: true };
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

    if (!esVacio(numero_ejemplar)) {
        const duplicadoEjemplar = await validarDuplicado({
            tabla: 'ejemplares',
            columna: 'numero_ejemplar',
            valor: numero_ejemplar,
            mensaje: 'El número de ejemplar ya existe'
        });
        if (!duplicadoEjemplar.success) {
            return res.status(409).json({
                success: false,
                message: duplicadoEjemplar.message
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
            Number(numero_ejemplar),
            Number(anio),
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

        const duplicadoInventario = await validarDuplicado({
            tabla: 'computadoras',
            columna: 'no_inventario',
            valor: no_inventario,
            mensaje: 'El número de inventario ya existe'
        });
        if (!duplicadoInventario.success) {
            return res.status(409).json({
                success: false,
                message: duplicadoInventario.message
            });
        }

        const duplicadoNumero = await validarDuplicado({
            tabla: 'computadoras',
            columna: 'no_computadora',
            valor: no_computadora,
            mensaje: 'El número de computadora ya existe'
        });
        if (!duplicadoNumero.success) {
            return res.status(409).json({
                success: false,
                message: duplicadoNumero.message
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

        const duplicadoInventario = await validarDuplicado({
            tabla: 'restiradores',
            columna: 'no_inventario',
            valor: no_inventario,
            mensaje: 'El número de inventario ya existe'
        });
        if (!duplicadoInventario.success) {
            return res.status(409).json({
                success: false,
                message: duplicadoInventario.message
            });
        }

        const duplicadoNumero = await validarDuplicado({
            tabla: 'restiradores',
            columna: 'no_restirador',
            valor: no_restirador,
            mensaje: 'El número de restirador ya existe'
        });
        if (!duplicadoNumero.success) {
            return res.status(409).json({
                success: false,
                message: duplicadoNumero.message
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

        if (numero_ejemplar !== undefined && numero_ejemplar !== null && numero_ejemplar !== '' && ejemplar_id) {
            const duplicadoEjemplar = await validarDuplicado({
                tabla: 'ejemplares',
                columna: 'numero_ejemplar',
                valor: numero_ejemplar,
                mensaje: 'El número de ejemplar ya existe',
                excluirId: ejemplar_id
            });
            if (!duplicadoEjemplar.success) {
                return res.status(409).json({
                    success: false,
                    message: duplicadoEjemplar.message
                });
            }
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

        if (no_inventario !== undefined && no_inventario !== null && no_inventario !== '') {
            const duplicadoInventario = await validarDuplicado({
                tabla: 'computadoras',
                columna: 'no_inventario',
                valor: no_inventario,
                mensaje: 'El número de inventario ya existe',
                excluirId: id
            });
            if (!duplicadoInventario.success) {
                return res.status(409).json({
                    success: false,
                    message: duplicadoInventario.message
                });
            }
        }

        if (no_computadora !== undefined && no_computadora !== null && no_computadora !== '') {
            const duplicadoNumero = await validarDuplicado({
                tabla: 'computadoras',
                columna: 'no_computadora',
                valor: no_computadora,
                mensaje: 'El número de computadora ya existe',
                excluirId: id
            });
            if (!duplicadoNumero.success) {
                return res.status(409).json({
                    success: false,
                    message: duplicadoNumero.message
                });
            }
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

        if (no_inventario !== undefined && no_inventario !== null && no_inventario !== '') {
            const duplicadoInventario = await validarDuplicado({
                tabla: 'restiradores',
                columna: 'no_inventario',
                valor: no_inventario,
                mensaje: 'El número de inventario ya existe',
                excluirId: id
            });
            if (!duplicadoInventario.success) {
                return res.status(409).json({
                    success: false,
                    message: duplicadoInventario.message
                });
            }
        }

        if (no_restirador !== undefined && no_restirador !== null && no_restirador !== '') {
            const duplicadoNumero = await validarDuplicado({
                tabla: 'restiradores',
                columna: 'no_restirador',
                valor: no_restirador,
                mensaje: 'El número de restirador ya existe',
                excluirId: id
            });
            if (!duplicadoNumero.success) {
                return res.status(409).json({
                    success: false,
                    message: duplicadoNumero.message
                });
            }
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
