const path = require('path');
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
    MarcarPrestamoDevuelto,
    ObtenerBoletas,
    CrearBoleta,
    ActualizarBoleta,
    EliminarBoleta,
    BulkUpsertBoletas,
    BoletasExistentes,
} = require('../models/ModeloAdministrador.js');
const { enviarCorreo, plantillaCorreo } = require('../utils/servicioCorreo.js');
const {
    agregarDiasHabiles,
    formatearFechaMexico,
    obtenerFechaMexico
} = require('../utils/fechaUtils.js');
const { getClient } = require("../config/db");

function validarEnteroSinDecimales(valor, campo) {
    if (valor === undefined || valor === null || valor === '') {
        return { ok: true, value: undefined };
    }

    if (typeof valor === 'string' && /[.,]/.test(valor)) {
        return { ok: false, message: `El campo ${campo} no puede contener decimales. Solo números enteros positivos.` };
    }

    const numero = Number(valor);
    if (!Number.isFinite(numero) || !Number.isInteger(numero)) {
        return { ok: false, message: `El campo ${campo} debe ser un número entero (sin decimales).` };
    }

    if (numero < 0) {
        return { ok: false, message: `El campo ${campo} no puede ser negativo.` };
    }

    return { ok: true, value: numero };
}

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

const tituloTrim = String(titulo ?? '').trim();
const clasificacionTrim = String(clasificacion ?? '').trim();
const isbnTrim = String(isbn ?? '').trim();
const tipoMaterialTrim = String(tipo_material ?? '').trim();
const autorTrim = String(autor ?? '').trim();
const codigoBarrasTrim = String(codigo_barras ?? '').trim();
const numeroEjemplarStr = String(numero_ejemplar ?? '').trim();
const anioStr = String(anio ?? '').trim();
const estatusItemTrim = String(estatus_item ?? '').trim();
const coleccionTrim = String(coleccion ?? '').trim();

// Validación de campos requeridos
if (!tituloTrim || !clasificacionTrim || !isbnTrim || !tipoMaterialTrim || !autorTrim) {
    return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
    });
}

if (!numeroEjemplarStr || !anioStr || !estatusItemTrim || !coleccionTrim || !codigoBarrasTrim) {
    return res.status(400).json({
        success: false,
        message: 'Todos los campos del ejemplar son requeridos'
    });
}

const validacionNumeroEjemplar = validarEnteroSinDecimales(numeroEjemplarStr, 'numero_ejemplar');
if (!validacionNumeroEjemplar.ok) {
    return res.status(400).json({
        success: false,
        message: validacionNumeroEjemplar.message
    });
}

const validacionAnio = validarEnteroSinDecimales(anioStr, 'anio');
if (!validacionAnio.ok) {
    return res.status(400).json({
        success: false,
        message: validacionAnio.message
    });
}

const numeroEjemplar = validacionNumeroEjemplar.value;
const anioNumero = validacionAnio.value;

// Validaciones numéricas
if (numeroEjemplar < 0) {
    return res.status(400).json({
        success: false,
        message: 'El número de ejemplar no puede ser negativo'
    });
}

if (anioNumero < 0) {
    return res.status(400).json({
        success: false,
        message: 'El año no puede ser negativo'
    });
}

