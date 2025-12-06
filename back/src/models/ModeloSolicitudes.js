const { getClient } = require('../config/db');
const supabase = getClient();
const tipos = ['computadora', 'restirador', 'libro'];

// ==================== CREAR SOLICITUD ====================
async function CrearSolicitud(tipoSolicitud, boleta, idRecurso) {
    switch (tipoSolicitud) {
        case 'computadora':
            return await CrearSolicitudComputadora(boleta, idRecurso);
        case 'restirador':
            return await CrearSolicitudRestiradores(boleta, idRecurso);
        case 'libro':
            return await CrearSolicitudlibro(boleta, idRecurso);
        default:
            return { success: false, error: 'Tipo de solicitud inválido' };
    }
}


//==================Funciones de los materiales para agregar los registros==================
async function CrearSolicitudComputadora(boleta, idRecurso) {
    try {
        const { error } = await supabase
            .from('solicitudes_computadora')
            .insert([{ usuario_boleta: boleta, recurso_id: idRecurso }]);
        //El estado se pone automáticamente en 'pendiente'
        if (error) {
            console.error("Error creando solicitud de computadora:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudComputadora:", err);
        return { success: false, error: 'Error interno del servidor' };
    }

}
async function CrearSolicitudRestiradores(boleta, idRecurso) {
    try {
        const { error } = await supabase
            .from('solicitudes_restirador')
            .insert([{ usuario_boleta: boleta, restirador_id: idRecurso }]);

        if (error) {
            console.error("Error creando solicitud de restirador:", error);
            return { success: false, error: error.message };
        }

        //Se crea la solicitud y se autocompletan los campos de tiempo actual y fecha limite a llegar 
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudRestiradores:", err);
        return { success: false, error: 'Error interno del servidor' };
    }

}
async function CrearSolicitudlibro(boleta, idRecurso) {
    try {
        const { error } = await supabase
            .from('solicitudes_libros')
            .insert([{ usuario_boleta: boleta, ejemplar_id: idRecurso }]);
        if (error) {
            console.error("Error creando solicitud de libro:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudlibro:", err);
        return { success: false, error: 'Error interno del servidor' };
    }
}


//=====================Verificar disponibilidad de recursos middleware=====================
async function VerificarDisponibilidadRecurso(tipoSolicitud, idRecurso) {//Poner en creacion de solicitud
    //Funcion general para la verificacion de disponibilidad
    switch (tipoSolicitud) {
        case 'computadora':
            return await VerificarDisponibilidadComputadora(idRecurso);
        case 'restirador':
            return await VerificarDisponibilidadRestirador(idRecurso);
        case 'libro':
            return await VerificarDisponibilidadLibro(idRecurso);
        default:
            return { disponible: false, error: 'Tipo de recurso inválido' };
    }



}

async function VerificarDisponibilidadComputadora(n_recurso) {
    try {
        const { data, error } = await supabase.from('computadoras').select('Disponible').eq('no_computadora', n_recurso).single();
        console.log("Disponibilidad Computadora:", data, error); //debug

        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { success: false, message: error.message };
        }
        if (data.length === 0) {
            return { success: false, message: 'Recurso no encontrado' };
        }
        if (data.Disponible === false) {
            return { message: 'La computadora no está disponible actualmente', success: false };
        }
        return { success: true, message: null };//Indica que la computadora está disponible


    } catch (error) {
        return { success: false, message: 'Error interno del servidor' };
    }

}
async function VerificarDisponibilidadRestirador(n_recurso) {
    try {
        const { data, error } = await supabase.from('restiradores').select('Disponible').eq('no_restirador', n_recurso).single();
        console.log("Disponibilidad Restirador:", data, error); //debug
        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { success: false, message: error.message };
        }
        if (data.length === 0) {
            return { success: false, message: 'Recurso no encontrado' };
        }
        if (data.Disponible === false) {
            return { message: 'El restirador no está disponible actualmente', success: false };
        }
        return { success: true, message: null };   //Indica que el restirador está disponible

    } catch (error) {

        return { success: false, message: 'Error interno del servidor' };

    }

}
async function VerificarDisponibilidadLibro(n_recurso) {
    try {
        const { data, error } = await supabase.from('ejemplares').select('Disponibilidad').eq('libro_id', n_recurso).single();

        console.log("Disponibilidad Libro:", data, error);
        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { success: false, message: error.message };
        }
        if (data.length === 0) {
            return { success: false, message: 'Recurso no encontrado' };
        }
        if (data.Disponibilidad === false) {
            return { message: 'El libro no está disponible actualmente', success: false };
        }
        return { success: true, message: null };//Indica que el libro está disponible
    } catch (error) {
        return { success: false, message: 'Error interno del servidor' };
    }

}

// ==================== OBTENER SOLICITUDES ACTIVAS ====================
async function ObtenerSolicitudesActivasPorBoleta(tipo, boleta) {
    const numeroBoleta = Number(boleta);
    if (!tipo || !boleta) {
        return { success: false, error: 'Faltan datos obligatorios' };
    }
    if (!tipos.includes(tipo)) {
        return { success: false, error: 'Tipo de solicitud inválido' };
    }
    if (tipo === 'computadora' || tipo === 'restirador') {
        if (!Number.isInteger(numeroBoleta)) {
            return { success: false, error: 'Boleta inválida' };
        }
        //Contar solicitudes activas en ambas tablas computadoras y restiradores
        try {
            const [computadoras, restiradores] = await Promise.all([
                contarPendientesPorTabla(supabase, 'solicitudes_computadora', numeroBoleta),
                contarPendientesPorTabla(supabase, 'solicitudes_restirador', numeroBoleta)
            ]);

            if (!computadoras.success) {
                return computadoras;
            }
            if (!restiradores.success) {
                return restiradores;
            }

            const detalle = {
                computadoras: computadoras.count,
                restiradores: restiradores.count
            };//Objeto con el detalle de solicitudes activas

            return {
                success: true,
                total: detalle.computadoras + detalle.restiradores,//retorna el total de solicitudes activas

            };
        } catch (err) {
            console.error('Error contando solicitudes activas:', err);
            return { success: false, error: 'Error interno del servidor' };
        }
    }else if(tipo === 'libro'){ 
        //Contar solicitudes activas en la tabla de libros
        const libros = await contarPendientesPorTabla(supabase, 'solicitudes_libros', numeroBoleta);
        if (!libros.success) {
            return libros;
        }
        return {
            success: true,
            total: libros.count
        }
    }
}

async function contarPendientesPorTabla(client, tabla, boleta) {
    try {
        const { error, count } = await client
            .from(tabla)
            .select('id', { count: 'exact', head: true })
            .eq('usuario_boleta', boleta)
            .eq('estado', 'pendiente' || '');
        console.log(`Conteo en ${tabla} para boleta ${boleta}:`, count, error); //debug
        if (error) {
            console.error(`Error consultando ${tabla}:`, error);
            return { success: false, error: error.message, count: 0 };
        }

        return { success: true, count: count };
    } catch (err) {
        console.error(`Error inesperado consultando ${tabla}:`, err);
        return { success: false, error: 'Error interno', count: 0 };
    }
}


// ==================== CANCELACION DE SOLICITUD ====================
async function CancelarSolicitud(solicitudId) { }


// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
    CrearSolicitud,
    CrearSolicitudComputadora,
    CrearSolicitudRestiradores,
    CrearSolicitudlibro,
    VerificarDisponibilidadRecurso,
    ObtenerSolicitudesActivasPorBoleta,
    CancelarSolicitud
};


