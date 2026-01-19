// Iniciar sesión - Llama al backend
// Soporta tanto login de usuario como de administrador

async function iniciarSesion(event) {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
    event.preventDefault();

    const identificador = document.getElementById('boleta').value.trim();
    const password = document.getElementById('password').value;
    const mensajeDiv = document.querySelector('.messaje');

    // Validaciones básicas
    if (!identificador || !password) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^\d{10}$/.test(identificador)) {
        mensajeDiv.textContent = 'El identificador debe tener exactamente 10 dígitos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    try {
        mensajeDiv.textContent = 'Verificando credenciales...';
        mensajeDiv.style.color = 'blue';

        console.log('Intentando login para identificador:', identificador);

        // PRIMERO: Intentar login como administrador
        try {
            const adminRes = await fetch(`${API_BASE}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ identificador, password })
            });

            const adminData = await adminRes.json();

            if (adminRes.ok && adminData.success) {
                console.log('Login de administrador exitoso:', adminData);
                
                // Guardar información de admin en localStorage
                localStorage.setItem('adminSession', JSON.stringify({
                    identificador: adminData.data.identificador,
                    rol: adminData.data.rol,
                    loginTime: new Date().toISOString()
                }));

                mensajeDiv.textContent = '¡Bienvenido, Administrador!';
                mensajeDiv.style.color = 'green';

                // Redirigir al panel de administrador
                setTimeout(() => {
                    window.location.href = './PantallasAdmin/admin.html';
                }, 400);

                return false;
            }
        } catch (adminErr) {
            console.log('No es admin, intentando como usuario normal');
        }

        // SEGUNDO: Si no es admin, intentar como usuario normal
        const userRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boleta: identificador, password })
        });

        const userData = await userRes.json();
        console.log('Login response:', userData);

        if (!userRes.ok) {
            mensajeDiv.textContent = userData.error || 'Credenciales incorrectas';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Login de usuario exitoso
        console.log('Login de usuario exitoso:', userData);
        
        // Guardar datos del usuario en localStorage
        if (userData.user) {
            localStorage.setItem('user_data', JSON.stringify(userData.user));
        }

        mensajeDiv.textContent = '¡Inicio de sesión exitoso!';
        mensajeDiv.style.color = 'green';

        // Redirigir al dashboard de usuario
        setTimeout(() => {
            window.location.href = './pantallasUs/usuario.html';
        }, 400);

        return false;

    } catch (err) {
        console.error('Error en iniciarSesion:', err);
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        return false;
    }
}
