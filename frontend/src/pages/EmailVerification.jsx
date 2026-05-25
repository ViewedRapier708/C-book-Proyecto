import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Loader, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // checking | waiting | success | error
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const intervalRef = useRef(null);
  const MAX_ATTEMPTS = 100;

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      const stored = localStorage.getItem('datosRegistro');
      if (!stored) {
        setStatus('error');
        setErrorMsg('No hay datos de registro. Registrate primero.');
        return;
      }

      const checkLegacyConfirmation = async () => {
        try {
          const { boleta, correo } = JSON.parse(stored);
          setAttempts((a) => a + 1);
          const data = await authApi.verifyEmail(boleta, correo);

          if (data.confirmado) {
            setSuccessMsg(data.mensaje || 'Tu cuenta ha sido confirmada.');
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

      checkLegacyConfirmation();
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
        checkLegacyConfirmation();
      }, 3000);

      return () => clearInterval(intervalRef.current);
    }

    let cancelled = false;

    const confirmRegistration = async () => {
      try {
        setStatus('checking');
        const data = await authApi.confirmRegistration(token);

        if (cancelled) return;

        localStorage.removeItem('datosRegistro');
        setSuccessMsg(data.mensaje || 'Tu cuenta ha sido confirmada.');
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      } catch (err) {
        if (cancelled) return;

        setErrorMsg(err.message || 'No se pudo confirmar la cuenta.');
        setStatus('error');
      }
    };

    confirmRegistration();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="verify-page">
      <div className="verify-card">
        {status === 'checking' && (
          <>
            <Loader size={40} style={{ animation: 'spin .7s linear infinite', color: 'var(--primary)' }} />
            <h2>Verificando correo...</h2>
            <p>Estamos confirmando tu cuenta de C-Book.</p>
          </>
        )}
        {status === 'waiting' && (
          <>
            <Clock size={40} style={{ color: 'var(--warning)' }} />
            <h2>Esperando confirmacion</h2>
            <p>Revisa tu bandeja de entrada y haz clic en el boton de confirmacion.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              El enlace expira en 2 horas. Intento {attempts} de {MAX_ATTEMPTS}
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} style={{ color: 'var(--success)' }} />
            <h2>Correo verificado</h2>
            <p>{successMsg || 'Tu cuenta ha sido confirmada. Seras redirigido al inicio de sesion...'}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle size={40} style={{ color: 'var(--danger)' }} />
            <h2>Error</h2>
            <p>{errorMsg}</p>
            <Link className="btn btn-primary" style={{ marginTop: '1rem' }} to="/">
              Volver al registro
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
