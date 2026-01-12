/**
 * CONFIGURACIÓN Y CONEXIÓN CON SUPABASE
 * Estas constantes permiten la conexión con el servidor de base de datos en tiempo real.
 */
const URL_SUPABASE = 'https://yondcnkwcekmkovdeaso.supabase.co';
const CLAVE_ANONIMA_SUPABASE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';

/**
 * VARIABLES GLOBALES DE ESTADO
 * Guardan información sobre la conexión activa para evitar duplicados.
 */
let canalesTiempoReal = []; // Lista de canales activos (suscripciones)
let clienteSupabase = null; // Instancia única del cliente de Supabase

/**
 * MAPEO DE RECURSOS
 * Relaciona los nombres usados en la interfaz con los nombres técnicos de las tablas en la base de datos.
 */
const MAPEO_TABLAS_SUPABASE = {
    'computadora': ['computadoras'],
    'libro': ['libros', 'ejemplares'], // Los libros dependen de títulos y ejemplares físicos
    'restirador': ['restiradores'],
    'areaconsulta': ['area_consulta'],
    // Las solicitudes se guardan por tipo en tablas distintas
    'solicitudes': ['solicitudes_computadora', 'solicitudes_restirador', 'solicitudes_libros']
};

/**
 * UTILIDADES DE FORMATO
 * Funciones simples para que los datos se vean bien en la pantalla.
 */

// Convierte valores booleanos o nulos en texto legible ("Sí", "No", "-")
const formatearValorLegible = (valor) => {
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (valor === null || valor === undefined) return '-';
    if (valor === 'Sí' || valor === 'No') return valor;
    return valor;
};

/**
 * Convierte el estado de una solicitud (numérico o texto) a un string legible.
 *
 * Casos soportados:
 * - 1 -> "Pendiente"
 * - 2 -> "Atendida" (o aprobada/confirmada, según tu catálogo)
 * - 3 -> "Cancelada"
 * - 4 -> "No asistió"
 * - 5 -> "Vencida"
 *
 * Si llega un texto (ej. "pendiente"), se normaliza.
 */
const parsearEstadoSolicitud = (estado) => {
    if (estado === null || estado === undefined) return '-';

    // Si viene como string (ej. desde una vista)
    if (typeof estado === 'string') {
        const normalizado = estado.trim().toLowerCase();
        if (!normalizado) return '-';

        // Soporta strings numéricos
        if (/^\d+$/.test(normalizado)) {
            return parsearEstadoSolicitud(Number(normalizado));
        }

        const mapeoTexto = {
            pendiente: 'Pendiente',
            aprobada: 'Aprobada',
            aprobadas: 'Aprobada',
            rechazada: 'Rechazada',
            cancelada: 'Cancelada',
            cancelado: 'Cancelada',
            atendida: 'Atendida',
            atendido: 'Atendida',
            finalizada: 'Finalizada',
            finalizado: 'Finalizada'
        };

        return mapeoTexto[normalizado] || (normalizado.charAt(0).toUpperCase() + normalizado.slice(1));
    }

    // Si viene como número
    if (typeof estado === 'number' && Number.isFinite(estado)) {
        const mapeo = {
            1: 'Pendiente',
            2: 'Atendida',
            3: 'Cancelada',
            4: 'No asistió',
            5: 'Vencida'
        };
        return mapeo[estado] || `Estado ${estado}`;
    }

    return String(estado);
};

/**
 * Lee la boleta desde localStorage si existe.
 * Nota: la API usa sesión/cookie, esto solo se usa para filtrar Realtime.
 */
const obtenerBoletaLocal = () => {
    try {
        const datosUsuario = JSON.parse(localStorage.getItem('user_data') || '{}');
        return datosUsuario?.boleta ? String(datosUsuario.boleta) : '';
    } catch {
        return '';
    }
};

/**
 * Obtiene de forma tolerante el ID del recurso asociado a una solicitud.
 */
const obtenerIdRecursoSolicitud = (solicitud) => {
    if (!solicitud || typeof solicitud !== 'object') return '-';
    return (
        solicitud.recurso_id ??
        solicitud.id_recurso ??
        solicitud.computadora_id ??
        solicitud.restirador_id ??
        solicitud.ejemplar_id ??
        solicitud.recurso?.id ??
        solicitud.recurso ??
        '-'
    );
};

