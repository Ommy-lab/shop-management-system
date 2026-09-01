export default function StatusBadge({ value }) {
  const normalized = String(value ?? 'UNKNOWN').toUpperCase();
  return <span className={`status-badge status-badge--${normalized.toLowerCase().replaceAll('_','-')}`}>{normalized.replaceAll('_',' ')}</span>;
}
