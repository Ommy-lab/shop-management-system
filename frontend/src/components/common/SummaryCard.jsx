export default function SummaryCard({ title, value, tone }) {
  return <div className={`summary-card${tone ? ` summary-card--${tone}` : ''}`}><span>{title}</span><strong>{value}</strong></div>;
}