/**
 * Formatea una fecha/hora para mostrarla en una sola columna.
 */
const formatearFechaSolicitud = (solicitud) => {
    const fecha = solicitud?.fecha_solicitud ?? solicitud?.fecha ?? solicitud?.created_at ?? '';
    const hora = solicitud?.hora_solicitud ?? solicitud?.hora ?? '';
    const fechaTxt = fecha ? String(fecha).replace('T', ' ').replace('Z', '') : '-';
    if (!hora) return fechaTxt;
    return `${fechaTxt} ${hora}`.trim();
};

// Extrae y ordena los datos de un objeto para que coincidan con las columnas de la tabla HTML
const mapearValoresFila = (tipoRecurso, datos) => {
    if (Array.isArray(datos)) return datos;
    const recurso = datos || {};
    
    // Configuración específica por cada tipo de recurso
    if (tipoRecurso === 'libro') {
        const infoLibro = recurso.libros || {};
        return [
            infoLibro.titulo || recurso.titulo || '-',
            infoLibro.autor || recurso.autor || '-',
            infoLibro.clasificacion || recurso.clasificacion || '-',
            infoLibro.tipo_material || recurso.tipo_material || '-',
            recurso.anio ?? '-',
            recurso.numero_ejemplar ?? '-',
            recurso.Disponibilidad ?? recurso.disponibilidad ?? recurso.estatus_item ?? '-'
        ];
    }

    if (tipoRecurso === 'computadora') {
        return [
            recurso.no_computadora ?? recurso.numero ?? '-',
            recurso.Observacion ?? recurso.observacion ?? '-',
            recurso.procesador ?? '-',
            recurso.programas ?? '-',
            recurso.carrera ?? '-',
            recurso.En_funcionamiento ?? recurso.en_funcionamiento ?? '-',
            recurso.Disponible ?? recurso.disponible ?? '-'
        ];
    }

    if (tipoRecurso === 'restirador') {
        return [
            recurso.no_restirador ?? recurso.id ?? '-',
            recurso.Observacion ?? recurso.observacion ?? '-',
            recurso.Disponible ?? recurso.disponible ?? '-',
            recurso.estado_de_material ?? '-'
        ];
    }

    if (tipoRecurso === 'solicitudes') {
        const estadoCrudo = recurso.estado ?? recurso.estado_asistencia ?? recurso.estado_asistencia_id;
        return [
            recurso.id ?? '-',
            recurso.tipo ?? '-',
            obtenerIdRecursoSolicitud(recurso),
            formatearFechaSolicitud(recurso),
            parsearEstadoSolicitud(estadoCrudo)
        ];
    }

    return Object.values(recurso);
};

// Genera un identificador único para buscar la fila en el HTML
const obtenerIdentificadorFila = (tipoRecurso, datos) => {
    if (tipoRecurso === 'libro') return datos.numero_ejemplar || datos.id || datos.libros?.isbn || null;
    if (tipoRecurso === 'computadora') return datos.no_computadora || datos.id || null;
    if (tipoRecurso === 'restirador') return datos.no_restirador || datos.id || null;
    if (tipoRecurso === 'solicitudes') return datos.id || null; 
    return datos.id || datos._id || null;
};

/**
 * FUNCIONES DE MANIPULACIÓN DE LA TABLA (DOM)
 * Estas funciones actualizan lo que el usuario ve en pantalla.
 */

