const API = 'https://localhost:5132/api';

function qs(obj = {}) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;

        if (Array.isArray(v)) {
            v.forEach(item => {
                if (item !== undefined && item !== null && item !== '') {
                    p.append(k, String(item));
                }
            });
        } else {
            p.append(k, String(v));
        }
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}

// kind: 'simple' | 'frozen'
// scope: 'public' | 'private'
// NEW: { types } — массив строк-энумов, например ['Deposit','Withdrawal']
export async function fetchBalanceHistory(scope, kind, { types } = {}) {
    const url = `${API}/balance/history/${kind}/${scope}${qs({ types })}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить историю баланса');
    return res.json();
}

export async function createBalanceHistory(scope, kind, body) {
    const url = `${API}/balance/history/${kind}/${scope}`;
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать запись');
    }
    return res.json(); // { id }
}

export async function deleteBalanceHistory(scope, kind, id) {
    const url = `${API}/balance/history/${kind}/${scope}/${id}`;
    const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Не удалось удалить запись');
    return true;
}
