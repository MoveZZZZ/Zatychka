import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './AutomationModal.css';

const AutomationModal = ({ onClose, email }) => {
    const portalElRef = useRef(null);

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
        } catch (err) {
            console.error('Ошибка при выходе:', err);
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
                <button className="confirm-btn" onClick={handleLogout}>Подтвердить</button>
                <button className="cancel-btn" onClick={onClose}>Отмена</button>
            </div>
        </div>,
        portalElRef.current
    );
};

export default AutomationModal;
