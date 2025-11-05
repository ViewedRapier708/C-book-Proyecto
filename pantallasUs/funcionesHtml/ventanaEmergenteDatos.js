function mostrarVentanaEmergenteDatos(numeroBoleta = '', materialSeleccionado = '', mensaje = '') {
    // Si ya existe, la removemos para recrear con valores nuevos
    const existingOverlay = document.getElementById('overlayVentanaEmergenteDatos');
    if (existingOverlay) existingOverlay.remove();

    // overlay oscuro
    const overlay = document.createElement('div');
    overlay.id = 'overlayVentanaEmergenteDatos';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10000'
    });

    // modal
    const modal = document.createElement('div');
    modal.id = 'ventanaEmergenteDatos';
    Object.assign(modal.style, {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '6px',
        width: '320px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
    });

    // titulo y mensaje
    const title = document.createElement('h3');
    title.textContent = 'Enviar datos';
    title.style.marginTop = '0';
    modal.appendChild(title);

    if (mensaje) {
        const msgP = document.createElement('p');
        msgP.textContent = mensaje;
        modal.appendChild(msgP);
    }

    // helper para filas
    function fila(labelText, control) {
        const row = document.createElement('div');
        row.style.marginBottom = '10px';
        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.fontSize = '13px';
        label.style.marginBottom = '4px';
        row.appendChild(label);
        row.appendChild(control);
        return row;
    }

    // campos de solo lectura
    const boletaSpan = document.createElement('span');
    boletaSpan.textContent = numeroBoleta;
    boletaSpan.style.display = 'inline-block';
    boletaSpan.style.padding = '8px';
    boletaSpan.style.width = '100%';
    boletaSpan.style.background = '#f5f5f5';
    boletaSpan.style.border = '1px solid #ddd';
    modal.appendChild(fila('Número de boleta (vista)', boletaSpan));

    const materialSpan = document.createElement('span');
    materialSpan.textContent = materialSeleccionado;
    materialSpan.style.display = 'inline-block';
    materialSpan.style.padding = '8px';
    materialSpan.style.width = '100%';
    materialSpan.style.background = '#f5f5f5';
    materialSpan.style.border = '1px solid #ddd';
    modal.appendChild(fila('Material seleccionado (vista)', materialSpan));

    // inputs editables
    const inputGrupo = document.createElement('input');
    inputGrupo.type = 'text';
    inputGrupo.placeholder = 'Ej. A';
    inputGrupo.style.width = '100%';
    inputGrupo.style.padding = '8px';
    inputGrupo.style.boxSizing = 'border-box';
    modal.appendChild(fila('Grupo (input)', inputGrupo));

    const inputSemestre = document.createElement('input');
    inputSemestre.type = 'number';
    inputSemestre.min = '1';
    inputSemestre.placeholder = 'Ej. 3';
    inputSemestre.style.width = '100%';
    inputSemestre.style.padding = '8px';
    inputSemestre.style.boxSizing = 'border-box';
    modal.appendChild(fila('Semestre (input)', inputSemestre));

    const inputCarrera = document.createElement('input');
    inputCarrera.type = 'text';
    inputCarrera.placeholder = 'Ej. Ingeniería';
    inputCarrera.style.width = '100%';
    inputCarrera.style.padding = '8px';
    inputCarrera.style.boxSizing = 'border-box';
    modal.appendChild(fila('Carrera (input)', inputCarrera));

    // botones
    const botones = document.createElement('div');
    botones.style.display = 'flex';
    botones.style.justifyContent = 'flex-end';
    botones.style.gap = '8px';
    botones.style.marginTop = '12px';

    const cancelarBtn = document.createElement('button');
    cancelarBtn.type = 'button';
    cancelarBtn.textContent = 'Cancelar';
    Object.assign(cancelarBtn.style, {
        padding: '8px 12px',
        background: '#eee',
        border: '1px solid #ccc',
        cursor: 'pointer'
    });
    cancelarBtn.addEventListener('click', () => overlay.remove());

    const enviarBtn = document.createElement('button');
    enviarBtn.type = 'button';
    enviarBtn.textContent = 'Enviar';
    Object.assign(enviarBtn.style, {
        padding: '8px 12px',
        background: '#0078d4',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
    });

    enviarBtn.addEventListener('click', async () => {
        const payload = {
            numeroBoleta: numeroBoleta,
            materialSeleccionado: materialSeleccionado,
            grupo: inputGrupo.value.trim(),
            semestre: inputSemestre.value.trim(),
            carrera: inputCarrera.value.trim()
        };

        // Validación simple
        if (!payload.grupo || !payload.semestre || !payload.carrera) {
            alert('Por favor rellena todos los campos requeridos.');
            return;
        }

        try {
            // Cambia la URL '/enviarDatos' por la que necesites
            const res = await fetch('/enviarDatos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Error en la petición');

            const data = await res.json().catch(() => ({}));
            alert('Enviado correctamente.');
            overlay.remove();
            // puedes manejar "data" si necesitas mostrar respuesta del servidor
        } catch (err) {
            console.error(err);
            alert('No se pudo enviar. Revisa la consola.');
        }
    });

    botones.appendChild(cancelarBtn);
    botones.appendChild(enviarBtn);
    modal.appendChild(botones);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}