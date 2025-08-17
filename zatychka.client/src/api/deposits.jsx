const BASE = 'https://localhost:5132';

export async function checkDepositsApi({ address, userId = null }) {
    const res = await fetch(`${BASE}/api/deposits/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, userId }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'API error');
    }
    return res.json();
}
