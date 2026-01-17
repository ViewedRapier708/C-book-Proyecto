

async function cerrarSesion() {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // ¡Correcto!
        });

        // Intentamos leer el JSON, pero prevemos si la respuesta no es JSON
        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = { mensaje: 'Sesión finalizada' };
        }

        // Limpiar localStorage (limpieza visual)
        localStorage.removeItem('user_data');
        
        if (!res.ok) {
            console.warn('Logout no confirmado:', data.error || data.mensaje);
        } else {
            console.log('Logout:', data.mensaje);
        }

        window.location.href = '/index.html'; 
        return res.ok;

    } catch (err) {
        console.error('Error en cerrarSesion:', err);
        // Fallback de seguridad: limpiar y sacar al usuario de todas formas
        localStorage.removeItem('user_data');
        window.location.href = '/index.html';
        return false;
    }
}