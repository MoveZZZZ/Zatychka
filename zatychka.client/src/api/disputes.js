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

// ===== ������ ������ (public/private)
export async function fetchDisputes(scope = 'public', { statuses, transactionId, userId } = {}) {
    const url = `${API}/disputes/${scope}${qs({ statuses, transactionId, userId })}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('�� ������� ��������� �����');
    return res.json();
}

// ===== �������� ����� (public/private)
export async function createDispute(scope = 'public', body) {
    const res = await fetch(`${API}/disputes/${scope}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || '�� ������� ������� ����');
    }
    return res.json(); // { id }
}

// ===== �������� ����� (public/private)
export async function deleteDispute(scope = 'public', id) {
    const res = await fetch(`${API}/disputes/${scope}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('�� ������� ������� ����');
    return true;
}
