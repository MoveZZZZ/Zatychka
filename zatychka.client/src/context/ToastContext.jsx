import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastBar from '../components/ToastBar';

const ToastContext = createContext({
    show: () => { },
    success: () => { },
    error: () => { },
    info: () => { },
    close: () => { },
});

export function ToastProvider({ children }) {
    const [state, setState] = useState({
        open: false,
        type: 'success',     // 'success' | 'error' | 'info'
        message: '',
        duration: 3500,
        key: 0,              // чтобы сбрасывать прогресс-бар
    });

    const show = useCallback((type, message, duration = 3500) => {
        setState(s => ({
            open: true,
            type,
            message,
            duration,
            key: s.key + 1,    
        }));
    }, []);

    const success = useCallback((msg, dur) => show('success', msg, dur), [show]);
    const error = useCallback((msg, dur) => show('error', msg, dur), [show]);
    const info = useCallback((msg, dur) => show('info', msg, dur), [show]);

    const close = useCallback(() => setState(s => ({ ...s, open: false })), []);

    const value = useMemo(() => ({ show, success, error, info, close }), [show, success, error, info, close]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastBar
                key={state.key}
                open={state.open}
                variant={state.type}
                message={state.message}
                duration={state.duration}
                onClose={close}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
