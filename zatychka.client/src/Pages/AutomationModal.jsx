import React from 'react';
import './AutomationModal.css';
import qrImage from '../assets/qr.png';

const AutomationModal = ({ onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Установка мобильного приложения</h2>
                <p className="modal-text">
                    Отсканируйте QR-код камерой вашего устройства или<br />
                    скачайте установочный файл
                </p>
                <img src={qrImage} alt="QR-код" className="qr-code" style={{ width: '300px', height: '300px' }} />

                <div className="modal-buttons">
                    <a href="https://static.sharq.pro/app/automatics.apk" download className="apk-button">Скачать .apk</a>
                    <a href="https://t.me/sharqchannel" target="_blank" rel="noopener noreferrer" className="tg-button">Перейти в Telegram</a>
                </div>
            </div>
        </div>
    );
};

export default AutomationModal;
