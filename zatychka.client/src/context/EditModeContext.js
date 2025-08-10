import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const EditModeContext = createContext({ editMode: false, toggle: () => { }, setEditMode: () => { } });

export function EditModeProvider({ children }) {
    const fromQuery = (() => {
        try { return new URLSearchParams(window.location.search).get('edit') === '1'; } catch (e) { return false; }
    })();

    const [editMode, setEditMode] = useState(() =>
        fromQuery || localStorage.getItem('editMode') === '1'
    );

    useEffect(() => {
        localStorage.setItem('editMode', editMode ? '1' : '0');
    }, [editMode]);

    const toggle = useCallback(() => setEditMode(v => !v), []);

    useEffect(() => {
        const onKey = (e) => {
            const key = (e.key || '').toLowerCase();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey) {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toggle]);

    return React.createElement(
        EditModeContext.Provider,
        { value: { editMode, toggle, setEditMode } },
        children
    );
}

export function useEditMode() {
    return useContext(EditModeContext);
}
