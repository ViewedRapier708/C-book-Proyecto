// Registro de usuario con Supabase
async function registro(event) {
event.preventDefault();

    const boleta = document.getElementById('boleta').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('contrasena').value;
    const confPsw = document.getElementById('confirmar_contrasena').value;
    const grupo = document.getElementById('grupo')?.value || '';
    const mensajeDiv = document.querySelector('.messaje');

    // Validaciones
    if (!boleta || !correo || !password || !confPsw) {
        mensajeDiv.textContent = 'Por favor, complete todos los campos obligatorios';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^\d{10}$/.test(boleta)) {
        mensajeDiv.textContent = 'La boleta debe tener exactamente 10 dígitos numéricos';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
        mensajeDiv.textContent = 'Correo con formato inválido';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password.length < 6 || password.length > 16) {
        mensajeDiv.textContent = 'La contraseña debe tener entre 6 y 16 caracteres';
        mensajeDiv.style.color = 'red';
        return false;
    }

    if (password !== confPsw) {
        mensajeDiv.textContent = 'Las contraseñas no coinciden';
        mensajeDiv.style.color = 'red';
        return false;
    }

    try {
        mensajeDiv.textContent = 'Registrando usuario...';
        mensajeDiv.style.color = 'blue';

        // Enviar al backend con credentials para mantener la sesión
        const res = await fetch('http://localhost:3000/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Importante para enviar/recibir cookies de sesión
            body: JSON.stringify({ boleta, correo, password, confPsw, grupo })
        });

        const data = await res.json();
        console.log('Registro response:', res.status, data);
        alert(JSON.stringify(data));

        if (!res.ok) {
            mensajeDiv.textContent = data.error || 'Error al registrar';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Registro exitoso
        mensajeDiv.textContent = '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.';
        mensajeDiv.style.color = 'green';

    

        // Redirigir a página de confirmación después de 2 segundos
        setTimeout(() => {
            window.location.href = 'confirmacionCorreo.html';
        }, 2000);

        return false;

    } catch (err) {
        console.error('Error en registro:', err);
        mensajeDiv.textContent = 'Error de conexión al servidor';
        mensajeDiv.style.color = 'red';
        return false;
    }
}

// Asignar al formulario cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro');
    if (form) {
        form.addEventListener('submit', registro);
    }
});
