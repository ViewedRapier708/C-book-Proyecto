// Guardia de sesión - Verifica autenticación en páginas protegidas
(async function() {
    // Esperar a que Supabase esté disponible
    function waitForSupabase(callback, maxAttempts = 10) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (typeof supabase !== 'undefined') {
                clearInterval(interval);
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.warn('Supabase no cargó correctamente');
            }
        }, 100);
    }

    waitForSupabase(async () => {
        const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';
        
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: localStorage
            }
        });

        // Obtener la página actual
        const paginaActual = window.location.pathname;
        const esIndex = paginaActual.includes('index.html') || paginaActual.endsWith('/') || paginaActual.endsWith('/C-book-Proyecto/');
        const esRegistro = paginaActual.includes('registro.html');
        const esConfirmacion = paginaActual.includes('confirmacionCorreo.html');
        const esPaginaPublica = esIndex || esRegistro || esConfirmacion;

        try {
            const { data: { session }, error } = await client.auth.getSession();
            
            if (error) {
                console.error('Error al verificar sesión:', error);
                if (!esPaginaPublica) {
                    window.location.href = '../index.html';
                }
                return;
            }

            // Si hay sesión activa
            if (session) {
                console.log('Usuario autenticado:', session.user.email);
                
                // Si está en página pública, redirigir a usuario.html
                if (esIndex || esRegistro) {
                    window.location.href = './pantallasUs/usuario.html';
                    return;
                }
            } else {
                // No hay sesión
                console.log('Sin sesión activa');
                
                // Si está en página protegida, redirigir a login
                if (!esPaginaPublica) {
                    window.location.href = '../index.html';
                    return;
                }
            }
        } catch (err) {
            console.error('Error en sessionGuard:', err);
        }

        // Escuchar cambios de autenticación
        client.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_OUT') {
                window.location.href = '../index.html';
            } else if (event === 'SIGNED_IN' && (esIndex || esRegistro)) {
                window.location.href = './pantallasUs/usuario.html';
            }
        });
    });
})();
