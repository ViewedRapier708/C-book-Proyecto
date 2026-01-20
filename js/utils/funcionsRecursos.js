// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
// Usamos window.recursoSeleccionado para compartir con userCards.js
if (typeof window.recursoSeleccionado === 'undefined') {
  window.recursoSeleccionado = null;
}

// Getter para mantener compatibilidad con código existente
Object.defineProperty(window, 'recursoSeleccionadoActual', {
  get: function() {
    return window.recursoSeleccionado;
  },
  set: function(value) {
    window.recursoSeleccionado = value;
  }
});

/** Selecciona una fila y muestra el botón Solicitar */
function seleccionarFila(fila) {
  // Remover selección previa
  const filasPrevias = document.querySelectorAll('.fila-recurso.seleccionada');
  filasPrevias.forEach(f => f.classList.remove('seleccionada'));

  // Marcar la fila como seleccionada
  fila.classList.add('seleccionada');

  // Guardar el recurso seleccionado
  window.recursoSeleccionado = JSON.parse(fila.dataset.recurso);

  // Buscar el botón en el .layout (fuera del container-tabla)
  const layout = fila.closest('.layout');
  const btnApartar = layout?.querySelector('.container-btn-apartar .btn-apartar');
  
  if (btnApartar) {
    btnApartar.classList.remove('btn-aparecer');
    void btnApartar.offsetWidth;
    btnApartar.style.display = 'inline-block';
    btnApartar.classList.add('btn-aparecer');
  }
}

/** Abre el modal de confirmación */
function abrirModal() {

  
  if (!window.recursoSeleccionado) {
    alert('Por favor selecciona un recurso primero');
    return;
  }

  const modal = document.getElementById('modal-confirmacion');

  
  if (!modal) {
    console.error('No se encontró el modal de confirmación');
    return;
  }

  // Llenar los datos del modal
  const detallesModal = document.getElementById('detalles-recurso');
  if (detallesModal) {
    let htmlDetalles = '<ul class="lista-detalles">';
    
    for (const [key, value] of Object.entries(window.recursoSeleccionado)) {
      // Formatear el nombre de la clave
      const nombreCampo = formatearNombreCampo(key);
      // Formatear el valor
      const valorFormateado = formatearValor(value);
      
      htmlDetalles += `
        <li>
          <strong>${nombreCampo}:</strong> 
          <span>${valorFormateado}</span>
        </li>`;
    }
    htmlDetalles += '</ul>';
    detallesModal.innerHTML = htmlDetalles;
  }

  // Mostrar el modal con animación
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
}

/** Formatea el nombre del campo para mostrarlo bonito */
function formatearNombreCampo(key) {
  const mapeoNombres = {
    'no_computadora': 'No. Computadora',
    'Observacion': 'Observaciones',
    'procesador': 'Procesador',
    'programas': 'Programas Instalados',
    'carrera': 'Carrera Recomendada',
    'En_funcionamiento': 'En Funcionamiento',
    'Disponible': 'Disponible',
    'titulo': 'Título',
    'autor': 'Autor',
    'clasificacion': 'Clasificación',
    'tipo_material': 'Tipo de Material',
    'anio': 'Año',
    'numero_ejemplar': 'No. Ejemplar',
    'Disponibilidad': 'Disponibilidad',
    'no_restirador': 'No. Restirador',
    'ubicacion': 'Ubicación',
    'capacidad': 'Capacidad'
  };
  
  return mapeoNombres[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/** Formatea el valor para mostrarlo bonito */
function formatearValor(value) {
  if (value === true || value === 'true') return '✅ Sí';
  if (value === false || value === 'false') return '❌ No';
  if (value === null || value === undefined || value === '') return '-';
  if (value === 'Sí' || value === 'Si') return '✅ Sí';
  if (value === 'No') return '❌ No';
  return value;
}

/** Cierra el modal de confirmación */
function cerrarModal() {
  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
  }
}

/** Confirma la solicitud del recurso */
async function confirmarSolicitud() {
  if (!window.recursoSeleccionado) {
    alert('No hay recurso seleccionado');
    return;
  }
  // Obtener el tipo de recurso de la tabla  const tabla = document.getElementById('tabla');
  const tipoRecurso = tabla?.getAttribute('data-tipo') ;
  // Obtener datos del usuario de localStorage (donde se guarda en el login)
  const usuarioData = localStorage.getItem('user_data');
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;
  if (!usuario || !usuario.boleta) {
    mostrarNotificacion('❌ Debes iniciar sesión para hacer una solicitud', 'error');
    return;
  }
  // Obtener el ID del recurso según el tipo
  let idRecurso = null;
  if (tipoRecurso === 'computadora') {
    // Puede ser string "101", convertir a número
    idRecurso = parseInt(window.recursoSeleccionado['No. Computadora'] || window.recursoSeleccionado.no_computadora);
  } else if (tipoRecurso === 'libro') {
    idRecurso = parseInt(
      window.recursoSeleccionado.id ||
      window.recursoSeleccionado.ejemplar_id ||
      window.recursoSeleccionado['ID'] ||
      window.recursoSeleccionado.numero_ejemplar ||
      window.recursoSeleccionado['No. de ejemplar']
    );
  } else if (tipoRecurso === 'restirador') {
    idRecurso = parseInt(window.recursoSeleccionado['ID'] || window.recursoSeleccionado.no_restirador || window.recursoSeleccionado.id);
  }
  if (!idRecurso || isNaN(idRecurso)) {
    mostrarNotificacion('❌ No se pudo identificar el recurso seleccionado', 'error');
    return;
  }
  // Preparar datos de la solicitud según lo que espera el backend
  const solicitud = {
    tipo: tipoRecurso,
    boleta: usuario.boleta,
    idRecurso: idRecurso
  };

  try {
    // Actualizar botón para indicar que se está procesando
    const btnConfirmar = document.getElementById('btn-confirmar-solicitud');
    const textoOriginal = btnConfirmar ? btnConfirmar.textContent : 'Apartar Recurso';

    if (btnConfirmar) {
      btnConfirmar.textContent = 'Procesando...';
      btnConfirmar.disabled = true;
    }
    const API_BASE = window.API_BASE_URL 
    
    const response = await fetch(`${API_BASE}/auth/solicitud`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', // Importante para enviar las cookies de sesión
      body: JSON.stringify(solicitud)
    });

    const resultado = await response.json();
    if (response.ok && resultado.success) {
      // Éxito
      alert('¡Solicitud realizada con éxito!');
      mostrarNotificacion('✅ ¡Solicitud confirmada exitosamente!', 'success');
      cerrarModal();
      
      // Limpiar selección
      limpiarSeleccion();
      
      // Recargar tabla para reflejar cambios
      if (typeof cargarDatosEnTabla === 'function') {
        cargarDatosEnTabla();
      }
    } else {
      // Error del servidor
      mostrarNotificacion(`❌ ${resultado.error|| 'No se pudo procesar la solicitud'}`, 'error');
      cerrarModal();
    }

    // Restaurar botón
    if (btnConfirmar) {
      btnConfirmar.textContent = textoOriginal;
      btnConfirmar.disabled = false;
    }

  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    mostrarNotificacion('❌ Error de conexión. Intenta de nuevo.', 'error');
    
    // Restaurar botón
    const btnConfirmar = document.getElementById('btn-confirmar-solicitud');
    if (btnConfirmar) {
      btnConfirmar.textContent = 'Apartar Recurso';
      btnConfirmar.disabled = false;
    }
  }
}

