import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function EmailConfirmed() {
  const navigate = useNavigate();

  return (
    <div className="verify-page">
      <div className="verify-card">
        <CheckCircle size={40} style={{ color: 'var(--success)' }} />
        <h2>Correo confirmado</h2>
        <p>Tu correo electrónico ha sido confirmado exitosamente.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
