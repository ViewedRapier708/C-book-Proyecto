import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Package, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { solicitudesApi } from '../../api/recursos';
import StatCard from '../../components/ui/StatCard';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { Spinner } from '../../components/ui/Feedback';

const ESTADO_SOLICITUD = {
  1: 'pendiente',
  2: 'aprobada',
  3: 'rechazada',
  4: 'cancelada',
  5: 'entregado',
};

const ESTADO_PRESTAMO = {
  1: 'en_espera_recoleccion',
  2: 'recogido',
  3: 'devuelto',
  4: 'perdido',
};

const TIPO_MAP = {
  libro: 'Libro',
};

function getTipoSolicitud(s) {
  if (s.tipo_solicitud) return s.tipo_solicitud.toLowerCase();
  if (s.ejemplar_id) return 'libro';
  return 'desconocido';
}

function getEstadoStr(s) {
  const tipo = getTipoSolicitud(s);

  // Para libros
  if (tipo === 'libro') {
    if (s.estado_prestamo_id) {
      return ESTADO_PRESTAMO[s.estado_prestamo_id] || 'sin_estado';
    }
    const estadoSolicitud = s.estado_solicitud_id ?? s.estado_asistencia_id;
    if (estadoSolicitud) {
      return ESTADO_SOLICITUD[estadoSolicitud] || 'sin_estado';
    }
    return 'sin_estado';
  }

  return 'sin_estado';
}

// Solicitud activa = está en uso actualmente
function isActiva(s) {
  const estado = getEstadoStr(s);
  // Activa = tiene libro (aprobada, entregado, en_espera_recoleccion, recogido)
  return ['aprobada', 'entregado', 'en_espera_recoleccion', 'recogido'].includes(estado);
}

// Solicitud pendiente = esperando respuesta/acción
function isPendiente(s) {
  const estado = getEstadoStr(s);
  return estado === 'pendiente';
}

function getTipoLabel(s) {
  const tipo = getTipoSolicitud(s);
  return TIPO_MAP[tipo] || tipo || 'Solicitud';
}

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSolicitudes = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await solicitudesApi.getUserSolicitudes();
      setSolicitudes(res.data || []);
    } catch { /* ignore */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSolicitudes();

    // Polling cada 15 segundos para mantener datos actualizados en tiempo real
    const interval = setInterval(() => loadSolicitudes(), 15000);

    // Refrescar cuando la pestaña vuelve a tener foco
    const handleFocus = () => loadSolicitudes();
    window.addEventListener('focus', handleFocus);

    // Refrescar cuando el usuario vuelve de otra página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSolicitudes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadSolicitudes]);

  const recientes = solicitudes.slice(0, 5);

  const services = [
    { icon: BookOpen, label: 'Libros', desc: 'Busca y solicita libros del acervo', to: '/user/libros', color: '#1f8a70' },
    { icon: Package, label: 'Mis Solicitudes', desc: 'Revisa el estado de tus solicitudes', to: '/user/mis-solicitudes', color: '#d97706' },
  ];

  return (
    <AnimatedPage>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>¡Bienvenido, {user?.boleta}!</h1>
          <p>¿Qué vamos a hacer hoy?</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => loadSolicitudes(true)}
          disabled={refreshing || loading}
          title="Actualizar datos"
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Quick Stats */}
      {loading && solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <StatCard icon={Activity} label="Total Solicitudes" value={solicitudes.length} color="#1f8a70" delay={0} />
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
        </>
      )}
    </AnimatedPage>
  );
}
