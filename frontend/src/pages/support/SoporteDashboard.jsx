import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Inbox, Clock, CheckCircle2, Activity, RefreshCcw, Bug, Users, ChevronRight, AlertCircle,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { soporteApi } from '../../api/soporte';
import '../../styles/support.css';

const COLORS = ['#176d5a', '#c46f21', '#0284c7', '#8b5cf6', '#dc4c3f', '#1f9d74'];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function SoporteDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await soporteApi.dashboard());
    } catch (err) {
      setError(err.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};
  const cards = [
    { lbl: 'Total tickets', val: stats.total ?? 0, color: '#e89a4f', icon: Ticket },
    { lbl: 'Abiertos', val: stats.abiertos ?? 0, color: '#8b5cf6', icon: Inbox },
    { lbl: 'Pendientes', val: stats.pendientes ?? 0, color: '#d97706', icon: Clock },
    { lbl: 'Resueltos', val: stats.resueltos ?? 0, color: '#1f9d74', icon: CheckCircle2 },
    { lbl: 'Tiempo medio', val: formatMinutes(stats.tiempoMedioMinutos), color: '#0284c7', icon: Activity },
  ];

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>Soporte C-Book</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)]">Metricas reales del proyecto Supabase de soporte</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={() => navigate('/admin/soporte/reportar')}>
              Reportar
            </button>
            <button className="px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={() => navigate('/admin/soporte/config')}>
              Configuracion
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={load} disabled={loading}>
              <RefreshCcw size={14} /> Actualizar
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} /> {error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((s, i) => (
            <div key={s.lbl} className="sup-stat-card" style={{ '--stat-color': s.color }}>
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}22`, color: s.color }}>
                  <s.icon size={16} />
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{s.lbl}</div>
              <div className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">{loading ? '...' : s.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><Activity size={15} /> Cola en vivo</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Tickets abiertos o pendientes</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => navigate('/admin/soporte/tickets')}>
                Ver bandeja <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-0">
              {(data?.cola || []).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-glass)] -mx-2 px-2 rounded-lg transition-colors" onClick={() => navigate(`/admin/soporte/tickets/${t.id}`)}>
                  <span className="sup-ticket-id text-xs">{t.folio}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{t.titulo}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{t.solicitante} - {t.tipo} - {formatDate(t.creado)}</div>
                  </div>
                  <EstadoBadge estado={t.estado} />
                </div>
              ))}
              {!loading && (data?.cola || []).length === 0 && (
                <div className="py-10 text-center text-sm text-[var(--text-muted)]">No hay tickets abiertos.</div>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><Bug size={15} /> Distribucion por tipo</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tickets registrados por categoria</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data?.tipos || []} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" strokeWidth={0}>
                  {(data?.tipos || []).map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5">
              {(data?.tipos || []).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[var(--text-secondary)] flex-1">{d.name}</span>
                  <span className="font-bold text-[var(--text-primary)]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Users size={15} /> Carga de agentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(data?.agentes || []).map((a) => (
              <div key={a.name} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-glass)] p-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{a.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{a.open} abiertos - {a.done} resueltos</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
