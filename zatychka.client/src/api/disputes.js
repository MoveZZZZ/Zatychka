const API = 'https://localhost:5132/api';

function qs(obj = {}) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        if (Array.isArray(v)) v.forEach(i => p.append(k, String(i)));
        else p.append(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}


export async function fetchDisputes({ statuses, transactionId } = {}) {
    const url = `${API}/disputes/public${qs({ statuses, transactionId })}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить споры');
    return res.json();
}

export async function createDispute(body) {
    const res = await fetch(`${API}/disputes/public`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать спор');
    }
    return res.json(); // { id }
}

export async function deleteDispute(id) {
    const res = await fetch(`${API}/disputes/public/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Не удалось удалить спор');
    return true;
}
