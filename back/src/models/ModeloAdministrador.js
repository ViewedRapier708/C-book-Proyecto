const {getClient} = require("../config/db");

const supabase = getClient();

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
//Obtencion de los materiales
async function ObtenerMateriales(tipo) {
    switch (tipo) {
        case 'libros':
            return await obtenerLibros();
        case 'computadoras':
            return await obtenerComputadoras();
        case 'restiradores':
            return await obtenerRestiradores();
        case 'guardarropas':
            return await obtenerGuardarropas();
        default:
            return { success: false, message: 'Tipo de material no válido' };
    }
}

async function obtenerComputadoras() {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .select('*')
        if (error) {
            console.error("Error obteniendo computadora:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno obteniendo computadora:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}
  async function obtenerLibros() {
    try {
        const { data, error } = await supabase
            .from('libros')
            .select('*')
        if (error) {
            console.error("Error obteniendo libro:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno obteniendo libro:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

  async function obtenerRestiradores() {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .select('*')
        if (error) {
            console.error("Error obteniendo restirador:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno obteniendo restirador:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}
  async function obtenerGuardarropas() {
    try {
        const { data, error } = await supabase
            .from('guardarropas')
            .select('*')
        if (error) {
            console.error("Error obteniendo guardarropa:", error);
            return { success: false, message: error.message };
        }
        return { success: true, data: data };
    } catch (error) {
        console.error("Error interno obteniendo guardarropa:", error);
        return { success: false, message: 'Error interno del servidor' };
    }
}
//Aceptacion de las solicitudes del usuario

//Aceptacion de documentacion del usuario
module.exports = {
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
    ObtenerMateriales,
    obtenerComputadoras,
    obtenerLibros,
    obtenerRestiradores,
    obtenerGuardarropas
};