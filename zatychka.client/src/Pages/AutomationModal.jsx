import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './AutomationModal.css';
import qrImage from '../assets/qr.png';

const AutomationModal = ({ onClose }) => {
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

    return createPortal(
        <div className="modal-overlay-auto modal-overlay--top" onClick={onClose}>
            <div
                className="modal-auto-window"
                role="dialog"
                aria-modal="true"
                aria-labelledby="automation-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="automation-title" className="modal-title">
                    Установка мобильного приложения
                </h2>

                <p className="modal-text">
                    Отсканируйте QR-код камерой вашего устройства или<br />
                    скачайте установочный файл
                </p>

                <img src={qrImage} alt="QR-код" className="qr-code-apk-auto" />

                <div className="modal-buttons">
                    <a
                        href="https://static.sharq.pro/app/automatics.apk"
                        download
                        className="apk-button"
                    >
                        Скачать .apk
                    </a>
                    <a
                        href="https://t.me/sharqchannel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tg-button"
                    >
                        Перейти в Telegram
                    </a>
                </div>
            </div>
        </div>,
        portalElRef.current
    );
};

export default AutomationModal;
