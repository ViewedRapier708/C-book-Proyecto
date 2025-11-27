// Función para cerrar sesión con Supabase
async function cerrarSesion() {
    const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';
    
    try {
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storage: localStorage
            }
        });

        const { error } = await client.auth.signOut();
        
        if (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión. Intenta de nuevo.');
            return false;
        }

        // Limpiar localStorage
        localStorage.removeItem('sb-yondcnkwcekmkovdeaso-auth-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-user');
        
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
