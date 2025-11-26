async function iniciarSesion(event) {
    event.preventDefault(); // Evita que el formulario recargue la página

    const boleta = document.getElementById('boleta').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.querySelector('.messaje');
  

    // Validaciones simples antes de enviar
    if (!boleta || !password) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos';
        mensajeDiv.style.color = 'red';
        return;
    }

    try {
        // Enviar datos al backend
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boleta, password })
        });
        
        const data = await res.json();
        console.log('Login status:', res.status, 'respuesta:', data);
        if (!res.ok) {
            mensajeDiv.textContent = `${data.mensaje || 'Usuario o contraseña incorrectos'}`;
            mensajeDiv.style.color = 'red';
        } else {
            // Guardar sesión de Supabase en localStorage
            if (data.session && data.session.access_token) {
                localStorage.setItem('sb-access-token', data.session.access_token);
                localStorage.setItem('sb-refresh-token', data.session.refresh_token);
                if (data.user) {
                    localStorage.setItem('sb-user', JSON.stringify(data.user));
                }
            }

            mensajeDiv.textContent = `${data.mensaje || 'Inicio de sesión correcto'}`;
            mensajeDiv.style.color = 'green';
            // Redirigir al dashboard
            setTimeout(() => {
                console.log('Redirigiendo a pantallasUs/usuario.html');
                window.location.href = './pantallasUs/usuario.html';
            }, 600);
        }
        return false; // asegura que el form no recargue

    } catch (error) {
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        console.error(error);
    }
}