/** Limpia la selección actual */
function limpiarSeleccion() {
  const filasPrevias = document.querySelectorAll('.fila-recurso.seleccionada');
  filasPrevias.forEach(f => f.classList.remove('seleccionada'));
  
  // Ocultar el botón
  const layout = document.querySelector('.layout');
  const btnApartar = layout?.querySelector('.container-btn-apartar .btn-apartar');
  if (btnApartar) {
    btnApartar.style.display = 'none';
  }
  
  window.recursoSeleccionado = null;
}

/** Muestra una notificación temporal */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Remover notificación previa si existe
  const notifPrevia = document.querySelector('.notificacion-solicitud');
  if (notifPrevia) notifPrevia.remove();

  // Crear el contenedor de notificaciones si no existe
  let notifContainer = document.querySelector('.notificaciones-container');
  if (!notifContainer) {
    notifContainer = document.createElement('div');
    notifContainer.className = 'notificaciones-container';
    notifContainer.style.position = 'fixed';
    notifContainer.style.top = '24px';
    notifContainer.style.right = '24px';
    notifContainer.style.zIndex = '9999';
    notifContainer.style.display = 'flex';
    notifContainer.style.flexDirection = 'column';
    notifContainer.style.gap = '12px';
    document.body.appendChild(notifContainer);
  }

  // Inyectar CSS de animaciones solo una vez
    if (!document.getElementById('notificacion-anim-css')) {
      const style = document.createElement('style');
      style.id = 'notificacion-anim-css';
      style.textContent = `
        @keyframes notifFadeIn {
          from { opacity: 0; transform: translateY(-30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-30px) scale(0.95); }
        }
        .notificacion-solicitud {
          animation: notifFadeIn 0.5s cubic-bezier(.4,1.4,.6,1) both;
          min-width: 260px;
          max-width: 350px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.13);
          padding: 16px 20px 16px 16px;
          font-size: 1rem;
          color: #222;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 5px solid #2196f3;
        }
        .notificacion-success { border-left-color: #43a047; }
        .notificacion-error { border-left-color: #e53935; }
        .notificacion-info { border-left-color: #2196f3; }
        .notificacion-solicitud.animar-entrada {
          animation: notifFadeIn 0.5s cubic-bezier(.4,1.4,.6,1) both;
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
        .notificacion-solicitud.saliendo {
          animation: notifFadeOut 0.45s cubic-bezier(.4,1.4,.6,1) both;
        }
      `;
      document.head.appendChild(style);
    }

  const notif = document.createElement('div');
  notif.className = `notificacion-solicitud notificacion-${tipo}`;
  notif.innerHTML = `
    <span>${mensaje}</span>
    <button style="margin-left:8px; background:none; border:none; font-size:18px; cursor:pointer;" onclick="this.parentElement.remove()">×</button>
  `;

  notifContainer.appendChild(notif);

  // Auto-remover después de 4 segundos con animación de salida
  setTimeout(() => {
    notif.classList.add('saliendo');
    setTimeout(() => notif.remove(), 450);
  }, 4000);
}

/** Inicializa eventos de la tabla (para compatibilidad con RealTime) */
function inicializarEventosTabla() {
  const filas = document.querySelectorAll('.fila-recurso');
  filas.forEach(fila => {
    if (!fila.hasAttribute('data-eventos-init')) {
      fila.addEventListener('click', function() {
        if (typeof window.seleccionarFila === 'function') {
          window.seleccionarFila(this);
        }
      });
      fila.setAttribute('data-eventos-init', 'true');
    }
  });
}

// Exponer funciones globalmente para onclick en HTML y RealTime.js
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.confirmarSolicitud = confirmarSolicitud;
window.seleccionarFila = seleccionarFila;
window.inicializarEventosTabla = inicializarEventosTabla;

// Inicializar cuando se carga el componente
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Inicialización sin logs.
  });
}