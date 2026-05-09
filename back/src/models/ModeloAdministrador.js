const {getClient} = require("../config/db");

const supabase = getClient();

const DEFAULT_LIMIT = 25;

function resolvePagination({ page = 1, limit = DEFAULT_LIMIT } = {}) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;
    return { page: safePage, limit: safeLimit, from, to };
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




  async function CrearGuardarropa(ocupado, estado) {
     try {
        const { data, error } = await supabase
            .from('guardarropas')
                .insert([{ ocupado, estado }])
            .select();
        if (error) {
            console.error("Error creando guardarropa:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno creando guardarropa:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}//Para despues



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
        const { page, limit, from, to } = resolvePagination(pagination);

        const { count, error: countError } = await supabase
            .from('ejemplares')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error obteniendo total libros:', countError);
            return { success: false, message: countError.message };
        }

        const { data, error } = await supabase
            .from('ejemplares')
            .select(
                `
                id,
                libro_id,
                codigo_barras,
                numero_ejemplar,
                anio,
                estatus_item,
                "Disponible",
                coleccion,
                libros (
                    id,
                    titulo,
                    autor,
                    clasificacion,
                    isbn,
                    tipo_material
                )
                `
            )
            .range(from, to);

        if (error) {
            console.error('Error obteniendo libros:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data, total: count, page, limit };
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

async function ObtenerUsuarios(pagination) {
    try {
        const { page, limit, from, to } = resolvePagination(pagination);

        const { count, error: countError } = await supabase
            .from('usuarios_web_movil')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error obteniendo total usuarios:', countError);
            return { success: false, message: countError.message };
        }

        const { data, error } = await supabase
            .from('usuarios_web_movil')
            .select('*')
            .range(from, to);

        if (error) {
            console.error('Error obteniendo usuarios:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data, total: count, page, limit };
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
                fecha_limite_devolucion: fechaLimite
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
        return { success: true, data };
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
                solicitudes_libros (
                    id,
                    ejemplares (id)
                )
            `)
            .eq('id', idPrestamo)
            .single();

        if (errorPrestamo || !prestamo) {
            return { success: false, message: errorPrestamo?.message || 'Préstamo no encontrado' };
        }

        if (Number(prestamo.estado_prestamo_id) === 3) {
            return { success: true };
        }

        const updateData = {
            estado_prestamo_id: 3,
            fecha_devolucion_real: fechaDevolucionReal ?? new Date()
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
        const { data: boletas, error: boletasError } = await supabase
            .from('boletas')
            .select('boleta, nombre, Grupo')
            .order('boleta', { ascending: true });

        if (boletasError) {
            console.error('Error obteniendo boletas:', boletasError);
            return { success: false, message: boletasError.message };
        }

        const { data: usuarios, error: usersError } = await supabase
            .from('usuarios_web_movil')
            .select('boleta');

        if (usersError) {
            console.error('Error obteniendo usuarios para boletas:', usersError);
            return { success: false, message: usersError.message };
        }

        const registradas = new Set((usuarios || []).map(u => u.boleta));

        const data = (boletas || []).map(b => ({
            ...b,
            registrado: registradas.has(b.boleta),
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

module.exports = {
    CrearLibro,
    CrearEjemplar,
    CrearGuardarropa,
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
};