// Cliente de Supabase para el frontend
const SUPABASE_URL = 'https://yondcnkwcekmkovdeaso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmRjbmt3Y2VrbWtvdmRlYXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2ODYyMDQsImV4cCI6MjA3NjI2MjIwNH0.4NqF_hCv7RiXrOjO9fxfRHPzikpZ61siqMZV_rlUQew';

// Importar Supabase desde CDN (agregar en el HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>)
let supabaseClient = null;

function getSupabaseClient() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: localStorage
            }
        });
    }
    return supabaseClient;
}

// Verificar si hay sesión activa
async function verificarSesion() {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
        console.error('Error al verificar sesión:', error);
        return null;
    }
    return session;
}

// Obtener usuario actual
async function obtenerUsuarioActual() {
    const client = getSupabaseClient();
    if (!client) return null;
    
    const { data: { user }, error } = await client.auth.getUser();
    if (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
    return user;
}

// Escuchar cambios de sesión
function escucharCambiosSesion(callback) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    return client.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        callback(event, session);
    });
}
