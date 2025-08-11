
const API = 'https://localhost:5132/api';

export async function fetchUsdtRub() {
    const res = await fetch(`${API}/rates/usdt-rub`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error('Не удалось получить курс USDT/RUB');
    const data = await res.json(); 
    return data; 
}
