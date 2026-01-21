// Enviar solicitud de recurso al backend
window.SolicitudRecursos = async function SolicitudRecursos(tipo, boleta, idRecurso) {
	const API_BASE = window.API_BASE_URL || 'http://localhost:3000';
	try {
		const resp = await fetch(`${API_BASE}/auth/solicitud`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ tipo, boleta, idRecurso })
		});

		const json = await resp.json().catch(() => ({}));

		if (!resp.ok) {
			return { success: false, message: json.message || json.error || `HTTP ${resp.status}` };
		}

		return { success: true, data: json };
	} catch (err) {
		return { success: false, message: 'Error de conexión' };
	}
};