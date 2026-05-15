import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Inbox, Clock, CheckCircle2, Activity, Zap,
  ArrowUp, ArrowDown, RefreshCcw, Calendar, Bug, Users, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

// ── Mock data ────────────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: 'SOP-2841', tipo: 'Funcional',   titulo: 'Error al registrar préstamo de libro: ISBN no válido',           estado: 'Abierto',   prioridad: 'Alta',  solicitante: 'Laura Méndez',  agente: 'María Velázquez', creado: 'Hoy 09:14',  sla: 0.6  },
  { id: 'SOP-2840', tipo: 'Visual',      titulo: 'La tabla de inventario se desborda en pantallas pequeñas',       estado: 'Pendiente', prioridad: 'Media', solicitante: 'Diego Vázquez', agente: 'María Velázquez', creado: 'Ayer 16:02', sla: 0.85 },
  { id: 'SOP-2839', tipo: 'Rendimiento', titulo: 'Listado de usuarios tarda más de 8s en cargar',                  estado: 'Nuevo',     prioridad: 'Alta',  solicitante: 'Laura Méndez',  agente: '—',              creado: 'Hoy 11:38',  sla: 0.4  },
  { id: 'SOP-2838', tipo: 'Funcional',   titulo: 'No se puede subir comprobante PDF mayor a 2 MB',                 estado: 'En espera', prioridad: 'Media', solicitante: 'Sofía Ortiz',   agente: 'Iván Ramírez',   creado: 'Ayer 10:25', sla: 0.92 },
];

const CHART_DATA = [
  { day: '9 abr',  creados: 9,  resueltos: 7  },
  { day: '15 abr', creados: 14, resueltos: 13 },
  { day: '22 abr', creados: 18, resueltos: 16 },
  { day: '29 abr', creados: 22, resueltos: 22 },
  { day: '7 may',  creados: 25, resueltos: 24 },
];

const TIPO_DATA = [
  { name: 'Funcional',   value: 14, color: '#0284c7' },
  { name: 'Rendimiento', value: 11, color: '#d97706' },
  { name: 'Visual',      value: 8,  color: '#8b5cf6' },
  { name: 'Datos',       value: 5,  color: '#1f9d74' },
  { name: 'Acceso',      value: 5,  color: '#dc4c3f' },
];

const AGENTS = [
  { name: 'María Velázquez', open: 8, done: 24, load: 0.85, online: true  },
  { name: 'Iván Ramírez',    open: 6, done: 19, load: 0.65, online: true  },
  { name: 'Carlos Núñez',    open: 4, done: 15, load: 0.45, online: false },
  { name: 'Andrea Soto',     open: 3, done: 9,  load: 0.32, online: true  },
];

const STATS = [
  { lbl: 'Total tickets',   val: 248,       color: '#e89a4f', trend: '+18%', up: true,  icon: Ticket,      spark: [10,12,9,15,17,14,20,22,18,24,28,30] },
  { lbl: 'Abiertos',        val: 32,        color: '#8b5cf6', trend: '+4',   up: true,  icon: Inbox,       spark: [4,5,6,7,5,8,9,8,10,9,11,12] },
  { lbl: 'Pendientes',      val: 11,        color: '#d97706', trend: '-2',   up: false, icon: Clock,       spark: [8,10,12,11,9,8,7,9,10,8,7,6] },
  { lbl: 'Resueltos (mes)', val: 187,       color: '#1f9d74', trend: '+22%', up: true,  icon: CheckCircle2,spark: [12,14,16,15,18,20,22,21,24,26,28,30] },
  { lbl: 'Tiempo medio',    val: '3h 12m',  color: '#0284c7', trend: '-18m', up: true,  icon: Activity,    spark: [200,210,205,195,180,175,170,168,160,155,150,148] },
];

const PALETTE = ['#176d5a', '#c46f21', '#0284c7', '#8b5cf6', '#dc4c3f', '#1f9d74'];

// ── Sub-components ───────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const bg = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return <div className="sup-avatar" style={{ background: bg }}>{initials}</div>;
}

