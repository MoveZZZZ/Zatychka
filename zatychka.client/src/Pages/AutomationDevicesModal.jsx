import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import './AutomationModal.css';
import useUserInfo from '../hooks/useUserInfo';

const toB64Url = (str) => {
    // base64url без паддинга
    const b64 = typeof window !== 'undefined'
        ? btoa(unescape(encodeURIComponent(str)))
        : Buffer.from(str, 'utf8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromUtf8ToB64 = (str) => {
    try { return btoa(unescape(encodeURIComponent(str))); }
    catch { return btoa(str); }
};

export default function AutomationDevicesModal({ deviceId, onClose, message = 'SHARQ_AUTOMATION' }) {
    const portalElRef = useRef(null);
    const [qrUrl, setQrUrl] = useState('');
    const [deeplink, setDeeplink] = useState('');
    const user = useUserInfo(); // ожидается { id, email, ... }

    if (!portalElRef.current) {
        portalElRef.current = document.createElement('div');
        portalElRef.current.setAttribute('data-portal', 'automation-modal');
    }

    // Монтирование портала + блокировка скролла
    useEffect(() => {
        document.body.appendChild(portalElRef.current);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
            try { document.body.removeChild(portalElRef.current); } catch { }
        };
    }, []);

    // Генерация deep link + QR
    useEffect(() => {
        const run = async () => {
            const payload = {
                deviceId,
                userId: user?.id ?? null,
                email: user?.email ?? null,
                note_b64: fromUtf8ToB64(message),
                ts: Date.now()
            };
            const payloadStr = JSON.stringify(payload);
            const payloadB64Url = toB64Url(payloadStr);

            // ЕДИНАЯ строка: и для QR, и для прямого открытия приложения
            const link = `sharq://login?payload=${payloadB64Url}`;
            setDeeplink(link);

            try {
                const url = await QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 2, scale: 6 });
                setQrUrl(url);
            } catch (e) {
                console.error('QR generation error', e);
                setQrUrl('');
            }
        };
        run();
    }, [deviceId, user?.id, user?.email, message]);

    // Авто-открытие приложения по наведению (hover) с fallback на .apk
    const openAppWithFallback = useCallback(() => {
        if (!deeplink) return;

        // Способ 1: Android intent:// с fallback URL на apk
        // Замените package на фактический applicationId из Gradle
        const pkg = 'com.example.sharq';
        const fallback = encodeURIComponent('https://sharq.space/apk/sharq.apk');
        const intentUrl =
            `intent://login?payload=${encodeURIComponent(deeplink.split('payload=')[1])}` +
            `#Intent;scheme=sharq;package=${pkg};S.browser_fallback_url=${fallback};end`;

        // Попытаться открыть приложение:
        window.location.href = intentUrl;

        // Альтернативный таймаутовый fallback (на случай, если intent не отработал):
        const t = setTimeout(() => {
            try {
                window.location.href = 'https://sharq.space/apk/sharq.apk';
            } catch { }
        }, 2000);

        // Если приложение открылось — новый page visibility change/blur обычно срабатывает.
        const onBlur = () => clearTimeout(t);
        window.addEventListener('blur', onBlur, { once: true });
    }, [deeplink]);

    return createPortal(
        <div className="modal-overlay-auto modal-overlay--top" onClick={onClose}>
            <div
                className="modal-auto-window"
                role="dialog"
                aria-modal="true"
                aria-labelledby="automation-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="automation-title" className="modal-title">Установка и вход</h2>
                <p className="modal-text">
                    Наведите камеру на QR — откроется приложение (или начнётся скачивание).<br />
                    Либо отсканируйте QR в приложении.
                </p>

                <div className="qr-wrap">
                    {qrUrl ? (
                        <img
                            src={qrUrl}
                            alt="QR-код автоматики"
                            className="qr-code-apk-auto"
                            /*onMouseEnter={openAppWithFallback}*/
                        />
                    ) : (
                        <div className="qr-placeholder">Генерация QR…</div>
                    )}

                </div>

                <div className="modal-buttons">
                    <a href="https://sharq.space/apk/sharq.apk" download className="apk-button">Скачать .apk</a>
                    <a href={deeplink || '#'} className="tg-button" onClick={(e) => { if (!deeplink) e.preventDefault(); }}>
                        Открыть приложение
                    </a>
                </div>
            </div>
        </div>,
        portalElRef.current
    );
}
