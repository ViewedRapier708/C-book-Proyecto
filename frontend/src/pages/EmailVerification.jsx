import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { supabase } from '../lib/supabaseClient';
import { Loader, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EmailVerification() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('form'); // form | loading | success | error
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const registrationData = useMemo(() => {
    const raw = localStorage.getItem('datosRegistro');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        correo: String(parsed?.correo || '').trim().toLowerCase(),
      };
    } catch {
      return null;
    }
  }, []);

  const email = registrationData?.correo || '';

  useEffect(() => {
    if (!email) {
      setStatus('error');
      setErrorMsg('No hay un registro pendiente. Registrate primero para verificar tu correo.');
    }
  }, [email]);

  const finishSuccess = (message) => {
    localStorage.removeItem('datosRegistro');
    setSuccessMsg(message || 'Tu cuenta ha sido confirmada.');
    setStatus('success');
    setTimeout(() => navigate('/', { replace: true }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setStatus('error');
      setErrorMsg('No hay correo de registro disponible.');
      return;
    }

    const normalizedCode = String(code || '').replace(/\D/g, '').trim();
    if (normalizedCode.length !== 6) {
      setStatus('error');
      setErrorMsg('Ingresa el codigo de 6 digitos enviado a tu correo.');
      return;
    }

    try {
      setStatus('loading');
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: normalizedCode,
        type: 'signup',
      });

      if (error) throw error;

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        throw new Error('No se pudo obtener la sesion confirmada de Supabase.');
      }

      const response = await authApi.verifySupabaseCallback(accessToken);
      finishSuccess(response?.mensaje || 'Correo verificado y cuenta activada exitosamente.');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'No se pudo confirmar la cuenta. Verifica el codigo e intenta de nuevo.');
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {status === 'form' && (
          <>
            <ShieldCheck size={40} style={{ color: 'var(--primary)' }} />
            <h2>Verificar correo</h2>
            <p>Ingresa el codigo de 6 digitos que recibiste por correo.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
              <strong>{email}</strong>
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '1rem' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  letterSpacing: '0.4rem',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
                autoFocus
                required
              />

              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                type="submit"
                disabled={code.replace(/\D/g, '').length !== 6}
              >
                Confirmar cuenta
              </button>
            </form>
          </>
        )}

        {status === 'loading' && (
          <>
            <Loader size={40} style={{ animation: 'spin .7s linear infinite', color: 'var(--primary)' }} />
            <h2>Confirmando cuenta...</h2>
            <p>Estamos validando tu codigo de verificacion.</p>
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
            <h2>No se pudo verificar</h2>
            <p>{errorMsg}</p>
            {email ? (
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setStatus('form');
                  setErrorMsg('');
                }}
              >
                Intentar de nuevo
              </button>
            ) : (
              <Link className="btn btn-primary" style={{ marginTop: '1rem' }} to="/">
                Volver al registro
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
