import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Monitor, PenTool, Package, Activity, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { solicitudesApi } from '../../api/recursos';
import StatCard from '../../components/ui/StatCard';
import AnimatedPage from '../../components/layout/AnimatedPage';

const ESTADO_ASISTENCIA = {
  1: 'pendiente',
  2: 'asistió',
  3: 'cancelada',
  4: 'no asistió',
};

const ESTADO_SOLICITUD = {
  1: 'pendiente',
  2: 'aprobada',
  3: 'rechazada',
  4: 'cancelada',
  5: 'entregado',
};

const TIPO_MAP = {
  computadora: 'Computadora',
  restirador: 'Restirador',
  libro: 'Libro',
};

function getEstadoStr(s) {
  const map = s.tipo_solicitud === 'libro' ? ESTADO_SOLICITUD : ESTADO_ASISTENCIA;
  return map[s.estado_asistencia_id] || 'pendiente';
}

function getTipoLabel(s) {
  const tipo = (s.tipo_solicitud || s.tipo_recurso || '').toLowerCase();
  return TIPO_MAP[tipo] || tipo || 'Solicitud';
}

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await solicitudesApi.getUserSolicitudes();
        setSolicitudes(res.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const pendientes = solicitudes.filter(s => getEstadoStr(s) === 'pendiente').length;
  const activas = solicitudes.filter(s => ['aprobada', 'asistió', 'entregado'].includes(getEstadoStr(s))).length;
  const recientes = solicitudes.slice(0, 5);

  const services = [
    { icon: Monitor, label: 'Computadoras', desc: 'Solicita una computadora disponible', to: '/user/computadoras', color: '#0ea5e9' },
    { icon: BookOpen, label: 'Libros', desc: 'Busca y solicita libros del acervo', to: '/user/libros', color: '#1f8a70' },
    { icon: PenTool, label: 'Restiradores', desc: 'Reserva un restirador de trabajo', to: '/user/restiradores', color: '#1f9d74' },
    { icon: Package, label: 'Mis Solicitudes', desc: 'Revisa el estado de tus solicitudes', to: '/user/mis-solicitudes', color: '#d97706' },
  ];

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>¡Bienvenido, {user?.boleta}!</h1>
        <p>¿Qué vamos a hacer hoy?</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={Activity} label="Total Solicitudes" value={solicitudes.length} color="#1f8a70" delay={0} />
        <StatCard icon={Clock} label="Pendientes" value={pendientes} color="#d97706" delay={0.08} />
        <StatCard icon={Package} label="Activas" value={activas} color="#1f9d74" delay={0.16} />
      </div>

      {/* Services */}
      <h3 style={{ marginBottom: '0.75rem' }}>Servicios Disponibles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {services.map((s, i) => (
          <motion.div
            key={s.to}
            className="service-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(s.to)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <div className="service-card-icon" style={{ background: s.color + '18' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <span className="service-card-label">{s.label}</span>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Actividad Reciente
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/mis-solicitudes')}>
            Ver todas <ArrowRight size={14} />
          </button>
        </div>
        {recientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
            Aún no has realizado solicitudes. ¡Comienza explorando los servicios!
          </p>
        ) : (
          <div className="activity-feed">
            {recientes.map((s, idx) => (
              <div key={idx} className="activity-item">
                <div className={`activity-dot ${getEstadoStr(s) === 'aprobada' ? 'success' : getEstadoStr(s) === 'cancelado' ? 'danger' : ''}`} />
                <div>
                  <div className="activity-text">
                    <strong>{getTipoLabel(s)}</strong> — {getEstadoStr(s)}
                  </div>
                  <div className="activity-time">
                    {s.fecha_solicitud ? formatDistanceToNow(new Date(s.fecha_solicitud), { addSuffix: true, locale: es }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
}