function EstadoBadge({ estado }) {
  const map = {
    Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto',
    Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera',
    Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado',
  };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function Sparkline({ data, color }) {
  const w = 140, h = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${w},${h} L0,${h} Z`;
  const gId = `sp${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function SoporteDashboard() {
  const [range, setRange] = useState('30d');
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>
              CU-S02 · Dashboard de soporte
            </p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)]">
              3 tickets nuevos esperan asignación · 2 vencen hoy · tiempo medio de resolución 3h 12m
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg p-1 gap-0.5">
              {['7d', '30d', '90d'].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${range === r ? 'bg-[var(--bg-glass-strong)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              <Calendar size={13} /> 7 abr – 7 may
            </button>
            <button className="p-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.lbl}
              className="sup-stat-card"
              style={{ '--stat-color': s.color }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}22`, color: s.color }}>
                  <s.icon size={16} />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full bg-[var(--bg-glass)]"
                  style={{ color: s.up ? '#1f9d74' : '#d97706' }}>
                  {s.up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{s.trend}
                </span>
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{s.lbl}</div>
              <div className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">{s.val}</div>
              <Sparkline data={s.spark} color={s.color} />
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line chart */}
          <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Activity size={15} /> Tickets por día
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Creados vs resueltos · últimos 30 días</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#e89a4f' }} /> Creados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#1f9d74' }} /> Resueltos
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="gCr" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#e89a4f" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e89a4f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRs" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#1f9d74" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1f9d74" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#738296', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <Area type="monotone" dataKey="creados"   stroke="#e89a4f" strokeWidth={2} fill="url(#gCr)" name="Creados" />
                <Area type="monotone" dataKey="resueltos" stroke="#1f9d74" strokeWidth={2} fill="url(#gRs)" name="Resueltos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Bug size={15} /> Distribución por tipo
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tickets activos por categoría</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={TIPO_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" strokeWidth={0}>
                    {TIPO_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5">
                {TIPO_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-[var(--text-secondary)] flex-1">{d.name}</span>
                    <span className="font-bold text-[var(--text-primary)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live queue */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap size={15} /> Cola en vivo
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Tickets que requieren atención inmediata</p>
              </div>
              <button
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                onClick={() => navigate('/admin/soporte/tickets')}
              >
                Ver bandeja <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-0">
              {MOCK_TICKETS.filter(t => ['Nuevo', 'Abierto', 'Pendiente'].includes(t.estado)).map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--bg-glass)] -mx-2 px-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/admin/soporte/tickets/${t.id}`)}
                >
                  <span className="sup-ticket-id text-xs">{t.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{t.titulo}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{t.solicitante} · {t.tipo} · {t.creado}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <EstadoBadge estado={t.estado} />
                    <div style={{ width: 60 }}>
                      <div className="sup-sla-bar">
                        <div className="sup-sla-fill" style={{ width: `${t.sla * 100}%`, background: t.sla > 0.85 ? '#dc4c3f' : t.sla > 0.6 ? '#d97706' : '#1f9d74' }} />
                      </div>
                      <div className="text-right mt-0.5" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>SLA {Math.round(t.sla * 100)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent load */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users size={15} /> Carga de agentes
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Tickets asignados activos</p>
            </div>
            <div className="space-y-0">
              {AGENTS.map(a => (
                <div key={a.name} className="flex items-center gap-3 py-3 border-b border-[var(--border-color)] last:border-0">
                  <div className="relative flex-shrink-0">
                    <Avatar name={a.name} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-card)]"
                      style={{ background: a.online ? '#1f9d74' : '#738296' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{a.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{a.open} abiertos · {a.done} resueltos esta semana</div>
                    <div className="sup-sla-bar mt-1.5">
                      <div className="sup-sla-fill" style={{ width: `${a.load * 100}%`, background: a.load > 0.8 ? '#dc4c3f' : '#e89a4f' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)] flex-shrink-0">{Math.round(a.load * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
}
