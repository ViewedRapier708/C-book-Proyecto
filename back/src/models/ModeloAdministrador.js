import { getClient } from "../config/db";

const supabase = getClient();

// ==================== MODELO ADMINISTRADOR ====================

  async function CrearLibro(id, titulo, clasificacion, isbn, tipo_material, autor) {
    try {
        const { data, error } = await supabase
            .from('libros')
            .insert([{ id, titulo, clasificacion, isbn, tipo_material, autor }])
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

  async function CrearComputadora(id, procesador, programas, carrera, Disponible, En_funcionamiento, Observacion, no_inventario, no_computadora) {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .insert([{ id, procesador, programas, carrera, Disponible, En_funcionamiento, Observacion, no_inventario, no_computadora }])
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

  async function CrearRestirador(id, Disponible, estado_material, Observacion, no_inventario, no_restirador) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .insert([{ id, Disponible, estado_material, Observacion, no_inventario, no_restirador }])
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


  async function CrearGuardarropa(id, ocupado,estado) {
     try {
        const { data, error } = await supabase
            .from('guardarropas')
            .insert([{ id, ocupado, estado }])
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
}


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
            .from('libros')
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

  async function actualizarDatosRestirador(id, Disponible, estado_material, Observacion, no_inventario, no_restirador) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .update({ Disponible, estado_material, Observacion, no_inventario, no_restirador })
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

  async function obtenerComputadoras(id) {
    try {
        const { data, error } = await supabase
            .from('computadoras')
            .select('*')
            .eq('id', id);
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

  async function obtenerLibros(id) {
    try {
        const { data, error } = await supabase
            .from('libros')
            .select('*')
            .eq('id', id);
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

  async function obtenerRestiradores(id) {
    try {
        const { data, error } = await supabase
            .from('restiradores')
            .select('*')
            .eq('id', id);
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
  async function obtenerGuardarropas(id) {
    try {
        const { data, error } = await supabase
            .from('guardarropas')
            .select('*')
            .eq('id', id);
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
    obtenerComputadoras,
    obtenerLibros,
    obtenerRestiradores,
    obtenerGuardarropas
};