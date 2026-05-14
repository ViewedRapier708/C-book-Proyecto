import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Loader, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | waiting | success | error
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef(null);
  const MAX_ATTEMPTS = 100;

  useEffect(() => {
    const stored = localStorage.getItem('datosRegistro');
    if (!stored) {
      setStatus('error');
      setErrorMsg('No hay datos de registro. Regístrate primero.');
      return;
    }

    const check = async () => {
      try {
        const { boleta, correo } = JSON.parse(stored);
        setAttempts((a) => a + 1);
        const data = await authApi.verifyEmail(boleta, correo);
        if (data.confirmado) {
          setStatus('success');
          localStorage.removeItem('datosRegistro');
          clearInterval(intervalRef.current);
          setTimeout(() => navigate('/', { replace: true }), 3000);
        } else {
          setStatus('waiting');
        }
      } catch {
        setStatus('waiting');
      }
    };

    check();
    intervalRef.current = setInterval(() => {
      setAttempts((a) => {
        if (a >= MAX_ATTEMPTS) {
          clearInterval(intervalRef.current);
          setStatus('error');
          setErrorMsg('Tiempo de espera agotado. Verifica tu correo y vuelve a intentarlo.');
          return a;
        }
        return a;
      });
      check();
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [navigate]);

  const retry = () => {
    setAttempts(0);
    setStatus('checking');
    window.location.reload();
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {status === 'checking' && (
          <>
            <Loader size={40} style={{ animation: 'spin .7s linear infinite', color: 'var(--primary)' }} />
            <h2>Verificando correo...</h2>
            <p>Estamos comprobando tu verificación de correo electrónico.</p>
          </>
        )}
        {status === 'waiting' && (
          <>
            <Clock size={40} style={{ color: 'var(--warning)' }} />
            <h2>Esperando confirmación</h2>
            <p>Revisa tu bandeja de entrada y haz clic en el enlace de verificación.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Intento {attempts} de {MAX_ATTEMPTS}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} style={{ color: 'var(--success)' }} />
            <h2>¡Correo verificado!</h2>
            <p>Tu cuenta ha sido confirmada. Serás redirigido al inicio de sesión...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle size={40} style={{ color: 'var(--danger)' }} />
            <h2>Error</h2>
            <p>{errorMsg}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={retry}>
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
