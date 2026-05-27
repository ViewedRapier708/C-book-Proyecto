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
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const supabaseAccessToken = searchParams.get('access_token') || hashParams.get('access_token');
    const supabaseCode = searchParams.get('code');

    const finishSuccess = (message) => {
      localStorage.removeItem('datosRegistro');
      setSuccessMsg(message || 'Tu cuenta ha sido confirmada.');
      setStatus('success');
      setTimeout(() => navigate('/', { replace: true }), 3000);
    };

    if (!token) {
      if (supabaseAccessToken || supabaseCode) {
        let cancelled = false;

        const confirmSupabaseRegistration = async () => {
          try {
            setStatus('checking');
            let accessToken = supabaseAccessToken;

            if (!accessToken && supabaseCode) {
              const { supabase } = await import('../lib/supabaseClient');
              const { data, error } = await supabase.auth.exchangeCodeForSession(supabaseCode);
              if (error) throw error;
              accessToken = data?.session?.access_token;
            }

            if (!accessToken) {
              throw new Error('No se pudo leer la sesion confirmada de Supabase.');
            }

            const data = await authApi.verifySupabaseCallback(accessToken);
            if (cancelled) return;

            finishSuccess(data.mensaje || 'Tu cuenta ha sido confirmada.');
          } catch (err) {
            if (cancelled) return;

            const stored = localStorage.getItem('datosRegistro');
            if (stored) {
              try {
                const { boleta, correo } = JSON.parse(stored);
                const data = await authApi.verifyEmail(boleta, correo);
                if (cancelled) return;

                if (data.confirmado) {
                  finishSuccess(data.mensaje || 'Tu cuenta ha sido confirmada.');
                  return;
                }

                setStatus('waiting');
                return;
              } catch {
                // Continua con el error original del callback.
              }
            }

            setErrorMsg(err.message || 'No se pudo confirmar la cuenta.');
            setStatus('error');
          }
        };

        confirmSupabaseRegistration();

        return () => {
          cancelled = true;
        };
      }

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
            clearInterval(intervalRef.current);
            finishSuccess(data.mensaje || 'Tu cuenta ha sido confirmada.');
          } else {
            setStatus('waiting');
          }
        } catch (err) {
          if (err?.status) {
            setErrorMsg(err.message || 'No se pudo activar la cuenta.');
            setStatus('error');
          } else {
            setStatus('waiting');
          }
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

        finishSuccess(data.mensaje || 'Tu cuenta ha sido confirmada.');
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
            <h2>Esperando confirmación</h2>
            <p>Revisa tu bandeja de entrada y haz clic en el botón de confirmación.</p>
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
