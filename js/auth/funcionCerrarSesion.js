// Función para cerrar sesión

function cerrarSesion() {
    try {
        // Limpiar toda la información de sesión del localStorage
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('user_data');
        localStorage.removeItem('sb-yondcnkwcekmkovdeaso-auth-token');
        
        console.log('Sesión cerrada exitosamente');
        
        // Redirigir al login
        window.location.href = '../index.html';
        return true;

    } catch (err) {
        console.error('Error en cerrarSesion:', err);
        alert('Error al cerrar sesión');
        return false;
    }
}
