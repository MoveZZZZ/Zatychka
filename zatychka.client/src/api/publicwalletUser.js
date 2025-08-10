const base = 'https://localhost:5132';

export async function getPublicWallet() {
    const res = await fetch(`${base}/api/publicwalletuser`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); 
}

export async function savePublicWallet(patch) {
    const res = await fetch(`${base}/api/publicwalletuser`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); 
}