// Agrega una nueva fila al final de la tabla
const agregarFilaATabla = (tipoDeTabla, datosRecurso) => {
    const cuerpoTabla = document.getElementById('Tbody');
    const tipoActualInterfaz = document.getElementById('tabla')?.getAttribute('data-tipo');
    
    // Solo agregar si estamos viendo la tabla correcta
    if (!cuerpoTabla || tipoDeTabla !== tipoActualInterfaz) return;

    const filaElemento = document.createElement('tr');
    const datosMapeados = mapearValoresFila(tipoDeTabla, datosRecurso);
    
    datosMapeados.forEach((valorCelda) => {
        const celdaElemento = document.createElement('td');
        celdaElemento.textContent = formatearValorLegible(valorCelda);
        filaElemento.appendChild(celdaElemento);
    });

    // Columna de acciones (solo para solicitudes)
    if (tipoDeTabla === 'solicitudes') {
        const celdaAcciones = document.createElement('td');
        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.className = 'btn-cancelar';
        btnCancelar.textContent = 'Cancelar Solicitud';
        btnCancelar.dataset.solicitudId = datosRecurso?.id ?? '';
        btnCancelar.dataset.tipo = datosRecurso?.tipo ?? '';
        celdaAcciones.appendChild(btnCancelar);
        filaElemento.appendChild(celdaAcciones);
    }

    // Guardamos metadatos en la fila para facilitar futuras actualizaciones
    filaElemento.dataset.recurso = JSON.stringify(datosRecurso);
    filaElemento.dataset.rowKey = obtenerIdentificadorFila(tipoDeTabla, datosRecurso);
    cuerpoTabla.appendChild(filaElemento);
};

/**
 * Configura la conexión de Supabase Realtime para escuchar cambios en vivo.
 * Por defecto, cuando llega un cambio, se recarga la tabla desde la API.
 */
async function inicializarTiempoRealSupabase(tipoInterfaz, callbackCambio) {
    try {
        if (typeof window.supabase === 'undefined') return null;

        const tablasAEscuchar = MAPEO_TABLAS_SUPABASE[tipoInterfaz];
        if (!tablasAEscuchar) return;

        if (!clienteSupabase) {
            clienteSupabase = window.supabase.createClient(URL_SUPABASE, CLAVE_ANONIMA_SUPABASE);
        }

        // Limpiamos canales antiguos para no duplicar peticiones
        if (canalesTiempoReal.length > 0) {
            canalesTiempoReal.forEach(canal => clienteSupabase.removeChannel(canal));
            canalesTiempoReal = [];
        }

        // Función que se ejecuta cuando algo cambia en la base de datos
        const procesarNotificacion = (payload) => {
            if (typeof callbackCambio === 'function') {
                callbackCambio(payload);
                return;
            }

            // Si no hay proceso especial, simplemente refrescamos toda la tabla
            cargarDatosEnTabla().then(() => {
                if (typeof inicializarEventosTabla === 'function') {
                    inicializarEventosTabla();
                }
            });
        };

        // Creamos una suscripción por cada tabla necesaria (ej. libros y ejemplares)
        const boleta = tipoInterfaz === 'solicitudes' ? obtenerBoletaLocal() : '';
        for (const nombreTabla of tablasAEscuchar) {
            const nombreCanal = `canal-${nombreTabla}-${Date.now()}`;
            const params = { event: '*', schema: 'public', table: nombreTabla };
            // Filtrar por usuario para evitar refrescos por cambios ajenos
            if (boleta && tipoInterfaz === 'solicitudes') {
                params.filter = `usuario_boleta=eq.${boleta}`;
            }
            const nuevoCanal = clienteSupabase
                .channel(nombreCanal)
                .on('postgres_changes', params, procesarNotificacion)
                .subscribe((estado) => {
                    console.log(`📡 [TiempoReal] Estado en ${nombreTabla}: ${estado}`);
                });

            canalesTiempoReal.push(nuevoCanal);
        }

        return canalesTiempoReal;
    } catch (error) {
        console.error('❌ Error al conectar con Supabase Realtime:', error);
        return null;
    }
}

/**
 * INICIALIZACIÓN AUTOMÁTICA
 */

// Función global para reiniciar el tiempo real (útil cuando se cambia de pestaña sin recargar)
async function configurarTiempoRealParaTablaActual() {
    const elementoTabla = document.getElementById('tabla');
    const tipo = elementoTabla?.getAttribute('data-tipo');
    if (tipo) {
        await inicializarTiempoRealSupabase(tipo);
    }
}

/**
 * LÓGICA DE DATOS Y TIEMPO REAL
 * Controla la obtención de información desde el servidor y las actualizaciones automáticas.
 */

