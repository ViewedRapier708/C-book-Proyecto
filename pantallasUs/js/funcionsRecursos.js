// Carga y renderiza computadoras en la tabla de solicitudComputadoras.html
(function(){
  const API_BASE = `http://${location.hostname}:3000`;

  function mapValue(row, keys, fallback = '') {
    for (const k of keys) {
      if (row && row[k] !== undefined && row[k] !== null) return String(row[k]);
    }
    return fallback;
  }

  async function cargarComputadoras() {
    const tbody = document.getElementById('tbody-computadoras');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
    try {
      const res = await fetch(`${API_BASE}/auth/recursos/tipo`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Error al obtener recursos');
      const lista = payload?.recursos || [];
      if (!Array.isArray(lista) || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Sin datos</td></tr>';
        return;
      }
      const rowsHtml = lista.map(row => {
        const numero = mapValue(row, ['numero', 'no', 'id', 'id_computadora', 'no_computadora', 'num_computadora'], '');
        const procesador = mapValue(row, ['procesador', 'cpu'], '');
        const programas = mapValue(row, ['programas', 'software'], '');
        const carrera = mapValue(row, ['carrera'], '');
        const dispVal = row?.disponible ?? row?.disponibilidad ?? row?.status ?? row?.estado;
        const disponibilidad = typeof dispVal === 'boolean' ? (dispVal ? 'Disponible' : 'No disponible') : (dispVal ?? '');
        return `<tr>
          <td>${numero}</td>
          <td>${procesador}</td>
          <td>${programas}</td>
          <td>${carrera}</td>
          <td>${disponibilidad}</td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rowsHtml;
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="5" style="color:red;">${err.message || 'Error de conexión'}</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', cargarComputadoras);
  window.cargarComputadoras = cargarComputadoras; // opcional
})();
