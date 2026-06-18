import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../utils/authRoutes';
import MobileAppPromo from '../components/ui/MobileAppPromo';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const CORREO_IPN_REGEX = /^[\w.-]+@alumno\.ipn\.mx$/;
const LOGO_SRC = '/images/cbook-logo.jpeg';
const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";

function validarPassword(password) {
  if (!password || password.length < 6 || password.length > 16)
    return 'La contraseña debe tener entre 6 y 16 caracteres';
  if (!/[a-z]/.test(password))
    return 'La contraseña debe contener al menos una letra minúscula';
  if (!/[A-Z]/.test(password))
    return 'La contraseña debe contener al menos una letra mayúscula';
  if (![...password].some((char) => SPECIAL_CHARS.includes(char)))
    return 'La contraseña debe contener al menos un carácter especial';
  return null;
}

function DocumentPage({ docUrl, title, onBack }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(docUrl);
        let text = await res.text();
        text = text.replace(/<br\s*\/?>\s*<div>.*?Termly.*?<\/div>/gs, '');
        text = text.replace(/This Privacy Policy was created using Termly.*?(?:<\/a>)?\.?\s*/gi, '');
        if (!cancelled) setHtml(DOMPurify.sanitize(text));
      } catch {
        if (!cancelled) setHtml('<p>Error al cargar el documento</p>');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [docUrl]);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Regresar
      </button>
      <h2>{title}</h2>
      {loading ? (
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando documento...</p>
      ) : (
        <div style={{ marginTop: '1rem', maxHeight: '70vh', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: '1rem' }} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ boleta: '', password: '', correo: '', confPsw: '' });
  const [msg, setMsg] = useState(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [view, setView] = useState('form');
  const [animKey, setAnimKey] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);

  useEffect(() => {
    const hasPendingRegistration = Boolean(localStorage.getItem('datosRegistro'));
    const callbackPayload = `${window.location.search || ''}${window.location.hash || ''}`;
    const isSupabaseSignupCallback = /(?:type=signup|access_token=|refresh_token=|code=)/.test(callbackPayload);

    if (hasPendingRegistration && isSupabaseSignupCallback) {
      navigate('/verificar', { replace: true });
    }
  }, [navigate]);

  if (user && !showBetaModal) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  if (view === 'privacidad') {
    return (
      <DocumentPage
        docUrl="/docs/AVISO DE PRIVACIDAD.txt"
        title="Aviso de Privacidad"
        onBack={() => setView('form')}
      />
    );
  }

  if (view === 'terminos') {
    return (
      <DocumentPage
        docUrl="/docs/terminos y condiciones.txt"
        title="Términos y Condiciones"
        onBack={() => setView('form')}
      />
    );
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!/^\d{10}$/.test(form.boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 digitos' });
      return;
    }

    if (!form.password) {
      setMsg({ type: 'error', text: 'Ingrese su contraseña' });
      return;
    }

    setLoading(true);
    try {
      await login(form.boleta, form.password);
      toast.success('Bienvenido');
      setShowBetaModal(true);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!/^\d{10}$/.test(form.boleta)) {
      setMsg({ type: 'error', text: 'La boleta debe tener 10 digitos' });
      return;
    }
    if (!CORREO_IPN_REGEX.test(form.correo)) {
      setMsg({ type: 'error', text: 'Solo se permiten correos institucionales @alumno.ipn.mx' });
      return;
    }
    const errorPsw = validarPassword(form.password);
    if (errorPsw) {
      setMsg({ type: 'error', text: errorPsw });
      return;
    }
    if (form.password !== form.confPsw) {
      setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (!aceptaTerminos) {
      setMsg({ type: 'error', text: 'Debes aceptar el Aviso de Privacidad y los Terminos y Condiciones' });
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.boleta, form.correo, form.password, form.confPsw, aceptaTerminos);
      toast.success(data.message || 'Registro exitoso. Bienvenido.');
      if (data.user) {
        navigate(getHomePath(data.user), { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setMsg(null);
    setAnimKey(prev => prev + 1);
  };

  const closeBetaModal = () => {
    setShowBetaModal(false);
    navigate(getHomePath(user), { replace: true });
  };

  return (
    <>
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-stack">
            <div className="auth-hero">
              <div className="auth-brand">
                <img src={LOGO_SRC} alt="" className="brand-logo auth-brand-logo" />
                <h1>C-Book</h1>
              </div>
              <p>Plataforma digital creada para facilitar el acceso a recursos educativos, solicitudes de libros y seguimiento de soporte.</p>
            </div>

            <MobileAppPromo
              compact
              title="Descarga la app movil de C-Book"
              description="Accede a tu cuenta y gestiona solicitudes de libros desde cualquier lugar con una experiencia pensada para celular."
            />
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form">
            <h2>{mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}</h2>

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
              <div key={animKey} className="auth-form-content">
                <p className="subtitle">
                  {mode === 'login' ? 'Ingresa tu boleta y contraseña' : 'Solo correos @alumno.ipn.mx'}
                </p>

                {msg && <div className={`msg msg-${msg.type}`}>{msg.text}</div>}
                <div className="form-group">
                  <label>Numero de boleta</label>
                  <input
                    type="text"
                    placeholder="Ej: 2023630001"
                    maxLength={10}
                    value={form.boleta}
                    onChange={set('boleta')}
                    onKeyPress={(e) => e.key !== 'Enter' && !/\d/.test(e.key) && e.preventDefault()}
                    required
                  />
                </div>

                {mode === 'register' && (
                  <div className="form-group">
                    <label>Correo institucional</label>
                    <input
                      type="email"
                      placeholder="correo@alumno.ipn.mx"
                      value={form.correo}
                      onChange={set('correo')}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Ingrese su contraseña"
                    maxLength={16}
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  {mode === 'register' && (
                    <p className="password-hint">
                      Formato: 6 a 16 caracteres, una mayuscula, una minuscula y un caracter especial.
                    </p>
                  )}
                </div>

                {mode === 'register' && (
                  <div className="form-group">
                    <label>Confirmar contraseña</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Confirme su contraseña"
                      maxLength={16}
                      value={form.confPsw}
                      onChange={set('confPsw')}
                      required
                    />
                  </div>
                )}
              </div>

              <label className="show-password">
                <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} />
                Mostrar contraseña
              </label>

              {mode === 'register' && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    <input type="checkbox" checked={aceptaTerminos} onChange={() => setAceptaTerminos(!aceptaTerminos)} />
                    <span>
                      Acepto el <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setView('privacidad'); }}>Aviso de Privacidad</a> y los <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setView('terminos'); }}>Términos y Condiciones</a>
                    </span>
                  </label>
                </div>
              )}

              <button className="btn-submit" type="submit" disabled={loading || (mode === 'register' && !aceptaTerminos)}>
                {loading ? 'Procesando...' : mode === 'login' ? 'ACCEDER' : 'REGISTRAR'}
              </button>
            </form>

            {mode === 'login' && (
              <p className="toggle-link" style={{ marginTop: '0.5rem' }}>
                <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </p>
            )}

            <div className="auth-divider">o</div>

            <p className="toggle-link">
              {mode === 'login' ? (
                <>No tienes cuenta? <a onClick={toggleMode}>Crear cuenta</a></>
              ) : (
                <>Ya tienes cuenta? <a onClick={toggleMode}>Iniciar sesion</a></>
              )}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={showBetaModal}
        onClose={closeBetaModal}
        title="Aviso de versión Beta"
        wide
        footer={
          <button className="btn btn-primary" onClick={closeBetaModal}>
            Entendido
          </button>
        }
      >
        <div style={{ lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          <p style={{ marginTop: 0 }}>Favor de leer completamente</p>
          <p>
            Este sistema es una está en una versión Beta por lo tanto únicamente esta hecho con fines para hacer pruebas y verificar el funcionamiento del mismo.
          </p>
          <p style={{ marginBottom: 0 }}>
            El sistema actualmente no podrá tomar en cuenta los prestamos reales con los prestamos de la biblioteca por lo tanto el prestamo que solicites desde llos aplicativos no seran tomados en cuenta hasta acabar la versión Beta, igualmente te invitamos a probar todas las funcionalidades para futuras mejoras
          </p>
        </div>
      </Modal>
    </>
  );
}
