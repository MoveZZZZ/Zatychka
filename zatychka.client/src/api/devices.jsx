import { authFetch } from '../utils/authFetch'; 
export { authFetch }; 

export async function getDevices() {
    const r = await authFetch('https://localhost:5132/api/devices/list');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function addDevice(name) {
    const body = JSON.stringify({ name: name.trim().replace(/\s+/g, ' ') });
    const r = await authFetch('https://localhost:5132/api/devices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });
    if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.message || `HTTP ${r.status}`);
    }
    return r.json();
}

export async function updateDevice(id, name) {
    const r = await authFetch(`https://localhost:5132/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim().replace(/\s+/g, ' ') }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

export async function deleteDevice(id) {
    const r = await authFetch(`https://localhost:5132/api/devices/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
}
