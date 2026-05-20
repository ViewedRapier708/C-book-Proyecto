import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Package, Activity, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { solicitudesApi } from '../../api/recursos';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { Spinner } from '../../components/ui/Feedback';
import { DOCUMENTACION_REQUERIDA_MENSAJE } from '../../constants/documentacion';

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
  return ['pendiente', 'aprobada', 'en_espera_recoleccion', 'recogido', 'entregado'].includes(estado);
}

// Solicitud pendiente = esperando respuesta/acción
function getTipoLabel(s) {
  const tipo = getTipoSolicitud(s);
  return TIPO_MAP[tipo] || tipo || 'Solicitud';
}

function getSolicitudNombre(s) {
  const titulo = String(s?.titulo || '').trim();
  if (titulo) return titulo;
  const tipo = getTipoLabel(s);
  const numero = s?.numero_material ?? s?.ejemplar_id ?? s?.recurso_id ?? s?.id ?? '';
  return `${tipo}${numero ? ` #${numero}` : ''}`.trim();
}

function getEstadoLabel(estado) {
  const map = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
    entregado: 'Entregado',
    en_espera_recoleccion: 'En espera de recoleccion',
    recogido: 'Recogido',
    devuelto: 'Devuelto',
    perdido: 'Perdido',
  };
  return map[estado] || estado || '-';
}

function formatFecha(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    { icon: Package, label: 'Mis solicitudes de libros', desc: 'Revisa el estado de tus solicitudes de libros', to: '/user/mis-solicitudes-libros', color: '#d97706' },
  ];

  const solicitudesActivas = solicitudes.filter(isActiva).slice(0, 3);
  const totalActivas = solicitudes.filter(isActiva).length;

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
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ width: 'min(100%, 1180px)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} /> Solicitudes activas
                </h3>
                <span className="badge badge-info">{Math.min(totalActivas, 3)} / 3</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
                {[0, 1, 2].map((idx) => {
                  const solicitud = solicitudesActivas[idx];
                  const estado = solicitud ? getEstadoStr(solicitud) : '';
                  const numeroMaterial = solicitud?.numero_material ?? solicitud?.ejemplar_id ?? solicitud?.recurso_id ?? solicitud?.id ?? '-';
                  return (
                    <div key={idx} style={{ padding: '0.7rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: solicitud ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          Solicitud {idx + 1}
                        </span>
                        <span className={`badge ${estado === 'aprobada' || estado === 'entregado' || estado === 'recogido' ? 'badge-success' : estado === 'rechazada' || estado === 'cancelada' ? 'badge-danger' : 'badge-warning'}`}>
                          {solicitud ? getEstadoLabel(estado) : 'Sin activa'}
                        </span>
                      </div>

                      {!solicitud ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin solicitud activa.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '0.3rem' }}>
                          <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{getSolicitudNombre(solicitud)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo: {getTipoLabel(solicitud)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Autor: {solicitud.autor || '-'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ejemplar: {numeroMaterial}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha solicitud: {formatFecha(solicitud.fecha_solicitud)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limite respuesta: {formatFecha(solicitud.fecha_limite_respuesta)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha aprobacion: {formatFecha(solicitud.fecha_aprobacion)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limite recoleccion: {formatFecha(solicitud.fecha_limite_recoleccion)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha entrega: {formatFecha(solicitud.fecha_inicio_prestamo)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limite devolucion: {formatFecha(solicitud.fecha_limite_devolucion)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha devolucion: {formatFecha(solicitud.fecha_devolucion_real)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {user?.tiene_documentos === false && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', background: '#f59e0b18', border: '1px solid #f59e0b44', marginBottom: '1.5rem', color: '#b45309' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{DOCUMENTACION_REQUERIDA_MENSAJE}</p>
            </div>
          )}

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
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/user/mis-solicitudes-libros')}>
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