// Validación del año (rango razonable: 1000-2100)
const anioActual = new Date().getFullYear();
if (anioNumero < 1000 || anioNumero > 2100) {
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
if (!regex.titulo.test(tituloTrim)) {
    return res.status(400).json({
        success: false,
        message: 'El título contiene caracteres no permitidos (no se permiten emojis)'
    });
}

if (!regex.clasificacion.test(clasificacionTrim)) {
    return res.status(400).json({
        success: false,
        message: 'La clasificación solo puede contener letras, números, espacios, puntos y guiones'
    });
}

if (!regex.tipo_material.test(tipoMaterialTrim)) {
    return res.status(400).json({
        success: false,
        message: 'El tipo de material solo puede contener letras y espacios'
    });
}

if (!regex.autor.test(autorTrim)) {
    return res.status(400).json({
        success: false,
        message: 'El autor solo puede contener letras, espacios, apóstrofes, puntos y guiones'
    });
}

if (!regex.codigo_barras.test(codigoBarrasTrim)) {
    return res.status(400).json({
        success: false,
        message: 'El código de barras contiene caracteres no permitidos'
    });
}

// Validación adicional: longitud mínima para código de barras
if (codigoBarrasTrim.length < 3) {
    return res.status(400).json({
        success: false,
        message: 'El código de barras debe tener al menos 3 caracteres'
    });
}

if (!regex.coleccion.test(coleccionTrim)) {
    return res.status(400).json({
        success: false,
        message: 'La colección contiene caracteres no permitidos'
    });
}

if (!regex.estatus_item.test(estatusItemTrim)) {
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
    tipo_material: { min: 1, max: 50 },
    autor: { min: 1, max: 200 },
    codigo_barras: { min: 3, max: 50 },
    coleccion: { min: 1, max: 200 },
    estatus_item: { min: 1, max: 50 }
};

for (const [campo, limites] of Object.entries(longitudes)) {
    const valor = String(req.body[campo] ?? '').trim();
    if (valor.length < limites.min || valor.length > limites.max) {
        return res.status(400).json({
            success: false,
            message: `El campo ${campo} debe tener entre ${limites.min} y ${limites.max} caracteres`
        });
    }
}

// Si todas las validaciones pasan, continuar con el procesamiento

        // Validar duplicados de ISBN
        const supabase = getClient();
        const { data: isbnDuplicado } = await supabase
            .from('libros')
            .select('id')
            .eq('isbn', isbnTrim)
            .maybeSingle();

        if (isbnDuplicado) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un libro con este ISBN'
            });
        }

        // Validar duplicado de código de barras
        const { data: codigoBarrasDuplicado } = await supabase
            .from('ejemplares')
            .select('id')
            .eq('codigo_barras', codigoBarrasTrim)
            .maybeSingle();

        if (codigoBarrasDuplicado) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un ejemplar con este código de barras'
            });
        }

        const resultadoLibro = await CrearLibro(tituloTrim, clasificacionTrim, isbnTrim, tipoMaterialTrim, autorTrim);

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
            codigoBarrasTrim,
            numeroEjemplar,
            anioNumero,
            estatusItemTrim,
            Disponible,
            coleccionTrim
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

        const procesadorTrim = String(procesador ?? '').trim();
        const programasTrim = String(programas ?? '').trim();
        const carreraTrim = String(carrera ?? '').trim();
        const noInventarioTrim = String(no_inventario ?? '').trim();
        
        if (!procesadorTrim || !programasTrim || !carreraTrim || !noInventarioTrim || no_computadora === undefined || no_computadora === null || String(no_computadora).trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos requeridos deben estar presentes' 
            });
        }

        const validacionNoComputadora = validarEnteroSinDecimales(no_computadora, 'no_computadora');
        if (!validacionNoComputadora.ok) {
            return res.status(400).json({
                success: false,
                message: validacionNoComputadora.message
            });
        }

        const noComputadoraNumero = validacionNoComputadora.value;

        // Validar duplicados
        const supabase = getClient();
        const { data: inventarioDuplicado } = await supabase
            .from('computadoras')
            .select('id')
            .eq('no_inventario', noInventarioTrim)
            .maybeSingle();

        if (inventarioDuplicado) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una computadora con este número de inventario'
            });
        }

        const { data: computadoraDuplicada } = await supabase
            .from('computadoras')
            .select('id')
            .eq('no_computadora', noComputadoraNumero)
            .maybeSingle();

        if (computadoraDuplicada) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una computadora con este número'
            });
        }

        const resultado = await CrearComputadora(
            procesadorTrim, programasTrim, carreraTrim, 
            Disponible, En_funcionamiento, Observacion, 
            noInventarioTrim, noComputadoraNumero
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
        const noInventarioTrim = String(no_inventario ?? '').trim();
        
        if (!noInventarioTrim || no_restirador === undefined || no_restirador === null || String(no_restirador).trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Los campos no_inventario y no_restirador son requeridos' 
            });
        }

        const validacionNoRestirador = validarEnteroSinDecimales(no_restirador, 'no_restirador');
        if (!validacionNoRestirador.ok) {
            return res.status(400).json({
                success: false,
                message: validacionNoRestirador.message
            });
        }

        const noRestiradorNumero = validacionNoRestirador.value;

        // Validar duplicados
        const supabase = getClient();
        const { data: inventarioDuplicado } = await supabase
            .from('restiradores')
            .select('id')
            .eq('no_inventario', noInventarioTrim)
            .maybeSingle();

        if (inventarioDuplicado) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un restirador con este número de inventario'
            });
        }

        const { data: restiradorDuplicado } = await supabase
            .from('restiradores')
            .select('id')
            .eq('no_restirador', noRestiradorNumero)
            .maybeSingle();

        if (restiradorDuplicado) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un restirador con este número'
            });
        }

        const resultado = await CrearRestirador(
            Disponible, estadoMaterial, 
            Observacion, noInventarioTrim, noRestiradorNumero
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

        let numeroEjemplarActualizado = numero_ejemplar;
        if (numero_ejemplar !== undefined) {
            const validacionNumeroEjemplar = validarEnteroSinDecimales(numero_ejemplar, 'numero_ejemplar');
            if (!validacionNumeroEjemplar.ok) {
                return res.status(400).json({
                    success: false,
                    message: validacionNumeroEjemplar.message
                });
            }
            numeroEjemplarActualizado = validacionNumeroEjemplar.value;
        }

        let anioActualizado = anio;
        if (anio !== undefined) {
            const validacionAnio = validarEnteroSinDecimales(anio, 'anio');
            if (!validacionAnio.ok) {
                return res.status(400).json({
                    success: false,
                    message: validacionAnio.message
                });
            }
            anioActualizado = validacionAnio.value;
        }

        const resultadoLibro = await actualizarDatosLibro(id, titulo, clasificacion, isbn, tipo_material, autor);

        if (!resultadoLibro.success) {
            return res.status(400).json(resultadoLibro);
        }

        if (ejemplar_id) {
            const resultadoEjemplar = await actualizarDatosEjemplar(
                ejemplar_id,
                codigo_barras,
                numeroEjemplarActualizado,
                anioActualizado,
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

        let noComputadoraActualizada = no_computadora;
        if (no_computadora !== undefined) {
            const validacionNoComputadora = validarEnteroSinDecimales(no_computadora, 'no_computadora');
            if (!validacionNoComputadora.ok) {
                return res.status(400).json({
                    success: false,
                    message: validacionNoComputadora.message
                });
            }
            noComputadoraActualizada = validacionNoComputadora.value;
        }

        const resultado = await actualizarDatosComputadora(
            id, procesador, programas, carrera, 
            Disponible, En_funcionamiento, Observacion, 
            no_inventario, noComputadoraActualizada
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

        let noRestiradorActualizado = no_restirador;
        if (no_restirador !== undefined) {
            const validacionNoRestirador = validarEnteroSinDecimales(no_restirador, 'no_restirador');
            if (!validacionNoRestirador.ok) {
                return res.status(400).json({
                    success: false,
                    message: validacionNoRestirador.message
                });
            }
            noRestiradorActualizado = validacionNoRestirador.value;
        }

        const resultado = await actualizarDatosRestirador(
            id, Disponible, estadoMaterial, 
            Observacion, no_inventario, noRestiradorActualizado
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
                // Obtener datos del alumno
                const { data: alumno } = await supabase
                    .from('usuarios_web_movil')
                    .select('correo, boletas(nombre, Grupo)')
                    .eq('boleta', boletaUser)
                    .single();

                if (alumno && alumno.correo) {
                    const nombre = alumno.boletas?.nombre || '-';
                    const grupo = alumno.boletas?.Grupo || '-';

                    // Obtener datos del libro de la solicitud
                    const { data: sol } = await supabase
                        .from('solicitudes_libros')
                        .select('ejemplar_id, ejemplares(numero_ejemplar, libros(titulo, autor, clasificacion))')
                        .eq('id', id)
                        .single();

                    const libro = sol?.ejemplares?.libros;
                    const detalles = [];
                    if (libro) {
                        detalles.push({ label: 'Título', value: libro.titulo || '-' });
                        detalles.push({ label: 'Autor', value: libro.autor || '-' });
                        detalles.push({ label: 'Clasificación', value: libro.clasificacion || '-' });
                    }
                    if (sol?.ejemplares?.numero_ejemplar) {
                        detalles.push({ label: 'Ejemplar #', value: String(sol.ejemplares.numero_ejemplar) });
                    }

                    const esAprobada = estadoNumero === 2;
                    const estatusTexto = esAprobada ? 'Aprobada' : 'Rechazada';
                    const fechaLimiteTexto = fechaLimiteRecoleccion
                        ? formatearFechaMexico(fechaLimiteRecoleccion)
                        : '-';

                    if (esAprobada) {
                        detalles.push({ label: 'Fecha límite', value: fechaLimiteTexto });
                    } else if (motivo) {
                        detalles.push({ label: 'Motivo rechazo', value: motivo });
                    }

                    const html = plantillaCorreo({
                        titulo: `Solicitud ${estatusTexto}`,
                        mensaje: esAprobada
                            ? 'Tu solicitud de libro ha sido <b>aprobada</b>. Tienes 1 día hábil para pasar a biblioteca a recoger el libro.'
                            : `Tu solicitud de libro ha sido <b>rechazada</b>. ${motivo ? `Motivo: ${motivo}` : ''}`,
                        nombre,
                        boleta: String(boletaUser),
                        grupo,
                        detalles,
                        estado: estatusTexto,
                        estadoColor: esAprobada ? '#22c55e' : '#ef4444',
                        color: esAprobada ? '#22c55e' : '#ef4444',
                    });

                    await enviarCorreo(
                        alumno.correo,
                        `Solicitud ${estatusTexto} - C-Book`,
                        html
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
            // Enviar correo con fecha límite de devolución
            try {
                const supabase = getClient();
                // Obtener solicitud para saber la boleta real
                const { data: sol } = await supabase
                    .from('solicitudes_libros')
                    .select('usuario_boleta, ejemplares(numero_ejemplar, libros(titulo, autor, clasificacion))')
                    .eq('id', id)
                    .single();

                const boletaReal = sol?.usuario_boleta || boletaValidacion || boleta;

                if (boletaReal) {
                    const { data: alumno } = await supabase
                        .from('usuarios_web_movil')
                        .select('correo, boletas(nombre, Grupo)')
                        .eq('boleta', boletaReal)
                        .single();

                    if (alumno?.correo) {
                        const nombre = alumno.boletas?.nombre || '-';
                        const grupo = alumno.boletas?.Grupo || '-';

                        // Obtener préstamo recién creado
                        const { data: prestamo } = await supabase
                            .from('prestamos_libros')
                            .select('fecha_inicio_prestamo, fecha_limite_devolucion')
                            .eq('solicitud_id', id)
                            .single();

                        const libroData = sol?.ejemplares?.libros;
                        const detalles = [];
                        if (libroData) {
                            detalles.push({ label: 'Título', value: libroData.titulo || '-' });
                            detalles.push({ label: 'Autor', value: libroData.autor || '-' });
                        }
                        if (sol?.ejemplares?.numero_ejemplar) {
                            detalles.push({ label: 'Ejemplar #', value: String(sol.ejemplares.numero_ejemplar) });
                        }
                        if (prestamo?.fecha_inicio_prestamo) {
                            detalles.push({ label: 'Fecha de entrega', value: formatearFechaMexico(prestamo.fecha_inicio_prestamo) });
                        }
                        if (prestamo?.fecha_limite_devolucion) {
                            detalles.push({ label: 'Fecha límite devolución', value: formatearFechaMexico(prestamo.fecha_limite_devolucion) });
                        }

                        const html = plantillaCorreo({
                            titulo: 'Libro Entregado',
                            mensaje: 'Tu libro ha sido entregado exitosamente. Recuerda devolverlo antes de la fecha límite para evitar sanciones.',
                            nombre,
                            boleta: String(boletaReal),
                            grupo,
                            detalles,
                            estado: 'Entregado',
                            estadoColor: '#22c55e',
                            color: '#6366f1',
                        });

                        enviarCorreo(alumno.correo, 'Libro Entregado - C-Book', html)
                            .catch(e => console.error('Error al enviar correo de entrega:', e));
                    }
                }
            } catch (emailErr) {
                console.error('Error enviando correo de entrega:', emailErr);
            }

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
            // Enviar correo de devolución
            try {
                const supabase = getClient();
                const { data: prestamo } = await supabase
                    .from('prestamos_libros')
                    .select(`fecha_inicio_prestamo, fecha_limite_devolucion, fecha_devolucion_real,
                        solicitudes_libros (
                            usuario_boleta,
                            ejemplares ( numero_ejemplar, libros ( titulo, autor ) )
                        )`)
                    .eq('id', id)
                    .single();

                const boletaPrestamo = prestamo?.solicitudes_libros?.usuario_boleta;
                if (boletaPrestamo) {
                    const { data: alumno } = await supabase
                        .from('usuarios_web_movil')
                        .select('correo, boletas(nombre, Grupo)')
                        .eq('boleta', boletaPrestamo)
                        .single();

                    if (alumno?.correo) {
                        const libroData = prestamo?.solicitudes_libros?.ejemplares?.libros;
                        const detalles = [];
                        if (libroData) {
                            detalles.push({ label: 'Título', value: libroData.titulo || '-' });
                            detalles.push({ label: 'Autor', value: libroData.autor || '-' });
                        }
                        if (prestamo?.solicitudes_libros?.ejemplares?.numero_ejemplar) {
                            detalles.push({ label: 'Ejemplar #', value: String(prestamo.solicitudes_libros.ejemplares.numero_ejemplar) });
                        }
                        if (prestamo?.fecha_inicio_prestamo) {
                            detalles.push({ label: 'Fecha préstamo', value: formatearFechaMexico(prestamo.fecha_inicio_prestamo) });
                        }
                        detalles.push({ label: 'Fecha devolución', value: formatearFechaMexico(fechaDevolucionReal) });

                        const html = plantillaCorreo({
                            titulo: 'Libro Devuelto',
                            mensaje: 'Tu libro ha sido devuelto correctamente. ¡Gracias por cumplir con la devolución!',
                            nombre: alumno.boletas?.nombre || '-',
                            boleta: String(boletaPrestamo),
                            grupo: alumno.boletas?.Grupo || '-',
                            detalles,
                            estado: 'Devuelto',
                            estadoColor: '#8b5cf6',
                            color: '#8b5cf6',
                        });

                        enviarCorreo(alumno.correo, 'Libro Devuelto - C-Book', html)
                            .catch(e => console.error('Error al enviar correo de devolución:', e));
                    }
                }
            } catch (emailErr) {
                console.error('Error enviando correo de devolución:', emailErr);
            }

            return res.status(200).json({ success: true, message: 'Préstamo marcado como devuelto.' });
        }

        return res.status(400).json(resultado);
    } catch (error) {
        console.error("Error marcando préstamo devuelto:", error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
}


// ==================== BOLETAS (CATÁLOGO DE ALUMNOS) ====================

const BOLETA_FORMAT_RE = /^\d{10}$/;
const GRUPO_FORMAT_RE = /^\d[A-Z]{2,4}\d?[A-Z]?$/;

async function obtenerBoletas(req, res) {
    try {
        const resultado = await ObtenerBoletas();
        if (resultado.success) return res.status(200).json(resultado);
        return res.status(400).json(resultado);
    } catch (error) {
        console.error('Error en obtenerBoletas:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function crearBoleta(req, res) {
    try {
        const { boleta, nombre, Grupo } = req.body;

        const boletaStr = String(boleta ?? '').trim();
        const nombreTrim = String(nombre ?? '').trim();
        const grupoTrim = String(Grupo ?? '').trim().toUpperCase();

        if (!BOLETA_FORMAT_RE.test(boletaStr)) {
            return res.status(400).json({ success: false, message: 'La boleta debe tener exactamente 10 dígitos numéricos' });
        }
        if (!nombreTrim) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }
        if (!GRUPO_FORMAT_RE.test(grupoTrim)) {
            return res.status(400).json({ success: false, message: 'El grupo debe tener el formato correcto (ej: 6CM1, 7IM3A)' });
        }

        const supabaseClient = require('../config/db').getClient();
        const { data: existente } = await supabaseClient
            .from('boletas')
            .select('boleta')
            .eq('boleta', parseInt(boletaStr, 10))
            .maybeSingle();

        if (existente) {
            return res.status(409).json({ success: false, message: 'Ya existe una boleta con ese número' });
        }

        const resultado = await CrearBoleta({
            boleta: parseInt(boletaStr, 10),
            nombre: nombreTrim.toUpperCase(),
            Grupo: grupoTrim,
        });

        if (resultado.success) return res.status(201).json(resultado);
        return res.status(400).json(resultado);
    } catch (error) {
        console.error('Error en crearBoleta:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function actualizarBoleta(req, res) {
    try {
        const { boleta: boletaParam } = req.params;
        const { nombre, Grupo } = req.body;

        const boletaNum = parseInt(boletaParam, 10);
        if (!boletaParam || Number.isNaN(boletaNum)) {
            return res.status(400).json({ success: false, message: 'Boleta inválida' });
        }

        const nombreTrim = String(nombre ?? '').trim();
        const grupoTrim = String(Grupo ?? '').trim().toUpperCase();

        if (!nombreTrim) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }
        if (!GRUPO_FORMAT_RE.test(grupoTrim)) {
            return res.status(400).json({ success: false, message: 'El grupo debe tener el formato correcto (ej: 6CM1, 7IM3A)' });
        }

        const resultado = await ActualizarBoleta(boletaNum, {
            nombre: nombreTrim.toUpperCase(),
            Grupo: grupoTrim,
        });

        if (resultado.success) return res.status(200).json(resultado);
        return res.status(400).json(resultado);
    } catch (error) {
        console.error('Error en actualizarBoleta:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function eliminarBoleta(req, res) {
    try {
        const { boleta: boletaParam } = req.params;
        const boletaNum = parseInt(boletaParam, 10);

        if (!boletaParam || Number.isNaN(boletaNum)) {
            return res.status(400).json({ success: false, message: 'Boleta inválida' });
        }

        const resultado = await EliminarBoleta(boletaNum);

        if (resultado.success) return res.status(200).json(resultado);
        // 409 if blocked by existing user
        return res.status(resultado.message.includes('cuenta registrada') ? 409 : 400).json(resultado);
    } catch (error) {
        console.error('Error en eliminarBoleta:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function previewCargaMasiva(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
        }

        const { parsePDF, parseCSV, parseXLSX } = require('../utils/parserAlumnos');
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();

        let parsedRows = [];
        try {
            if (ext === '.pdf' || mime === 'application/pdf') {
                parsedRows = await parsePDF(file.buffer);
            } else if (ext === '.csv' || mime === 'text/csv' || mime === 'application/csv') {
                parsedRows = parseCSV(file.buffer);
            } else if (['.xlsx', '.xls'].includes(ext) || mime.includes('spreadsheetml') || mime.includes('ms-excel')) {
                parsedRows = parseXLSX(file.buffer);
            } else {
                return res.status(400).json({ success: false, message: 'Formato no soportado. Use PDF, CSV o XLSX.' });
            }
        } catch (parseError) {
            console.error('Error parseando archivo:', parseError);
            return res.status(400).json({ success: false, message: 'Error al procesar el archivo: ' + parseError.message });
        }

        // Batch-check which boletas already exist
        const potentialNums = parsedRows
            .filter(r => BOLETA_FORMAT_RE.test(String(r.boleta)))
            .map(r => parseInt(String(r.boleta), 10));

        const existingResult = await BoletasExistentes(potentialNums);
        const existingSet = new Set(existingResult.data || []);

        const rows = parsedRows.map(r => {
            const boletaStr = String(r.boleta ?? '').trim();
            const nombre = String(r.nombre ?? '').trim();
            const grupo = String(r.Grupo ?? r.grupo ?? '').trim().toUpperCase();

            const isValidFormat = BOLETA_FORMAT_RE.test(boletaStr) && nombre.length > 0 && GRUPO_FORMAT_RE.test(grupo);

            if (!isValidFormat) {
                return { boleta: boletaStr, nombre, Grupo: grupo, status: 'invalid' };
            }

            const boletaNum = parseInt(boletaStr, 10);
            return {
                boleta: boletaNum,
                nombre,
                Grupo: grupo,
                status: existingSet.has(boletaNum) ? 'duplicate' : 'valid',
            };
        });

        const summary = {
            valid: rows.filter(r => r.status === 'valid').length,
            duplicate: rows.filter(r => r.status === 'duplicate').length,
            invalid: rows.filter(r => r.status === 'invalid').length,
        };

        return res.status(200).json({ success: true, rows, summary, fileName: file.originalname });
    } catch (error) {
        console.error('Error en previewCargaMasiva:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
}

async function confirmarCargaMasiva(req, res) {
    try {
        const { rows, overwriteDuplicates = false } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay filas para importar' });
        }

        const validRows = rows
            .filter(r => BOLETA_FORMAT_RE.test(String(r.boleta)) && r.nombre && r.Grupo)
            .map(r => ({
                boleta: parseInt(String(r.boleta), 10),
                nombre: String(r.nombre).trim().toUpperCase(),
                Grupo: String(r.Grupo).trim().toUpperCase(),
            }));

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay filas con formato válido para importar' });
        }

        // Pre-check which already exist so we can report accurate counts
        const boletaNums = validRows.map(r => r.boleta);
        const existingResult = await BoletasExistentes(boletaNums);
        const existingSet = new Set(existingResult.data || []);

        const inserted = validRows.filter(r => !existingSet.has(r.boleta)).length;
        const dupCount = validRows.filter(r => existingSet.has(r.boleta)).length;
        const updated = overwriteDuplicates ? dupCount : 0;
        const skipped = overwriteDuplicates ? 0 : dupCount;

        const resultado = await BulkUpsertBoletas(validRows, overwriteDuplicates);

        if (!resultado.success) return res.status(400).json(resultado);

        return res.status(200).json({ success: true, inserted, updated, skipped });
    } catch (error) {
        console.error('Error en confirmarCargaMasiva:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
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
    marcarPrestamoDevuelto,
    obtenerBoletas,
    crearBoleta,
    actualizarBoleta,
    eliminarBoleta,
    previewCargaMasiva,
    confirmarCargaMasiva,
};