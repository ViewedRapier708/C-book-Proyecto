const API_BASE = window.API_BASE_URL || '';
const PAGE_LIMIT = 10;

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
	const mensaje = document.getElementById('mensaje-libros');
	ocultarMensaje(mensaje);
	try {
		const { page, limit } = adminState.libros;
		const resultado = await requestJson(`/auth/admin/materiales/libros?page=${page}&limit=${limit}`);
		const tabla = document.getElementById('tabla-libros');

		if (!tabla) return;

		const filas = (resultado.data || []).map((item) => {
			const libro = item.libros || {};
			return {
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
		});

		filas.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));

		tabla.innerHTML = filas
			.map(
				(fila) => `
				<tr data-libro-id="${fila.libro_id}" data-ejemplar-id="${fila.ejemplar_id}">
					<td>${fila.ejemplar_id}</td>
					<td>${fila.titulo}</td>
					<td>${fila.autor}</td>
					<td>${fila.clasificacion}</td>
					<td>${fila.isbn}</td>
					<td>${fila.tipo_material}</td>
					<td>${fila.codigo_barras}</td>
					<td>${fila.numero_ejemplar}</td>
					<td>${fila.anio}</td>
					<td>${fila.estatus_item}</td>
					<td>${formatBoolean(fila.Disponible)}</td>
					<td>${fila.coleccion}</td>
					<td>
						<div class="acciones-botones">
							<button class="btn-editar" data-action="editar">Editar</button>
							<button class="btn-eliminar" data-action="eliminar">Eliminar</button>
						</div>
					</td>
				</tr>
			`
			)
			.join('');

		adminState.libros.total = resultado.total || 0;
		adminState.libros.lastCount = filas.length;
		actualizarTotal('libros', adminState.libros.total);
		actualizarPaginacion('libros');
	} catch (error) {
		mostrarMensaje(mensaje, 'error', error.message);
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
	const tbody = document.getElementById('tabla-libros');
	const mensaje = document.getElementById('mensaje-libros');

	inicializarModalConfirmacion();
	configurarPaginacion('libros', cargarLibros);
	configurarRecarga('libros', cargarLibros);

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

	tbody?.addEventListener('click', async (event) => {
		const action = event.target.getAttribute('data-action');
		const fila = event.target.closest('tr');
		if (!action || !fila) return;

		const libroId = fila.getAttribute('data-libro-id');
		const ejemplarId = fila.getAttribute('data-ejemplar-id');

		if (action === 'editar') {
			document.getElementById('modal-titulo').textContent = 'Editar Libro';
			document.getElementById('libro_id').value = libroId;
			document.getElementById('ejemplar_id').value = ejemplarId;
			document.getElementById('titulo').value = fila.cells[1].textContent;
			document.getElementById('autor').value = fila.cells[2].textContent;
			document.getElementById('clasificacion').value = fila.cells[3].textContent;
			document.getElementById('isbn').value = fila.cells[4].textContent;
			document.getElementById('tipo_material').value = fila.cells[5].textContent;
			document.getElementById('codigo_barras').value = fila.cells[6].textContent;
			document.getElementById('numero_ejemplar').value = fila.cells[7].textContent;
			document.getElementById('anio').value = fila.cells[8].textContent;
			document.getElementById('estatus_item').value = fila.cells[9].textContent;
			document.getElementById('disponible').value = fila.cells[10].textContent.trim() === 'Sí' ? 'true' : 'false';
			document.getElementById('coleccion').value = fila.cells[11].textContent;
			abrirModal(modal);
		}

		if (action === 'eliminar') {
			const confirmar = await abrirConfirmacion({
				titulo: 'Eliminar registro',
				mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
				detalle: `
					<p><strong>Título:</strong> ${fila.cells[1].textContent}</p>
					<p><strong>Código de barras:</strong> ${fila.cells[6].textContent}</p>
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
	});

	cargarLibros();
}

// ==================== COMPUTADORAS ====================

async function cargarComputadoras() {
	const mensaje = document.getElementById('mensaje-computadoras');
	ocultarMensaje(mensaje);
	try {
		const { page, limit } = adminState.computadoras;
		const resultado = await requestJson(`/auth/admin/materiales/computadoras?page=${page}&limit=${limit}`);
		const tabla = document.getElementById('tabla-computadoras');

		if (!tabla) return;

		const filas = (resultado.data || []).map((item) => ({
			id: item.id,
			no_computadora: item.no_computadora,
			procesador: item.procesador || '',
			programas: item.programas || '',
			carrera: item.carrera || '',
			Disponible: item.Disponible,
			En_funcionamiento: item.En_funcionamiento,
			Observacion: item.Observacion || '',
			no_inventario: item.no_inventario || ''
		}));

		filas.sort((a, b) => Number(a.no_computadora) - Number(b.no_computadora));

		tabla.innerHTML = filas
			.map(
				(fila) => `
				<tr data-id="${fila.id}">
					<td>${fila.no_computadora}</td>
					<td>${fila.procesador}</td>
					<td>${fila.programas}</td>
					<td>${fila.carrera}</td>
					<td>${formatBoolean(fila.Disponible)}</td>
					<td>${formatBoolean(fila.En_funcionamiento)}</td>
					<td>${fila.Observacion}</td>
					<td>${fila.no_inventario}</td>
					<td>
						<div class="acciones-botones">
							<button class="btn-editar" data-action="editar">Editar</button>
							<button class="btn-eliminar" data-action="eliminar">Eliminar</button>
						</div>
					</td>
				</tr>
			`
			)
			.join('');

		adminState.computadoras.total = resultado.total || 0;
		adminState.computadoras.lastCount = filas.length;
		actualizarTotal('computadoras', adminState.computadoras.total);
		actualizarPaginacion('computadoras');
	} catch (error) {
		mostrarMensaje(mensaje, 'error', error.message);
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
	const tbody = document.getElementById('tabla-computadoras');
	const mensaje = document.getElementById('mensaje-computadoras');

	inicializarModalConfirmacion();
	configurarPaginacion('computadoras', cargarComputadoras);
	configurarRecarga('computadoras', cargarComputadoras);

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

	tbody?.addEventListener('click', async (event) => {
		const action = event.target.getAttribute('data-action');
		const fila = event.target.closest('tr');
		if (!action || !fila) return;

		const id = fila.getAttribute('data-id');

		if (action === 'editar') {
			document.getElementById('modal-titulo').textContent = 'Editar Computadora';
			document.getElementById('computadora_id').value = id;
			document.getElementById('no_computadora').value = fila.cells[0].textContent;
			document.getElementById('procesador').value = fila.cells[1].textContent;
			document.getElementById('programas').value = fila.cells[2].textContent;
			document.getElementById('carrera').value = fila.cells[3].textContent;
			document.getElementById('disponible').value = fila.cells[4].textContent.trim() === 'Sí' ? 'true' : 'false';
			document.getElementById('en_funcionamiento').value = fila.cells[5].textContent.trim() === 'Sí' ? 'true' : 'false';
			document.getElementById('observacion').value = fila.cells[6].textContent;
			document.getElementById('no_inventario').value = fila.cells[7].textContent;
			abrirModal(modal);
		}

		if (action === 'eliminar') {
			const confirmar = await abrirConfirmacion({
				titulo: 'Eliminar registro',
				mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
				detalle: `<p><strong>No. Inventario:</strong> ${fila.cells[7].textContent}</p>`
			});

			if (!confirmar) return;

			try {
				await requestJson(`/auth/admin/materiales/computadoras/${id}`, { method: 'DELETE' });
				mostrarToast('Material eliminado exitosamente.');
				cargarComputadoras();
			} catch (error) {
				if (error.message?.includes('fk_solicitudes_computadora_equipo')) {
					mostrarToast(
						'No se puede eliminar el material porque hay solicitudes relacionadas con ese material.',
						'error'
					);
				} else {
					mostrarToast(error.message || 'No se pudo eliminar el material.', 'error');
				}
			}
		}
	});

	cargarComputadoras();
}

// ==================== RESTIRADORES ====================

async function cargarRestiradores() {
	const mensaje = document.getElementById('mensaje-restiradores');
	ocultarMensaje(mensaje);
	try {
		const { page, limit } = adminState.restiradores;
		const resultado = await requestJson(`/auth/admin/materiales/restiradores?page=${page}&limit=${limit}`);
		const tabla = document.getElementById('tabla-restiradores');

		if (!tabla) return;

		const filas = (resultado.data || []).map((item) => ({
			id: item.id,
			no_restirador: item.no_restirador,
			no_inventario: item.no_inventario || '',
			Disponible: item.Disponible,
			estado_de_material: item.estado_de_material,
			Observacion: item.Observacion || ''
		}));

		filas.sort((a, b) => Number(a.no_restirador) - Number(b.no_restirador));

		tabla.innerHTML = filas
			.map(
				(fila) => `
				<tr data-id="${fila.id}">
					<td>${fila.no_restirador}</td>
					<td>${fila.no_inventario}</td>
					<td>${formatBoolean(fila.Disponible)}</td>
					<td>${formatEstadoMaterial(fila.estado_de_material)}</td>
					<td>${fila.Observacion}</td>
					<td>
						<div class="acciones-botones">
							<button class="btn-editar" data-action="editar">Editar</button>
							<button class="btn-eliminar" data-action="eliminar">Eliminar</button>
						</div>
					</td>
				</tr>
			`
			)
			.join('');

		adminState.restiradores.total = resultado.total || 0;
		adminState.restiradores.lastCount = filas.length;
		actualizarTotal('restiradores', adminState.restiradores.total);
		actualizarPaginacion('restiradores');
	} catch (error) {
		mostrarMensaje(mensaje, 'error', error.message);
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
	const tbody = document.getElementById('tabla-restiradores');
	const mensaje = document.getElementById('mensaje-restiradores');

	inicializarModalConfirmacion();
	configurarPaginacion('restiradores', cargarRestiradores);
	configurarRecarga('restiradores', cargarRestiradores);

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

	tbody?.addEventListener('click', async (event) => {
		const action = event.target.getAttribute('data-action');
		const fila = event.target.closest('tr');
		if (!action || !fila) return;

		const id = fila.getAttribute('data-id');

		if (action === 'editar') {
			document.getElementById('modal-titulo').textContent = 'Editar Restirador';
			document.getElementById('restirador_id').value = id;
			document.getElementById('no_restirador').value = fila.cells[0].textContent;
			document.getElementById('no_inventario').value = fila.cells[1].textContent;
			document.getElementById('disponible').value = fila.cells[2].textContent.trim() === 'Sí' ? 'true' : 'false';
			document.getElementById('estado_material').value = fila.cells[3].textContent.trim() === 'Funcional' ? 'true' : 'false';
			document.getElementById('observacion').value = fila.cells[4].textContent;
			abrirModal(modal);
		}

		if (action === 'eliminar') {
			const confirmar = await abrirConfirmacion({
				titulo: 'Eliminar registro',
				mensaje: '¿Confirma la eliminación de este registro? Esta acción es irreversible.',
				detalle: `<p><strong>No. Inventario:</strong> ${fila.cells[1].textContent}</p>`
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
	});

	cargarRestiradores();
}

// ==================== USUARIOS ====================

async function cargarUsuarios() {
	const mensaje = document.getElementById('mensaje-usuarios');
	ocultarMensaje(mensaje);
	try {
		const { page, limit } = adminState.usuarios;
		const resultado = await requestJson(`/auth/admin/usuarios?page=${page}&limit=${limit}`);
		const tabla = document.getElementById('tabla-usuarios');

		if (!tabla) return;

		tabla.innerHTML = (resultado.data || [])
			.map(
				(usuario) => `
				<tr data-id="${usuario.id}" data-habilitado="${usuario.tiene_documentos}">
					<td>${usuario.boleta}</td>
					<td>${usuario.correo}</td>
					<td>${usuario.rol}</td>
					<td>${formatBoolean(usuario.tiene_documentos)}</td>
					<td>
						${
							usuario.tiene_documentos
								? ''
								: '<button class="btn-habilitar" data-action="habilitar">Habilitar documentación</button>'
						}
					</td>
				</tr>
			`
			)
			.join('');

		adminState.usuarios.total = resultado.total || 0;
		adminState.usuarios.lastCount = (resultado.data || []).length;
		actualizarTotal('usuarios', adminState.usuarios.total);
		actualizarPaginacion('usuarios');
	} catch (error) {
		mostrarMensaje(mensaje, 'error', error.message);
	}
}

function inicializarUsuarios() {
	const tbody = document.getElementById('tabla-usuarios');
	const mensaje = document.getElementById('mensaje-usuarios');

	inicializarModalConfirmacion();
	configurarPaginacion('usuarios', cargarUsuarios);
	configurarRecarga('usuarios', cargarUsuarios);

	tbody?.addEventListener('click', async (event) => {
		const action = event.target.getAttribute('data-action');
		const fila = event.target.closest('tr');
		if (!action || !fila) return;

		if (action === 'habilitar') {
			const usuario = {
				id: fila.getAttribute('data-id'),
				boleta: fila.cells[0].textContent,
				correo: fila.cells[1].textContent,
				rol: fila.cells[2].textContent,
				tiene_documentos: fila.getAttribute('data-habilitado') === 'true'
			};

			const confirmar = await abrirConfirmacion({
				titulo: 'Habilitar documentación',
				mensaje: '¿Confirma la habilitación de la documentación de este usuario? Esta acción es irreversible.',
				detalle: obtenerDetalleUsuario(usuario)
			});

			if (!confirmar) return;

			try {
				await requestJson(`/auth/admin/usuarios/${usuario.id}/habilitar`, { method: 'PUT' });
				mostrarMensaje(mensaje, 'success', 'Documentación habilitada correctamente.');
				cargarUsuarios();
			} catch (error) {
				mostrarMensaje(mensaje, 'error', error.message);
			}
		}

	});

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
    const tbody = document.getElementById('tabla-prestamos-libros');
    if (!tbody) return;
    
	tbody.innerHTML = '<tr><td colspan="13" class="loading">Cargando préstamos...</td></tr>';

    try {
        const respuesta = await requestJson('/auth/admin/prestamos/libros');
        if (respuesta.success) {
            tbody.innerHTML = '';
            
            if (respuesta.data.length === 0) {
				 tbody.innerHTML = '<tr><td colspan="13">No hay préstamos registrados.</td></tr>';
                 return;
            }

            respuesta.data.forEach(prestamo => {
                const tr = document.createElement('tr');
                const usuario = prestamo.solicitudes_libros?.usuarios_web_movil;
				const alumno = usuario?.boletas;
                const libro = prestamo.solicitudes_libros?.ejemplares?.libros;
                const ejemplar = prestamo.solicitudes_libros?.ejemplares;
				const estadoId = Number(prestamo.estado_prestamo_id);
				const estado = estadoId === 1
					? 'En espera'
					: estadoId === 2
						? 'Recogido'
						: estadoId === 3
							? 'Devuelto'
							: 'Perdido';
				const devuelto = estadoId === 3 ? 'Sí' : 'No';
				let acciones = '';
				if (estadoId === 2) {
					acciones = `
						<button class="btn-guardar" style="background: #2f855a; color: white; border-color: #2f855a;" onclick="devolverPrestamo(${prestamo.id})">
							<i class="fas fa-undo"></i> Marcar Devuelto
						</button>
					`;
				}

                tr.innerHTML = `
                    <td>${prestamo.id}</td>
                    <td>${usuario?.boleta || 'N/A'}</td>
					<td>${alumno?.nombre || 'N/A'}</td>
					<td>${alumno?.Grupo || 'N/A'}</td>
					<td>${usuario?.correo || 'N/A'}</td>
                    <td>${libro?.titulo || 'N/A'}</td>
                    <td>${ejemplar?.numero_ejemplar || 'N/A'}</td>
					<td>${formatFechaMexico(prestamo.fecha_inicio_prestamo)}</td>
					<td>${formatFechaMexico(prestamo.fecha_limite_devolucion)}</td>
					<td>${formatFechaMexico(prestamo.fecha_devolucion_real)}</td>
					<td>${estado}</td>
					<td>${devuelto}</td>
					<td class="acciones-botones">${acciones}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
		tbody.innerHTML = `<tr><td colspan="12" class="error">Error: ${error.message}</td></tr>`;
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

window.inicializarLibros = inicializarLibros;
window.inicializarComputadoras = inicializarComputadoras;
window.inicializarRestiradores = inicializarRestiradores;
window.inicializarUsuarios = inicializarUsuarios;
window.inicializarSolicitudesLibros = inicializarSolicitudesLibros;
window.inicializarPrestamosLibros = inicializarPrestamosLibros;
window.cargarSolicitudesLibros = cargarSolicitudesLibros;
window.filtrarSolicitudes = filtrarSolicitudes;
window.siguientePaginaSolicitud = siguientePaginaSolicitud;
window.anteriorPaginaSolicitud = anteriorPaginaSolicitud;
window.irAPaginaSolicitud = irAPaginaSolicitud;
window.gestionarSolicitud = gestionarSolicitud;
window.entregarLibro = entregarLibro;
window.cargarPrestamosLibros = cargarPrestamosLibros;
window.devolverPrestamo = devolverPrestamo;
