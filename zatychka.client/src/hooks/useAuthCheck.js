import { useEffect, useState } from 'react';

export default function useAuthCheck() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('https://localhost:5132/api/auth/refresh_access_token', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (!r.ok) throw new Error();
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { isAuthenticated, loading };
}
