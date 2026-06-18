import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { openSatisfactionSurvey } from '../../constants/survey';
import '../../styles/support.css';

export default function SurveyFab() {
  const { user } = useAuth();

  if (user?.rol !== 'alumno') return null;

  return (
    <button
      type="button"
      className="survey-fab"
      onClick={openSatisfactionSurvey}
      aria-label="Encuesta de satisfacción"
      title="Encuesta de satisfacción"
    >
      <ClipboardCheck size={18} />
      <span>Encuesta de satisfacción</span>
    </button>
  );
}
