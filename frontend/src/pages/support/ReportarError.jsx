import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bug, Eye, Zap, Hash, Lock, MoreHorizontal, BookOpen, PackageSearch,
  Check, Send, ArrowLeft, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import { soporteApi } from '../../api/soporte';
import { isSupportRole } from '../../utils/authRoutes';
import '../../styles/support.css';

const FALLBACK_TYPES = [
  { name: 'Funcional', description: 'Algo no funciona como deberia', icon: Bug, color: '#0284c7' },
  { name: 'Visual', description: 'Diseno, textos cortados, etc.', icon: Eye, color: '#8b5cf6' },
  { name: 'Rendimiento', description: 'Carga lenta o cuelgues', icon: Zap, color: '#d97706' },
  { name: 'Datos', description: 'Informacion incorrecta', icon: Hash, color: '#1f9d74' },
  { name: 'Acceso', description: 'No puedo entrar o sin permisos', icon: Lock, color: '#dc4c3f' },
  { name: 'Otro', description: 'No encaja con lo anterior', icon: MoreHorizontal, color: '#64748b' },
];

const ICONS = { Funcional: Bug, Visual: Eye, Rendimiento: Zap, Datos: Hash, Acceso: Lock, Otro: MoreHorizontal };
const COLORS = { Funcional: '#0284c7', Visual: '#8b5cf6', Rendimiento: '#d97706', Datos: '#1f9d74', Acceso: '#dc4c3f', Otro: '#64748b' };

function iconForType(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('acceso') || lower.includes('sesion') || lower.includes('login')) return Lock;
  if (lower.includes('inventario') || lower.includes('libro') || lower.includes('ejemplar')) return BookOpen;
  if (lower.includes('prestamo') || lower.includes('devolucion') || lower.includes('renovacion')) return PackageSearch;
  if (lower.includes('tecnico') || lower.includes('general')) return Bug;
  return ICONS[name] || MoreHorizontal;
}

function colorForType(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('acceso')) return '#dc4c3f';
  if (lower.includes('inventario')) return '#0284c7';
  if (lower.includes('prestamo') || lower.includes('devolucion')) return '#d97706';
  if (lower.includes('tecnico')) return '#8b5cf6';
  return COLORS[name] || '#64748b';
}

const MODULOS = [
  'Prestamos - Nuevo prestamo',
  'Catalogo - Busqueda',
  'Usuarios - Registro',
  'Reportes - Exportar',
  'Documentos',
  'Login / Acceso',
  'Otro modulo',
];

export default function ReportarError() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tipos, setTipos] = useState(FALLBACK_TYPES);
  const [tipo, setTipo] = useState('Funcional');
  const [modulo, setModulo] = useState(MODULOS[0]);
  const [titulo, setTitulo] = useState('');
  const [correo, setCorreo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');
  const reportListPath = isSupportRole(user?.rol)
    ? '/soporte/tickets'
    : user?.rol === 'Admin'
      ? '/admin'
      : '/user/soporte/mis-reportes';

  useEffect(() => {
    let alive = true;
    soporteApi.getTypes()
      .then(({ tipos: data }) => {
        if (!alive || !Array.isArray(data) || data.length === 0) return;
        const mapped = data
          .filter((t) => t.is_active !== false)
          .map((t) => ({
            ...t,
            icon: iconForType(t.name),
            color: colorForType(t.name),
          }));
        setTipos(mapped);
        if (mapped[0]?.name) setTipo(mapped[0].name);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    const baseValid = descripcion.trim().length >= 15 && titulo.trim().length >= 4;
    if (user) return baseValid;
    return baseValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
  }, [descripcion, titulo, correo, user]);

  const handleEnviar = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = { tipo, modulo, titulo, descripcion, correo, nombre };
      const { ticket } = user
        ? await soporteApi.createTicket(payload)
        : await soporteApi.createPublicTicket(payload);
      setCreated(ticket);
      toast.success(`Ticket ${ticket.folio} creado`);
    } catch (err) {
      setError(err.message || 'No se pudo crear el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <AnimatedPage>
        <div className="max-w-[1240px] mx-auto w-full px-2 sm:px-3 lg:px-5 py-4 md:py-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1f9d7422' }}>
              <Check size={32} style={{ color: '#1f9d74' }} />
            </motion.div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Reporte enviado</h2>
            <p className="text-sm text-[var(--text-muted)] text-center max-w-sm">
              Se creo el ticket <strong className="text-[var(--text-primary)]">{created.folio}</strong> con estado <strong className="text-[var(--text-primary)]">Nuevo</strong>.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]" onClick={() => navigate(-1)}>
                Volver
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c46f21' }} onClick={() => navigate(reportListPath)}>
                Ver mis reportes
              </button>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-[1240px] mx-auto w-full px-2 sm:px-3 lg:px-5 py-4 md:py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-glass)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#e89a4f' }}>Soporte C-Book</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Reportar un error</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Describe el problema y deja un correo para dar seguimiento.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Tipo de error</label>
              <div className="sup-type-grid">
                {tipos.map((t) => {
                  const Icon = t.icon || MoreHorizontal;
                  return (
                    <motion.button
                      type="button"
                      key={t.name}
                      className={`sup-type-card text-left ${tipo === t.name ? 'selected' : ''}`}
                      style={{ '--type-color': t.color }}
                      onClick={() => setTipo(t.name)}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon size={18} style={{ color: t.color, flexShrink: 0 }} />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[var(--text-primary)]">{t.name}</span>
                        <span className="block text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{t.description || 'Sin descripcion'}</span>
                      </span>
                      {tipo === t.name && <span className="sup-type-card-check"><Check size={11} /></span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Donde ocurrio</label>
              <select className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={modulo} onChange={(e) => setModulo(e.target.value)}>
                {MODULOS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>

            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)]">Correo de contacto</label>
                  <input className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)]">Nombre</label>
                  <input className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Asunto</label>
              <input className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={160} placeholder="Ej: No puedo enviar una solicitud de libro" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">Descripcion</label>
              <textarea className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f] resize-none" rows={6} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} placeholder="Explica que intentabas hacer, que paso y que esperabas que ocurriera." />
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{descripcion.length >= 15 ? 'Descripcion suficiente' : 'Minimo 15 caracteres'}</span>
                <span>{descripcion.length} / 2000</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)]" onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#c46f21' }} disabled={!canSubmit || submitting} onClick={handleEnviar}>
                <Send size={14} /> {submitting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 h-fit">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Que pasa al enviar</h3>
            <div className="space-y-3">
              {[
                ['Se crea un ticket', 'Se genera folio y queda en estado Nuevo.'],
                ['Queda en bandeja', 'Los administradores lo ven en soporte.'],
                ['Se atiende', 'Un agente puede tomarlo, comentar y cambiar estado.'],
                ['Puedes seguirlo', 'Aparece en Mis reportes con su historial.'],
              ].map(([t, d], i) => (
                <div key={t} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0" style={{ background: '#c46f21' }}>{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{t}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
