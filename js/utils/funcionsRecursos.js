// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
let recursoSeleccionado = null;

/** Inicializa los event listeners para las filas de la tabla */
function inicializarEventosTabla() {
  const tabla = document.getElementById('tabla');
  if (!tabla) return;

  const filas = tabla.querySelectorAll('tbody tr');
  filas.forEach(fila => {
    // Extraer datos de la fila
    const celdas = fila.querySelectorAll('td');
    if (celdas.length > 0) {
      const datos = {};
      const headers = tabla.querySelectorAll('thead th');
      
      celdas.forEach((celda, index) => {
        if (headers[index]) {
          const nombreColumna = headers[index].textContent.trim();
          datos[nombreColumna] = celda.textContent.trim();
        }
      });
      
      // Guardar datos en el dataset de la fila
      fila.dataset.recurso = JSON.stringify(datos);
      fila.classList.add('fila-recurso');
      
      // Agregar evento de clic
      fila.addEventListener('click', function() {
        seleccionarFila(this);
      });
    }
  });

  console.log('Event listeners inicializados para', filas.length, 'filas');
}

/** Carga la tabla #tabla con los recursos del tipo indicado */
async function cargarTabla() {
  const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
  const tabla = document.getElementById('tabla');
  
  if (!tabla) {
    console.error('No se encontró la tabla #tabla');
    return;
  }

  const tipo = tabla.dataset.tipo;
  console.log('Cargando tabla de tipo:', tipo);

  // Construir la URL con query‑string
  const url = new URL(`${API_BASE}/auth/recursos`);
  url.searchParams.set('tipo', tipo);

  try {
    // Petición GET (con credenciales)
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (resp.status === 401 || resp.status === 403) {
      mostrarNotificacion('⚠️ Debes iniciar sesión para ver los recursos.', 'error');
      // Opcional: window.location.href = '/pantallasUs/registro.html';
      return;
    }

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    console.log('Datos recibidos para tipo', tipo, ':', json);

    // Rellenar la tabla
    const filas = Array.isArray(json.data) ? json.data : [];

    console.log('Filas a insertar en la tabla:', filas);
    const tbody = tabla.querySelector('tbody');
   
    // Insertar filas
    tbody.innerHTML = '';
    
    if (filas.length === 0) {
      const tr = tbody.insertRow();
      const td = tr.insertCell();
      td.colSpan = tabla.querySelectorAll('th').length;
      td.textContent = 'No hay recursos disponibles';
      td.style.textAlign = 'center';
      return;
    }
    
    filas.forEach(reg => {
      const tr = tbody.insertRow();
      tr.classList.add('fila-recurso');
      tr.dataset.recurso = JSON.stringify(reg);

      const columnas = Object.keys(reg);
      console.log('Insertando fila para registro:', reg);
      
      columnas.forEach(col => {
        const td = tr.insertCell();
        td.textContent = reg[col] != null ? reg[col] === false ? 'Disponible' : reg[col] === true ? 'Ocupado' : reg[col] !== true ? reg[col] : '' : '';
      });

      // Agregar evento de clic a la fila
      tr.addEventListener('click', function() {
        seleccionarFila(this);
      });
    });

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
    // Si falla la carga del API, usar los datos estáticos que ya están en el HTML
    console.log('Usando datos estáticos de la tabla HTML');
    inicializarEventosTabla();
  }
}

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

  // Mostrar loading
  const btnConfirmar = document.getElementById('btn-confirmar-solicitud');
  const textoOriginal = btnConfirmar?.textContent;
  if (btnConfirmar) {
    btnConfirmar.textContent = 'Procesando...';
    btnConfirmar.disabled = true;
  }

  // Usar helper global para enviar la solicitud
  try {
    const resultado = await window.SolicitudRecursos(tipoRecurso, usuario.boleta, idRecurso);
    console.log('Respuesta del servidor:', resultado);

    if (resultado.success) {
      mostrarNotificacion('✅ ¡Solicitud confirmada exitosamente!', 'success');
      cerrarModal();
      limpiarSeleccion();
      if (typeof cargarDatosTabla === 'function') {
        cargarDatosTabla();
      }
    } else {
      mostrarNotificacion(`❌ ${resultado.message || 'No se pudo procesar la solicitud'}`, 'error');
    }
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    mostrarNotificacion('❌ Error de conexión. Intenta de nuevo.', 'error');
  }
  // Restaurar botón
  if (btnConfirmar) {
    btnConfirmar.textContent = textoOriginal || 'Apartar Recurso';
    btnConfirmar.disabled = false;
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