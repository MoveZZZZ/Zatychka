import React from 'react';
import './AuthorizeDeviceModal.css';
import qr from '../assets/qr.png';

const AuthorizeDeviceModal = ({ onClose, qrCodeUrl, syncKey }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className ="title-style">Авторизуйтесь через<br />мобильное приложение</h2>
                <p className="subtitle">
                    Отсканируйте QR-код через наше мобильное приложение<br />
                    на вашем устройстве и разрешите все доступы
                </p>

                <div className="qr-box">
                    <img src={qr} alt="QR Code" />
                </div>

                <p className="sync-instruction">Или введите ключ для синхронизации в мобильном приложении</p>

                <div className="sync-key-box">
                    <input type="text" readOnly value={syncKey} />
                </div>

                <div className="download-box">
                    <span>Если у вас ещё нет мобильного приложения автоматики</span>
                    <a className="download-btn" href="https://static.sharq.pro/app/automatics.apk" target="_blank" rel="noopener noreferrer">Скачать</a>
                </div>
            </div>
        </div>
    );
};

export default AuthorizeDeviceModal;
