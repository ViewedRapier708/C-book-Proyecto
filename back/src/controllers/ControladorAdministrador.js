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