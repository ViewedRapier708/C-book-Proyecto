function mostrarVentanaEmergenteDatos(numeroBoleta = '', materialSeleccionado = '') {
    // Si ya existe, la removemos para recrear con valores nuevos
    const existingOverlay = document.getElementById('overlayVentanaEmergenteDatos');
    if (existingOverlay) existingOverlay.remove();

    // inject styles for animations once
    if (!document.getElementById('ventanaEmergenteDatos-styles')) {
        const style = document.createElement('style');
        style.id = 'ventanaEmergenteDatos-styles';
        style.textContent = "@keyframes overlayFade { from { opacity: 0 } to { opacity: 1 } }\n@keyframes popIn { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }\n@keyframes overlayFadeOut { from { opacity: 1 } to { opacity: 0 } }\n@keyframes popOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(8px) scale(.98); } }\n#overlayVentanaEmergenteDatos.overlay-anim { animation: overlayFade .18s ease-out forwards; }\n#ventanaEmergenteDatos.modal-anim { animation: popIn .22s cubic-bezier(.2,.9,.2,1) forwards; transform-origin: center; }\n#overlayVentanaEmergenteDatos.overlay-exit { animation: overlayFadeOut .14s ease-in forwards; }\n#ventanaEmergenteDatos.modal-exit { animation: popOut .16s cubic-bezier(.4,.0,.22,1) forwards; transform-origin: center; }";
        document.head.appendChild(style);
    }

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
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '8px'
    });

    // titulo y mensaje
    const title = document.createElement('h3');
    title.textContent = 'Confirmar solicitud';
    title.style.marginTop = '0';
    modal.appendChild(title);

   
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
    cancelarBtn.addEventListener('click', closeModal);

    // close with exit animation
    function closeModal() {
        // detach potential event listeners later
        document.removeEventListener('keydown', onKeyDown);
        overlay.classList.remove('overlay-anim');
        modal.classList.remove('modal-anim');
        overlay.classList.add('overlay-exit');
        modal.classList.add('modal-exit');
        // remove once modal animation finishes
        const onEnd = () => { if (overlay && overlay.parentNode) overlay.remove(); modal.removeEventListener('animationend', onEnd); };
        modal.addEventListener('animationend', onEnd);
    }

    function onKeyDown(e){ if(e.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onKeyDown);

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
            closeModal();
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

    // trigger entrance animations (add classes after insert so animations run)
    requestAnimationFrame(() => {
        overlay.classList.add('overlay-anim');
        modal.classList.add('modal-anim');
    });
}


function traerDatos() {
var oneTbody = document.querySelector("#tabla tbody"), //Cuerpo de la primera tabla
seleccion = [], //Arreglo que almacenará a las filas seleccionadas
seleccionar = function(event){ //Función a ejecutarse para seleccionar una fila
    if (event.target.tagName == "TD"){ //Si se pulsó una celda
        var fila = event.target.parentNode; //Se almacena en una variable a la fila que la contiene
        
        //Si no está seleccionada
        if (fila.dataset.selected < 1){
            fila.style.backgroundColor = "red"; //Se la pinta de rojo
            fila.style.color = "white"; //Con un texto en blanco
            fila.dataset.selected = 1; //Se asigna el valor 1 al pseudoatributo "data-selected"
            seleccion.push(fila); //Se añade la fila al arreglo de filas seleccionadas
        }
        //Si está seleccionada
        else{
            fila.style.backgroundColor = ""; //Se retira el color de fondo
            fila.style.color = ""; //Y el del texto
            fila.dataset.selected = 0; //El valor del pseudoatributo retorna a 0
            seleccion.splice(seleccion.indexOf(fila), 1); //Se elimina la fila del arreglo  
        }           
    }
}

//Cuando se produzca el evento "click" en la primera tabla, se ejecutará la función "callback"
oneTbody.addEventListener("click", seleccionar, false);
 

}