export default function ConfirmDialog({ open, title='Confirm action', message, confirmLabel='Confirm', danger=false, onCancel, onConfirm }) {
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><h2 id="confirm-title">{title}</h2><p>{message}</p><div className="form-actions"><button className="btn btn--secondary" onClick={onCancel}>Cancel</button><button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}
