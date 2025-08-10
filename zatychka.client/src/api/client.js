// api/client
import { authFetch } from '../utils/authFetch';
export { authFetch }; 

const BASE_URL = 'https://localhost:5132';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const res = await authFetch(`${BASE_URL}${path}`, {
        method,
        credentials: 'include',
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const message = data?.message || data || `HTTP ${res.status}`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

export const get = (path, opts) => request(path, { ...opts, method: 'GET' });
export const post = (path, body, opts) => request(path, { ...opts, method: 'POST', body });
export const put = (path, body, opts) => request(path, { ...opts, method: 'PUT', body });
export const del = (path, opts) => request(path, { ...opts, method: 'DELETE' });
