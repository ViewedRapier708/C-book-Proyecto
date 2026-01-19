// Configuración de la API para el panel de administrador
const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

// ==========================================
// FUNCIONES DE AUTENTICACIÓN Y SESIÓN
// ==========================================

/**
 * Login de administrador
 */
async function loginAdmin(identificador, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ identificador, password })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Login exitoso:', data);
            return data;
        } else {
            console.error('Error en login:', data.message);
            return data;
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

/**
 * Verificar sesión de administrador
 */
async function verificarSesionAdmin() {
    try {
        const response = await fetch(`${API_BASE}/auth/session`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            console.log('No hay sesión activa');
            return false;
        }

        const data = await response.json();
        
        if (!data.autenticado || !data.user) {
            console.log('Usuario no autenticado');
            return false;
        }

        // Verificar que sea administrador
        if (data.user.tipo_usuario !== 'administrador') {
            console.log('Usuario no es administrador');
            window.location.href = '../index.html';
            return false;
        }

        console.log('Sesión de administrador activa:', data.user);
        return true;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

/**
 * Función para cerrar sesión
 */
async function logout() {
    try {
        const response = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        // Limpiar datos locales
        localStorage.removeItem('user_data');
        localStorage.removeItem('usuario');
        sessionStorage.clear();
        
        // Redirigir a la página de inicio
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar y redirigir de todas formas
        localStorage.removeItem('user_data');
        localStorage.removeItem('usuario');
        window.location.href = '../index.html';
    }
}

// ==========================================
// FUNCIONES PARA GESTIÓN DE RECURSOS
// ==========================================

// ========== RESTIRADORES ==========

/**
 * Obtener todos los restiradores
 */
async function obtenerRestiradores() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/restiradores`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener restiradores:', data.message);
            return [];
        }

        return data.data || [];
    } catch (error) {
        console.error('Error obteniendo restiradores:', error);
        return [];
    }
}

/**
 * Crear nuevo restirador
 */
async function crearRestirador(restirador) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/restiradores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(restirador)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al crear restirador');
        }

        return data;
    } catch (error) {
        console.error('Error creando restirador:', error);
        throw error;
    }
}

/**
 * Actualizar restirador existente
 */
async function actualizarRestirador(restirador) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/restiradores/actualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(restirador)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar restirador');
        }

        return data;
    } catch (error) {
        console.error('Error actualizando restirador:', error);
        throw error;
    }
}

/**
 * Eliminar restirador
 */
async function eliminarRestirador(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/restiradores/eliminar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al eliminar restirador');
        }

        return data;
    } catch (error) {
        console.error('Error eliminando restirador:', error);
        throw error;
    }
}

// ========== COMPUTADORAS ==========

/**
 * Obtener todas las computadoras
 */
async function obtenerComputadoras() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/computadoras`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener computadoras:', data.message);
            return [];
        }

        return data.data || [];
    } catch (error) {
        console.error('Error obteniendo computadoras:', error);
        return [];
    }
}

/**
 * Crear nueva computadora
 */
async function crearComputadora(computadora) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/computadoras`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(computadora)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al crear computadora');
        }

        return data;
    } catch (error) {
        console.error('Error creando computadora:', error);
        throw error;
    }
}

/**
 * Actualizar computadora existente
 */
async function actualizarComputadora(computadora) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/computadoras/actualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(computadora)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar computadora');
        }

        return data;
    } catch (error) {
        console.error('Error actualizando computadora:', error);
        throw error;
    }
}

/**
 * Eliminar computadora
 */
async function eliminarComputadora(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/computadoras/eliminar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al eliminar computadora');
        }

        return data;
    } catch (error) {
        console.error('Error eliminando computadora:', error);
        throw error;
    }
}

// ========== LIBROS ==========

/**
 * Obtener todos los libros
 */
async function obtenerLibros() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/libros`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener libros:', data.message);
            return [];
        }

        return data.data || [];
    } catch (error) {
        console.error('Error obteniendo libros:', error);
        return [];
    }
}

