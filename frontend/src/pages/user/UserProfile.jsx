import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserCircle, Mail, Hash, Shield, Sun, Moon,
  Calendar, Activity, BookOpen, Monitor, PenTool
} from 'lucide-react';
import { solicitudesApi } from '../../api/recursos';
import AnimatedPage from '../../components/layout/AnimatedPage';
import StatCard from '../../components/ui/StatCard';

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

function getTipoNorm(s) {
  return (s.tipo_solicitud || s.tipo_recurso || '').toLowerCase();
}

function getTipoLabel(s) {
  return TIPO_MAP[getTipoNorm(s)] || getTipoNorm(s) || 'Solicitud';
}

export default function UserProfile() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
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

  const countByType = (tipo) => solicitudes.filter(s => getTipoNorm(s) === tipo).length;
  const countByEstado = (estado) => solicitudes.filter(s => getEstadoStr(s) === estado).length;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Mi Perfil</h1>
        <p>Información de tu cuenta y preferencias</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Profile Card */}
        <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', fontSize: '2rem', color: '#fff', fontWeight: 700
            }}>
              {(user?.boleta || 'U')[0].toUpperCase()}
            </div>
            <h2 style={{ margin: '0 0 0.25rem' }}>{user?.boleta || 'Usuario'}</h2>
            <span className={`badge ${user?.rol === 'Admin' ? 'badge-success' : 'badge-info'}`}>
              {user?.rol || 'alumno'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
              <Hash size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Boleta:</span>
              <strong>{user?.boleta || '-'}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
              <Mail size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Correo:</span>
              <strong style={{ wordBreak: 'break-all' }}>{user?.correo || '-'}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
              <Shield size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Rol:</span>
              <strong>{user?.rol || 'alumno'}</strong>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

          {/* Preferences */}
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Preferencias</h4>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', cursor: 'pointer'
            }}
            onClick={toggle}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              Tema {theme === 'dark' ? 'Oscuro' : 'Claro'}
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 999, background: theme === 'dark' ? '#6366f1' : '#cbd5e1',
              position: 'relative', transition: 'background 0.2s'
            }}>
              <motion.div
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 2,
                }}
                animate={{ left: theme === 'dark' ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats & Activity */}
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard icon={Activity} label="Total Solicitudes" value={solicitudes.length} color="#6366f1" delay={0} />
            <StatCard icon={Monitor} label="Computadoras" value={countByType('computadora')} color="#0ea5e9" delay={0.08} />
            <StatCard icon={BookOpen} label="Libros" value={countByType('libro')} color="#8b5cf6" delay={0.16} />
            <StatCard icon={PenTool} label="Restiradores" value={countByType('restirador')} color="#10b981" delay={0.24} />
          </div>

          {/* Status Breakdown */}
          <motion.div className="card" style={{ marginBottom: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 style={{ margin: '0 0 1rem' }}>Estado de Solicitudes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Pendientes', count: countByEstado('pendiente'), color: '#f59e0b', bg: '#f59e0b15' },
                { label: 'Aprobadas / Asistió', count: countByEstado('aprobada') + countByEstado('asistió') + countByEstado('entregado'), color: '#10b981', bg: '#10b98115' },
                { label: 'Canceladas / Rechazadas', count: countByEstado('cancelada') + countByEstado('rechazada') + countByEstado('no asistió'), color: '#ef4444', bg: '#ef444415' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius-sm)', background: item.bg }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.count}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Solicitudes */}
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 style={{ margin: '0 0 1rem' }}>Solicitudes Recientes</h3>
            {solicitudes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                Aún no has realizado solicitudes
              </p>
            ) : (
              <div className="activity-feed">
                {solicitudes.slice(0, 8).map((s, idx) => (
                  <div key={idx} className="activity-item">
                    <div className={`activity-dot ${getEstadoStr(s) === 'aprobada' ? 'success' : getEstadoStr(s) === 'cancelado' ? 'danger' : ''}`} />
                    <div>
                      <div className="activity-text">
                        <strong>{getTipoLabel(s)}</strong> — {getEstadoStr(s)}
                      </div>
                      <div className="activity-time">
                        {s.fecha_solicitud ? format(new Date(s.fecha_solicitud), "d MMM yyyy, HH:mm", { locale: es }) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
