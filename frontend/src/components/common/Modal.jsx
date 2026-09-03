import { useEffect } from 'react';
export default function Modal({ open, title, children, onClose, footer }) {
  useEffect(() => { if (!open) return; const onKey = (event) => event.key === 'Escape' && onClose(); document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>×</button></header><div className="modal__body">{children}</div>{footer && <footer className="modal__footer">{footer}</footer>}</section></div>;
}
