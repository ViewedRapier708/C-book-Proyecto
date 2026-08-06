import { useState, useEffect, createContext, useContext } from 'react';
import { Clock } from 'lucide-react';

const HorarioContext = createContext({ dentroHorario: true });

export function useHorario() {
  return useContext(HorarioContext);
}

function getHoraMexico() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find(p => p.type === 'hour').value);
  const minute = Number(parts.find(p => p.type === 'minute').value);
  return { hour, minute };
}

function estaEnHorario() {
  const { hour } = getHoraMexico();
  return hour >= 8 && hour < 20;
}

export default function HorarioRestriction({ children }) {
  const [dentroHorario, setDentroHorario] = useState(estaEnHorario);
  const [horaStr, setHoraStr] = useState('');

  useEffect(() => {
    const update = () => {
      setDentroHorario(estaEnHorario());
      const { hour, minute } = getHoraMexico();
      setHoraStr(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HorarioContext.Provider value={{ dentroHorario }}>
      {!dentroHorario && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: '0.7rem 1.2rem',
          background: '#f59e0b18',
          borderBottom: '1px solid #f59e0b44',
          color: '#b45309',
          fontSize: '0.9rem',
          fontWeight: 500,
        }}>
          <Clock size={18} style={{ flexShrink: 0 }} />
          <span>
            Fuera del horario de atención (8:00 a 20:00 CDMX) — Solo puedes consultar información. Hora actual: {horaStr} CDMX
          </span>
        </div>
      )}
      {children}
    </HorarioContext.Provider>
  );
}
