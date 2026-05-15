import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

const MIS_TICKETS = [
  { id: 'SOP-2841', tipo: 'Funcional',   titulo: 'Error al registrar préstamo de libro: ISBN no válido',       estado: 'Abierto',   prioridad: 'Alta',  creado: 'Hoy 09:14',    actualizado: 'hace 12 min', agente: 'María Velázquez' },
  { id: 'SOP-2820', tipo: 'Rendimiento', titulo: 'No puedo descargar reporte mensual de bajas',                  estado: 'Resuelto',  prioridad: 'Media', creado: '2 may 11:00',  actualizado: 'hace 3d',     agente: 'Iván Ramírez'    },
  { id: 'SOP-2802', tipo: 'Visual',      titulo: 'Catálogo no muestra portadas de libros nuevos',               estado: 'Cerrado',   prioridad: 'Baja',  creado: '28 abr 10:30', actualizado: 'hace 5d',     agente: 'Carlos Núñez'    },
  { id: 'SOP-2791', tipo: 'Funcional',   titulo: 'Al buscar por autor el sistema no muestra resultados',         estado: 'Cerrado',   prioridad: 'Media', creado: '21 abr 09:15', actualizado: 'hace 8d',     agente: 'Andrea Soto'     },
];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function TipoBadge({ tipo }) {
  const map = { Funcional: 'sup-badge-funcional', Visual: 'sup-badge-visual', Rendimiento: 'sup-badge-rendimiento', Datos: 'sup-badge-datos', Acceso: 'sup-badge-acceso' };
  return <span className={`sup-badge ${map[tipo] ?? 'sup-badge-neutral'}`}>{tipo}</span>;
}

const ESTADOS_FILTRO = ['Todos', 'Abierto', 'Pendiente', 'En espera', 'Resuelto', 'Cerrado'];

export default function MisReportes() {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const filtered = MIS_TICKETS.filter(t => {
    const matchEstado = estadoFiltro === 'Todos' || t.estado === estadoFiltro;
    const matchBusqueda = busqueda === '' || t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || t.id.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const abiertos = MIS_TICKETS.filter(t => ['Nuevo', 'Abierto', 'Pendiente', 'En espera'].includes(t.estado)).length;

  return (
    <AnimatedPage>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>
              Mis reportes
            </p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Mis reportes</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {MIS_TICKETS.length} reportes enviados · {abiertos} en proceso
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: '#c46f21' }}
            onClick={() => navigate('/user/soporte/reportar')}
          >
            <Plus size={14} /> Nuevo reporte
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { lbl: 'Total',    val: MIS_TICKETS.length,                                                        color: '#e89a4f' },
            { lbl: 'Abiertos', val: MIS_TICKETS.filter(t => t.estado === 'Abierto').length,                   color: '#fbbf24' },
            { lbl: 'Resueltos',val: MIS_TICKETS.filter(t => t.estado === 'Resuelto').length,                  color: '#1f9d74' },
            { lbl: 'Cerrados', val: MIS_TICKETS.filter(t => t.estado === 'Cerrado').length,                   color: '#738296' },
          ].map((s, i) => (
            <motion.div
              key={s.lbl}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">{s.lbl}</div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f] transition-colors"
              placeholder="Buscar por ID o título..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_FILTRO.map(s => (
              <button
                key={s}
                onClick={() => setEstadoFiltro(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${estadoFiltro === s ? 'bg-[#c46f21] text-white border-[#c46f21]' : 'bg-[var(--bg-glass)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 cursor-pointer hover:border-[var(--border-glow)] transition-all group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/admin/soporte/tickets/${t.id}`)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="sup-ticket-id text-xs">{t.id}</span>
                    <EstadoBadge estado={t.estado} />
                    <TipoBadge tipo={t.tipo} />
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)] mb-1.5 leading-snug">{t.titulo}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    <span>Creado {t.creado}</span>
                    <span>·</span>
                    <span>Actualizado {t.actualizado}</span>
                    {t.agente && (
                      <>
                        <span>·</span>
                        <span>Agente: <strong className="text-[var(--text-secondary)]">{t.agente}</strong></span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-[var(--text-muted)]">
              No se encontraron reportes con los filtros seleccionados.
            </div>
          )}
        </div>

      </div>
    </AnimatedPage>
  );
}