// Carga los datos iniciales desde la API y los dibuja en la tabla
async function cargarDatosEnTabla() {
    const cuerpoTabla = document.getElementById('Tbody');
    const tipoRecurso = document.getElementById('tabla')?.getAttribute('data-tipo');
    
    if (!cuerpoTabla || !tipoRecurso) {
        console.error('❌ Error: No se encontró el contenedor de la tabla o el tipo de recurso.');
        return;
    }

    /**
     * Renderiza filas en el tbody actual.
     * Para "solicitudes", agrega una columna de acciones con botón cancelar.
     */
    const renderizarLista = (listaDatos) => {
        cuerpoTabla.innerHTML = ''; // Limpiamos la tabla antes de cargar
        
        listaDatos.forEach((datos) => {
            const fila = document.createElement('tr');
            const valores = mapearValoresFila(tipoRecurso, datos);

            valores.forEach((valor) => {
                const celda = document.createElement('td');
                celda.textContent = formatearValorLegible(valor);
                fila.appendChild(celda);
            });

            if (tipoRecurso === 'solicitudes') {
                const celdaAcciones = document.createElement('td');
                const btnCancelar = document.createElement('button');
                btnCancelar.type = 'button';
                btnCancelar.className = 'btn-cancelar';
                btnCancelar.textContent = 'Cancelar Solicitud';
                btnCancelar.dataset.solicitudId = datos?.id ?? '';
                btnCancelar.dataset.tipo = datos?.tipo ?? '';
                celdaAcciones.appendChild(btnCancelar);
                fila.appendChild(celdaAcciones);
            }

            // Configuración de la fila para interacción
            fila.dataset.recurso = JSON.stringify(datos);
            fila.dataset.rowKey = obtenerIdentificadorFila(tipoRecurso, datos) || '';
            fila.classList.add('fila-recurso');
            fila.style.cursor = 'pointer';
            
            // Evento para seleccionar la fila al hacer clic
            fila.addEventListener('click', function () {
                if (typeof window.seleccionarFila === 'function') {
                    window.seleccionarFila(this);
                }
            });

            cuerpoTabla.appendChild(fila);
        });
    };

    const urlBaseApi = window.API_BASE_URL;
    let datosFinales = [];

    try {
        if (tipoRecurso === 'solicitudes') {
            const respuesta = await fetch(`${urlBaseApi}/auth/recursos/usuario`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (!respuesta.ok) {
                const msg = await respuesta.text().catch(() => '');
                console.warn(`No se pudieron cargar solicitudes (${respuesta.status}):`, msg);
                datosFinales = [];
            } else {
                const dataObtenida = await respuesta.json();
                datosFinales = (dataObtenida?.success && Array.isArray(dataObtenida?.data)) ? dataObtenida.data : [];
            }
        } else {
            const respuesta = await fetch(`${urlBaseApi}/auth/recursos?tipo=${tipoRecurso}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            const dataObtenida = await respuesta.json();
            datosFinales = Array.isArray(dataObtenida?.data) ? dataObtenida.data : (Array.isArray(dataObtenida) ? dataObtenida : []);
        }

        renderizarLista(datosFinales);

        // Re-enganchar handlers (p.ej. botón cancelar) después de re-render
        if (typeof inicializarEventosTabla === 'function') {
            inicializarEventosTabla();
        }
    } catch (error) {
        console.error('❌ Error al obtener datos de la API:', error);
    }
}

/**
 * Envía la petición de cancelación a la API.
 */
async function cancelarSolicitudDesdeTabla(tipo, idSolicitud, boton) {
    const urlBaseApi = window.API_BASE_URL;
    const id = String(idSolicitud || '').trim();
    const tipoSeguro = String(tipo || '').trim();

    if (!tipoSeguro || !id) {
        console.warn('No se pudo cancelar: faltan tipo o id');
        return;
    }

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Cancelando...';
        }

        const resp = await fetch(`${urlBaseApi}/auth/solicitud/${encodeURIComponent(tipoSeguro)}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.success) {
            console.error('Error cancelando solicitud:', data);
            if (boton) {
                boton.disabled = false;
                boton.textContent = 'Cancelar Solicitud';
            }
            return;
        }

        // Refresco completo (simple y consistente con Realtime)
        await cargarDatosEnTabla();
    } catch (err) {
        console.error('Error cancelando solicitud:', err);
        if (boton) {
            boton.disabled = false;
            boton.textContent = 'Cancelar Solicitud';
        }
    }
}

/**
 * Inicializa eventos de interacción de la tabla actual.
 * Para "solicitudes", agrega handler al botón "Cancelar".
 */
function inicializarEventosTabla() {
    const tabla = document.getElementById('tabla');
    const tipoRecurso = tabla?.getAttribute('data-tipo');
    const cuerpoTabla = document.getElementById('Tbody');
    if (!tabla || !cuerpoTabla || tipoRecurso !== 'solicitudes') return;

    if (cuerpoTabla.hasAttribute('data-cancel-handler')) return;

    cuerpoTabla.addEventListener('click', async (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains('btn-cancelar')) return;

        e.preventDefault();
        e.stopPropagation();

        const id = target.dataset.solicitudId;
        const tipo = target.dataset.tipo;
        await cancelarSolicitudDesdeTabla(tipo, id, target);
    });

    cuerpoTabla.setAttribute('data-cancel-handler', 'true');
}

// Actualiza los valores de una fila existente sin recargar toda la página
const actualizarFilaEnTabla = (datosAntiguos, datosNuevos) => {
    const cuerpoTabla = document.getElementById('Tbody');
    const tipoActual = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!cuerpoTabla || !tipoActual) return;

    const filasExistentes = Array.from(cuerpoTabla.querySelectorAll('tr'));
    const valoresNuevos = mapearValoresFila(tipoActual, datosNuevos);
    const idFila = obtenerIdentificadorFila(tipoActual, datosAntiguos);

    const filaDestino = idFila
        ? filasExistentes.find((f) => f.dataset.rowKey === String(idFila))
        : filasExistentes.find((f) => {
            const celdas = Array.from(f.querySelectorAll('td'));
            const valoresAntiguos = mapearValoresFila(tipoActual, datosAntiguos);
            return valoresAntiguos.every((v, i) => celdas[i] && celdas[i].textContent == v);
        });

    if (!filaDestino) {
        console.warn('⚠️ No se encontró la fila para actualizar');
        return;
    }

    const celdasFila = filaDestino.querySelectorAll('td');
    valoresNuevos.forEach((valor, i) => {
        if (celdasFila[i]) celdasFila[i].textContent = formatearValorLegible(valor);
    });

    filaDestino.dataset.recurso = JSON.stringify(datosNuevos || {});
    filaDestino.dataset.rowKey = obtenerIdentificadorFila(tipoActual, datosNuevos) || filaDestino.dataset.rowKey;
};

