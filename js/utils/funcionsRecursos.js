// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
let recursoSeleccionado = null;



/** Selecciona una fila y muestra el botón Solicitar */
function seleccionarFila(fila) {
  // Remover selección previa
  const filasPrevias = document.querySelectorAll('.fila-recurso.seleccionada');
  filasPrevias.forEach(f => f.classList.remove('seleccionada'));

  // Marcar la fila como seleccionada
  fila.classList.add('seleccionada');

  // Guardar el recurso seleccionado
  recursoSeleccionado = JSON.parse(fila.dataset.recurso);

  console.log('Recurso seleccionado:', recursoSeleccionado);

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
  console.log('=== ABRIENDO MODAL ===');
  console.log('Recurso seleccionado:', recursoSeleccionado);
  
  if (!recursoSeleccionado) {
    alert('Por favor selecciona un recurso primero');
    return;
  }

  const modal = document.getElementById('modal-confirmacion');
  console.log('Modal encontrado:', modal ? 'SI' : 'NO');
  
  if (!modal) {
    console.error('No se encontró el modal de confirmación');
    return;
  }

  // Llenar los datos del modal
  const detallesModal = document.getElementById('detalles-recurso');
  console.log('Contenedor de detalles encontrado:', detallesModal ? 'SI' : 'NO');
  
  if (detallesModal) {
    let htmlDetalles = '<ul class="lista-detalles">';
    
    for (const [key, value] of Object.entries(recursoSeleccionado)) {
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
    console.log('Datos insertados en el modal');
  }

  // Mostrar el modal con animación
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  console.log('Modal visible');
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
  console.log('=== CERRANDO MODAL ===');
  const modal = document.getElementById('modal-confirmacion');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
  }
}

/** Confirma la solicitud del recurso */
async function confirmarSolicitud() {
  if (!recursoSeleccionado) {
    alert('No hay recurso seleccionado');
    return;
  }

  console.log('Confirmando solicitud para:', recursoSeleccionado);
  
  // Obtener el tipo de recurso de la tabla
  const tabla = document.getElementById('tabla');
  const tipoRecurso = tabla?.getAttribute('data-tipo') || 'desconocido';
  
  // Obtener datos del usuario de localStorage (donde se guarda en el login)
  const usuarioData = localStorage.getItem('user_data');
  const usuario = usuarioData ? JSON.parse(usuarioData) : null;
  
  console.log('Usuario encontrado:', usuario);
  
  if (!usuario || !usuario.boleta) {
    mostrarNotificacion('❌ Debes iniciar sesión para hacer una solicitud', 'error');
    return;
  }

  // Obtener el ID del recurso según el tipo
  let idRecurso = null;
  if (tipoRecurso === 'computadora') {
    // Puede ser string "101", convertir a número
    idRecurso = parseInt(recursoSeleccionado['No. Computadora'] || recursoSeleccionado.no_computadora);
  } else if (tipoRecurso === 'libro') {
    idRecurso = parseInt(recursoSeleccionado['No. de ejemplar'] || recursoSeleccionado.numero_ejemplar);
  } else if (tipoRecurso === 'restirador') {
    idRecurso = parseInt(recursoSeleccionado['ID'] || recursoSeleccionado.no_restirador || recursoSeleccionado.id);
  }

  console.log('ID del recurso:', idRecurso, 'Tipo:', tipoRecurso);

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

  console.log('Enviando solicitud:', solicitud);

  try {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
    
    // Mostrar loading
    const btnConfirmar = document.getElementById('btn-confirmar-solicitud');
    const textoOriginal = btnConfirmar?.textContent;
    if (btnConfirmar) {
      btnConfirmar.textContent = 'Procesando...';
      btnConfirmar.disabled = true;
    }

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
    console.log('Respuesta del servidor:', resultado);

    if (response.ok && resultado.success) {
      // Éxito
      mostrarNotificacion('✅ ¡Solicitud confirmada exitosamente!', 'success');
      cerrarModal();
      
      // Limpiar selección
      limpiarSeleccion();
      
      // Recargar tabla para reflejar cambios
      if (typeof cargarDatosTabla === 'function') {
        cargarDatosTabla();
      }
    } else {
      // Error del servidor
      mostrarNotificacion(`❌ ${resultado.message || 'No se pudo procesar la solicitud'}`, 'error');
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
  
  recursoSeleccionado = null;
}

/** Muestra una notificación temporal */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Remover notificación previa si existe
  const notifPrevia = document.querySelector('.notificacion-solicitud');
  if (notifPrevia) notifPrevia.remove();

  const notif = document.createElement('div');
  notif.className = `notificacion-solicitud notificacion-${tipo}`;
  notif.innerHTML = `
    <span>${mensaje}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notif);
  
  // Auto-remover después de 4 segundos
  setTimeout(() => {
    notif.classList.add('notificacion-salir');
    setTimeout(() => notif.remove(), 300);
  }, 4000);
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
    console.log('funcionsRecursos.js cargado y listo');
  });
}