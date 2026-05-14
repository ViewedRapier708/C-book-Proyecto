import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BookOpen, Users, FileText,
  ClipboardList, BookCheck, TrendingUp, Activity,
  ArrowRight, BarChart3, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { analyticsApi } from '../../api/analytics';
import StatCard from '../../components/ui/StatCard';
import { SkeletonGrid } from '../../components/ui/Skeleton';
import AnimatedPage from '../../components/layout/AnimatedPage';

const COLORS = ['#1f8a70', '#0ea5e9', '#1f9d74', '#d97706', '#d4654a', '#c46f21'];

const quickLinks = [
  { icon: BookOpen, label: 'Libros', to: '/admin/libros', color: '#1f8a70' },
  { icon: Users, label: 'Usuarios', to: '/admin/usuarios', color: '#c46f21' },
  { icon: FileText, label: 'Documentos', to: '/admin/documentos', color: '#d97706' },
  { icon: ClipboardList, label: 'Solicitudes', to: '/admin/solicitudes-libros', color: '#d4654a' },
  { icon: BookCheck, label: 'Préstamos', to: '/admin/prestamos-libros', color: '#176d5a' },
];

export default function AdminHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes, aRes] = await Promise.all([analyticsApi.getStats(), analyticsApi.getTrends(), analyticsApi.getActivity(8)]);
        setStats(sRes?.data || sRes || {});
        setTrends(Array.isArray(tRes?.data) ? tRes.data : Array.isArray(tRes) ? tRes : []);
        setActivity(Array.isArray(aRes?.data) ? aRes.data : Array.isArray(aRes) ? aRes : []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pieData = stats ? [
    { name: 'Libros', value: stats.solicitudesPorTipo?.libro || 0 },
  ].filter(d => d.value > 0) : [];

  const statCards = stats ? [
    { icon: Users, label: 'Usuarios', value: stats.totales?.usuarios || 0, color: '#c46f21' },
    { icon: BookOpen, label: 'Libros', value: stats.totales?.libros || 0, subtitle: `${stats.disponibilidad?.libros?.disponibles || 0} disponibles`, color: '#1f8a70' },
    { icon: ClipboardList, label: 'Solicitudes Pendientes', value: stats.solicitudesPorEstado?.pendientes || 0, color: '#d97706' },
    { icon: BookCheck, label: 'Préstamos Activos', value: stats.totales?.prestamosActivos || 0, color: '#d4654a' },
  ] : [];

  return (
    <AnimatedPage>
      {/* Header */}
      <div className="page-header">
        <h1>Panel de Administración</h1>
        <p>Bienvenido de vuelta, <strong>{user?.boleta}</strong>. Aquí tienes un resumen del sistema.</p>
      </div>

      {/* Stats Row */}
      {loading ? (
        <SkeletonGrid count={6} type="stat" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {statCards.map((s, i) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} subtitle={s.subtitle} color={s.color} delay={i * 0.08} />
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Trends Area Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <TrendingUp size={18} /> Solicitudes (30 días)
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/analytics')}>
              Ver más <ArrowRight size={14} />
            </button>
          </div>
          {trends.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorSol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f8a70" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#1f8a70" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#1f8a70" strokeWidth={2} fill="url(#colorSol)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <BarChart3 size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p>Sin datos de tendencias aún</p>
            </div>
          )}
        </motion.div>

        {/* Pie Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
            <Activity size={18} /> Distribución Solicitudes
          </h3>
          {pieData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p>Sin solicitudes registradas</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity Feed + Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Activity Feed */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem' }}>
            <Activity size={18} /> Actividad Reciente
          </h3>
          <div className="activity-feed">
            {activity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Sin actividad reciente</p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${a.estado === 'aprobada' || a.estado === 'activo' ? 'success' : a.estado === 'rechazada' ? 'danger' : ''}`} />
                  <div>
                    <div className="activity-text">
                      <strong>{a.tipo}</strong> — {a.descripcion || a.estado || 'Registrada'}
                    </div>
                    <div className="activity-time">
                      {a.fecha ? formatDistanceToNow(new Date(a.fecha), { addSuffix: true, locale: es }) : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 style={{ margin: '0 0 1rem' }}>Accesos Rápidos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {quickLinks.map((s) => (
              <div
                key={s.to}
                className="service-card"
                onClick={() => navigate(s.to)}
                style={{ cursor: 'pointer' }}
              >
                <div className="service-card-icon" style={{ background: s.color + '18' }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <span className="service-card-label">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
