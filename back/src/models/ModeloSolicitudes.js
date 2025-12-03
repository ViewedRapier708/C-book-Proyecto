const { getClient } = require('../config/db');



// ==================== CREAR SOLICITUD ====================
async function CrearSolicitud(tipoSolicitud, boleta, idRecurso) {
    const supabase = getClient();


    //Inicialmente tengo que revisar si no tengo alguna solicitud activa
    if (!tipoSolicitud || !boleta || !idRecurso) {
        return { success: false, error: 'Faltan datos obligatorios' };
    }
    if (!tipos.includes(tipoSolicitud)) {
        return { success: false, error: 'Tipo de solicitud inválido' };
    }

    

    try {

        switch (tipoSolicitud) {
            case 'computadora':
            
            break;
            default:
                return { success: false, error: 'Tipo de solicitud no manejado' };
        }       
   
      
    } catch (err) {
        console.error("Error en solicitudes de computadora:", err);
        return { success: false, error: 'Error interno del servidor' };
    }


}


//==================Funciones de los materiales para agregar los registros==================
async function CrearSolicitudComputadora(boleta, idRecurso) {
    const supabase = getClient();
    try {
        const { error } = await supabase
            .from('solicitudes_computadora')
            .insert([{usuario_boleta: boleta, recurso_id: idRecurso}]);
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
    const supabase = getClient();
    try {
        const { error } = await supabase
            .from('solicitudes_restirador')
            .insert([{usuario_boleta: boleta, restirador_id: idRecurso}]);

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
    const supabase = getClient();
    try {
        const { error } = await supabase
            .from('solicitudes_libros')
            .insert([{usuario_boleta: boleta, ejemplar_id: idRecurso}]);
        if (error) {
            console.error("Error creando solicitud de libro:", error);
            return { success: false, error: error.message };
        }
        return { success: true};
    } catch (err) {
        console.error("Error en CrearSolicitudlibro:", err);
        return { success: false, error: 'Error interno del servidor' };
    }
}


//=====================Verificar disponibilidad de recursos middleware=====================
async function VerificarDisponibilidadRecurso(tipoSolicitud, idRecurso) {
//Funcion general para la verificacion de disponibilidad
    const supabase = getClient();
    

}

async function VerificarDisponibilidadComputadora(n_recurso) {
    const supabase = getClient();
    try {
        const { data, error } = await supabase.from('computadoras').select('ocupado').eq('no_computadora', n_recurso).single();
        console.log("Disponibilidad Computadora:", data, error); //debug
        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { disponible: false, error: error.message };
        }
        if (data.ocupado === true) {
            return true;
        }
    } catch (error) {
        return { disponible: false, error: 'Error interno del servidor' };
    }
}
async function VerificarDisponibilidadRestirador(n_recurso) {
    const supabase = getClient();
    try {
        const { data, error } = await supabase.from('restiradores').select('ocupado').eq('no_restirador', n_recurso).single();
        console.log("Disponibilidad Restirador:", data, error); //debug
        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { disponible: false, error: error.message };
        }
        if (data) {
            return true;
        }
    } catch (error) {
        return { disponible: false, error: 'Error interno del servidor' };
    }
}
async function VerificarDisponibilidadLibro(n_recurso) {
    const supabase = getClient();
    try {
        const { data, error } = await supabase.from('ejemplares').select('Disponibilidad').eq('libro_id', n_recurso).single();

         console.log("Disponibilidad Libro:", data, error);
        if (error) {
            console.error("Error verificando disponibilidad:", error);
            return { disponible: false, error: error.message };
        }
        if (data.Disponibilidad === false) {
            return {message: 'El libro no está disponible actualmente'};
        }
        return true;
    } catch (error) {
        return { disponible: false, error: 'Error interno del servidor' };
    }
       

}


// ==================== OBTENER SOLICITUDES ACTIVAS ====================
async function ObtenerSolicitudesActivasPorBoleta(boleta) {}

async function CancelarSolicitud(solicitudId) {}


// ==================== CANCELACION DE SOLICITUD ====================


// ==================== EXPORTAR FUNCIONES ====================



