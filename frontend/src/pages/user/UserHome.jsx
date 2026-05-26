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
import MobileAppPromo from '../../components/ui/MobileAppPromo';
import { DOCUMENTACION_REQUERIDA_MENSAJE } from '../../constants/documentacion';
import {
  getSolicitudLibroEstadoId,
  getSolicitudLibroVisibleDetails,
  getSolicitudLibroSortOrder,
  getSolicitudLibroStatusLabel,
  isSolicitudLibroActiva,
} from '../../utils/solicitudesLibros';

const ESTADO_SOLICITUD = {
  1: 'pendiente',
  2: 'aprobada',
  3: 'rechazada',
  4: 'cancelada',
  5: 'entregado',
  6: 'devuelto',
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

  if (tipo === 'libro') {
    const estadoSolicitud = getSolicitudLibroEstadoId(s);
    if (estadoSolicitud) {
      return ESTADO_SOLICITUD[estadoSolicitud] || 'sin_estado';
    }
  }

  return 'sin_estado';
}

function isActiva(s) {
  return getTipoSolicitud(s) === 'libro' && isSolicitudLibroActiva(s);
}

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
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSolicitudes();

    const interval = setInterval(() => loadSolicitudes(), 15000);
    const handleFocus = () => loadSolicitudes();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSolicitudes();
      }
    };

    window.addEventListener('focus', handleFocus);
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

  const solicitudesActivas = solicitudes
    .filter(isActiva)
    .sort((a, b) => {
      const diff = getSolicitudLibroSortOrder(a) - getSolicitudLibroSortOrder(b);
      if (diff !== 0) return diff;
      return new Date(b.fecha_solicitud || 0) - new Date(a.fecha_solicitud || 0);
    })
    .slice(0, 3);
  const totalActivas = solicitudes.filter(isActiva).length;

  return (
    <AnimatedPage>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Bienvenido, {user?.boleta}!</h1>
          <p>Que vamos a hacer hoy?</p>
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

      {loading && solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
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
                  const visibleDetails = solicitud ? getSolicitudLibroVisibleDetails(solicitud) : [];
                  const numeroMaterial = solicitud?.numero_material ?? solicitud?.ejemplar_id ?? solicitud?.recurso_id ?? solicitud?.id ?? '-';
                  const badgeClass = estado === 'aprobada' || estado === 'entregado' ? 'badge-success' : estado === 'rechazada' || estado === 'cancelada' ? 'badge-danger' : 'badge-warning';

                  return (
                    <div key={idx} style={{ padding: '0.7rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.55rem', marginBottom: '0.55rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: solicitud ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          Solicitud {idx + 1}
                        </span>
                        <span className={`badge ${badgeClass}`}>{solicitud ? getSolicitudLibroStatusLabel(solicitud) : 'Sin activa'}</span>
                      </div>

                      {!solicitud ? (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sin solicitud activa.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: '0.3rem' }}>
                          <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{getSolicitudNombre(solicitud)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo: {getTipoLabel(solicitud)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Autor: {solicitud.autor || '-'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ejemplar: {numeroMaterial}</div>
                          {visibleDetails.map((detalle) => (
                            <div key={`${solicitud.id}-${detalle.label}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {detalle.label}: {formatFecha(detalle.value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {user?.tiene_documentos === false && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                padding: '0.9rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: '#f59e0b18',
                border: '1px solid #f59e0b44',
                marginBottom: '1.5rem',
                color: '#b45309',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{DOCUMENTACION_REQUERIDA_MENSAJE}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ marginBottom: '1.5rem' }}
          >
            <MobileAppPromo
              title="Solicita libros tambien desde tu celular"
              description="Prueba la app movil para revisar tu cuenta y enviar solicitudes con mas rapidez, sin depender solo de la version web."
            />
          </motion.div>

          <h3 style={{ marginBottom: '0.75rem' }}>Servicios Disponibles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {services.map((service, i) => (
              <motion.div
                key={service.to}
                className="service-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(service.to)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="service-card-icon" style={{ background: `${service.color}18` }}>
                  <service.icon size={22} color={service.color} />
                </div>
                <div>
                  <span className="service-card-label">{service.label}</span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

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
                Aun no has realizado solicitudes. Comienza explorando los servicios.
              </p>
            ) : (
              <div className="activity-feed">
                {recientes.map((s, idx) => {
                  const estado = getEstadoStr(s);
                  return (
                    <div key={idx} className="activity-item">
                      <div className={`activity-dot ${estado === 'aprobada' || estado === 'entregado' ? 'success' : estado === 'cancelada' || estado === 'rechazada' ? 'danger' : ''}`} />
                      <div>
                        <div className="activity-text">
                          <strong>{getTipoLabel(s)}</strong> - {getSolicitudLibroStatusLabel(getSolicitudLibroEstadoId(s))}
                        </div>
                        <div className="activity-time">
                          {s.fecha_solicitud ? formatDistanceToNow(new Date(s.fecha_solicitud), { addSuffix: true, locale: es }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatedPage>
  );
}
