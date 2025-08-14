// WithdrawModal.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import './WithdrawModal.css';

export default function WithdrawModal({ open, onClose, managerUrl }) {
    const dialogRef = useRef(null);
    const firstFocusableRef = useRef(null);

    // Закрытие по Esc
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
            // Примитивный focus trap
            if (e.key === 'Tab' && dialogRef.current) {
                const focusables = dialogRef.current.querySelectorAll(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Начальный фокус
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                firstFocusableRef.current?.focus();
            }, 0);
        }
    }, [open]);

    const stop = useCallback((e) => e.stopPropagation(), []);

    if (!open) return null;

    return (
        <div className="withdraw-modal-overlay" onClick={onClose}>
            <div
                className="withdraw-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="withdraw-modal-title"
                aria-describedby="withdraw-modal-text"
                onClick={stop}
                ref={dialogRef}
            >

                <div className="withdraw-modal-icon" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M12 22q-2.075 0-3.9-.788t-3.2-2.137t-2.137-3.2T2 12t.788-3.9t2.137-3.2t3.2-2.137T12 2t3.9.788t3.2 2.137t2.137 3.2T22 12t-.788 3.9t-2.137 3.2t-3.2 2.137T12 22m-1.1-5.1l7-7l-1.4-1.4l-5.6 5.6l-2.6-2.6l-1.4 1.4z"
                        />
                    </svg>
                </div>

                <h3 id="withdraw-modal-title" className="withdraw-modal-title">
                    Заявка на вывод отправлена
                </h3>

                <p id="withdraw-modal-text" className="withdraw-modal-text">
                    Выводы проверяются вручную. Ожидайте ответа менеджера в привязанном Telegram.
                </p>

                <div className="withdraw-modal-actions">
                    <a
                        href={managerUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tg-btn-wid"
                        ref={firstFocusableRef}
                    >
                        Написать менеджеру
                    </a>
                    <button className="secondary-btn" onClick={onClose} type="button">
                        Понятно
                    </button>
                </div>
            </div>
        </div>
    );
}
