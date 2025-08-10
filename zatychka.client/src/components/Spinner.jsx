import React, { useEffect, useRef, useState } from 'react';
import './ToastBar.css';

const ACCENTS = {
    success: '#22c55e', // зелёный
    error: '#ef4444', // красный
    info: '#3b82f6', // синий
};

export default function ToastBar({
    open,
    message,
    // поддерживаем оба пропса: и variant, и type (из контекста сейчас приходит type)
    variant: variantProp = 'success',
    type,                       // 'success' | 'error' | 'info'
    duration = 4000,
    onClose,
}) {
    const variant = (type || variantProp);
    const [progress, setProgress] = useState(0); // 0…1
    const rafRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        if (!open) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startRef.current = null;
            setProgress(0);
            return;
        }
        startRef.current = performance.now();
        setProgress(0);

        const tick = (now) => {
            if (!startRef.current) return;
            const elapsed = now - startRef.current;
            const p = Math.min(elapsed / duration, 1);
            setProgress(p);
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
            else onClose?.();
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [open, duration, onClose]);

    const handleClose = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startRef.current = null;
        setProgress(0);
        onClose?.();
    };

    // цвет для полоски прогресса через CSS-переменную
    const style = { '--accent': ACCENTS[variant] || ACCENTS.success };

    return (
        <div className={`toastbar ${open ? 'show' : ''} ${variant}`} style={style}>
            <div className="toastbar-text">{message}</div>

            <div className="toastbar-progress-outer">
                <div
                    className="toastbar-progress-inner"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            <button className="toastbar-close" onClick={handleClose} aria-label="Закрыть">
                ×
            </button>
        </div>
    );
}
