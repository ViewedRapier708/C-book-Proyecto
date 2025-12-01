// Función para cerrar sesión

async function cerrarSesion() {
    try {
        // Cerrar sesión en el backend
        await fetch('http://localhost:3000/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
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
        // Aún así limpiar localStorage y redirigir
        localStorage.removeItem('user_data');
        window.location.href = '../index.html';
        return false;
    }
}
