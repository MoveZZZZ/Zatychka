import { React, useState } from 'react';
import './InviteModal.css';
import { ClipboardCopy } from 'lucide-react';

const InviteModal = ({ onClose, referralLink }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="title-style">Пригласить реферала</h2>
                <p className="invite-description">
                    Создайте реферальную ссылку и отправьте её своему партнёру. После регистрации трейдера он сразу появится
                    в вашем списке реферальных партнёров
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
                        <svg onClick={handleCopy}
                            className="copy-btn-referal"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            style={{ cursor: 'pointer' }}>
                            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z" />
                                <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" />
                            </g>
                        </svg>
                        {copied && <div className="copied-popover-referal">Адрес скопирован</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
