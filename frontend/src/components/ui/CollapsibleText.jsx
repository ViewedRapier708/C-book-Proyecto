import { useState } from 'react';

export default function CollapsibleText({ text, maxLength = 40, className = '' }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= maxLength) {
    return <span className={`${className} sup-text-wrap`}>{text}</span>;
  }

  return (
    <span className={`${className} sup-text-wrap`}>
      {expanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="ml-1.5 text-xs font-semibold align-baseline inline-flex items-center gap-0.5"
        style={{ color: '#e89a4f' }}
      >
        {expanded ? 'Ver menos' : 'Ver más'}
      </button>
    </span>
  );
}
