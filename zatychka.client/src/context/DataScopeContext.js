// src/context/DataScopeContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DataScopeContext = createContext({ scope: 'private', setScope: () => { } });

export function DataScopeProvider({ children }) {
    const fromQuery = (() => {
        try {
            const q = new URLSearchParams(window.location.search).get('scope');
            return q === 'public' || q === 'private' ? q : null;
        } catch {
            return null;
        }
    })();

    const [scope, setScope] = useState(() =>
        fromQuery || localStorage.getItem('dataScope') || 'private'
    );

    useEffect(() => {
        localStorage.setItem('dataScope', scope);
    }, [scope]);

    const value = useMemo(() => ({ scope, setScope }), [scope]);

    return React.createElement(
        DataScopeContext.Provider,
        { value },
        children
    );
}

export function useDataScope() {
    return useContext(DataScopeContext);
}
