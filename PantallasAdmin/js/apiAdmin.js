const API_BASE = window.API_BASE_URL || '';
const PAGE_LIMIT = 10;

// ==================== UTILIDADES ====================

// Debounce para búsqueda optimizada
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Maps globales para almacenar datos completos por ID
const librosMap = new Map();
const computadorasMap = new Map();
const restiradoresMap = new Map();
const usuariosMap = new Map();
const prestamosMap = new Map();

// Variables de paginación por módulo
const CARDS_LIBROS = 3;
const CARDS_COMPUTADORAS = 4;
const CARDS_RESTIRADORES = 6;
const CARDS_USUARIOS = 6;
const CARDS_PRESTAMOS = 3;

let librosDataOriginal = [];
let librosFiltrados = [];
let paginaActualLibros = 0;

let computadorasDataOriginal = [];
let computadorasFiltradas = [];
let paginaActualComputadoras = 0;

let restiradoresDataOriginal = [];
let restiradoresFiltrados = [];
let paginaActualRestiradores = 0;

let usuariosDataOriginal = [];
let usuariosFiltrados = [];
let paginaActualUsuarios = 0;

let prestamosDataOriginal = [];
let prestamosFiltrados = [];
let paginaActualPrestamos = 0;

const adminState = {
	libros: { page: 1, total: 0, limit: PAGE_LIMIT },
	computadoras: { page: 1, total: 0, limit: PAGE_LIMIT },
	restiradores: { page: 1, total: 0, limit: PAGE_LIMIT },
	usuarios: { page: 1, total: 0, limit: PAGE_LIMIT },
    solicitudesLibros: { page: 1, total: 0, limit: PAGE_LIMIT },
    prestamosLibros: { page: 1, total: 0, limit: PAGE_LIMIT }
};

function formatBoolean(value) {
	return value ? 'Sí' : 'No';
}

function formatEstadoMaterial(value) {
	return value ? 'Funcional' : 'Dañado';
}

const TIME_ZONE_MEXICO = 'America/Mexico_City';
const ZONA_MEXICO_LABEL = 'Hora de México (CDT/CST)';

function formatFechaMexico(value) {
	if (!value) return '-';
	const fecha = new Date(value);
	if (Number.isNaN(fecha.getTime())) return '-';
	const texto = fecha.toLocaleString('es-MX', {
		timeZone: TIME_ZONE_MEXICO,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});
	return `${texto} ${ZONA_MEXICO_LABEL}`;
}

