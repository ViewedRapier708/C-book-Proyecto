// Configuración de la API para el panel de administrador
const API_BASE = window.API_BASE_URL || 'http://localhost:3000';

// ==========================================
// FUNCIONES DE AUTENTICACIÓN Y SESIÓN
// ==========================================

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

        if (response.ok) {
            // Limpiar datos locales
            localStorage.removeItem('usuario');
            sessionStorage.clear();
            
            // Redirigir a la página de inicio
            window.location.href = '../index.html';
        } else {
            console.error('Error al cerrar sesión');
            // Aún así redirigir
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar y redirigir de todas formas
        localStorage.removeItem('usuario');
        window.location.href = '../index.html';
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
            window.location.href = '../index.html';
            return false;
        }

        const data = await response.json();
        
        // Verificar que sea administrador
        if (!data.user || data.user.tipo_usuario !== 'administrador') {
            alert('Acceso denegado. Solo administradores pueden acceder a esta sección.');
            window.location.href = '../index.html';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        window.location.href = '../index.html';
        return false;
    }
}

// ==========================================
// FUNCIONES PARA GESTIÓN DE RECURSOS
// ==========================================

/**
 * Obtener recursos por tipo
 */
async function obtenerRecursos(tipo) {
    try {
        const response = await fetch(`${API_BASE}/auth/recursos?tipo=${tipo}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error al obtener ${tipo}s`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error obteniendo ${tipo}s:`, error);
        return [];
    }
}

/**
 * Crear nuevo recurso
 */
async function crearRecurso(tipo, datos) {
    try {
        const response = await fetch(`${API_BASE}/auth/recursos/${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear recurso');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creando recurso:', error);
        throw error;
    }
}

/**
 * Actualizar recurso existente
 */
async function actualizarRecurso(tipo, id, datos) {
    try {
        const response = await fetch(`${API_BASE}/auth/recursos/${tipo}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar recurso');
        }

        return await response.json();
    } catch (error) {
        console.error('Error actualizando recurso:', error);
        throw error;
    }
}

/**
 * Eliminar recurso
 */
async function eliminarRecurso(tipo, id) {
    try {
        const response = await fetch(`${API_BASE}/auth/recursos/${tipo}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar recurso');
        }

        return await response.json();
    } catch (error) {
        console.error('Error eliminando recurso:', error);
        throw error;
    }
}

// ==========================================
// FUNCIONES PARA SOLICITUDES
// ==========================================

/**
 * Obtener todas las solicitudes
 */
async function obtenerSolicitudes(filtros = {}) {
    try {
        const params = new URLSearchParams(filtros);
        const response = await fetch(`${API_BASE}/auth/solicitudes?${params}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al obtener solicitudes');
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        return [];
    }
}

/**
 * Actualizar estado de solicitud
 */
async function actualizarEstadoSolicitud(id, nuevoEstado) {
    try {
        const response = await fetch(`${API_BASE}/auth/solicitudes/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar solicitud');
        }

        return await response.json();
    } catch (error) {
        console.error('Error actualizando solicitud:', error);
        throw error;
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
