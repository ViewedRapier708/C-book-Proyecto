// ---------- funcionesRecursos.js ----------

// Variable global para almacenar el recurso seleccionado
let recursoSeleccionado = null;

/** Carga la tabla #tabla con los recursos del tipo indicado */
async function cargarTabla() {
  const tabla = document.getElementById('tabla');
  
  if (!tabla) {
    console.error('No se encontró la tabla #tabla');
    return;
  }

  const tipo = tabla.dataset.tipo;
  console.log('Cargando tabla de tipo:', tipo);

  // 2️⃣ Construir la URL con query‑string
  const url = new URL('http://localhost:3000/auth/recursos');
  url.searchParams.set('tipo', tipo);

  try {
    // 3️⃣ Petición GET (sin cuerpo)
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();               // esperamos { data: [...] }
    console.log('Datos recibidos para tipo', tipo, ':', json);

    // 4️⃣ Rellenar la tabla
    const filas = Array.isArray(json.data) ? json.data : [];

    //Filas que se ingresan a la tabla 
    console.log('Filas a insertar en la tabla:', filas);
    const tbody = tabla.querySelector('tbody');
   
    // 4.2 Insertar filas
    tbody.innerHTML = '';
    
    if (filas.length === 0) {
      const tr = tbody.insertRow();
      const td = tr.insertCell();
      td.colSpan = tabla.querySelectorAll('th').length; // abarcar todas las columnas
      td.textContent = 'No hay recursos disponibles';
      td.style.textAlign = 'center';
      return; // salir si no hay filas
    }
    
    filas.forEach(reg => {
      const tr = tbody.insertRow();
      const columnas = Object.keys(reg);
      console.log('Insertando fila para registro:', reg);
      
      columnas.forEach(col => {
        const td = tr.insertCell();
        td.textContent = reg[col] != null ? reg[col] === false ?'Disponible' :reg[col] === true ? 'Ocupado' : reg[col] !==true? reg[col] : '' : '';
      });
      
      // Guardar los datos en el atributo data de la fila
      tr.dataset.recurso = JSON.stringify(reg);
    });

    // Inicializar eventos después de cargar los datos
    inicializarEventosTabla();

  } catch (err) {
    console.error('Error al cargar la tabla:', err);
  }
}

// Función para inicializar los eventos de la tabla
function inicializarEventosTabla() {
    console.log('🔧 Inicializando eventos de tabla...');
    
    const tabla = document.querySelector('#tabla');
    let btnApartar = document.querySelector('.btn-apartar');
    const modal = document.querySelector('#modal-confirmacion');
    const btnConfirmar = document.querySelector('#btn-confirmar-solicitud');
    const btnCancelar = document.querySelector('#btn-cancelar-solicitud');
    
    console.log('📋 Elementos encontrados:', {
        tabla: !!tabla,
        btnApartar: !!btnApartar,
        modal: !!modal,
        btnConfirmar: !!btnConfirmar,
        btnCancelar: !!btnCancelar
    });
    
    if (!tabla) {
        console.error('❌ No se encontró la tabla');
        return;
    }
    
    // Agregar eventos a las filas de la tabla
    const filas = tabla.querySelectorAll('tbody tr');
    console.log(`📊 Filas encontradas: ${filas.length}`);
    
    filas.forEach((fila, index) => {
        fila.addEventListener('click', function() {
            console.log(`🖱️ Click en fila ${index + 1}`);
            seleccionarFila(this);
        });
    });
    
    console.log('✅ Eventos de fila configurados');
    
    // Evento para cerrar modal al hacer click fuera
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                window.cerrarModal();
            }
        });
        console.log('✅ Evento de cerrar modal al hacer click fuera configurado');
    }
}

