import { useEffect, useState } from 'react';
import { AlertCircle, Plus, RefreshCcw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { soporteApi } from '../../api/soporte';
import '../../styles/support.css';

export default function AgregarAgenteSoporte() {
  const [agentes, setAgentes] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    boleta: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await soporteApi.getAgents();
      setAgentes(data?.agentes || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los agentes');
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
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('La confirmacion de contrasena no coincide');
      return;
    }

    setSaving(true);
    try {
      await soporteApi.createAgent({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        boleta: form.boleta,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Agente de soporte registrado');
      setForm({
        nombre: '',
        email: '',
        telefono: '',
        boleta: '',
        password: '',
        confirmPassword: '',
      });
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
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>Modulo de soporte</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Agregar agente de soporte</h1>
            <p className="text-sm text-[var(--text-muted)]">Registro de nuevos agentes con validacion de contrasena confirmada.</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={load} disabled={loading}>
            <RefreshCcw size={14} /> Actualizar
          </button>
        </div>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} /> {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Plus size={15} /> Nuevo agente</h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={createAgent}>
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Nombre completo" value={form.nombre} onChange={setField('nombre')} required />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="correo@soporte.com" type="email" value={form.email} onChange={setField('email')} required />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Numero de boleta" value={form.boleta} onChange={setField('boleta')} maxLength={10} onKeyPress={(e) => e.key !== 'Enter' && !/\d/.test(e.key) && e.preventDefault()} />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Telefono" value={form.telefono} onChange={setField('telefono')} />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Contrasena temporal" type="password" value={form.password} onChange={setField('password')} required />
              <input className="px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" placeholder="Confirmar contrasena" type="password" value={form.confirmPassword} onChange={setField('confirmPassword')} required />
              <button className="md:col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={saving}>
                <Plus size={14} /> {saving ? 'Guardando...' : 'Crear agente'}
              </button>
            </form>
          </section>

          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Users size={15} /> Agentes registrados</h2>
            <div className="space-y-2">
              {agentes.map((a) => (
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
              {!loading && agentes.length === 0 && <p className="text-sm text-[var(--text-muted)]">No hay agentes registrados.</p>}
            </div>
          </section>
        </div>
      </div>
    </AnimatedPage>
  );
}