/**
 * Crear nuevo libro
 */
async function crearLibro(libro) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/libros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(libro)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al crear libro');
        }

        return data;
    } catch (error) {
        console.error('Error creando libro:', error);
        throw error;
    }
}

/**
 * Actualizar libro existente
 */
async function actualizarLibro(libro) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/libros/actualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(libro)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar libro');
        }

        return data;
    } catch (error) {
        console.error('Error actualizando libro:', error);
        throw error;
    }
}

/**
 * Eliminar libro
 */
async function eliminarLibro(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/libros/eliminar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al eliminar libro');
        }

        return data;
    } catch (error) {
        console.error('Error eliminando libro:', error);
        throw error;
    }
}

// ========== GUARDAROPAS ==========

/**
 * Obtener todos los guardaropas
 */
async function obtenerGuardaropas() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/guardaropas`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener guardaropas:', data.message);
            return [];
        }

        return data.data || [];
    } catch (error) {
        console.error('Error obteniendo guardaropas:', error);
        return [];
    }
}

/**
 * Crear nuevo guardaropa
 */
async function crearGuardaropa(guardaropa) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/guardaropas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(guardaropa)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al crear guardaropa');
        }

        return data;
    } catch (error) {
        console.error('Error creando guardaropa:', error);
        throw error;
    }
}

/**
 * Actualizar guardaropa existente
 */
async function actualizarGuardaropa(guardaropa) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/guardaropas/actualizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(guardaropa)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al actualizar guardaropa');
        }

        return data;
    } catch (error) {
        console.error('Error actualizando guardaropa:', error);
        throw error;
    }
}

/**
 * Eliminar guardaropa
 */
async function eliminarGuardaropa(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/guardaropas/eliminar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al eliminar guardaropa');
        }

        return data;
    } catch (error) {
        console.error('Error eliminando guardaropa:', error);
        throw error;
    }
}

// ==========================================
// FUNCIONES PARA SOLICITUDES
// ==========================================

/**
 * Obtener todas las solicitudes
 */
async function obtenerSolicitudes() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/solicitudes`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener solicitudes:', data.message);
            return [];
        }

        return data.data || [];
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        return [];
    }
}

/**
 * Obtener detalle de una solicitud
 */
async function obtenerSolicitudDetalle(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/solicitudes/detalle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al obtener solicitud');
        }

        return data;
    } catch (error) {
        console.error('Error obteniendo solicitud:', error);
        throw error;
    }
}

/**
 * Aprobar solicitud
 */
async function aprobarSolicitud(id) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/solicitudes/aprobar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al aprobar solicitud');
        }

        return data;
    } catch (error) {
        console.error('Error aprobando solicitud:', error);
        throw error;
    }
}

/**
 * Rechazar solicitud
 */
async function rechazarSolicitud(id, motivo) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/solicitudes/rechazar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id, motivo })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al rechazar solicitud');
        }

        return data;
    } catch (error) {
        console.error('Error rechazando solicitud:', error);
        throw error;
    }
}

/**
 * Cancelar solicitud
 */
async function cancelarSolicitudAdmin(id, motivo) {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/solicitudes/cancelar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ id, motivo })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al cancelar solicitud');
        }

        return data;
    } catch (error) {
        console.error('Error cancelando solicitud:', error);
        throw error;
    }
}

// ==========================================
// FUNCIONES PARA ESTADÍSTICAS
// ==========================================

/**
 * Obtener estadísticas del sistema
 */
async function obtenerEstadisticas() {
    try {
        const response = await fetch(`${API_BASE}/auth/admin/estadisticas`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Error al obtener estadísticas:', data.message);
            return null;
        }

        return data.data || null;
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
    }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
    // Implementar según diseño
    alert(mensaje);
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
    // Implementar según diseño
    alert('Error: ' + mensaje);
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    verificarSesionAdmin();
});
