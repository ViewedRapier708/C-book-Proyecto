import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function ForgotPassword() {
  const [boleta, setBoleta] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!/^\d{10}$/.test(boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 dígitos' });
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.forgotPassword(boleta);
      setSent(true);
      setMsg({ type: 'success', text: data.message || 'Revisa tu correo para continuar.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'No se pudo procesar la solicitud' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <h1>C-Book</h1>
          <p>Recupera el acceso a tu cuenta ingresando tu número de boleta. Te enviaremos un enlace a tu correo registrado.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form">
          <h2>Recuperar contraseña</h2>
          <p className="subtitle">Ingresa tu boleta y te enviaremos las instrucciones</p>

          {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Número de boleta</label>
                <input
                  type="text"
                  placeholder="Ej: 2023630001"
                  maxLength={10}
                  value={boleta}
                  onChange={(e) => setBoleta(e.target.value)}
                  onKeyPress={(e) => e.key !== 'Enter' && !/\d/.test(e.key) && e.preventDefault()}
                  required
                />
              </div>

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Enviando...' : 'ENVIAR ENLACE'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña.
              </p>
            </div>
          )}

          <div className="auth-divider">o</div>

          <p className="toggle-link">
            <Link to="/">Volver a Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
