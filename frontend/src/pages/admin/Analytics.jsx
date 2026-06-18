import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart3, TrendingUp, PieChart as PieChartIcon,
  Activity, Users, BookOpen, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { analyticsApi } from '../../api/analytics';
import StatCard from '../../components/ui/StatCard';
import { SkeletonGrid } from '../../components/ui/Skeleton';
import AnimatedPage from '../../components/layout/AnimatedPage';

const COLORS = ['#1f8a70', '#0ea5e9', '#1f9d74', '#d97706', '#d4654a', '#c46f21', '#176d5a'];

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '0.8rem',
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([analyticsApi.getStats(), analyticsApi.getTrends()]);
      setStats(sRes?.data || sRes || {});
      setTrends(Array.isArray(tRes?.data) ? tRes.data : Array.isArray(tRes) ? tRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totales = stats?.totales || {};
  const porTipo = stats?.solicitudesPorTipo || {};
  const porEstado = stats?.solicitudesPorEstado || {};
  const disp = stats?.disponibilidad || {};

  const pieDistribucion = stats ? [
    { name: 'Libros', value: porTipo.libro || 0 },
  ].filter(d => d.value > 0) : [];

  const pieEstados = stats ? [
    { name: 'Pendientes', value: porEstado.pendientes || 0 },
    { name: 'Aprobadas', value: porEstado.aprobadas || 0 },
    { name: 'Canceladas', value: porEstado.canceladas || 0 },
  ].filter(d => d.value > 0) : [];

  const disponibilidad = stats ? [
  ] : [];

  const statCards = stats ? [
    { icon: Users, label: 'Total Usuarios', value: totales.usuarios || 0, color: '#c46f21' },
    { icon: BookOpen, label: 'Total Libros', value: totales.libros || 0, color: '#1f8a70' },
    { icon: Activity, label: 'Total Solicitudes', value: totales.solicitudes || 0, color: '#d97706' },
    { icon: BarChart3, label: 'Préstamos Activos', value: totales.prestamosActivos || 0, color: '#d4654a' },
  ] : [];

  return (
    <AnimatedPage>
      <div className="page-header flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1>Analytics</h1>
          <p>Panel completo de métricas y tendencias del sistema</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['overview', 'tendencias', 'recursos'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Resumen General' : t === 'tendencias' ? 'Tendencias' : 'Recursos'}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid count={6} type="stat" />
      ) : (
        <>
          {tab === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4">
                {statCards.map((s, i) => (
                  <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i * 0.06} />
                ))}
              </div>

              {/* Pie Charts Row */}
              <div className="grid gap-4 mb-6 md:grid-cols-2">
                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                    <PieChartIcon size={18} /> Solicitudes por Tipo
                  </h3>
                  {pieDistribucion.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieDistribucion} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieDistribucion.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  ) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin datos</p>}
                </motion.div>

                <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                    <PieChartIcon size={18} /> Solicitudes por Estado
                  </h3>
                  {pieEstados.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieEstados} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin datos</p>}
                </motion.div>
              </div>
            </>
          )}

          {tab === 'tendencias' && (
            <>
              {/* Area Chart - 30 day trends */}
              <motion.div className="card" style={{ marginBottom: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <TrendingUp size={18} /> Solicitudes — Últimos 30 Días
                </h3>
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trends}>
                      <defs>
                        <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1f8a70" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1f8a70" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-primary)' }} />
                      <Area type="monotone" dataKey="total" stroke="#1f8a70" strokeWidth={2.5} fill="url(#gradTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Sin datos de tendencias</p>}
              </motion.div>
            </>
          )}

          {tab === 'recursos' && (
            <>
              {/* Availability Bar Chart */}
              <motion.div className="card" style={{ marginBottom: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
                  <BarChart3 size={18} /> Disponibilidad de Recursos
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={disponibilidad} layout="vertical" barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: 'var(--text-primary)' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="disponibles" fill="#10b981" name="Disponibles" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="ocupados" fill="#ef4444" name="Ocupados/No Disp." radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Resource Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {disponibilidad.map((r, i) => {
                  const pctAvail = r.total > 0 ? Math.round((r.disponibles / r.total) * 100) : 0;
                  return (
                    <motion.div key={r.name} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
                      <h4 style={{ margin: '0 0 0.75rem' }}>{r.name}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Disponibilidad</span>
                        <span style={{ fontWeight: 600, color: pctAvail > 50 ? '#10b981' : pctAvail > 20 ? '#f59e0b' : '#ef4444' }}>{pctAvail}%</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
                        <motion.div
                          style={{ height: '100%', background: pctAvail > 50 ? '#10b981' : pctAvail > 20 ? '#f59e0b' : '#ef4444', borderRadius: 999 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pctAvail}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>{r.disponibles} disponibles</span>
                        <span>{r.total} total</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </AnimatedPage>
  );
}
