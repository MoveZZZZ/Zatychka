const BASE = 'https://localhost:5132/api/privatestatisticsuser';

export async function getMyStatisticsNumbers() {
    const res = await fetch(BASE, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить приватную статистику');
    return res.json();
}

export async function saveMyStatisticsNumbers(patch) {
    // patch той же формы, что и в контроллере: { intake?, disputes? }
    const res = await fetch(BASE, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Не удалось сохранить приватную статистику');
    return res.json();
}