// Función para seleccionar una fila
function seleccionarFila(fila) {
    console.log('✅ Seleccionando fila...');
    
    const tabla = fila.closest('table');
    const todasLasFilas = tabla.querySelectorAll('tbody tr');
    
    // Remover selección previa
    todasLasFilas.forEach(f => f.classList.remove('seleccionada'));
    
    // Seleccionar la fila actual
    fila.classList.add('seleccionada');
    
    // Guardar datos del recurso
    try {
        recursoSeleccionado = JSON.parse(fila.dataset.recurso || '{}');
        console.log('💾 Recurso seleccionado:', recursoSeleccionado);
    } catch (error) {
        console.error('Error al parsear datos del recurso:', error);
        recursoSeleccionado = {};
    }
    
    // Mostrar el botón con animación
    const btnApartar = document.querySelector('.btn-apartar');
    if (btnApartar) {
        console.log('🎬 Aplicando animación al botón...');
        
        // Remover clase de animación si existe
        btnApartar.classList.remove('btn-aparecer');
        
        // Mostrar el botón
        btnApartar.style.display = 'inline-block';
        
        // Forzar reflow para reiniciar la animación
        void btnApartar.offsetWidth;
        
        // Agregar clase de animación
        btnApartar.classList.add('btn-aparecer');
        
        console.log('✨ Animación aplicada');
    } else {
        console.error('❌ No se encontró el botón .btn-apartar');
    }
}

// Función para abrir el modal - GLOBAL
window.abrirModal = function() {
    console.log('🔓 ABRIENDO MODAL...', recursoSeleccionado);
    
    const modal = document.getElementById('modal-confirmacion');
    const tablaBody = document.getElementById('tabla-detalles-body');
    
    if (!modal) {
        alert('ERROR: No se encontró el modal #modal-confirmacion');
        console.error('Modal no encontrado');
        return;
    }
    
    if (!tablaBody) {
        alert('ERROR: No se encontró #tabla-detalles-body');
        console.error('Tabla body no encontrado');
        return;
    }
    
    if (!recursoSeleccionado || Object.keys(recursoSeleccionado).length === 0) {
        alert('Por favor selecciona un recurso de la tabla primero');
        return;
    }
    
    console.log('✅ Todos los elementos encontrados, llenando datos...');
    
    // Limpiar tabla
    tablaBody.innerHTML = '';
    
    // Llenar tabla con los datos del recurso
    for (let key in recursoSeleccionado) {
        if (recursoSeleccionado.hasOwnProperty(key)) {
            let valor = recursoSeleccionado[key];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${key}</strong></td>
                <td>${valor}</td>
            `;
            tablaBody.appendChild(row);
        }
    }
    
    console.log('✅ Datos insertados, mostrando modal...');
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('✅✅✅ MODAL VISIBLE');
}

// Función para cerrar el modal - GLOBAL
window.cerrarModal = function() {
    console.log('🔒 Cerrando modal...');
    
    const modal = document.getElementById('modal-confirmacion');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('✅ Modal cerrado');
    }
}

// Función para confirmar la solicitud - GLOBAL
window.confirmarSolicitud = function() {
    console.log('✅ Confirmando solicitud para:', recursoSeleccionado);
    
    if (!recursoSeleccionado) {
        alert('No hay recurso seleccionado');
        return;
    }
    
    // Construir mensaje legible
    let mensaje = 'Solicitud confirmada exitosamente:\n\n';
    for (let key in recursoSeleccionado) {
        if (recursoSeleccionado.hasOwnProperty(key)) {
            mensaje += `${key}: ${recursoSeleccionado[key]}\n`;
        }
    }
    
    alert(mensaje);
    
    window.cerrarModal();
    
    // Limpiar selección
    const todasLasFilas = document.querySelectorAll('tbody tr');
    todasLasFilas.forEach(f => f.classList.remove('seleccionada'));
    
    const btnApartar = document.querySelector('.btn-apartar');
    if (btnApartar) {
        btnApartar.style.display = 'none';
        btnApartar.classList.remove('btn-aparecer');
    }
    
    recursoSeleccionado = null;
    console.log('✅ Solicitud procesada');
}
}