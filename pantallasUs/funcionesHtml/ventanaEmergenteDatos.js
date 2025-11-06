    function mostrarVentanaEmergenteDatos(numeroBoleta = '', materialSeleccionado = '') {
      const existingOverlay = document.getElementById('overlayVentanaEmergenteDatos');
      if (existingOverlay) existingOverlay.remove();

      if (!document.getElementById('ventanaEmergenteDatos-styles')) {
        const style = document.createElement('style');
        style.id = 'ventanaEmergenteDatos-styles';
        style.textContent =
          "@keyframes overlayFade { from { opacity: 0 } to { opacity: 1 } }" +
          "@keyframes popIn { from { opacity: 0; transform: translateY(-10px) scale(.98);} to { opacity: 1; transform: translateY(0) scale(1);} }" +
          "@keyframes overlayFadeOut { from { opacity: 1 } to { opacity: 0 } }" +
          "@keyframes popOut { from { opacity: 1; transform: translateY(0) scale(1);} to { opacity: 0; transform: translateY(8px) scale(.98);} }" +
          "#overlayVentanaEmergenteDatos.overlay-anim { animation: overlayFade .18s ease-out forwards; }" +
          "#ventanaEmergenteDatos.modal-anim { animation: popIn .22s cubic-bezier(.2,.9,.2,1) forwards; transform-origin: center; }" +
          "#overlayVentanaEmergenteDatos.overlay-exit { animation: overlayFadeOut .14s ease-in forwards; }" +
          "#ventanaEmergenteDatos.modal-exit { animation: popOut .16s cubic-bezier(.4,.0,.22,1) forwards; transform-origin: center; }";
        document.head.appendChild(style);
      }

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

      const modal = document.createElement('div');
      modal.id = 'ventanaEmergenteDatos';
      Object.assign(modal.style, {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        width: '320px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      });

      const title = document.createElement('h3');
      title.textContent = 'Enviar solicitud';
      modal.appendChild(title);

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

      const boletaSpan = document.createElement('span');
      boletaSpan.textContent = numeroBoleta;
      Object.assign(boletaSpan.style, {
        display: 'inline-block', padding: '8px', width: '100%',
        background: '#f5f5f5', border: '1px solid #ddd'
      });
      modal.appendChild(fila('Número de boleta', boletaSpan));

      const materialSpan = document.createElement('span');
      materialSpan.textContent = materialSeleccionado;
      Object.assign(materialSpan.style, {
        display: 'inline-block', padding: '8px', width: '100%',
        background: '#f5f5f5', border: '1px solid #ddd'
      });
      modal.appendChild(fila('Material seleccionado', materialSpan));

      const inputGrupo = document.createElement('input');
      inputGrupo.type = 'text';
      inputGrupo.placeholder = 'Ej. A';
      inputGrupo.style.width = '100%';
      inputGrupo.style.padding = '8px';
      modal.appendChild(fila('Grupo', inputGrupo));

      const inputSemestre = document.createElement('input');
      inputSemestre.type = 'number';
      inputSemestre.min = '1';
      inputSemestre.placeholder = 'Ej. 3';
      inputSemestre.style.width = '100%';
      inputSemestre.style.padding = '8px';
      modal.appendChild(fila('Semestre', inputSemestre));

      const inputCarrera = document.createElement('input');
      inputCarrera.type = 'text';
      inputCarrera.placeholder = 'Ej. Ingeniería';
      inputCarrera.style.width = '100%';
      inputCarrera.style.padding = '8px';
      modal.appendChild(fila('Carrera', inputCarrera));

      const botones = document.createElement('div');
      botones.style.display = 'flex';
      botones.style.justifyContent = 'flex-end';
      botones.style.gap = '8px';
      botones.style.marginTop = '12px';

      const cancelarBtn = document.createElement('button');
      cancelarBtn.textContent = 'Cancelar';
      Object.assign(cancelarBtn.style, {
        padding: '8px 12px',
        background: '#eee',
        border: '1px solid #ccc',
        cursor: 'pointer'
      });
      cancelarBtn.addEventListener('click', closeModal);

      const enviarBtn = document.createElement('button');
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
          numeroBoleta,
          materialSeleccionado,
          grupo: inputGrupo.value.trim(),
          semestre: inputSemestre.value.trim(),
          carrera: inputCarrera.value.trim()
        };

        if (!payload.grupo || !payload.semestre || !payload.carrera) {
          alert('Por favor rellena todos los campos requeridos.');
          return;
        }

        try {
          const res = await fetch('/enviarDatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error('Error en la petición');
          const data = await res.json().catch(() => ({}));
          alert('✅ Enviado correctamente.');
          closeModal();
        } catch (err) {
          console.error(err);
          alert('❌ No se pudo enviar. Revisa la consola.');
        }
      });

      botones.appendChild(cancelarBtn);
      botones.appendChild(enviarBtn);
      modal.appendChild(botones);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      function closeModal() {
        document.removeEventListener('keydown', onKeyDown);
        overlay.classList.add('overlay-exit');
        modal.classList.add('modal-exit');
        setTimeout(() => overlay.remove(), 200);
      }

      function onKeyDown(e) { if (e.key === 'Escape') closeModal(); }
      document.addEventListener('keydown', onKeyDown);

      requestAnimationFrame(() => {
        overlay.classList.add('overlay-anim');
        modal.classList.add('modal-anim');
      });
    }

    // ===========================
    // FUNCION DE SELECCION DE FILA
    // ===========================
    function traerDatos() {
      const tabla = document.getElementById("tabla");
      let filaSeleccionada = null;

      tabla.addEventListener("click", (event) => {
        if (event.target.tagName === "TD") {
          const fila = event.target.parentNode;

          if (filaSeleccionada) filaSeleccionada.style.backgroundColor = "";
          fila.style.backgroundColor = "#d0ebff";
          filaSeleccionada = fila;

          const celdas = fila.querySelectorAll("td");
          const numeroBoleta = celdas[0].textContent.trim();
          const materialSeleccionado = celdas[1].textContent.trim();

          // Abrir modal con esos datos
          mostrarVentanaEmergenteDatos(numeroBoleta, materialSeleccionado);
        }
      });
    }

    window.addEventListener("DOMContentLoaded", traerDatos);
