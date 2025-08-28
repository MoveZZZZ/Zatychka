import React from 'react';
import './ImportantLineModal.css';

export default function ImportantLineModal({
    open,
    title,
    message,
    continueText = 'Продолжить',
    cancelText = 'Отменить',
    onContinue,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div className="ilm-backdrop" onClick={onCancel}>
            <div className="ilm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ilm-header">
                    <div className="ilm-signal" aria-hidden>!</div>
                    <h3 className="ilm-title">{title}</h3>
                </div>

                <p className="ilm-message">{message}</p>

                <div className="ilm-actions">
                    <button className="ilm-btn danger" onClick={onContinue} type="button">
                        {continueText}
                    </button>
                    <button className="ilm-btn ghost" onClick={onCancel} type="button">
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}