async function requestJson(path, options = {}) {
	const response = await fetch(`${API_BASE}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {})
		},
		credentials: 'include',
		cache: 'no-store',
		...options
	});

	const data = await response.json();

	if (!response.ok || data?.success === false) {
		throw new Error(data?.message || 'Error en la solicitud');
	}

	return data;
}

function mostrarMensaje(container, tipo, mensaje) {
	if (!container) return;
	container.textContent = mensaje;
	container.classList.remove('success', 'error', 'warning', 'info');
	container.classList.add(tipo);
	container.hidden = false;
}

function ocultarMensaje(container) {
	if (!container) return;
	container.hidden = true;
	container.textContent = '';
	container.classList.remove('success', 'error', 'warning', 'info');
}

let toastContainer = null;

function obtenerToastContainer() {
	if (toastContainer) return toastContainer;
	const container = document.createElement('div');
	container.className = 'toast-container';
	container.setAttribute('role', 'status');
	container.setAttribute('aria-live', 'polite');
	container.setAttribute('aria-atomic', 'true');
	document.body.appendChild(container);
	toastContainer = container;
	return toastContainer;
}

function mostrarToast(mensaje, tipo = 'success') {
	const container = obtenerToastContainer();
	if (!container) return;
	const toast = document.createElement('div');
	toast.className = `toast toast-${tipo}`;
	toast.textContent = mensaje;
	container.appendChild(toast);

	requestAnimationFrame(() => {
		toast.classList.add('visible');
	});

	const cerrarToast = () => {
		toast.classList.remove('visible');
		toast.addEventListener('transitionend', () => toast.remove(), { once: true });
	};

	const timeoutId = window.setTimeout(cerrarToast, 4000);
	toast.addEventListener('click', () => {
		window.clearTimeout(timeoutId);
		cerrarToast();
	});
}

function actualizarTotal(tipo, total) {
	const totalElement = document.querySelector(`[data-total="${tipo}"]`);
	if (totalElement) {
		totalElement.textContent = `Total: ${total ?? 0}`;
	}
}

function actualizarPaginacion(tipo) {
	const paginacion = document.querySelector(`[data-paginacion="${tipo}"]`);
	if (!paginacion) return;
	const { page, total, limit } = adminState[tipo];
	const prevBtn = paginacion.querySelector('[data-prev]');
	const nextBtn = paginacion.querySelector('[data-next]');
	const pageLabel = paginacion.querySelector('.pagina-actual');

	const hasPrev = page > 1;
	const hasNextByTotal = page * limit < (total || 0);
	const hasNextByCount = adminState[tipo].lastCount === limit;
	const hasNext = hasNextByTotal || hasNextByCount || ((total || 0) > limit);

	if (prevBtn) prevBtn.disabled = !hasPrev;
	if (nextBtn) nextBtn.disabled = !hasNext;
	if (pageLabel) pageLabel.textContent = `Página ${page}`;
}

function configurarPaginacion(tipo, onReload) {
	const paginacion = document.querySelector(`[data-paginacion="${tipo}"]`);
	if (!paginacion) return;
	const prevBtn = paginacion.querySelector('[data-prev]');
	const nextBtn = paginacion.querySelector('[data-next]');

	if (prevBtn) {
		prevBtn.addEventListener('click', () => {
			if (adminState[tipo].page > 1) {
				adminState[tipo].page -= 1;
				onReload();
			}
		});
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', () => {
			adminState[tipo].page += 1;
			onReload();
		});
	}
}

function configurarRecarga(tipo, onReload) {
	const boton = document.querySelector(`[data-recargar="${tipo}"]`);
	if (!boton) return;
	boton.addEventListener('click', () => {
		onReload();
	});
}

function obtenerDetalleUsuario(usuario) {
	return [
		`<p><strong>Boleta:</strong> ${usuario.boleta ?? 'N/A'}</p>`,
		`<p><strong>Correo:</strong> ${usuario.correo ?? 'N/A'}</p>`,
		`<p><strong>Rol:</strong> ${usuario.rol ?? 'N/A'}</p>`,
		`<p><strong>Documentación:</strong> ${formatBoolean(usuario.tiene_documentos)}</p>`
	].join('');
}

let confirmacionActual = null;
let confirmacionInicializada = false;

function abrirConfirmacion({ titulo, mensaje, detalle }) {
	const modal = document.getElementById('modalConfirmacion');
	const tituloEl = document.getElementById('modal-confirmacion-titulo');
	const mensajeEl = document.getElementById('modal-confirmacion-mensaje');
	const detalleEl = document.getElementById('modal-confirmacion-detalle');

	if (!modal) return Promise.resolve(false);

	if (tituloEl) tituloEl.textContent = titulo;
	if (mensajeEl) mensajeEl.textContent = mensaje;
	if (detalleEl) detalleEl.innerHTML = detalle || '';

	modal.classList.add('activo');

	return new Promise((resolve) => {
		confirmacionActual = resolve;
	});
}

function cerrarConfirmacion(resultado) {
	const modal = document.getElementById('modalConfirmacion');
	if (modal) modal.classList.remove('activo');
	if (confirmacionActual) {
		confirmacionActual(resultado);
		confirmacionActual = null;
	}
}

function inicializarModalConfirmacion() {
	if (confirmacionInicializada) return;
	const modal = document.getElementById('modalConfirmacion');
	const cerrarBtn = document.getElementById('modal-confirmacion-cerrar');
	const cancelarBtn = document.getElementById('modal-confirmacion-cancelar');
	const aceptarBtn = document.getElementById('modal-confirmacion-aceptar');

	if (!modal) return;

	confirmacionInicializada = true;

	cerrarBtn?.addEventListener('click', () => cerrarConfirmacion(false));
	cancelarBtn?.addEventListener('click', () => cerrarConfirmacion(false));
	aceptarBtn?.addEventListener('click', () => cerrarConfirmacion(true));

	modal.addEventListener('click', (event) => {
		if (event.target === modal) {
			cerrarConfirmacion(false);
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && modal.classList.contains('activo')) {
			cerrarConfirmacion(false);
		}
	});
}

// ==================== LIBROS ====================

async function cargarLibros() {
	const grid = document.getElementById('grid-libros');
	if (!grid) return;
	
	grid.innerHTML = '<div class="admin-loading">Cargando libros...</div>';
	ocultarControlesPaginacionAdmin('libros');
	
	const mensaje = document.getElementById('mensaje-libros');
	ocultarMensaje(mensaje);
	
	try {
		const resultado = await requestJson('/auth/admin/materiales/libros?page=1&limit=1000');
		
		librosMap.clear();
		librosDataOriginal = (resultado.data || []).map((item) => {
			const libro = item.libros || {};
			const obj = {
				ejemplar_id: item.id,
				libro_id: item.libro_id ?? libro.id,
				titulo: libro.titulo || '',
				autor: libro.autor || '',
				clasificacion: libro.clasificacion || '',
				isbn: libro.isbn || '',
				tipo_material: libro.tipo_material || '',
				codigo_barras: item.codigo_barras || '',
				numero_ejemplar: item.numero_ejemplar || '',
				anio: item.anio || '',
				estatus_item: item.estatus_item || '',
				Disponible: item.Disponible,
				coleccion: item.coleccion || ''
			};
			librosMap.set(obj.ejemplar_id, obj);
			return obj;
		});

		librosDataOriginal.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));
		paginaActualLibros = 0;
		filtrarLibros();
	} catch (error) {
		grid.innerHTML = `<div class="admin-error">Error: ${error.message}</div>`;
		mostrarMensaje(mensaje, 'error', error.message);
	}
}

function filtrarLibros() {
	const filtro = document.getElementById('filtro-libros')?.value || 'todos';
	const busqueda = (document.getElementById('buscar-libros')?.value || '').toLowerCase().trim();
	
	librosFiltrados = librosDataOriginal.filter(libro => {
		// Filtro por estado
		let pasaFiltro = true;
		if (filtro === 'disponible') pasaFiltro = libro.Disponible === true;
		else if (filtro === 'no-disponible') pasaFiltro = libro.Disponible === false;
		
		// Filtro por búsqueda
		let pasaBusqueda = true;
		if (busqueda) {
			pasaBusqueda = libro.titulo.toLowerCase().includes(busqueda) ||
				libro.autor.toLowerCase().includes(busqueda) ||
				libro.isbn.toLowerCase().includes(busqueda) ||
				libro.clasificacion.toLowerCase().includes(busqueda);
		}
		
		return pasaFiltro && pasaBusqueda;
	});
	
	paginaActualLibros = 0;
	actualizarContadorAdmin('libros', librosFiltrados.length, librosDataOriginal.length);
	
	const grid = document.getElementById('grid-libros');
	if (librosFiltrados.length === 0) {
		grid.innerHTML = '<div class="admin-vacio">No se encontraron libros.</div>';
		ocultarControlesPaginacionAdmin('libros');
		return;
	}
	
	mostrarPaginaLibros();
	generarDotsAdmin('libros', Math.ceil(librosFiltrados.length / CARDS_LIBROS), paginaActualLibros);
	mostrarControlesPaginacionAdmin('libros');
}

const debouncedFiltrarLibros = debounce(filtrarLibros, 300);

function mostrarPaginaLibros() {
	const grid = document.getElementById('grid-libros');
	if (!grid || librosFiltrados.length === 0) return;
	
	const inicio = paginaActualLibros * CARDS_LIBROS;
	const fin = Math.min(inicio + CARDS_LIBROS, librosFiltrados.length);
	const librosPagina = librosFiltrados.slice(inicio, fin);
	
	grid.innerHTML = librosPagina.map(libro => crearCardLibro(libro)).join('');
	
	actualizarDotsAdmin('libros', paginaActualLibros);
	actualizarContadorPaginacionAdmin('libros', paginaActualLibros, Math.ceil(librosFiltrados.length / CARDS_LIBROS), librosFiltrados.length);
	actualizarFlechasAdmin('libros', paginaActualLibros, Math.ceil(librosFiltrados.length / CARDS_LIBROS));
}

function crearCardLibro(libro) {
	const badgeClass = libro.Disponible ? 'badge-disponible' : 'badge-no-disponible';
	const badgeText = libro.Disponible ? 'Disponible' : 'No disponible';
	
	return `
		<div class="admin-card" data-id="${libro.ejemplar_id}">
			<div class="admin-card-header">
				<span class="admin-card-titulo" title="${libro.titulo}">${libro.titulo || 'Sin título'}</span>
				<span class="badge ${badgeClass}">${badgeText}</span>
			</div>
			<div class="admin-card-body">
				<div class="admin-card-dato">
					<span class="admin-card-label">Autor</span>
					<span class="admin-card-value">${libro.autor || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">ISBN</span>
					<span class="admin-card-value">${libro.isbn || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Clasificación</span>
					<span class="admin-card-value">${libro.clasificacion || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Tipo</span>
					<span class="admin-card-value">${libro.tipo_material || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Año</span>
					<span class="admin-card-value">${libro.anio || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Colección</span>
					<span class="admin-card-value">${libro.coleccion || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Código Barras</span>
					<span class="admin-card-value">${libro.codigo_barras || 'N/A'}</span>
				</div>
			</div>
			<div class="admin-card-footer">
				<button class="btn-editar" onclick="editarLibroCard(${libro.ejemplar_id})">Editar</button>
				<button class="btn-eliminar" onclick="eliminarLibroCard(${libro.ejemplar_id})">Eliminar</button>
			</div>
		</div>
	`;
}

function siguientePaginaLibros() {
	const totalPaginas = Math.ceil(librosFiltrados.length / CARDS_LIBROS);
	if (paginaActualLibros < totalPaginas - 1) {
		paginaActualLibros++;
		mostrarPaginaLibros();
	}
}

function anteriorPaginaLibros() {
	if (paginaActualLibros > 0) {
		paginaActualLibros--;
		mostrarPaginaLibros();
	}
}

function irAPaginaLibros(indice) {
	const totalPaginas = Math.ceil(librosFiltrados.length / CARDS_LIBROS);
	if (indice >= 0 && indice < totalPaginas) {
		paginaActualLibros = indice;
		mostrarPaginaLibros();
	}
}

async function editarLibroCard(ejemplarId) {
	const libro = librosMap.get(ejemplarId);
	if (!libro) return;
	
	const modal = document.getElementById('modalFormulario');
	document.getElementById('modal-titulo').textContent = 'Editar Libro';
	document.getElementById('libro_id').value = libro.libro_id;
	document.getElementById('ejemplar_id').value = libro.ejemplar_id;
	document.getElementById('titulo').value = libro.titulo;
	document.getElementById('autor').value = libro.autor;
	document.getElementById('clasificacion').value = libro.clasificacion;
	document.getElementById('isbn').value = libro.isbn;
	document.getElementById('tipo_material').value = libro.tipo_material;
	document.getElementById('codigo_barras').value = libro.codigo_barras;
	document.getElementById('numero_ejemplar').value = libro.numero_ejemplar;
	document.getElementById('anio').value = libro.anio;
	document.getElementById('estatus_item').value = libro.estatus_item;
	document.getElementById('disponible').value = libro.Disponible ? 'true' : 'false';
	document.getElementById('coleccion').value = libro.coleccion;
	abrirModal(modal);
}

async function eliminarLibroCard(ejemplarId) {
	const libro = librosMap.get(ejemplarId);
	if (!libro) return;
	
	const confirmar = await abrirConfirmacion({
		titulo: 'Eliminar registro',
		mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
		detalle: `
			<p><strong>Título:</strong> ${libro.titulo}</p>
			<p><strong>Código de barras:</strong> ${libro.codigo_barras}</p>
		`
	});

	if (!confirmar) return;

	try {
		await requestJson(`/auth/admin/materiales/libros/${ejemplarId}`, { method: 'DELETE' });
		mostrarToast('Material eliminado exitosamente.');
		cargarLibros();
	} catch (error) {
		mostrarToast(error.message || 'No se pudo eliminar el material.', 'error');
	}
}

function limpiarFormularioLibro() {
	document.getElementById('libro_id').value = '';
	document.getElementById('ejemplar_id').value = '';
	document.getElementById('titulo').value = '';
	document.getElementById('autor').value = '';
	document.getElementById('clasificacion').value = '';
	document.getElementById('isbn').value = '';
	document.getElementById('tipo_material').value = '';
	document.getElementById('codigo_barras').value = '';
	document.getElementById('numero_ejemplar').value = '';
	document.getElementById('anio').value = '';
	document.getElementById('estatus_item').value = '';
	document.getElementById('disponible').value = 'true';
	document.getElementById('coleccion').value = '';
}

function abrirModal(modal) {
	modal?.classList.add('activo');
}

function cerrarModal(modal) {
	modal?.classList.remove('activo');
}

function inicializarLibros() {
	const modal = document.getElementById('modalFormulario');
	const btnAgregar = document.getElementById('btn-agregar');
	const btnCerrar = modal?.querySelector('.modal-cerrar');
	const btnLimpiar = document.getElementById('btn-limpiar');
	const btnGuardar = document.getElementById('btn-guardar');
	const mensaje = document.getElementById('mensaje-libros');

	inicializarModalConfirmacion();

	btnAgregar?.addEventListener('click', () => {
		document.getElementById('modal-titulo').textContent = 'Nuevo Libro';
		limpiarFormularioLibro();
		abrirModal(modal);
	});

	btnCerrar?.addEventListener('click', () => cerrarModal(modal));
	btnLimpiar?.addEventListener('click', limpiarFormularioLibro);

	btnGuardar?.addEventListener('click', async () => {
		ocultarMensaje(mensaje);
		try {
			const libroId = document.getElementById('libro_id').value;
			const ejemplarId = document.getElementById('ejemplar_id').value;
			const payload = {
				id: libroId || undefined,
				ejemplar_id: ejemplarId || undefined,
				titulo: document.getElementById('titulo').value,
				autor: document.getElementById('autor').value,
				clasificacion: document.getElementById('clasificacion').value,
				isbn: document.getElementById('isbn').value,
				tipo_material: document.getElementById('tipo_material').value,
				codigo_barras: document.getElementById('codigo_barras').value,
				numero_ejemplar: document.getElementById('numero_ejemplar').value,
				anio: Number(document.getElementById('anio').value),
				estatus_item: document.getElementById('estatus_item').value,
				Disponible: document.getElementById('disponible').value === 'true',
				coleccion: document.getElementById('coleccion').value
			};

			if (libroId) {
				await requestJson('/auth/admin/libros', {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material actualizado exitosamente.');
			} else {
				await requestJson('/auth/admin/libros', {
					method: 'POST',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material agregado exitosamente.');
			}

			cerrarModal(modal);
			cargarLibros();
		} catch (error) {
			mostrarToast(error.message || 'No se pudo guardar el material.', 'error');
		}
	});

	cargarLibros();
}

// ==================== COMPUTADORAS ====================

async function cargarComputadoras() {
	const grid = document.getElementById('grid-computadoras');
	if (!grid) return;
	
	grid.innerHTML = '<div class="admin-loading">Cargando computadoras...</div>';
	ocultarControlesPaginacionAdmin('computadoras');
	
	const mensaje = document.getElementById('mensaje-computadoras');
	ocultarMensaje(mensaje);
	
	try {
		const resultado = await requestJson('/auth/admin/materiales/computadoras?page=1&limit=1000');
		
		computadorasMap.clear();
		computadorasDataOriginal = (resultado.data || []).map((item) => {
			const obj = {
				id: item.id,
				no_computadora: item.no_computadora,
				procesador: item.procesador || '',
				programas: item.programas || '',
				carrera: item.carrera || '',
				Disponible: item.Disponible,
				En_funcionamiento: item.En_funcionamiento,
				Observacion: item.Observacion || '',
				no_inventario: item.no_inventario || ''
			};
			computadorasMap.set(obj.id, obj);
			return obj;
		});

		computadorasDataOriginal.sort((a, b) => Number(a.no_computadora) - Number(b.no_computadora));
		paginaActualComputadoras = 0;
		filtrarComputadoras();
	} catch (error) {
		grid.innerHTML = `<div class="admin-error">Error: ${error.message}</div>`;
		mostrarMensaje(mensaje, 'error', error.message);
	}
}

function filtrarComputadoras() {
	const filtro = document.getElementById('filtro-computadoras')?.value || 'todos';
	const busqueda = (document.getElementById('buscar-computadoras')?.value || '').toLowerCase().trim();
	
	computadorasFiltradas = computadorasDataOriginal.filter(comp => {
		let pasaFiltro = true;
		if (filtro === 'disponible') pasaFiltro = comp.Disponible === true;
		else if (filtro === 'no-disponible') pasaFiltro = comp.Disponible === false;
		else if (filtro === 'funcionando') pasaFiltro = comp.En_funcionamiento === true;
		else if (filtro === 'fuera-servicio') pasaFiltro = comp.En_funcionamiento === false;
		
		let pasaBusqueda = true;
		if (busqueda) {
			pasaBusqueda = comp.procesador.toLowerCase().includes(busqueda) ||
				comp.carrera.toLowerCase().includes(busqueda) ||
				comp.programas.toLowerCase().includes(busqueda) ||
				String(comp.no_computadora).includes(busqueda) ||
				comp.no_inventario.toLowerCase().includes(busqueda);
		}
		
		return pasaFiltro && pasaBusqueda;
	});
	
	paginaActualComputadoras = 0;
	actualizarContadorAdmin('computadoras', computadorasFiltradas.length, computadorasDataOriginal.length);
	
	const grid = document.getElementById('grid-computadoras');
	if (computadorasFiltradas.length === 0) {
		grid.innerHTML = '<div class="admin-vacio">No se encontraron computadoras.</div>';
		ocultarControlesPaginacionAdmin('computadoras');
		return;
	}
	
	mostrarPaginaComputadoras();
	generarDotsAdmin('computadoras', Math.ceil(computadorasFiltradas.length / CARDS_COMPUTADORAS), paginaActualComputadoras);
	mostrarControlesPaginacionAdmin('computadoras');
}

const debouncedFiltrarComputadoras = debounce(filtrarComputadoras, 300);

function mostrarPaginaComputadoras() {
	const grid = document.getElementById('grid-computadoras');
	if (!grid || computadorasFiltradas.length === 0) return;
	
	const inicio = paginaActualComputadoras * CARDS_COMPUTADORAS;
	const fin = Math.min(inicio + CARDS_COMPUTADORAS, computadorasFiltradas.length);
	const compsPagina = computadorasFiltradas.slice(inicio, fin);
	
	grid.innerHTML = compsPagina.map(comp => crearCardComputadora(comp)).join('');
	
	actualizarDotsAdmin('computadoras', paginaActualComputadoras);
	actualizarContadorPaginacionAdmin('computadoras', paginaActualComputadoras, Math.ceil(computadorasFiltradas.length / CARDS_COMPUTADORAS), computadorasFiltradas.length);
	actualizarFlechasAdmin('computadoras', paginaActualComputadoras, Math.ceil(computadorasFiltradas.length / CARDS_COMPUTADORAS));
}

function crearCardComputadora(comp) {
	const badgeDisp = comp.Disponible ? 'badge-disponible' : 'badge-no-disponible';
	const textDisp = comp.Disponible ? 'Disp.' : 'No disp.';
	const badgeFunc = comp.En_funcionamiento ? 'badge-funcional' : 'badge-danado';
	const textFunc = comp.En_funcionamiento ? 'Func.' : 'Fuera';
	
	return `
		<div class="admin-card" data-id="${comp.id}">
			<div class="admin-card-header">
				<span class="admin-card-titulo">PC #${comp.no_computadora}</span>
				<span class="badge ${badgeDisp}">${textDisp}</span>
				<span class="badge ${badgeFunc}">${textFunc}</span>
			</div>
			<div class="admin-card-body">
				<div class="admin-card-dato">
					<span class="admin-card-label">Procesador</span>
					<span class="admin-card-value admin-card-value-truncate" title="${comp.procesador}">${comp.procesador || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Carrera</span>
					<span class="admin-card-value">${comp.carrera || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Inventario</span>
					<span class="admin-card-value">${comp.no_inventario || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Observación</span>
					<span class="admin-card-value admin-card-value-truncate" title="${comp.Observacion}">${comp.Observacion || 'N/A'}</span>
				</div>
			</div>
			<div class="admin-card-footer">
				<button class="btn-editar" onclick="editarComputadoraCard(${comp.id})">Editar</button>
				<button class="btn-eliminar" onclick="eliminarComputadoraCard(${comp.id})">Eliminar</button>
			</div>
		</div>
	`;
}

function siguientePaginaComputadoras() {
	const totalPaginas = Math.ceil(computadorasFiltradas.length / CARDS_COMPUTADORAS);
	if (paginaActualComputadoras < totalPaginas - 1) {
		paginaActualComputadoras++;
		mostrarPaginaComputadoras();
	}
}

function anteriorPaginaComputadoras() {
	if (paginaActualComputadoras > 0) {
		paginaActualComputadoras--;
		mostrarPaginaComputadoras();
	}
}

function irAPaginaComputadoras(indice) {
	const totalPaginas = Math.ceil(computadorasFiltradas.length / CARDS_COMPUTADORAS);
	if (indice >= 0 && indice < totalPaginas) {
		paginaActualComputadoras = indice;
		mostrarPaginaComputadoras();
	}
}

async function editarComputadoraCard(id) {
	const comp = computadorasMap.get(id);
	if (!comp) return;
	
	const modal = document.getElementById('modalFormulario');
	document.getElementById('modal-titulo').textContent = 'Editar Computadora';
	document.getElementById('computadora_id').value = comp.id;
	document.getElementById('no_computadora').value = comp.no_computadora;
	document.getElementById('procesador').value = comp.procesador;
	document.getElementById('programas').value = comp.programas;
	document.getElementById('carrera').value = comp.carrera;
	document.getElementById('disponible').value = comp.Disponible ? 'true' : 'false';
	document.getElementById('en_funcionamiento').value = comp.En_funcionamiento ? 'true' : 'false';
	document.getElementById('observacion').value = comp.Observacion;
	document.getElementById('no_inventario').value = comp.no_inventario;
	abrirModal(modal);
}

async function eliminarComputadoraCard(id) {
	const comp = computadorasMap.get(id);
	if (!comp) return;
	
	const confirmar = await abrirConfirmacion({
		titulo: 'Eliminar registro',
		mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
		detalle: `<p><strong>No. Inventario:</strong> ${comp.no_inventario}</p>`
	});

	if (!confirmar) return;

	try {
		await requestJson(`/auth/admin/materiales/computadoras/${id}`, { method: 'DELETE' });
		mostrarToast('Material eliminado exitosamente.');
		cargarComputadoras();
	} catch (error) {
		if (error.message?.includes('fk_solicitudes_computadora_equipo')) {
			mostrarToast('No se puede eliminar el material porque hay solicitudes relacionadas.', 'error');
		} else {
			mostrarToast(error.message || 'No se pudo eliminar el material.', 'error');
		}
	}
}

function limpiarFormularioComputadora() {
	document.getElementById('computadora_id').value = '';
	document.getElementById('procesador').value = '';
	document.getElementById('programas').value = '';
	document.getElementById('carrera').value = '';
	document.getElementById('disponible').value = 'true';
	document.getElementById('en_funcionamiento').value = 'true';
	document.getElementById('observacion').value = '';
	document.getElementById('no_inventario').value = '';
	document.getElementById('no_computadora').value = '';
}

function inicializarComputadoras() {
	const modal = document.getElementById('modalFormulario');
	const btnAgregar = document.getElementById('btn-agregar');
	const btnCerrar = modal?.querySelector('.modal-cerrar');
	const btnLimpiar = document.getElementById('btn-limpiar');
	const btnGuardar = document.getElementById('btn-guardar');
	const mensaje = document.getElementById('mensaje-computadoras');

	inicializarModalConfirmacion();

	btnAgregar?.addEventListener('click', () => {
		document.getElementById('modal-titulo').textContent = 'Nueva Computadora';
		limpiarFormularioComputadora();
		abrirModal(modal);
	});

	btnCerrar?.addEventListener('click', () => cerrarModal(modal));
	btnLimpiar?.addEventListener('click', limpiarFormularioComputadora);

	btnGuardar?.addEventListener('click', async () => {
		ocultarMensaje(mensaje);
		try {
			const id = document.getElementById('computadora_id').value;
			const payload = {
				id: id || undefined,
				procesador: document.getElementById('procesador').value,
				programas: document.getElementById('programas').value,
				carrera: document.getElementById('carrera').value,
				Disponible: document.getElementById('disponible').value === 'true',
				En_funcionamiento: document.getElementById('en_funcionamiento').value === 'true',
				Observacion: document.getElementById('observacion').value,
				no_inventario: document.getElementById('no_inventario').value,
				no_computadora: Number(document.getElementById('no_computadora').value)
			};

			if (id) {
				await requestJson('/auth/admin/computadoras', {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material actualizado exitosamente.');
			} else {
				await requestJson('/auth/admin/computadoras', {
					method: 'POST',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material agregado exitosamente.');
			}

			cerrarModal(modal);
			cargarComputadoras();
		} catch (error) {
			mostrarToast(error.message || 'No se pudo guardar el material.', 'error');
		}
	});

	cargarComputadoras();
}

// ==================== RESTIRADORES ====================

async function cargarRestiradores() {
	const grid = document.getElementById('grid-restiradores');
	if (!grid) return;
	
	grid.innerHTML = '<div class="admin-loading">Cargando restiradores...</div>';
	ocultarControlesPaginacionAdmin('restiradores');
	
	const mensaje = document.getElementById('mensaje-restiradores');
	ocultarMensaje(mensaje);
	
	try {
		const resultado = await requestJson('/auth/admin/materiales/restiradores?page=1&limit=1000');
		
		restiradoresMap.clear();
		restiradoresDataOriginal = (resultado.data || []).map((item) => {
			const obj = {
				id: item.id,
				no_restirador: item.no_restirador,
				no_inventario: item.no_inventario || '',
				Disponible: item.Disponible,
				estado_de_material: item.estado_de_material,
				Observacion: item.Observacion || ''
			};
			restiradoresMap.set(obj.id, obj);
			return obj;
		});

		restiradoresDataOriginal.sort((a, b) => Number(a.no_restirador) - Number(b.no_restirador));
		paginaActualRestiradores = 0;
		filtrarRestiradores();
	} catch (error) {
		grid.innerHTML = `<div class="admin-error">Error: ${error.message}</div>`;
		mostrarMensaje(mensaje, 'error', error.message);
	}
}

function filtrarRestiradores() {
	const filtro = document.getElementById('filtro-restiradores')?.value || 'todos';
	const busqueda = (document.getElementById('buscar-restiradores')?.value || '').toLowerCase().trim();
	
	restiradoresFiltrados = restiradoresDataOriginal.filter(rest => {
		let pasaFiltro = true;
		if (filtro === 'disponible') pasaFiltro = rest.Disponible === true;
		else if (filtro === 'no-disponible') pasaFiltro = rest.Disponible === false;
		else if (filtro === 'funcional') pasaFiltro = rest.estado_de_material === true;
		else if (filtro === 'danado') pasaFiltro = rest.estado_de_material === false;
		
		let pasaBusqueda = true;
		if (busqueda) {
			pasaBusqueda = rest.no_inventario.toLowerCase().includes(busqueda) ||
				String(rest.no_restirador).includes(busqueda) ||
				rest.Observacion.toLowerCase().includes(busqueda);
		}
		
		return pasaFiltro && pasaBusqueda;
	});
	
	paginaActualRestiradores = 0;
	actualizarContadorAdmin('restiradores', restiradoresFiltrados.length, restiradoresDataOriginal.length);
	
	const grid = document.getElementById('grid-restiradores');
	if (restiradoresFiltrados.length === 0) {
		grid.innerHTML = '<div class="admin-vacio">No se encontraron restiradores.</div>';
		ocultarControlesPaginacionAdmin('restiradores');
		return;
	}
	
	mostrarPaginaRestiradores();
	generarDotsAdmin('restiradores', Math.ceil(restiradoresFiltrados.length / CARDS_RESTIRADORES), paginaActualRestiradores);
	mostrarControlesPaginacionAdmin('restiradores');
}

const debouncedFiltrarRestiradores = debounce(filtrarRestiradores, 300);

function mostrarPaginaRestiradores() {
	const grid = document.getElementById('grid-restiradores');
	if (!grid || restiradoresFiltrados.length === 0) return;
	
	const inicio = paginaActualRestiradores * CARDS_RESTIRADORES;
	const fin = Math.min(inicio + CARDS_RESTIRADORES, restiradoresFiltrados.length);
	const restsPagina = restiradoresFiltrados.slice(inicio, fin);
	
	grid.innerHTML = restsPagina.map(rest => crearCardRestirador(rest)).join('');
	
	actualizarDotsAdmin('restiradores', paginaActualRestiradores);
	actualizarContadorPaginacionAdmin('restiradores', paginaActualRestiradores, Math.ceil(restiradoresFiltrados.length / CARDS_RESTIRADORES), restiradoresFiltrados.length);
	actualizarFlechasAdmin('restiradores', paginaActualRestiradores, Math.ceil(restiradoresFiltrados.length / CARDS_RESTIRADORES));
}

function crearCardRestirador(rest) {
	const badgeDisp = rest.Disponible ? 'badge-disponible' : 'badge-no-disponible';
	const textDisp = rest.Disponible ? 'Disp.' : 'No disp.';
	const badgeEstado = rest.estado_de_material ? 'badge-funcional' : 'badge-danado';
	const textEstado = rest.estado_de_material ? 'Funcional' : 'Dañado';
	
	return `
		<div class="admin-card" data-id="${rest.id}">
			<div class="admin-card-header">
				<span class="admin-card-titulo">Rest. #${rest.no_restirador}</span>
				<span class="badge ${badgeDisp}">${textDisp}</span>
			</div>
			<div class="admin-card-body">
				<div class="admin-card-dato">
					<span class="admin-card-label">Inventario</span>
					<span class="admin-card-value">${rest.no_inventario || 'N/A'}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Estado</span>
					<span class="badge ${badgeEstado}">${textEstado}</span>
				</div>
			</div>
			<div class="admin-card-footer">
				<button class="btn-editar" onclick="editarRestiradorCard(${rest.id})">Editar</button>
				<button class="btn-eliminar" onclick="eliminarRestiradorCard(${rest.id})">Eliminar</button>
			</div>
		</div>
	`;
}

function siguientePaginaRestiradores() {
	const totalPaginas = Math.ceil(restiradoresFiltrados.length / CARDS_RESTIRADORES);
	if (paginaActualRestiradores < totalPaginas - 1) {
		paginaActualRestiradores++;
		mostrarPaginaRestiradores();
	}
}

function anteriorPaginaRestiradores() {
	if (paginaActualRestiradores > 0) {
		paginaActualRestiradores--;
		mostrarPaginaRestiradores();
	}
}

function irAPaginaRestiradores(indice) {
	const totalPaginas = Math.ceil(restiradoresFiltrados.length / CARDS_RESTIRADORES);
	if (indice >= 0 && indice < totalPaginas) {
		paginaActualRestiradores = indice;
		mostrarPaginaRestiradores();
	}
}

async function editarRestiradorCard(id) {
	const rest = restiradoresMap.get(id);
	if (!rest) return;
	
	const modal = document.getElementById('modalFormulario');
	document.getElementById('modal-titulo').textContent = 'Editar Restirador';
	document.getElementById('restirador_id').value = rest.id;
	document.getElementById('no_restirador').value = rest.no_restirador;
	document.getElementById('no_inventario').value = rest.no_inventario;
	document.getElementById('disponible').value = rest.Disponible ? 'true' : 'false';
	document.getElementById('estado_material').value = rest.estado_de_material ? 'true' : 'false';
	document.getElementById('observacion').value = rest.Observacion;
	abrirModal(modal);
}

async function eliminarRestiradorCard(id) {
	const rest = restiradoresMap.get(id);
	if (!rest) return;
	
	const confirmar = await abrirConfirmacion({
		titulo: 'Eliminar registro',
		mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
		detalle: `<p><strong>No. Inventario:</strong> ${rest.no_inventario}</p>`
	});

	if (!confirmar) return;

	try {
		await requestJson(`/auth/admin/materiales/restiradores/${id}`, { method: 'DELETE' });
		mostrarToast('Material eliminado exitosamente.');
		cargarRestiradores();
	} catch (error) {
		mostrarToast(error.message || 'No se pudo eliminar el material.', 'error');
	}
}

function limpiarFormularioRestirador() {
	document.getElementById('restirador_id').value = '';
	document.getElementById('disponible').value = 'true';
	document.getElementById('estado_material').value = 'true';
	document.getElementById('observacion').value = '';
	document.getElementById('no_inventario').value = '';
	document.getElementById('no_restirador').value = '';
}

function inicializarRestiradores() {
	const modal = document.getElementById('modalFormulario');
	const btnAgregar = document.getElementById('btn-agregar');
	const btnCerrar = modal?.querySelector('.modal-cerrar');
	const btnLimpiar = document.getElementById('btn-limpiar');
	const btnGuardar = document.getElementById('btn-guardar');
	const mensaje = document.getElementById('mensaje-restiradores');

	inicializarModalConfirmacion();

	btnAgregar?.addEventListener('click', () => {
		document.getElementById('modal-titulo').textContent = 'Nuevo Restirador';
		limpiarFormularioRestirador();
		abrirModal(modal);
	});

	btnCerrar?.addEventListener('click', () => cerrarModal(modal));
	btnLimpiar?.addEventListener('click', limpiarFormularioRestirador);

	btnGuardar?.addEventListener('click', async () => {
		ocultarMensaje(mensaje);
		try {
			const id = document.getElementById('restirador_id').value;
			const payload = {
				id: id || undefined,
				Disponible: document.getElementById('disponible').value === 'true',
				estado_de_material: document.getElementById('estado_material').value === 'true',
				Observacion: document.getElementById('observacion').value,
				no_inventario: document.getElementById('no_inventario').value,
				no_restirador: Number(document.getElementById('no_restirador').value)
			};

			if (id) {
				await requestJson('/auth/admin/restiradores', {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material actualizado exitosamente.');
			} else {
				await requestJson('/auth/admin/restiradores', {
					method: 'POST',
					body: JSON.stringify(payload)
				});
				mostrarToast('Material agregado exitosamente.');
			}

			cerrarModal(modal);
			cargarRestiradores();
		} catch (error) {
			mostrarToast(error.message || 'No se pudo guardar el material.', 'error');
		}
	});

	cargarRestiradores();
}

// ==================== USUARIOS ====================

async function cargarUsuarios() {
	const grid = document.getElementById('grid-usuarios');
	if (!grid) return;
	
	grid.innerHTML = '<div class="admin-loading">Cargando usuarios...</div>';
	ocultarControlesPaginacionAdmin('usuarios');
	
	const mensaje = document.getElementById('mensaje-usuarios');
	ocultarMensaje(mensaje);
	
	try {
		const resultado = await requestJson('/auth/admin/usuarios?page=1&limit=1000');
		
		usuariosMap.clear();
		usuariosDataOriginal = (resultado.data || []).map((usuario) => {
			const obj = {
				id: usuario.id,
				boleta: usuario.boleta,
				correo: usuario.correo,
				rol: usuario.rol,
				tiene_documentos: usuario.tiene_documentos
			};
			usuariosMap.set(obj.id, obj);
			return obj;
		});

		paginaActualUsuarios = 0;
		filtrarUsuarios();
	} catch (error) {
		grid.innerHTML = `<div class="admin-error">Error: ${error.message}</div>`;
		mostrarMensaje(mensaje, 'error', error.message);
	}
}

function filtrarUsuarios() {
	const filtro = document.getElementById('filtro-usuarios')?.value || 'todos';
	const busqueda = (document.getElementById('buscar-usuarios')?.value || '').toLowerCase().trim();
	
	usuariosFiltrados = usuariosDataOriginal.filter(usuario => {
		let pasaFiltro = true;
		if (filtro === 'con-docs') pasaFiltro = usuario.tiene_documentos === true;
		else if (filtro === 'sin-docs') pasaFiltro = usuario.tiene_documentos === false;
		
		let pasaBusqueda = true;
		if (busqueda) {
			pasaBusqueda = usuario.boleta.toLowerCase().includes(busqueda) ||
				usuario.correo.toLowerCase().includes(busqueda) ||
				usuario.rol.toLowerCase().includes(busqueda);
		}
		
		return pasaFiltro && pasaBusqueda;
	});
	
	paginaActualUsuarios = 0;
	actualizarContadorAdmin('usuarios', usuariosFiltrados.length, usuariosDataOriginal.length);
	
	const grid = document.getElementById('grid-usuarios');
	if (usuariosFiltrados.length === 0) {
		grid.innerHTML = '<div class="admin-vacio">No se encontraron usuarios.</div>';
		ocultarControlesPaginacionAdmin('usuarios');
		return;
	}
	
	mostrarPaginaUsuarios();
	generarDotsAdmin('usuarios', Math.ceil(usuariosFiltrados.length / CARDS_USUARIOS), paginaActualUsuarios);
	mostrarControlesPaginacionAdmin('usuarios');
}

const debouncedFiltrarUsuarios = debounce(filtrarUsuarios, 300);

function mostrarPaginaUsuarios() {
	const grid = document.getElementById('grid-usuarios');
	if (!grid || usuariosFiltrados.length === 0) return;
	
	const inicio = paginaActualUsuarios * CARDS_USUARIOS;
	const fin = Math.min(inicio + CARDS_USUARIOS, usuariosFiltrados.length);
	const usuariosPagina = usuariosFiltrados.slice(inicio, fin);
	
	grid.innerHTML = usuariosPagina.map(usuario => crearCardUsuario(usuario)).join('');
	
	actualizarDotsAdmin('usuarios', paginaActualUsuarios);
	actualizarContadorPaginacionAdmin('usuarios', paginaActualUsuarios, Math.ceil(usuariosFiltrados.length / CARDS_USUARIOS), usuariosFiltrados.length);
	actualizarFlechasAdmin('usuarios', paginaActualUsuarios, Math.ceil(usuariosFiltrados.length / CARDS_USUARIOS));
}

function crearCardUsuario(usuario) {
	const badgeClass = usuario.tiene_documentos ? 'badge-con-docs' : 'badge-sin-docs';
	const badgeText = usuario.tiene_documentos ? 'Con docs' : 'Sin docs';
	const botonHabilitar = usuario.tiene_documentos ? '' : 
		`<button class="btn-habilitar btn-aprobar" onclick="habilitarUsuarioCard(${usuario.id})">Habilitar</button>`;
	
	return `
		<div class="admin-card" data-id="${usuario.id}">
			<div class="admin-card-header">
				<span class="admin-card-titulo">${usuario.boleta}</span>
				<span class="badge ${badgeClass}">${badgeText}</span>
			</div>
			<div class="admin-card-body">
				<div class="admin-card-dato">
					<span class="admin-card-label">Correo</span>
					<span class="admin-card-value admin-card-value-truncate" title="${usuario.correo}">${usuario.correo}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Rol</span>
					<span class="admin-card-value">${usuario.rol}</span>
				</div>
			</div>
			<div class="admin-card-footer">
				${botonHabilitar}
			</div>
		</div>
	`;
}

function siguientePaginaUsuarios() {
	const totalPaginas = Math.ceil(usuariosFiltrados.length / CARDS_USUARIOS);
	if (paginaActualUsuarios < totalPaginas - 1) {
		paginaActualUsuarios++;
		mostrarPaginaUsuarios();
	}
}

function anteriorPaginaUsuarios() {
	if (paginaActualUsuarios > 0) {
		paginaActualUsuarios--;
		mostrarPaginaUsuarios();
	}
}

function irAPaginaUsuarios(indice) {
	const totalPaginas = Math.ceil(usuariosFiltrados.length / CARDS_USUARIOS);
	if (indice >= 0 && indice < totalPaginas) {
		paginaActualUsuarios = indice;
		mostrarPaginaUsuarios();
	}
}

async function habilitarUsuarioCard(id) {
	const usuario = usuariosMap.get(id);
	if (!usuario) return;
	
	const confirmar = await abrirConfirmacion({
		titulo: 'Habilitar documentación',
		mensaje: '¿Confirma la habilitación de la documentación de este usuario? Esta acción es irreversible.',
		detalle: obtenerDetalleUsuario(usuario)
	});

	if (!confirmar) return;

	try {
		await requestJson(`/auth/admin/usuarios/${id}/habilitar`, { method: 'PUT' });
		mostrarToast('Documentación habilitada correctamente.');
		cargarUsuarios();
	} catch (error) {
		mostrarToast(error.message || 'No se pudo habilitar la documentación.', 'error');
	}
}

function inicializarUsuarios() {
	inicializarModalConfirmacion();
	cargarUsuarios();
}

// ==================== SOLICITUDES LIBROS ====================

// Variables globales para paginación de solicitudes
let solicitudesDataOriginal = [];
let solicitudesFiltradas = [];
let paginaActualSolicitud = 0;
const CARDS_POR_PAGINA = 3;

async function cargarSolicitudesLibros() {
    const container = document.getElementById('tabla-solicitudes-libros');
    if (!container) return;
    
    container.innerHTML = '<div class="solicitud-loading">Cargando solicitudes...</div>';
    ocultarControlesPaginacion();
    
    try {
        const respuesta = await requestJson('/auth/admin/solicitudes/libros');
        if (respuesta.success) {
            // Ordenar: Pendientes (1) primero, luego por ID descendente
            solicitudesDataOriginal = respuesta.data.sort((a, b) => {
                const estadoA = Number(a.estado_asistencia_id);
                const estadoB = Number(b.estado_asistencia_id);
                if (estadoA === 1 && estadoB !== 1) return -1;
                if (estadoB === 1 && estadoA !== 1) return 1;
                return b.id - a.id;
            });
            
            paginaActualSolicitud = 0;
            
            // Aplicar filtro por defecto (Pendientes)
            filtrarSolicitudes();
        }
    } catch (error) {
        console.error("Error cargando solicitudes:", error);
        container.innerHTML = `<div class="solicitud-error">Error: ${error.message}</div>`;
        ocultarControlesPaginacion();
    }
}

function filtrarSolicitudes() {
    const filtro = document.getElementById('filtro-estado')?.value || 'todos';
    
    if (filtro === 'todos') {
        solicitudesFiltradas = [...solicitudesDataOriginal];
    } else {
        solicitudesFiltradas = solicitudesDataOriginal.filter(
            s => Number(s.estado_asistencia_id) === Number(filtro)
        );
    }
    
    paginaActualSolicitud = 0;
    actualizarContadorFiltro();
    
    const container = document.getElementById('tabla-solicitudes-libros');
    if (solicitudesFiltradas.length === 0) {
        container.innerHTML = '<div class="solicitud-vacia">No hay solicitudes con este estado.</div>';
        ocultarControlesPaginacion();
        return;
    }
    
    mostrarPaginaSolicitudes();
    generarDotsSolicitudes();
    actualizarContadorSolicitudes();
    mostrarControlesPaginacion();
}

function actualizarContadorFiltro() {
    const contador = document.getElementById('filtro-contador');
    if (!contador) return;
    
    const filtro = document.getElementById('filtro-estado')?.value || 'todos';
    const pendientes = solicitudesDataOriginal.filter(s => Number(s.estado_asistencia_id) === 1).length;
    
    if (filtro === '1') {
        contador.textContent = pendientes > 0 ? `${pendientes} pendiente${pendientes > 1 ? 's' : ''}` : '';
        contador.className = 'filtro-contador' + (pendientes > 0 ? ' filtro-contador-activo' : '');
    } else if (filtro === 'todos') {
        contador.textContent = `Total: ${solicitudesDataOriginal.length}`;
        contador.className = 'filtro-contador';
    } else {
        contador.textContent = `${solicitudesFiltradas.length} resultado${solicitudesFiltradas.length !== 1 ? 's' : ''}`;
        contador.className = 'filtro-contador';
    }
}

function getTotalPaginas() {
    return Math.ceil(solicitudesFiltradas.length / CARDS_POR_PAGINA);
}

function mostrarPaginaSolicitudes() {
    const container = document.getElementById('tabla-solicitudes-libros');
    if (!container || solicitudesFiltradas.length === 0) return;

    const inicio = paginaActualSolicitud * CARDS_POR_PAGINA;
    const fin = Math.min(inicio + CARDS_POR_PAGINA, solicitudesFiltradas.length);
    const solicitudesPagina = solicitudesFiltradas.slice(inicio, fin);
    
    container.innerHTML = solicitudesPagina.map((solicitud, index) => 
        crearCardSolicitud(solicitud, index)
    ).join('');
    
    actualizarDotsSolicitudes();
    actualizarContadorSolicitudes();
    actualizarEstadoFlechas();
}

function crearCardSolicitud(solicitud, animationDelay = 0) {
    const estadoId = Number(solicitud.estado_asistencia_id);
    const estado = estadoId === 1
        ? 'Pendiente'
        : estadoId === 2
            ? 'Aprobada (Por Recoger)'
            : estadoId === 3
                ? 'Rechazada'
                : 'Cancelada';
    const usuario = solicitud.usuarios_web_movil;
    const alumno = usuario?.boletas;
    const libro = solicitud.ejemplares?.libros;
    const prestamos = solicitud.prestamos_libros;
    const prestamoArray = Array.isArray(prestamos) ? prestamos : (prestamos ? [prestamos] : []);
    const devuelto = prestamoArray.some(p => Number(p.estado_prestamo_id) === 3);
    const tieneDocumentos = usuario?.tiene_documentos ? 'Sí' : 'No';
    
    let botones = '';
    if (estadoId === 1) {
        botones = `
            <button class="btn-aprobar" onclick="gestionarSolicitud(${solicitud.id}, 2, '${usuario?.boleta}')">Aprobar</button>
            <button class="btn-rechazar" onclick="gestionarSolicitud(${solicitud.id}, 3, '${usuario?.boleta}')">Rechazar</button>
        `;
    } else if (estadoId === 2) {
        botones = `
            <button class="btn-guardar btn-entregar-libro" onclick="entregarLibro(${solicitud.id}, '${usuario?.boleta}', ${solicitud.ejemplares?.id})">
                 <i class="fas fa-check"></i> Entregar Libro
            </button>
        `;
    }

    const badgeClass = estadoId === 1 ? 'badge-warning' : estadoId === 2 ? 'badge-success' : 'badge-danger';

    return `
        <div class="solicitud-card solicitud-card-animada" style="animation-delay: ${animationDelay * 0.08}s">
            <div class="solicitud-card-header">
                <span class="solicitud-boleta">${usuario?.boleta || 'N/A'}</span>
                <span class="badge ${badgeClass}">${estado}</span>
            </div>
            <div class="solicitud-card-body">
                <div class="solicitud-dato">
                    <span class="solicitud-label">Nombre</span>
                    <span class="solicitud-value">${alumno?.nombre || 'N/A'}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Grupo</span>
                    <span class="solicitud-value">${alumno?.Grupo || 'N/A'}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Correo</span>
                    <span class="solicitud-value solicitud-correo">${usuario?.correo || 'N/A'}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Documentación</span>
                    <span class="solicitud-value">${tieneDocumentos}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Libro Solicitado</span>
                    <span class="solicitud-value solicitud-libro">${libro?.titulo || 'N/A'}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Fecha Solicitud</span>
                    <span class="solicitud-value">${formatFechaMexico(solicitud.fecha_solicitud)}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Fecha Límite</span>
                    <span class="solicitud-value">${formatFechaMexico(solicitud.fecha_limite_recoleccion)}</span>
                </div>
                <div class="solicitud-dato">
                    <span class="solicitud-label">Devuelto</span>
                    <span class="solicitud-value">${devuelto ? 'Sí' : 'No'}</span>
                </div>
            </div>
            <div class="solicitud-card-footer">
                ${botones}
            </div>
        </div>
    `;
}

function siguientePaginaSolicitud() {
    if (paginaActualSolicitud < getTotalPaginas() - 1) {
        paginaActualSolicitud++;
        mostrarPaginaSolicitudes();
    }
}

function anteriorPaginaSolicitud() {
    if (paginaActualSolicitud > 0) {
        paginaActualSolicitud--;
        mostrarPaginaSolicitudes();
    }
}

function irAPaginaSolicitud(indice) {
    if (indice >= 0 && indice < getTotalPaginas()) {
        paginaActualSolicitud = indice;
        mostrarPaginaSolicitudes();
    }
}

function generarDotsSolicitudes() {
    const dotsContainer = document.getElementById('solicitudes-dots');
    if (!dotsContainer) return;
    
    const totalPaginas = getTotalPaginas();
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < totalPaginas; i++) {
        const dot = document.createElement('button');
        dot.className = `paginacion-dot ${i === paginaActualSolicitud ? 'active' : ''}`;
        dot.onclick = () => irAPaginaSolicitud(i);
        dot.setAttribute('aria-label', `Ir a página ${i + 1}`);
        dotsContainer.appendChild(dot);
    }
}

function actualizarDotsSolicitudes() {
    const dots = document.querySelectorAll('#solicitudes-dots .paginacion-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === paginaActualSolicitud);
    });
}

function actualizarContadorSolicitudes() {
    const contador = document.getElementById('solicitudes-contador');
    if (contador) {
        const totalPaginas = getTotalPaginas();
        contador.textContent = `Página ${paginaActualSolicitud + 1} / ${totalPaginas} (${solicitudesFiltradas.length} solicitudes)`;
    }
}

function actualizarEstadoFlechas() {
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const totalPaginas = getTotalPaginas();
    
    if (prevBtn) {
        prevBtn.disabled = paginaActualSolicitud === 0;
        prevBtn.classList.toggle('disabled', paginaActualSolicitud === 0);
    }
    if (nextBtn) {
        nextBtn.disabled = paginaActualSolicitud >= totalPaginas - 1;
        nextBtn.classList.toggle('disabled', paginaActualSolicitud >= totalPaginas - 1);
    }
}

function mostrarControlesPaginacion() {
    const paginacion = document.querySelector('.solicitudes-paginacion');
    const flechas = document.querySelectorAll('.carousel-arrow');
    if (paginacion) paginacion.style.display = 'flex';
    flechas.forEach(f => f.style.display = 'flex');
}

function ocultarControlesPaginacion() {
    const paginacion = document.querySelector('.solicitudes-paginacion');
    const flechas = document.querySelectorAll('.carousel-arrow');
    if (paginacion) paginacion.style.display = 'none';
    flechas.forEach(f => f.style.display = 'none');
}

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    const container = document.getElementById('tabla-solicitudes-libros');
    if (!container || solicitudesFiltradas.length === 0) return;
    
    if (e.key === 'ArrowLeft') {
        anteriorPaginaSolicitud();
    } else if (e.key === 'ArrowRight') {
        siguientePaginaSolicitud();
    }
})

async function gestionarSolicitud(id, estado, boletaUser) {
    let motivo = null;
    if (estado === 3) { // Rechazar
        motivo = prompt("Ingrese el motivo del rechazo:");
        if (motivo === null) return; // Cancelado
    }

    if (!confirm(`¿Estás seguro de ${estado === 2 ? 'APROBAR' : 'RECHAZAR'} esta solicitud?`)) return;

    try {
        const res = await requestJson(`/auth/admin/solicitudes/libros/${id}/gestionar`, {
            method: 'POST',
            body: JSON.stringify({ estado, boletaUser, motivo })
        });
        
        mostrarToast(res.message, 'success');
        cargarSolicitudesLibros();
    } catch (error) {
         mostrarToast("Error: " + error.message, 'error');
    }
}

async function entregarLibro(idSolicitud, boleta, idEjemplar) {
    if (!confirm("¿Confirmar que el alumno ha recogido el libro y se inicia el préstamo?")) return;

    try {
        const res = await requestJson(`/auth/admin/solicitudes/libros/${idSolicitud}/entregar`, {
             method: 'POST',
             body: JSON.stringify({ boleta, idEjemplar })
        });
        mostrarToast(res.message, 'success');
        cargarSolicitudesLibros(); 
    } catch (error) {
        mostrarToast("Error: " + error.message, 'error');
    }
}

// ==================== PRÉSTAMOS LIBROS ====================

async function cargarPrestamosLibros() {
	const grid = document.getElementById('grid-prestamos');
	if (!grid) return;
	
	grid.innerHTML = '<div class="admin-loading">Cargando préstamos...</div>';
	ocultarControlesPaginacionAdmin('prestamos');

	try {
		const respuesta = await requestJson('/auth/admin/prestamos/libros');
		if (respuesta.success) {
			prestamosMap.clear();
			prestamosDataOriginal = respuesta.data.map(prestamo => {
				const usuario = prestamo.solicitudes_libros?.usuarios_web_movil;
				const alumno = usuario?.boletas;
				const libro = prestamo.solicitudes_libros?.ejemplares?.libros;
				const ejemplar = prestamo.solicitudes_libros?.ejemplares;
				const estadoId = Number(prestamo.estado_prestamo_id);
				
				const obj = {
					id: prestamo.id,
					estado_prestamo_id: estadoId,
					boleta: usuario?.boleta || 'N/A',
					nombre: alumno?.nombre || 'N/A',
					grupo: alumno?.Grupo || 'N/A',
					correo: usuario?.correo || 'N/A',
					libro_titulo: libro?.titulo || 'N/A',
					numero_ejemplar: ejemplar?.numero_ejemplar || 'N/A',
					fecha_inicio: prestamo.fecha_inicio_prestamo,
					fecha_limite: prestamo.fecha_limite_devolucion,
					fecha_devolucion: prestamo.fecha_devolucion_real
				};
				prestamosMap.set(obj.id, obj);
				return obj;
			});
			
			paginaActualPrestamos = 0;
			filtrarPrestamos();
		}
	} catch (error) {
		grid.innerHTML = `<div class="admin-error">Error: ${error.message}</div>`;
	}
}

function filtrarPrestamos() {
	const filtro = document.getElementById('filtro-prestamos')?.value || 'todos';
	const busqueda = (document.getElementById('buscar-prestamos')?.value || '').toLowerCase().trim();
	
	prestamosFiltrados = prestamosDataOriginal.filter(prestamo => {
		let pasaFiltro = true;
		if (filtro !== 'todos') {
			pasaFiltro = prestamo.estado_prestamo_id === Number(filtro);
		}
		
		let pasaBusqueda = true;
		if (busqueda) {
			pasaBusqueda = prestamo.boleta.toLowerCase().includes(busqueda) ||
				prestamo.nombre.toLowerCase().includes(busqueda) ||
				prestamo.libro_titulo.toLowerCase().includes(busqueda) ||
				String(prestamo.id).includes(busqueda);
		}
		
		return pasaFiltro && pasaBusqueda;
	});
	
	paginaActualPrestamos = 0;
	actualizarContadorAdmin('prestamos', prestamosFiltrados.length, prestamosDataOriginal.length);
	
	const grid = document.getElementById('grid-prestamos');
	if (prestamosFiltrados.length === 0) {
		grid.innerHTML = '<div class="admin-vacio">No se encontraron préstamos.</div>';
		ocultarControlesPaginacionAdmin('prestamos');
		return;
	}
	
	mostrarPaginaPrestamos();
	generarDotsAdmin('prestamos', Math.ceil(prestamosFiltrados.length / CARDS_PRESTAMOS), paginaActualPrestamos);
	mostrarControlesPaginacionAdmin('prestamos');
}

const debouncedFiltrarPrestamos = debounce(filtrarPrestamos, 300);

function mostrarPaginaPrestamos() {
	const grid = document.getElementById('grid-prestamos');
	if (!grid || prestamosFiltrados.length === 0) return;
	
	const inicio = paginaActualPrestamos * CARDS_PRESTAMOS;
	const fin = Math.min(inicio + CARDS_PRESTAMOS, prestamosFiltrados.length);
	const prestamosPagina = prestamosFiltrados.slice(inicio, fin);
	
	grid.innerHTML = prestamosPagina.map(prestamo => crearCardPrestamo(prestamo)).join('');
	
	actualizarDotsAdmin('prestamos', paginaActualPrestamos);
	actualizarContadorPaginacionAdmin('prestamos', paginaActualPrestamos, Math.ceil(prestamosFiltrados.length / CARDS_PRESTAMOS), prestamosFiltrados.length);
	actualizarFlechasAdmin('prestamos', paginaActualPrestamos, Math.ceil(prestamosFiltrados.length / CARDS_PRESTAMOS));
}

function crearCardPrestamo(prestamo) {
	const estadoId = prestamo.estado_prestamo_id;
	let estado, badgeClass;
	
	switch(estadoId) {
		case 1: estado = 'En espera'; badgeClass = 'badge-en-espera'; break;
		case 2: estado = 'Recogido'; badgeClass = 'badge-recogido'; break;
		case 3: estado = 'Devuelto'; badgeClass = 'badge-devuelto'; break;
		case 4: estado = 'Perdido'; badgeClass = 'badge-perdido'; break;
		default: estado = 'Desconocido'; badgeClass = 'badge-warning';
	}
	
	const botonDevolver = estadoId === 2 ? 
		`<button class="btn-aprobar" onclick="devolverPrestamo(${prestamo.id})"><i class="fas fa-undo"></i> Devolver</button>` : '';
	
	return `
		<div class="admin-card" data-id="${prestamo.id}">
			<div class="admin-card-header">
				<span class="admin-card-titulo">Préstamo #${prestamo.id}</span>
				<span class="badge ${badgeClass}">${estado}</span>
			</div>
			<div class="admin-card-body">
				<div class="admin-card-dato">
					<span class="admin-card-label">Boleta</span>
					<span class="admin-card-value">${prestamo.boleta}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Nombre</span>
					<span class="admin-card-value admin-card-value-truncate" title="${prestamo.nombre}">${prestamo.nombre}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Libro</span>
					<span class="admin-card-value admin-card-value-truncate" title="${prestamo.libro_titulo}">${prestamo.libro_titulo}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Ejemplar</span>
					<span class="admin-card-value">${prestamo.numero_ejemplar}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Inicio</span>
					<span class="admin-card-value">${formatFechaMexico(prestamo.fecha_inicio)}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Límite</span>
					<span class="admin-card-value">${formatFechaMexico(prestamo.fecha_limite)}</span>
				</div>
				<div class="admin-card-dato">
					<span class="admin-card-label">Devolución</span>
					<span class="admin-card-value">${prestamo.fecha_devolucion ? formatFechaMexico(prestamo.fecha_devolucion) : 'Pendiente'}</span>
				</div>
			</div>
			<div class="admin-card-footer">
				${botonDevolver}
			</div>
		</div>
	`;
}

function siguientePaginaPrestamos() {
	const totalPaginas = Math.ceil(prestamosFiltrados.length / CARDS_PRESTAMOS);
	if (paginaActualPrestamos < totalPaginas - 1) {
		paginaActualPrestamos++;
		mostrarPaginaPrestamos();
	}
}

function anteriorPaginaPrestamos() {
	if (paginaActualPrestamos > 0) {
		paginaActualPrestamos--;
		mostrarPaginaPrestamos();
	}
}

function irAPaginaPrestamos(indice) {
	const totalPaginas = Math.ceil(prestamosFiltrados.length / CARDS_PRESTAMOS);
	if (indice >= 0 && indice < totalPaginas) {
		paginaActualPrestamos = indice;
		mostrarPaginaPrestamos();
	}
}

async function devolverPrestamo(idPrestamo) {
	if (!confirm("¿Confirmar devolución del libro?")) return;
	const observaciones = prompt("Observaciones (opcional):", "") ?? '';

	try {
		const res = await requestJson(`/auth/admin/prestamos/libros/${idPrestamo}/devolver`, {
			method: 'POST',
			body: JSON.stringify({ observaciones })
		});
		mostrarToast(res.message, 'success');
		cargarPrestamosLibros();
		cargarSolicitudesLibros();
	} catch (error) {
		mostrarToast("Error: " + error.message, 'error');
	}
}

function inicializarSolicitudesLibros() {
    cargarSolicitudesLibros();
}

function inicializarPrestamosLibros() {
    cargarPrestamosLibros();
}

// ==================== FUNCIONES UTILITARIAS ADMIN ====================

function actualizarContadorAdmin(tipo, filtrados, total) {
	const contador = document.getElementById(`contador-${tipo}`);
	if (contador) {
		contador.textContent = `Mostrando ${filtrados} de ${total}`;
	}
}

function generarDotsAdmin(tipo, totalPaginas, paginaActual) {
	const dotsContainer = document.getElementById(`paginacion-dots-${tipo}`);
	if (!dotsContainer) return;
	
	let html = '';
	for (let i = 0; i < totalPaginas; i++) {
		html += `<span class="admin-paginacion-dot${i === paginaActual ? ' active' : ''}" onclick="irAPagina${tipo.charAt(0).toUpperCase() + tipo.slice(1)}(${i})"></span>`;
	}
	dotsContainer.innerHTML = html;
}

function actualizarDotsAdmin(tipo, paginaActual) {
	const dots = document.querySelectorAll(`#paginacion-dots-${tipo} .admin-paginacion-dot`);
	dots.forEach((dot, i) => {
		dot.classList.toggle('active', i === paginaActual);
	});
}

function actualizarContadorPaginacionAdmin(tipo, paginaActual, totalPaginas, totalItems) {
	const contador = document.getElementById(`paginacion-contador-${tipo}`);
	if (contador) {
		contador.textContent = `Página ${paginaActual + 1} de ${totalPaginas} (${totalItems} items)`;
	}
}

function actualizarFlechasAdmin(tipo, paginaActual, totalPaginas) {
	const btnAnterior = document.querySelector(`#arrow-prev-${tipo}, [onclick="anteriorPagina${tipo.charAt(0).toUpperCase() + tipo.slice(1)}()"]`);
	const btnSiguiente = document.querySelector(`#arrow-next-${tipo}, [onclick="siguientePagina${tipo.charAt(0).toUpperCase() + tipo.slice(1)}()"]`);
	
	if (btnAnterior) {
		btnAnterior.disabled = paginaActual === 0;
		btnAnterior.style.opacity = paginaActual === 0 ? '0.5' : '1';
	}
	if (btnSiguiente) {
		btnSiguiente.disabled = paginaActual >= totalPaginas - 1;
		btnSiguiente.style.opacity = paginaActual >= totalPaginas - 1 ? '0.5' : '1';
	}
}

function mostrarControlesPaginacionAdmin(tipo) {
	const carousel = document.querySelector(`#carousel-${tipo}`);
	const paginacion = document.querySelector(`#paginacion-${tipo}`);
	if (carousel) {
		carousel.style.display = 'flex';
		const arrows = carousel.querySelectorAll('.admin-arrow');
		arrows.forEach(a => a.style.visibility = 'visible');
	}
	if (paginacion) paginacion.style.display = 'flex';
}

function ocultarControlesPaginacionAdmin(tipo) {
	const carousel = document.querySelector(`#carousel-${tipo}`);
	const paginacion = document.querySelector(`#paginacion-${tipo}`);
	if (carousel) {
		const arrows = carousel.querySelectorAll('.admin-arrow');
		arrows.forEach(a => a.style.visibility = 'hidden');
	}
	if (paginacion) paginacion.style.display = 'none';
}

// ==================== EXPORTS ====================

window.inicializarLibros = inicializarLibros;
window.inicializarComputadoras = inicializarComputadoras;
window.inicializarRestiradores = inicializarRestiradores;
window.inicializarUsuarios = inicializarUsuarios;
window.inicializarSolicitudesLibros = inicializarSolicitudesLibros;
window.inicializarPrestamosLibros = inicializarPrestamosLibros;

// Libros
window.cargarLibros = cargarLibros;
window.filtrarLibros = filtrarLibros;
window.debouncedFiltrarLibros = debouncedFiltrarLibros;
window.siguientePaginaLibros = siguientePaginaLibros;
window.anteriorPaginaLibros = anteriorPaginaLibros;
window.irAPaginaLibros = irAPaginaLibros;
window.editarLibroCard = editarLibroCard;
window.eliminarLibroCard = eliminarLibroCard;

// Computadoras
window.cargarComputadoras = cargarComputadoras;
window.filtrarComputadoras = filtrarComputadoras;
window.debouncedFiltrarComputadoras = debouncedFiltrarComputadoras;
window.siguientePaginaComputadoras = siguientePaginaComputadoras;
window.anteriorPaginaComputadoras = anteriorPaginaComputadoras;
window.irAPaginaComputadoras = irAPaginaComputadoras;
window.editarComputadoraCard = editarComputadoraCard;
window.eliminarComputadoraCard = eliminarComputadoraCard;

// Restiradores
window.cargarRestiradores = cargarRestiradores;
window.filtrarRestiradores = filtrarRestiradores;
window.debouncedFiltrarRestiradores = debouncedFiltrarRestiradores;
window.siguientePaginaRestiradores = siguientePaginaRestiradores;
window.anteriorPaginaRestiradores = anteriorPaginaRestiradores;
window.irAPaginaRestiradores = irAPaginaRestiradores;
window.editarRestiradorCard = editarRestiradorCard;
window.eliminarRestiradorCard = eliminarRestiradorCard;

// Usuarios
window.cargarUsuarios = cargarUsuarios;
window.filtrarUsuarios = filtrarUsuarios;
window.debouncedFiltrarUsuarios = debouncedFiltrarUsuarios;
window.siguientePaginaUsuarios = siguientePaginaUsuarios;
window.anteriorPaginaUsuarios = anteriorPaginaUsuarios;
window.irAPaginaUsuarios = irAPaginaUsuarios;
window.habilitarUsuarioCard = habilitarUsuarioCard;

// Solicitudes
window.cargarSolicitudesLibros = cargarSolicitudesLibros;
window.filtrarSolicitudes = filtrarSolicitudes;
window.siguientePaginaSolicitud = siguientePaginaSolicitud;
window.anteriorPaginaSolicitud = anteriorPaginaSolicitud;
window.irAPaginaSolicitud = irAPaginaSolicitud;
window.gestionarSolicitud = gestionarSolicitud;
window.entregarLibro = entregarLibro;

// Préstamos
window.cargarPrestamosLibros = cargarPrestamosLibros;
window.filtrarPrestamos = filtrarPrestamos;
window.debouncedFiltrarPrestamos = debouncedFiltrarPrestamos;
window.siguientePaginaPrestamos = siguientePaginaPrestamos;
window.anteriorPaginaPrestamos = anteriorPaginaPrestamos;
window.irAPaginaPrestamos = irAPaginaPrestamos;
window.devolverPrestamo = devolverPrestamo;
