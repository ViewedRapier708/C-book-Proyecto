import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, MailCheck } from 'lucide-react';

function safeDecode(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isValidConfirmationUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.pathname.includes('/auth/v1/verify');
  } catch {
    return false;
  }
}

export default function ConfirmarCuenta() {
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const email = useMemo(() => {
    return String(searchParams.get('email') || '').trim();
  }, [searchParams]);

  const confirmationUrl = useMemo(() => {
    const rawUrl = String(searchParams.get('url') || '').trim();
    const decoded = safeDecode(rawUrl);
    return isValidConfirmationUrl(decoded) ? decoded : '';
  }, [searchParams]);

  const handleConfirm = () => {
    if (!confirmationUrl) return;
    setSubmitting(true);
    window.location.assign(confirmationUrl);
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {!confirmationUrl ? (
          <>
            <AlertTriangle size={40} style={{ color: 'var(--danger)' }} />
            <h2>Enlace invalido</h2>
            <p>No se encontro un enlace de confirmacion valido. Solicita un nuevo correo.</p>
            <Link className="btn btn-primary" style={{ marginTop: '1rem' }} to="/">
              Volver al inicio
            </Link>
          </>
        ) : (
          <>
            <MailCheck size={40} style={{ color: 'var(--primary)' }} />
            <h2>Confirmar cuenta</h2>
            <p>
              {email
                ? `Correo detectado: ${email}.`
                : 'Tu enlace de confirmacion esta listo.'}
            </p>
            <p>Presiona el boton para confirmar manualmente tu cuenta.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Confirmando...' : 'Confirmar cuenta'}
            </button>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.75rem' }}>
              Solo se confirmara cuando hagas clic en este boton.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
