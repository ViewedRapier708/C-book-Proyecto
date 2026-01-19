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

  async function CrearComputadora(procesador, programas, carrera, Disponible = true, En_funcionamiento = true, Observacion = 'N/A', no_inventario, no_computadora) {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .insert([{ procesador, programas, carrera, Disponible, En_funcionamiento, Observacion, no_inventario, no_computadora }])
            .select();
        if (error) {
            console.error("Error creando computadora:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno creando computadora:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

  async function CrearRestirador(Disponible = true, estado_de_material = true, Observacion = 'N/A', no_inventario, no_restirador) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .insert([{ Disponible, estado_de_material, Observacion, no_inventario, no_restirador }])
            .select();
        if (error) {
            console.error("Error creando restirador:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno creando restirador:", error);
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

  async function eliminarComputadora(id) {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .delete()
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error eliminando computadora:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno eliminando computadora:", error);
        return { success: false, message: 'Error interno del servidor' };
    }   
}

  async function eliminarRestirador(id) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .delete()
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error eliminando restirador:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno eliminando restirador:", error);
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

  async function actualizarDatosComputadora(id, procesador, programas, carrera, Disponible, En_funcionamiento, Observacion, no_inventario, no_computadora) {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .update({ procesador, programas, carrera, Disponible, En_funcionamiento, Observacion, no_inventario, no_computadora })
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error actualizando computadora:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno actualizando computadora:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

  async function actualizarDatosRestirador(id, Disponible, estado_de_material, Observacion, no_inventario, no_restirador) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .update({ Disponible, estado_de_material, Observacion, no_inventario, no_restirador })
            .eq('id', id)
            .select();
        if (error) {
            console.error("Error actualizando restirador:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno actualizando restirador:", error);
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
        case 'computadoras':
            return await obtenerComputadoras(pagination);
        case 'restiradores':
            return await obtenerRestiradores(pagination);
        case 'guardarropas':
            return await obtenerGuardarropas(pagination);
        default:
            return { success: false, message: 'Tipo de material no válido' };
    }
}

async function obtenerComputadoras(pagination) {
    try {
        const { page, limit, from, to } = resolvePagination(pagination);

        const { count, error: countError } = await supabase
            .from('computadoras')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error obteniendo total computadoras:', countError);
            return { success: false, message: countError.message };
        }

        const { data, error } = await supabase
            .from('computadoras')
            .select('*')
            .range(from, to);

        if (error) {
            console.error('Error obteniendo computadora:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data, total: count, page, limit };
    } catch (error) {
        console.error('Error interno obteniendo computadora:', error);
        return { success: false, message: 'Error interno del servidor' };
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

async function obtenerRestiradores(pagination) {
    try {
        const { page, limit, from, to } = resolvePagination(pagination);

        const { count, error: countError } = await supabase
            .from('restiradores')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error obteniendo total restiradores:', countError);
            return { success: false, message: countError.message };
        }

        const { data, error } = await supabase
            .from('restiradores')
            .select('*')
            .range(from, to);

        if (error) {
            console.error('Error obteniendo restirador:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data: data, total: count, page, limit };
    } catch (error) {
        console.error('Error interno obteniendo restirador:', error);
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

//Aceptacion de las solicitudes del usuario

//Aceptacion de documentacion del usuario
module.exports = {
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
    ObtenerMateriales,
    ObtenerUsuarios,
    HabilitarDocumentacionUsuario,
    obtenerComputadoras,
    obtenerLibros,
    obtenerRestiradores,
    obtenerGuardarropas
};