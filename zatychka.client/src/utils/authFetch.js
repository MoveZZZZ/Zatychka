// src/utils/authFetch.js
let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = fetch('https://localhost:5132/api/auth/check', {
            method: 'POST',
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('refresh failed');
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

export async function authFetch(url, options = {}) {
    const res = await fetch(url, { ...options, credentials: 'include' });
    if (res.status !== 401) return res;

    try {
        await refreshAccessToken();
        return await fetch(url, { ...options, credentials: 'include' });
    } catch {
        try {
            await fetch('https://localhost:5132/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch { }
        window.location.replace('/login');
        throw new Error('Unauthorized');
    }
}
