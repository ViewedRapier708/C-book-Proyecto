import { useEffect, useState } from 'react';
import {
  Tag, Share2, FileText, RefreshCcw, AlertCircle, Users, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { soporteApi } from '../../api/soporte';
import '../../styles/support.css';

export default function ConfiguracionSoporte() {
  const [data, setData] = useState({ tipos: [], plantillas: [], asignacion: null, agentes: [] });
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', boleta: '', password: '', rol: 'support_agent', estado: 'active' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const createAgent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await soporteApi.createAgent(form);
      toast.success('Agente registrado');
      setForm({ nombre: '', email: '', telefono: '', boleta: '', password: '', rol: 'support_agent', estado: 'active' });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el agente');
    } finally {
      setSaving(false);
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 lg:col-span-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Users size={15} /> Agentes de soporte</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={createAgent}>
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Nombre completo" value={form.nombre} onChange={setField('nombre')} required />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="correo@soporte.com" type="email" value={form.email} onChange={setField('email')} required />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Numero de boleta" value={form.boleta} onChange={setField('boleta')} maxLength={10} onKeyPress={(e) => e.key !== 'Enter' && !/\d/.test(e.key) && e.preventDefault()} />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Telefono" value={form.telefono} onChange={setField('telefono')} />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Contrasena temporal" type="password" value={form.password} onChange={setField('password')} required />
              <select className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={form.rol} onChange={setField('rol')}>
                <option value="support_agent">Agente de soporte</option>
                <option value="support_admin">Administrador de soporte</option>
              </select>
              <select className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={form.estado} onChange={setField('estado')}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              <button className="md:col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={saving}>
                <Plus size={14} /> {saving ? 'Guardando...' : 'Nuevo agente'}
              </button>
            </form>
            <div className="space-y-2">
              {(data.agentes || []).map((a) => (
                <div key={a.userId} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-sm text-[var(--text-primary)]">{a.nombre}</strong>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{a.email}{a.boleta ? ` | Boleta: ${a.boleta}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="sup-badge sup-badge-neutral">{a.rol === 'support_admin' ? 'Admin soporte' : 'Agente'}</span>
                      <span className={`sup-badge ${a.activo ? 'sup-estado-resuelto' : 'sup-badge-neutral'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && (data.agentes || []).length === 0 && <p className="text-sm text-[var(--text-muted)]">No hay agentes registrados.</p>}
            </div>
          </section>

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

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Share2 size={15} /> Distribucion</h2>
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Asignacion automatica</div>
              <div className="text-lg font-extrabold text-[var(--text-primary)]">{data.asignacion?.is_enabled ? 'Activa' : 'Inactiva'}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-2">Modo: <strong>{data.asignacion?.mode || 'manual'}</strong></div>
              <div className="text-xs text-[var(--text-muted)] mt-2">
                Los cambios de configuracion avanzada deben hacerse en Supabase hasta que se conecten acciones de escritura para este panel.
              </div>
            </div>
          </section>
        </div>
      </div>
    </AnimatedPage>
  );
}
