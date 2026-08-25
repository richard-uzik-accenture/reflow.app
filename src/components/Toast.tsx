import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToastItem } from '../hooks/useToast';
import './Toast.css';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="4 13 9 18 20 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12" y2="13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <motion.div
      layout
      className={`toast toast--${toast.kind}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 30, mass: 0.8 } }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.175, ease: 'easeIn' } }}
      role={toast.kind === 'error' ? 'alert' : 'status'}
    >
      <span className="toast__icon">
        {toast.kind === 'error' ? <AlertIcon /> : <CheckIcon />}
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__dismiss"
        aria-label="dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return createPortal(
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
