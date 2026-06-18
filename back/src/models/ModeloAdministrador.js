const {getClient} = require("../config/db");

const supabase = getClient();

const DEFAULT_LIMIT = 25;
const FETCH_BATCH_SIZE = 1000;
const PROTECTED_BOLETAS = new Set([10000000001, 1000000001]);

function resolvePagination({ page = 1, limit = DEFAULT_LIMIT, all = false } = {}) {
    const fetchAll = all || limit === 0;
    const safePage = fetchAll ? 1 : (Number.isFinite(page) && page > 0 ? page : 1);
    const safeLimit = fetchAll ? 0 : (Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT);
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;
    return { page: safePage, limit: safeLimit, from, to, all: fetchAll };
}

async function getMatchingLibroIds({ q = '', tipo_material = '' } = {}) {
    const search = String(q || '').trim();
    const tipo = String(tipo_material || '').trim();

    if (!search && !tipo) {
        return null;
    }

    const buildQuery = (options) => {
        let query = supabase
            .from('libros')
            .select('id', options);

        if (search) {
            const term = `%${search}%`;
            query = query.or(`titulo.ilike.${term},autor.ilike.${term},isbn.ilike.${term},clasificacion.ilike.${term}`);
        }

        if (tipo) {
            query = query.eq('tipo_material', tipo);
        }

        return query;
    };

    const { count, error: countError } = await buildQuery({ count: 'exact', head: true });

    if (countError) {
        console.error('Error contando busqueda de libros:', countError);
        return { success: false, message: 'Error al buscar libros' };
    }

    const result = await fetchRowsInBatches(buildQuery, count || 0);

    if (!result.success) {
        console.error('Error buscando libros:', result.message);
        return { success: false, message: 'Error al buscar libros' };
    }

    return { success: true, ids: result.data.map((row) => row.id) };
}

function applyEjemplarFilters(query, { libroIds, disponible } = {}) {
    if (Array.isArray(libroIds)) {
        query = query.in('libro_id', libroIds);
    }

    if (disponible !== undefined && disponible !== '') {
        query = query.eq('Disponible', disponible === true || disponible === 'true' || disponible === 'si');
    }

    return query;
}

async function fetchRowsInBatches(buildQuery, total) {
    if (!total || total <= 0) {
        return { success: true, data: [] };
    }

    const rows = [];

    for (let start = 0; start < total; start += FETCH_BATCH_SIZE) {
        const end = Math.min(start + FETCH_BATCH_SIZE - 1, total - 1);
        const { data, error } = await buildQuery().range(start, end);

        if (error) {
            return { success: false, message: error.message };
        }

        rows.push(...(data || []));
    }

    return { success: true, data: rows };
}

function esBoletaProtegida(boleta) {
    const boletaNum = Number(boleta);
    return Number.isFinite(boletaNum) && PROTECTED_BOLETAS.has(boletaNum);
}

function normalizarGrupo(grupo) {
    return String(grupo ?? '').trim().toUpperCase();
}

function esGrupoAdminProtegido(grupo) {
    return ['ADMIN', 'ADMINISTRADOR'].includes(normalizarGrupo(grupo));
}

