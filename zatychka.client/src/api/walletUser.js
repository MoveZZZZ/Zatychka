// src/api/walletUser.js
export async function getMyWallet() {
    const r = await fetch('https://localhost:5132/api/privatewalletuser', {
        method: 'GET',
        credentials: 'include',
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}
export async function saveMyWallet(patch) {
    const r = await fetch('https://localhost:5132/api/privatewalletuser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}
