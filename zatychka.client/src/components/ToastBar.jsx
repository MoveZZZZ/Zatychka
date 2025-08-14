import React, { useEffect, useRef, useState } from 'react';
import './ToastBar.css';

const ACCENTS = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
};

export default function ToastBar({
    open,
    message,
    variant = 'success',   // 'success' | 'error' | 'info'
    duration = 4000,
    onClose,
}) {
    // ===== Прогресс (с паузой/резюме) =====
    const [progress, setProgress] = useState(0); // 0..1
    const rafRef = useRef(null);
    const startRef = useRef(null);
    const baseProgressRef = useRef(0);       // накопленный прогресс перед паузой
    const animDurationRef = useRef(duration); // длительность текущего этапа (оставшееся время)

    useEffect(() => {
        if (!open) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startRef.current = null;
            baseProgressRef.current = 0;
            animDurationRef.current = duration;
            setProgress(0);
            return;
        }

        // старт/рестарт
        baseProgressRef.current = 0;
        animDurationRef.current = duration;
        setProgress(0);
        startRef.current = performance.now();

        const tick = (now) => {
            const start = startRef.current;
            if (!start) return;
            const elapsed = now - start;
            const base = baseProgressRef.current;
            const part = Math.min(elapsed / animDurationRef.current, 1);
            const p = base + part * (1 - base);
            setProgress(p);
            if (p < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                onClose?.();
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [open, duration, onClose]);

    const pauseProgress = () => {
        if (startRef.current) {
            // зафиксировать текущий прогресс как базовый
            baseProgressRef.current = progress;
            animDurationRef.current = duration * (1 - baseProgressRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startRef.current = null;
        }
    };

    const resumeProgress = () => {
        if (!startRef.current && progress < 1) {
            startRef.current = performance.now();
            const tick = (now) => {
                const start = startRef.current;
                if (!start) return;
                const elapsed = now - start;
                const base = baseProgressRef.current;
                const part = Math.min(
                    animDurationRef.current ? elapsed / animDurationRef.current : 1,
                    1
                );
                const p = base + part * (1 - base);
                setProgress(p);
                if (p < 1) {
                    rafRef.current = requestAnimationFrame(tick);
                } else {
                    onClose?.();
                }
            };
            rafRef.current = requestAnimationFrame(tick);
        }
    };

    // ===== Свайп =====
    const [dx, setDx] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const [dismissAnim, setDismissAnim] = useState(false);
    const startXRef = useRef(0);

    const SWIPE_THRESHOLD = 80;  // пикселей до закрытия
    const OFFSCREEN = 600;       // куда "улетает" тост при закрытии свайпом

    const onStart = (x) => {
        if (!open) return;
        setSwiping(true);
        startXRef.current = x;
        setDx(0);
        pauseProgress();
    };

    const onMove = (x) => {
        if (!swiping) return;
        setDx(x - startXRef.current);
    };

    const onEnd = () => {
        if (!swiping) return;
        const shouldDismiss = Math.abs(dx) > SWIPE_THRESHOLD;
        if (shouldDismiss) {
            setDismissAnim(true);
            // даём анимации "улёта" 180мс и закрываем
            setTimeout(() => {
                setDismissAnim(false);
                setDx(0);
                onClose?.();
            }, 180);
        } else {
            // откат назад
            setSwiping(false);
            setDx(0);
            resumeProgress();
        }
    };

    // touch
    const handleTouchStart = (e) => onStart(e.touches[0].clientX);
    const handleTouchMove = (e) => onMove(e.touches[0].clientX);
    const handleTouchEnd = () => onEnd();

    // mouse (для десктопа)
    const mouseActiveRef = useRef(false);
    const handleMouseDown = (e) => {
        mouseActiveRef.current = true;
        onStart(e.clientX);
    };
    const handleMouseMove = (e) => {
        if (mouseActiveRef.current) onMove(e.clientX);
    };
    const handleMouseUp = () => {
        if (mouseActiveRef.current) {
            mouseActiveRef.current = false;
            onEnd();
        }
    };
    const handleMouseLeave = () => {
        if (mouseActiveRef.current) {
            mouseActiveRef.current = false;
            onEnd();
        }
    };

    // стиль: цвет акцента и трансформации
    const accent = ACCENTS[variant] ?? ACCENTS.success;
    const translateX = dismissAnim
        ? (dx > 0 ? OFFSCREEN : -OFFSCREEN)
        : dx;

    return (
        <div
            className={`toastbar ${variant} ${open ? 'show' : ''} ${swiping ? 'swiping' : ''}`}
            style={{
                '--accent': accent,
                transform: open
                    ? `translateY(0) translateX(${translateX}px)`
                    : 'translateY(-10px)',
                opacity: open ? 1 : 0,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            role="status"
            aria-live="polite"
        >
            <div className="toastbar-text">{message}</div>

            <div className="toastbar-progress-outer">
                <div className="toastbar-progress-inner" style={{ width: `${progress * 100}%` }} />
            </div>
        </div>
    );
}
