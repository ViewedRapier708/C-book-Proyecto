import { useEffect, useState } from 'react';
import {
  Tag, FileText, RefreshCcw, AlertCircle,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { soporteApi } from '../../api/soporte';
import '../../styles/support.css';

export default function ConfiguracionSoporte() {
  const [data, setData] = useState({ tipos: [], plantillas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await soporteApi.config());
    } catch (err) {
      setError(err.message || 'No se pudo cargar la configuracion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>Modulo de soporte - Configuracion</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Configuracion</h1>
            <p className="text-sm text-[var(--text-muted)]">Lectura directa de tipos, plantillas y reglas guardadas en Supabase.</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={load} disabled={loading}>
            <RefreshCcw size={14} /> Actualizar
          </button>
        </div>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} /> {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Tag size={15} /> Tipos de incidencia</h2>
            <div className="space-y-2">
              {loading && <p className="text-sm text-[var(--text-muted)]">Cargando...</p>}
              {(data.tipos || []).map((t) => (
                <div key={t.id} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-[var(--text-primary)]">{t.name}</strong>
                    <span className={`sup-badge ${t.is_active ? 'sup-estado-resuelto' : 'sup-badge-neutral'}`}>{t.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t.description || 'Sin descripcion'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><FileText size={15} /> Plantillas</h2>
            <div className="space-y-2">
              {(data.plantillas || []).map((p) => (
                <div key={p.id} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-[var(--text-primary)]">{p.title}</strong>
                    <span className={`sup-badge ${p.is_active ? 'sup-estado-resuelto' : 'sup-badge-neutral'}`}>{p.is_active ? 'Activa' : 'Inactiva'}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-3">{p.body}</p>
                </div>
              ))}
              {!loading && (data.plantillas || []).length === 0 && <p className="text-sm text-[var(--text-muted)]">No hay plantillas registradas.</p>}
            </div>
          </section>

        </div>
      </div>
    </AnimatedPage>
  );
}
