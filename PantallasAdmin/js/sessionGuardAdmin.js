/**
 * Guard de protección para páginas de administrador
 * Este script debe cargarse al inicio de cada página de admin
 */

(async function proteccionPaginaAdmin() {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
    
    try {
        const response = await fetch(`${API_BASE}/admin/session`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (!data.success) {
            console.log('No hay sesión de administrador activa');
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            window.location.href = '../loginAdmin.html';
            return;
        }

        console.log('Sesión de administrador verificada:', data.data);
        
        // Guardar datos en el DOM para uso posterior
        window.adminData = data.data;
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        alert('Error al verificar la sesión. Redirigiendo al login...');
        window.location.href = '../loginAdmin.html';
    }
})();

/**
 * Actualizar enlace de cerrar sesión
 */
window.addEventListener('DOMContentLoaded', () => {
    const cerrarSesionBtn = document.querySelector('.btn-cerrar-sesion a');
    
    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de cerrar sesión?')) {
                await logout();
            }
        });
    }
});