// ==================== MODELO ADMINISTRADOR ====================

    async function CrearLibro(titulo, clasificacion, isbn, tipo_material, autor) {
    try {
        const { data, error } = await supabase
            .from('libros')
                        .insert([{ titulo, clasificacion, isbn, tipo_material, autor }])
            .select();
        if (error) {
            console.error("Error creando libro:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno creando libro:", error);
        return { success: false, message: 'Error interno del servidor' };
    }

}

async function CrearEjemplar(libro_id, codigo_barras, numero_ejemplar, anio, estatus_item, Disponible = true, coleccion) {
    try {
        const { data, error } = await supabase
            .from('ejemplares')
            .insert([
                {
                    libro_id,
                    codigo_barras,
                    numero_ejemplar,
                    anio,
                    estatus_item,
                    Disponible,
                    coleccion
                }
            ])
            .select();

        if (error) {
            console.error('Error creando ejemplar:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data };
    } catch (error) {
        console.error('Error interno creando ejemplar:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}




  async function eliminarLibro(id) {
    try {
        const { data, error } = await supabase
            .from('ejemplares')
            .delete()
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error eliminando libro:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno eliminando libro:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function eliminarGuardarropa(id) {
    try {
        const { data, error } = await supabase
            .from('guardarropas')
            .delete()
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error eliminando guardarropa:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno eliminando guardarropa:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}



  async function actualizarDatosLibro(id, titulo, clasificacion, isbn, tipo_material, autor) {
    try {
        const { data, error } = await supabase
            .from('libros')
            .update({ titulo, clasificacion, isbn, tipo_material, autor })
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error actualizando libro:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno actualizando libro:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function actualizarDatosEjemplar(id, codigo_barras, numero_ejemplar, anio, estatus_item, Disponible, coleccion) {
    try {
        const { data, error } = await supabase
            .from('ejemplares')
            .update({ codigo_barras, numero_ejemplar, anio, estatus_item, Disponible, coleccion })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error actualizando ejemplar:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data };
    } catch (error) {
        console.error('Error interno actualizando ejemplar:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}
//Obtencion de los materiales
async function ObtenerMateriales(tipo, pagination = {}) {
    switch (tipo) {
        case 'libros':
            return await obtenerLibros(pagination);
        case 'guardarropas':
            return await obtenerGuardarropas(pagination);
        default:
            return { success: false, message: 'Tipo de material no válido' };
    }
}



async function obtenerLibros(pagination) {
    try {
        const { page, limit, from, to, all } = resolvePagination(pagination);
        const matching = await getMatchingLibroIds(pagination);

        if (matching && !matching.success) {
            return matching;
        }

        const libroIds = matching?.ids;

        if (Array.isArray(libroIds) && libroIds.length === 0) {
            return { success: true, data: [], total: 0, page: 1, limit: all ? 0 : limit };
        }

        const { count, error: countError } = await applyEjemplarFilters(supabase
            .from('ejemplares')
            .select('*', { count: 'exact', head: true }), {
                libroIds,
                disponible: pagination.disponible,
            });

        if (countError) {
            console.error('Error obteniendo total libros:', countError);
            return { success: false, message: countError.message };
        }

        const buildQuery = () => applyEjemplarFilters(supabase
            .from('ejemplares')
            .select('id, libro_id, codigo_barras, numero_ejemplar, anio, estatus_item, "Disponible", coleccion, libros(id, titulo, autor, clasificacion, isbn, tipo_material)')
            .order('id', { ascending: true }), {
                libroIds,
                disponible: pagination.disponible,
            });

        let data = [];

        if (all) {
            const result = await fetchRowsInBatches(buildQuery, count || 0);
            if (!result.success) {
                console.error('Error obteniendo libros:', result.message);
                return result;
            }
            data = result.data;
        } else {
            const { data: pagedData, error } = await buildQuery().range(from, to);
            if (error) {
                console.error('Error obteniendo libros:', error);
                return { success: false, message: error.message };
            }
            data = pagedData || [];
        }

        return { success: true, data, total: count, page: all ? 1 : page, limit: all ? count : limit };
    } catch (error) {
        console.error('Error interno obteniendo libro:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}


  async function obtenerGuardarropas(pagination) {
    try {
        const { page, limit, from, to } = resolvePagination(pagination);

        const { count, error: countError } = await supabase
            .from('guardarropas')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error obteniendo total guardarropas:', countError);
            return { success: false, message: countError.message };
        }

        const { data, error } = await supabase
            .from('guardarropas')
            .select('*')
            .range(from, to)
        if (error) {
            console.error("Error obteniendo guardarropa:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data, total: count, page, limit };
    } catch (error) {
        console.error("Error interno obteniendo guardarropa:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function ObtenerUsuarios(pagination = {}, filters = {}) {
    try {
        const { page, limit, from, to, all } = resolvePagination(pagination);
        const rol = String(filters.rol ?? '').trim();

        let countQuery = supabase
            .from('usuarios_web_movil')
            .select('*', { count: 'exact', head: true });

        if (rol) {
            countQuery = countQuery.eq('rol', rol);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('Error obteniendo total usuarios:', countError);
            return { success: false, message: countError.message };
        }

        const buildQuery = () => {
            let query = supabase
                .from('usuarios_web_movil')
                .select('*')
                .order('boleta', { ascending: true });

            if (rol) {
                query = query.eq('rol', rol);
            }

            return query;
        };

        let data = [];

        if (all) {
            const result = await fetchRowsInBatches(buildQuery, count || 0);
            if (!result.success) {
                console.error('Error obteniendo usuarios:', result.message);
                return result;
            }
            data = result.data;
        } else {
            const { data: pagedData, error } = await buildQuery().range(from, to);

            if (error) {
                console.error('Error obteniendo usuarios:', error);
                return { success: false, message: error.message };
            }

            data = pagedData || [];
        }

        return { success: true, data, total: count, page: all ? 1 : page, limit: all ? count : limit };
    } catch (error) {
        console.error('Error interno obteniendo usuarios:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function HabilitarDocumentacionUsuario(id) {
    try {
        const { data, error } = await supabase
            .from('usuarios_web_movil')
            .update({ tiene_documentos: true })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Error habilitando documentación:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data };
    } catch (error) {
        console.error('Error interno habilitando documentación:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// ==================== SOLICITUDES Y PRÉSTAMOS ====================

async function ObtenerSolicitudesLibros() {
    try {
        // Historial completo de solicitudes
        const { data, error } = await supabase
            .from('solicitudes_libros')
            .select(`
                id,
                fecha_solicitud,
                fecha_limite_respuesta,
                fecha_limite_recoleccion,
                usuario_boleta,
                estado_asistencia_id,
                usuarios_web_movil (
                    boleta,
                    correo,
                    tiene_documentos,
                    boletas (boleta, nombre, Grupo)
                ),
                prestamos_libros (
                    id,
                    estado_prestamo_id
                ),
                ejemplares (
                    id,
                    numero_ejemplar,
                    libros (titulo, autor)
                )
            `)
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error obteniendo solicitudes:", error);
        return { success: false, message: error.message };
    }
}

async function ActualizarEstadoSolicitudLibro(idSolicitud, nuevoEstado, motivo = null, fechaLimiteRecoleccion = null, fechaAprobacion = null) {
    try {
        const updateData = { estado_asistencia_id: nuevoEstado };
        if (nuevoEstado === 2) { // Aprobada
            updateData.fecha_aprobacion = fechaAprobacion ?? new Date();
            if (fechaLimiteRecoleccion) {
                updateData.fecha_limite_recoleccion = fechaLimiteRecoleccion;
            }
        } else if (nuevoEstado === 3) { // Rechazada
            updateData.fecha_rechazo = new Date();
            updateData.motivo_rechazo = motivo;
        }

        const { error } = await supabase
            .from('solicitudes_libros')
            .update(updateData)
            .eq('id', idSolicitud);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error actualizando solicitud:", error);
        return { success: false, message: error.message };
    }
}

async function EntregarLibro(idSolicitud, boleta, idEjemplar) {
    try {
        const fechaInicio = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaInicio.getDate() + 3); // 3 días de préstamo

        // 1. Crear Préstamo
        const { error: errorPrestamo } = await supabase
            .from('prestamos_libros')
            .insert([{
                solicitud_id: idSolicitud,
                estado_prestamo_id: 2, // Recogido / Activo
                fecha_inicio_prestamo: fechaInicio,
                fecha_limite_devolucion: fechaLimite,
                fecha_devolucion_real: null
            }]);

        if (errorPrestamo) throw errorPrestamo;

        // 2. Actualizar Solicitud a "Entregado" (Digamos estado 4, o dejar en 2?)
        // Vamos a ponerlo en un estado que signifique "Ya se entregó".
        await supabase
            .from('solicitudes_libros')
            .update({ estado_asistencia_id: 5}) 
            .eq('id', idSolicitud);

        return { success: true };
    } catch (error) {
        console.error("Error entregando libro:", error);
        return { success: false, message: error.message };
    }
}

function normalizarFechaDevolucion(fechaInicioPrestamo, fechaDevolucionReal = null) {
    const fechaInicio = fechaInicioPrestamo ? new Date(fechaInicioPrestamo) : null;
    const fechaDevolucion = fechaDevolucionReal ? new Date(fechaDevolucionReal) : new Date();

    if (fechaInicio && !Number.isNaN(fechaInicio.getTime()) && fechaDevolucion < fechaInicio) {
        return fechaInicio;
    }

    return fechaDevolucion;
}

async function ObtenerPrestamosLibros() {
    try {
        const { data, error } = await supabase
            .from('prestamos_libros')
            .select(`
                id,
                fecha_inicio_prestamo,
                fecha_limite_devolucion,
                fecha_devolucion_real,
                observaciones,
                estado_prestamo_id,
                solicitudes_libros (
                    id,
                    usuario_boleta,
                    usuarios_web_movil (
                        boleta,
                        correo,
                        tiene_documentos,
                        boletas (boleta, nombre, Grupo)
                    ),
                    ejemplares (
                        id,
                        numero_ejemplar,
                        libros (titulo, autor)
                    )
                )
            `);
           
        if (error) throw error;

        const ordenados = (data || []).sort((a, b) => {
            const prioridadEstado = (estadoId) => {
                const estado = Number(estadoId);
                if (estado === 1 || estado === 2) return 0; // Activos
                if (estado === 3) return 2; // Completados / devueltos
                return 1;
            };

            const prioridadA = prioridadEstado(a.estado_prestamo_id);
            const prioridadB = prioridadEstado(b.estado_prestamo_id);

            if (prioridadA !== prioridadB) {
                return prioridadA - prioridadB;
            }

            return new Date(b.fecha_inicio_prestamo || 0) - new Date(a.fecha_inicio_prestamo || 0);
        });

        return { success: true, data: ordenados };
    } catch (error) {
        console.error("Error obteniendo prestamos:", error);
        return { success: false, message: error.message };
    }
}

async function MarcarPrestamoDevuelto(idPrestamo, fechaDevolucionReal = null, observaciones = null) {
    try {
        const { data: prestamo, error: errorPrestamo } = await supabase
            .from('prestamos_libros')
            .select(`
                id,
                estado_prestamo_id,
                fecha_inicio_prestamo,
                solicitudes_libros (
                    id,
                    ejemplares (id)
                )
            `)
            .eq('id', idPrestamo)
            .single();
console.log(prestamo, errorPrestamo)
        if (errorPrestamo || !prestamo) {
            return { success: false, message: errorPrestamo?.message || 'Préstamo no encontrado' };
        }

        if (Number(prestamo.estado_prestamo_id) === 3) {
            return { success: true };
        }

        const updateData = {
            estado_prestamo_id: 3,
            fecha_devolucion_real: normalizarFechaDevolucion(prestamo.fecha_inicio_prestamo, fechaDevolucionReal)
        };

        if (observaciones !== undefined) {
            updateData.observaciones = observaciones;
        }

        const { error: errorUpdate } = await supabase
            .from('prestamos_libros')
            .update(updateData)
            .eq('id', idPrestamo);

        if (errorUpdate) throw errorUpdate;

        const ejemplarId = prestamo.solicitudes_libros?.ejemplares?.id;
        if (ejemplarId) {
            const { error: errorEjemplar } = await supabase
                .from('ejemplares')
                .update({ Disponible: true })
                .eq('id', ejemplarId);

            if (errorEjemplar) throw errorEjemplar;
        }

        return { success: true };
    } catch (error) {
        console.error("Error marcando préstamo devuelto:", error);
        return { success: false, message: error.message };
    }
}

// ==================== BOLETAS (CATÁLOGO DE ALUMNOS) ====================

async function ObtenerBoletas() {
    try {
        const { count: boletaCount, error: countError } = await supabase
            .from('boletas')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error contando boletas:', countError);
            return { success: false, message: countError.message };
        }

        const boletasResult = await fetchRowsInBatches(
            () => supabase
                .from('boletas')
                .select('boleta, nombre, Grupo')
                .order('boleta', { ascending: true }),
            boletaCount || 0
        );

        if (!boletasResult.success) {
            console.error('Error obteniendo boletas:', boletasResult.message);
            return boletasResult;
        }

        const { count: usuariosCount, error: usersCountError } = await supabase
            .from('usuarios_web_movil')
            .select('*', { count: 'exact', head: true });

        if (usersCountError) {
            console.error('Error contando usuarios para boletas:', usersCountError);
            return { success: false, message: usersCountError.message };
        }

        const usuariosResult = await fetchRowsInBatches(
            () => supabase
                .from('usuarios_web_movil')
                .select('boleta'),
            usuariosCount || 0
        );

        if (!usuariosResult.success) {
            console.error('Error obteniendo usuarios para boletas:', usuariosResult.message);
            return usuariosResult;
        }

        const registradas = new Set((usuariosResult.data || []).map(u => u.boleta));

        const data = (boletasResult.data || [])
            .filter((boleta) => !esBoletaProtegida(boleta.boleta) && !esGrupoAdminProtegido(boleta.Grupo))
            .map((boleta) => ({
                ...boleta,
                registrado: registradas.has(boleta.boleta),
            }));

        return { success: true, data, total: data.length };
    } catch (error) {
        console.error('Error interno en ObtenerBoletas:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function CrearBoleta({ boleta, nombre, Grupo }) {
    try {
        const { data, error } = await supabase
            .from('boletas')
            .insert([{ boleta, nombre, Grupo }])
            .select();

        if (error) {
            console.error('Error creando boleta:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error interno creando boleta:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function ActualizarBoleta(boleta, { nombre, Grupo }) {
    try {
        const { data, error } = await supabase
            .from('boletas')
            .update({ nombre, Grupo })
            .eq('boleta', boleta)
            .select();

        if (error) {
            console.error('Error actualizando boleta:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error interno actualizando boleta:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function EliminarBoleta(boleta) {
    try {
        const { data: usuario } = await supabase
            .from('usuarios_web_movil')
            .select('id')
            .eq('boleta', boleta)
            .maybeSingle();

        if (usuario) {
            return { success: false, message: 'No se puede eliminar: el alumno ya tiene una cuenta registrada en la app' };
        }

        const { error } = await supabase
            .from('boletas')
            .delete()
            .eq('boleta', boleta);

        if (error) {
            console.error('Error eliminando boleta:', error);
            return { success: false, message: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error interno eliminando boleta:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function BulkUpsertBoletas(rows, overwriteDuplicates) {
    try {
        const { data, error } = await supabase
            .from('boletas')
            .upsert(rows, { onConflict: 'boleta', ignoreDuplicates: !overwriteDuplicates })
            .select();

        if (error) {
            console.error('Error en upsert masivo de boletas:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error interno en BulkUpsertBoletas:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function BoletasExistentes(boletasArr) {
    try {
        if (!boletasArr || boletasArr.length === 0) return { success: true, data: [] };

        const { data, error } = await supabase
            .from('boletas')
            .select('boleta')
            .in('boleta', boletasArr);

        if (error) {
            console.error('Error verificando boletas existentes:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: (data || []).map(r => r.boleta) };
    } catch (error) {
        console.error('Error interno en BoletasExistentes:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

const CHUNK_SIZE_QUERY = 1000;
const CHUNK_SIZE_INSERT = 500;

async function consultarEnLotes(tabla, columna, valores) {
    if (!valores || valores.length === 0) return { success: true, data: [] };

    const resultados = [];
    for (let i = 0; i < valores.length; i += CHUNK_SIZE_QUERY) {
        const lote = valores.slice(i, i + CHUNK_SIZE_QUERY);
        const { data, error } = await supabase
            .from(tabla)
            .select(columna)
            .in(columna, lote);

        if (error) {
            console.error(`Error consultando ${tabla}.${columna} en lote:`, error);
            return { success: false, message: error.message };
        }

        resultados.push(...(data || []));
    }

    return { success: true, data: resultados };
}

async function EjemplaresExistentesPorCodigo(codigosArr) {
    try {
        const codigos = (codigosArr || []).filter(Boolean);
        if (codigos.length === 0) return { success: true, data: [] };

        const result = await consultarEnLotes('ejemplares', 'codigo_barras', codigos);
        if (!result.success) return result;
        return { success: true, data: result.data.map(r => r.codigo_barras) };
    } catch (error) {
        console.error('Error interno en EjemplaresExistentesPorCodigo:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

async function BulkCrearLibrosConEjemplares(rows) {
    const inserted = [];

    try {
        for (let i = 0; i < rows.length; i += CHUNK_SIZE_INSERT) {
            const chunk = rows.slice(i, i + CHUNK_SIZE_INSERT);

            const librosData = chunk.map(row => ({
                titulo: row.titulo,
                clasificacion: row.clasificacion,
                isbn: row.isbn || null,
                tipo_material: row.tipo_material,
                autor: row.autor,
            }));

            const { data: createdLibros, error: librosError } = await supabase
                .from('libros')
                .insert(librosData)
                .select();

            if (librosError) {
                console.error('Error creando libros en lote:', librosError);
                return { success: false, message: `Error creando libros: ${librosError.message}`, inserted };
            }

            const ejemplaresData = createdLibros.map((libro, idx) => ({
                libro_id: libro.id,
                codigo_barras: chunk[idx].codigo_barras,
                numero_ejemplar: chunk[idx].numero_ejemplar,
                anio: chunk[idx].anio,
                estatus_item: chunk[idx].estatus_item,
                Disponible: chunk[idx].Disponible ?? true,
                coleccion: chunk[idx].coleccion,
            }));

            const { data: createdEjemplares, error: ejemplaresError } = await supabase
                .from('ejemplares')
                .insert(ejemplaresData, { onConflict: 'codigo_barras', ignoreDuplicates: true })
                .select();

            if (ejemplaresError) {
                console.error('Error creando ejemplares en lote:', ejemplaresError);
                const libroIds = createdLibros.map(l => l.id);
                await supabase.from('libros').delete().in('id', libroIds);
                return { success: false, message: `Error creando ejemplares: ${ejemplaresError.message}`, inserted };
            }

            const ejemplarByBarcode = {};
            for (const ej of createdEjemplares || []) {
                ejemplarByBarcode[ej.codigo_barras] = ej;
            }

            inserted.push(...chunk.map((row, idx) => ({
                libro: createdLibros[idx],
                ejemplar: ejemplarByBarcode[row.codigo_barras] || null,
            })));
        }

        return { success: true, data: inserted };
    } catch (error) {
        console.error('Error interno en BulkCrearLibrosConEjemplares:', error);
        return { success: false, message: 'Error interno del servidor', inserted };
    }
}

module.exports = {
    CrearLibro,
    CrearEjemplar,
    eliminarLibro,
    eliminarGuardarropa,
    actualizarDatosLibro,
    actualizarDatosEjemplar,
    ObtenerMateriales,
    ObtenerUsuarios,
    HabilitarDocumentacionUsuario,
    obtenerLibros,
    obtenerGuardarropas,
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
    EjemplaresExistentesPorCodigo,
    BulkCrearLibrosConEjemplares,
};
