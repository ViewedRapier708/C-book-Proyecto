const { getClient } = require('../config/db');

// ==================== COMPUTADORAS ====================
/**
 * Obtener todas las computadoras
 */
const obtenerComputadoras = async (req, res) => {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('computadoras')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener computadoras', 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Crear una nueva computadora
 */
const crearComputadora = async (req, res) => {
  try {
    console.log('=== crearComputadora iniciada ===');
    console.log('Body recibido:', req.body);
    
    const { procesador, programas, carrera, ram, estado } = req.body;

    // Validar datos requeridos
    if (!procesador || !programas || !carrera) {
      console.log('Faltan datos requeridos');
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos: procesador, programas, carrera' 
      });
    }

    console.log('Obteniendo cliente Supabase...');
    const supabase = getClient();
    
    console.log('Consultando última computadora...');
    // Obtener el último no_computadora para autoincrementar
    const { data: lastComp, error: queryError } = await supabase
      .from('computadoras')
      .select('no_computadora, no_inventario')
      .order('id', { ascending: false })
      .limit(1);
    
    if (queryError) {
      console.error('Error consultando última computadora:', queryError);
    }
    
    console.log('Última computadora:', lastComp);
    
    // Generar siguiente número como entero
    let nextNum = 1;
    if (lastComp && lastComp.length > 0 && lastComp[0].no_computadora) {
      nextNum = parseInt(lastComp[0].no_computadora) + 1;
    }
    
    console.log('Próximo número:', nextNum);
    
    const no_inventario = `INV-COMP-${String(nextNum).padStart(3, '0')}`;
    const no_computadora = nextNum; // Número entero para bigint
    
    const insertData = {
      no_inventario,
      no_computadora,
      procesador, 
      programas, 
      carrera,
      Observacion: ram || 'N/A',
      Disponible: true,
      En_funcionamiento: true
    };
    
    console.log('Datos a insertar:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await supabase
      .from('computadoras')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error de Supabase al crear computadora:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        success: false, 
        message: 'Error al crear computadora en la base de datos', 
        error: error.message,
        details: error.details || error.hint || 'Sin detalles adicionales'
      });
    }

    console.log('Computadora creada exitosamente:', data);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Computadora creada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    console.error('Error en crearComputadora (catch):', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Actualizar una computadora existente
 */
const actualizarComputadora = async (req, res) => {
  try {
    const { id, no_inventario, no_computadora, procesador, programas, carrera, Disponible, En_funcionamiento, Observacion } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de computadora requerido' 
      });
    }

    const updateData = {};
    if (no_inventario !== undefined) updateData.no_inventario = no_inventario;
    if (no_computadora !== undefined) updateData.no_computadora = no_computadora;
    if (procesador !== undefined) updateData.procesador = procesador;
    if (programas !== undefined) updateData.programas = programas;
    if (carrera !== undefined) updateData.carrera = carrera;
    if (Disponible !== undefined) updateData.Disponible = Disponible;
    if (En_funcionamiento !== undefined) updateData.En_funcionamiento = En_funcionamiento;
    if (Observacion !== undefined) updateData.Observacion = Observacion;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay datos para actualizar' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('computadoras')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar computadora', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Computadora no encontrada' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Computadora actualizada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Eliminar una computadora
 */
const eliminarComputadora = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de computadora requerido' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('computadoras')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar computadora', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Computadora no encontrada' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Computadora eliminada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

// ==================== LIBROS ====================
/**
 * Obtener todos los libros
 */
