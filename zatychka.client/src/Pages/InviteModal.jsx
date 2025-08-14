import React, { useEffect, useState } from 'react';
import './InviteModal.css';

const InviteModal = ({ onClose, referralLink }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // no-op
        }
    };

    // Закрытие по Esc
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="invite-modal-overlay" onClick={onClose} role="presentation">
            <div
                className="invite-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="invite-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="invite-modal-title" className="invite-title">Пригласить реферала</h2>

                <p className="invite-description">
                    Создайте реферальную ссылку и отправьте её своему партнёру. После регистрации трейдера
                    он сразу появится в вашем списке реферальных партнёров.
                </p>

                <div className="styled-input-wrapper">
                    <label className="styled-label">Реферальная ссылка</label>

                    <div className="styled-input">
                        <input
                            type="text"
                            readOnly
                            value={referralLink}
                            className="styled-link-input"
                        />

                        <button
                            type="button"
                            className="copy-btn-referal"
                            aria-label="Скопировать ссылку"
                            onClick={handleCopy}
                        >
                            {/* copy icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                    <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z" />
                                    <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" />
                                </g>
                            </svg>
                        </button>

                        {copied && <div className="copied-popover-referal">Адрес скопирован</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
