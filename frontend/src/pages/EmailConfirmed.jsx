import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Loader, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('confirming');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const cancelledRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const supabaseAccessToken = searchParams.get('access_token') || hashParams.get('access_token');
    const supabaseCode = searchParams.get('code');

    if (!token && !supabaseAccessToken && !supabaseCode) {
      setErrorMsg('Enlace de confirmación inválido o expirado.');
      setStatus('error');
      return;
    }

    const confirm = async () => {
      try {
        if (token) {
          const data = await authApi.confirmRegistration(token);
          if (cancelledRef.current) return;
          setSuccessMsg(data.mensaje || 'Tu cuenta ha sido confirmada.');
          setStatus('success');
          return;
        }

        let accessToken = supabaseAccessToken;

        if (!accessToken && supabaseCode) {
          const { supabase } = await import('../lib/supabaseClient');
          const { data, error } = await supabase.auth.exchangeCodeForSession(supabaseCode);
          if (error) throw error;
          accessToken = data?.session?.access_token;
        }

        if (!accessToken) {
          throw new Error('No se pudo obtener la sesión confirmada.');
        }

        const data = await authApi.verifySupabaseCallback(accessToken);
        if (cancelledRef.current) return;
        setSuccessMsg(data.mensaje || 'Tu cuenta ha sido confirmada.');
        setStatus('success');
      } catch (err) {
        if (cancelledRef.current) return;
        setErrorMsg(err.message || 'No se pudo confirmar la cuenta.');
        setStatus('error');
      }
    };

    confirm();

    return () => {
      cancelledRef.current = true;
    };
  }, [searchParams]);

  return (
    <div className="verify-page">
      <div className="verify-card">
        {status === 'confirming' && (
          <>
            <Loader size={40} style={{ animation: 'spin .7s linear infinite', color: 'var(--primary)' }} />
            <h2>Confirmando tu cuenta...</h2>
            <p>Estamos verificando tu correo electrónico.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} style={{ color: 'var(--success)' }} />
            <h2>Correo confirmado</h2>
            <p>{successMsg}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
              Iniciar sesión
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle size={40} style={{ color: 'var(--danger)' }} />
            <h2>Error</h2>
            <p>{errorMsg}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