// Elimina una fila de la tabla HTML
const eliminarFilaDeTabla = (datosARemover) => {
    const cuerpoTabla = document.getElementById('Tbody');
    const tipoActual = document.getElementById('tabla')?.getAttribute('data-tipo');
    if (!cuerpoTabla || !tipoActual) return;

    const filasExistentes = Array.from(cuerpoTabla.querySelectorAll('tr'));
    const idFila = obtenerIdentificadorFila(tipoActual, datosARemover);

    const filaABorrar = idFila
        ? filasExistentes.find((f) => f.dataset.rowKey === String(idFila))
        : filasExistentes.find((f) => {
            const celdas = Array.from(f.querySelectorAll('td'));
            const valores = mapearValoresFila(tipoActual, datosARemover);
            return valores.every((v, i) => celdas[i] && celdas[i].textContent == v);
        });

    if (filaABorrar) {
        filaABorrar.remove();
    }
};

// Al cargar el documento, busca si hay una tabla activa y arranca el sistema
document.addEventListener('DOMContentLoaded', async () => {
    const elementoTabla = document.getElementById('tabla');
    const tipoRecurso = elementoTabla?.getAttribute('data-tipo');
    
    if (tipoRecurso) {
        await cargarDatosEnTabla();
        if (typeof inicializarEventosTabla === 'function') {
            inicializarEventosTabla();
        }
        inicializarTiempoRealSupabase(tipoRecurso);
    }
});
