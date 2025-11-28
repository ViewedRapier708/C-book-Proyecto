// Registro de usuario - Llama al backend
async function registro(event) {
    event.preventDefault();

    const boleta = document.getElementById('boleta').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('contrasena').value;
    const confPsw = document.getElementById('confirmar_contrasena').value;
    const mensajeDiv = document.querySelector('.messaje');

    // Validaciones básicas en frontend
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

        // Llamar al backend
        const res = await fetch('http://localhost:3000/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ boleta, correo, password, confPsw })
        });

        const data = await res.json();
        console.log('Registro response:', data); //debug

        if (!res.ok) {
            mensajeDiv.textContent = data.error || 'Error al registrar';
            mensajeDiv.style.color = 'red';
            return false;
        }

        // Guardar datos en localStorage para la verificación
        localStorage.setItem('datosRegistro', JSON.stringify({
            boleta,
            correo,
            grupo
        }));

        // Registro exitoso
        mensajeDiv.textContent = data.message || '¡Registro exitoso! Revisa tu correo.';
        mensajeDiv.style.color = 'green';

        // Redirigir a confirmación
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

// Asignar al formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-registro');
    if (form) {
        form.addEventListener('submit', registro);
    }
});
