import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './AutomationModal.css';
import { useToast } from '../context/ToastContext';
const AutomationModal = ({ onClose, email }) => {
    const portalElRef = useRef(null);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const toast = useToast();
    if (!portalElRef.current) {
        portalElRef.current = document.createElement('div');
        portalElRef.current.setAttribute('data-portal', 'automation-modal');
    }

    useEffect(() => {
        document.body.appendChild(portalElRef.current);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
            try { document.body.removeChild(portalElRef.current); } catch { }
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('https://localhost:5132/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setLoadingLogout(true); await new Promise(r => setTimeout(r, 1800)); setLoadingLogout(false);
        } catch (err) {
            toast.error("Ошибка при выходе");
        } finally {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    return createPortal(
        <div className="modal-overlay-auto modal-overlay--top" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Выход из аккаунта</h2>
                <p>
                    Вы действительно хотите выйти из аккаунта{' '}
                    <span className="highlight">{email || 'Гость'}</span>?
                </p>
                <button className="confirm-btn" onClick={handleLogout}>
                    {loadingLogout ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="btn-spinner" aria-label="Загрузка" />
                            Выхожу…
                        </span>
                    ) : 'Подтвердить'}

                    </button>
                <button className="cancel-btn" onClick={onClose}>Отмена</button>
            </div>
        </div>,
        portalElRef.current
    );
};

export default AutomationModal;
