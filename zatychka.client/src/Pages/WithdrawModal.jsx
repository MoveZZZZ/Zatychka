// WithdrawModal.jsx
import React from 'react';
import './WithdrawModal.css';

export default function WithdrawModal({ open, onClose, managerUrl }) {
    if (!open) return null;

    return (
        <div className="withdraw-modal-overlay" onClick={onClose}>
            <div
                className="withdraw-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="withdraw-modal-title"
                aria-describedby="withdraw-modal-text"
                onClick={(e) => e.stopPropagation()}
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
                        href={managerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tg-btn"
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
