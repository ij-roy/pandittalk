import { useEffect, useRef } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  durationMs?: number;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  durationMs = 3000,
}: ToastProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message]);

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="status">
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss"
        onClick={onClose}
      >
        ×
      </button>
      <span
        className={styles.bar}
        style={{ animationDuration: `${durationMs}ms` }}
        aria-hidden
      />
    </div>
  );
}