const obtenerLibros = async (req, res) => {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('libros')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener libros', 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Crear un nuevo libro
 */
const crearLibro = async (req, res) => {
  try {
    const { titulo, autor, editorial, isbn, carrera, cantidad } = req.body;

    // Validar datos requeridos
    if (!titulo || !autor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos: titulo, autor' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('libros')
      .insert([{ 
        titulo, 
        clasificacion: carrera || null,
        isbn: isbn || null,
        tipo_material: editorial || null,
        autor
      }])
      .select();

    if (error) {
      console.error('Error al crear libro:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al crear libro', 
        error: error.message 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Libro creado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    console.error('Error interno crearLibro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Actualizar un libro existente
 */
const actualizarLibro = async (req, res) => {
  try {
    const { id, titulo, clasificacion, isbn, tipo_material, autor } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de libro requerido' 
      });
    }

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (clasificacion !== undefined) updateData.clasificacion = clasificacion;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (tipo_material !== undefined) updateData.tipo_material = tipo_material;
    if (autor !== undefined) updateData.autor = autor;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay datos para actualizar' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('libros')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar libro', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Libro no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Libro actualizado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Eliminar un libro
 */
const eliminarLibro = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de libro requerido' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('libros')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar libro', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Libro no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Libro eliminado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

// ==================== RESTIRADORES ====================
/**
 * Obtener todos los restiradores
 */
const obtenerRestiradores = async (req, res) => {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('restiradores')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener restiradores', 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Crear un nuevo restirador
 */
const crearRestirador = async (req, res) => {
  try {
    const { no_inventario, no_restirador, Observacion } = req.body;

    // Validar datos requeridos
    if (!no_inventario || !no_restirador) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos: no_inventario, no_restirador' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('restiradores')
      .insert([{ 
        no_inventario, 
        no_restirador,
        Observacion: Observacion || 'N/A',
        Disponible: true,
        estado_de_material: true
      }])
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al crear restirador', 
        error: error.message 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Restirador creado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Actualizar un restirador existente
 */
const actualizarRestirador = async (req, res) => {
  try {
    const { id, no_inventario, no_restirador, Disponible, estado_de_material, Observacion } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de restirador requerido' 
      });
    }

    const updateData = {};
    if (no_inventario !== undefined) updateData.no_inventario = no_inventario;
    if (no_restirador !== undefined) updateData.no_restirador = no_restirador;
    if (Disponible !== undefined) updateData.Disponible = Disponible;
    if (estado_de_material !== undefined) updateData.estado_de_material = estado_de_material;
    if (Observacion !== undefined) updateData.Observacion = Observacion;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay datos para actualizar' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('restiradores')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar restirador', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restirador no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Restirador actualizado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Eliminar un restirador
 */
const eliminarRestirador = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de restirador requerido' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('restiradores')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar restirador', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restirador no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Restirador eliminado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

// ==================== GUARDAROPAS ====================
/**
 * Obtener todos los guardaropas
 */
const obtenerGuardaropas = async (req, res) => {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('guardaropas')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener guardaropas', 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Crear un nuevo guardaropa
 */
const crearGuardaropa = async (req, res) => {
  try {
    const { cantidad, estado } = req.body;

    const cantidadNum = parseInt(cantidad) || 1;

    const supabase = getClient();
    
    // Obtener el último ID para autoincrementar
    const { data: lastGuard } = await supabase
      .from('guardarropas')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    let nextId = lastGuard && lastGuard.length > 0 ? (lastGuard[0].id || 0) + 1 : 1;
    
    // Crear múltiples guardaropas según la cantidad
    const guardaropas = [];
    for (let i = 0; i < cantidadNum; i++) {
      guardaropas.push({
        id: nextId + i,
        ocupado: false,
        estado: estado === 'disponible'
      });
    }
    const { data, error } = await supabase
      .from('guardarropas')
      .insert(guardaropas)
      .select();

    if (error) {
      console.error('Error al crear guardaropa:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al crear guardaropa', 
        error: error.message 
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: `${cantidadNum} guardaropa(s) creado(s) exitosamente`, 
      data 
    });
  } catch (error) {
    console.error('Error interno crearGuardaropa:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Actualizar un guardaropa existente
 */
const actualizarGuardaropa = async (req, res) => {
  try {
    const { id, ocupado, estado } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de guardaropa requerido' 
      });
    }

    const updateData = {};
    if (ocupado !== undefined) updateData.ocupado = ocupado;
    if (estado !== undefined) updateData.estado = estado;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay datos para actualizar' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('guardaropas')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar guardaropa', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardaropa no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Guardaropa actualizado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Eliminar un guardaropa
 */
const eliminarGuardaropa = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de guardaropa requerido' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('guardaropas')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar guardaropa', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Guardaropa no encontrado' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Guardaropa eliminado exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

// ==================== SOLICITUDES ====================
/**
 * Obtener todas las solicitudes
 */
const obtenerSolicitudes = async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    
    const supabase = getClient();
    let query = supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrar por estado si se proporciona
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Filtrar por tipo si se proporciona
    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener solicitudes', 
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Obtener detalles de una solicitud específica
 */
const obtenerSolicitudPorId = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de solicitud requerido' 
      });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener solicitud', 
        error: error.message 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Aprobar una solicitud
 */
const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de solicitud requerido' 
      });
    }

    const supabase = getClient();

    // Actualizar estado de la solicitud
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ 
        estado: 'aprobada',
        fecha_aprobacion: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al aprobar solicitud', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }

    // Marcar el recurso como ocupado
    const solicitud = data[0];
    const { error: errorRecurso } = await supabase
      .from(solicitud.tipo)
      .update({ ocupado: true })
      .eq('id', solicitud.recurso_id);

    if (errorRecurso) {
      console.error('Error al actualizar estado del recurso:', errorRecurso);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Solicitud aprobada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Rechazar una solicitud
 */
const rechazarSolicitud = async (req, res) => {
  try {
    const { id, motivo } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de solicitud requerido' 
      });
    }

    const supabase = getClient();

    // Actualizar estado de la solicitud
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ 
        estado: 'rechazada',
        fecha_rechazo: new Date().toISOString(),
        motivo_rechazo: motivo || 'No especificado'
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al rechazar solicitud', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }

    // Liberar el recurso si estaba ocupado
    const solicitud = data[0];
    const { error: errorRecurso } = await supabase
      .from(solicitud.tipo)
      .update({ ocupado: false })
      .eq('id', solicitud.recurso_id);

    if (errorRecurso) {
      console.error('Error al actualizar estado del recurso:', errorRecurso);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Solicitud rechazada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Cancelar una solicitud (por admin o sistema)
 */
const cancelarSolicitud = async (req, res) => {
  try {
    const { id, motivo } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de solicitud requerido' 
      });
    }

    const supabase = getClient();

    // Actualizar estado de la solicitud
    const { data, error } = await supabase
      .from('solicitudes')
      .update({ 
        estado: 'cancelada',
        fecha_cancelacion: new Date().toISOString(),
        motivo_cancelacion: motivo || 'Cancelada por administrador'
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al cancelar solicitud', 
        error: error.message 
      });
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }

    // Liberar el recurso
    const solicitud = data[0];
    const { error: errorRecurso } = await supabase
      .from(solicitud.tipo)
      .update({ ocupado: false })
      .eq('id', solicitud.recurso_id);

    if (errorRecurso) {
      console.error('Error al actualizar estado del recurso:', errorRecurso);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Solicitud cancelada exitosamente', 
      data: data[0] 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Obtener estadísticas del dashboard
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const supabase = getClient();

    // Contar computadoras
    const { count: totalComputadoras } = await supabase
      .from('computadoras')
      .select('*', { count: 'exact', head: true });

    const { count: computadorasOcupadas } = await supabase
      .from('computadoras')
      .select('*', { count: 'exact', head: true })
      .eq('ocupado', true);

    // Contar libros
    const { count: totalLibros } = await supabase
      .from('libros')
      .select('*', { count: 'exact', head: true });

    const { count: librosOcupados } = await supabase
      .from('libros')
      .select('*', { count: 'exact', head: true })
      .eq('ocupado', true);

    // Contar restiradores
    const { count: totalRestiradores } = await supabase
      .from('restiradores')
      .select('*', { count: 'exact', head: true });

    const { count: restiradoresOcupados } = await supabase
      .from('restiradores')
      .select('*', { count: 'exact', head: true })
      .eq('ocupado', true);

    // Contar guardaropas
    const { count: totalGuardaropas } = await supabase
      .from('guardaropas')
      .select('*', { count: 'exact', head: true });

    const { count: guardaropasOcupados } = await supabase
      .from('guardaropas')
      .select('*', { count: 'exact', head: true })
      .eq('ocupado', true);

    // Contar solicitudes por estado
    const { count: solicitudesPendientes } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente');

    const { count: solicitudesAprobadas } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'aprobada');

    const { count: solicitudesRechazadas } = await supabase
      .from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'rechazada');

    return res.status(200).json({
      success: true,
      data: {
        recursos: {
          computadoras: {
            total: totalComputadoras || 0,
            ocupadas: computadorasOcupadas || 0,
            disponibles: (totalComputadoras || 0) - (computadorasOcupadas || 0)
          },
          libros: {
            total: totalLibros || 0,
            ocupados: librosOcupados || 0,
            disponibles: (totalLibros || 0) - (librosOcupados || 0)
          },
          restiradores: {
            total: totalRestiradores || 0,
            ocupados: restiradoresOcupados || 0,
            disponibles: (totalRestiradores || 0) - (restiradoresOcupados || 0)
          },
          guardaropas: {
            total: totalGuardaropas || 0,
            ocupados: guardaropasOcupados || 0,
            disponibles: (totalGuardaropas || 0) - (guardaropasOcupados || 0)
          }
        },
        solicitudes: {
          pendientes: solicitudesPendientes || 0,
          aprobadas: solicitudesAprobadas || 0,
          rechazadas: solicitudesRechazadas || 0,
          total: (solicitudesPendientes || 0) + (solicitudesAprobadas || 0) + (solicitudesRechazadas || 0)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};

// ==================== AUTENTICACIÓN DE ADMINISTRADOR ====================
/**
 * Login de administrador (local, sin base de datos)
 */
const loginAdministrador = async (req, res) => {
  try {
    const { identificador, password } = req.body;

    // Validar datos requeridos
    if (!identificador || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identificador y contraseña requeridos' 
      });
    }

    // Validar formato del identificador (10 dígitos)
    if (!/^\d{10}$/.test(identificador)) {
      return res.status(400).json({ 
        success: false, 
        message: 'El identificador debe tener exactamente 10 dígitos' 
      });
    }

    // Credenciales hardcodeadas (deberías usar variables de entorno en producción)
    const ADMIN_IDENTIFICADOR = process.env.ADMIN_IDENTIFICADOR || '1234567890';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    // Verificar credenciales
    if (identificador === ADMIN_IDENTIFICADOR && password === ADMIN_PASSWORD) {
      // Crear sesión de administrador
      req.session.admin = {
        identificador: identificador,
        rol: 'admin',
        loginTime: new Date().toISOString()
      };

      // Guardar sesión (manejo de errores mejorado)
      try {
        await new Promise((resolve, reject) => {
          req.session.save(err => (err ? reject(err) : resolve()));
        });
      } catch (saveError) {
        console.warn('Advertencia al guardar sesión:', saveError.message);
        // Continuar aunque falle el save - la sesión está en memoria
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Login de administrador exitoso',
        data: {
          identificador: identificador,
          rol: 'admin'
        }
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales de administrador inválidas' 
      });
    }
  } catch (error) {
    console.error('Error en loginAdministrador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
};

/**
 * Cerrar sesión de administrador
 */
const cerrarSesionAdministrador = async (req, res) => {
  try {
    req.session.admin = null;
    
    await new Promise((resolve, reject) => {
      req.session.save(err => (err ? reject(err) : resolve()));
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Sesión de administrador cerrada exitosamente' 
    });
  } catch (error) {
    console.error('Error en cerrarSesionAdministrador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al cerrar sesión', 
      error: error.message 
    });
  }
};

/**
 * Verificar sesión de administrador
 */
const verificarSesionAdministrador = async (req, res) => {
  try {
    if (req.session.admin) {
      return res.status(200).json({ 
        success: true, 
        data: {
          identificador: req.session.admin.identificador,
          rol: req.session.admin.rol,
          loginTime: req.session.admin.loginTime
        }
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'No hay sesión de administrador activa' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Error al verificar sesión', 
      error: error.message 
    });
  }
};

module.exports = {
  // Autenticación
  loginAdministrador,
  cerrarSesionAdministrador,
  verificarSesionAdministrador,
  
  // Computadoras
  obtenerComputadoras,
  crearComputadora,
  actualizarComputadora,
  eliminarComputadora,
  
  // Libros
  obtenerLibros,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
  
  // Restiradores
  obtenerRestiradores,
  crearRestirador,
  actualizarRestirador,
  eliminarRestirador,
  
  // Guardaropas
  obtenerGuardaropas,
  crearGuardaropa,
  actualizarGuardaropa,
  eliminarGuardaropa,
  
  // Solicitudes
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  aprobarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  
  // Estadísticas
  obtenerEstadisticas
};
