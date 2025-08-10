const API = 'https://localhost:5132/api';

function qs(obj = {}) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}

// ПУБЛИЧНЫЕ транзакции (единственные)
export async function fetchPayinTransactions({ status, id, page = 1, pageSize = 50 } = {}) {
    const url = `${API}/payin/transactions/public${qs({ status, id, page, pageSize })}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить транзакции');
    return res.json();
}

export async function createPayinTransaction(body) {
    const url = `${API}/payin/transactions/public`;
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать транзакцию');
    }
    return res.json();
}

export async function deletePayinTransaction(id) {
    const url = `${API}/payin/transactions/public/${id}`;
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось удалить транзакцию');
    }
    return true;
}

// LOOKUP по ЛОГИНУ
export async function lookupRequisites(login, take = 20) {
    const res = await fetch(`${API}/payin/lookup/requisites${qs({ login, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить реквизиты');
    return res.json();
}

export async function lookupDevices(login, take = 20) {
    const res = await fetch(`${API}/payin/lookup/devices${qs({ login, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить устройства');
    return res.json();
}
