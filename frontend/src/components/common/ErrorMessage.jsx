export default function ErrorMessage({ message, onRetry }) {
  return <div className="error-message" role="alert"><span>{message || 'Something went wrong.'}</span>{onRetry && <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>Retry</button>}</div>;
}
