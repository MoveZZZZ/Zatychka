const API = 'https://localhost:5132/api';

export async function getMyProfile() {
    const res = await fetch(`${API}/account/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить профиль');
    return res.json(); // { id, login, email, phone, role, createdAt }
}

export async function updateMyProfile({ login, email, phone }) {
    const res = await fetch(`${API}/account/me`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, email, phone }),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось сохранить профиль');
    }
    return res.json(); // updated profile
}

export async function changeMyPassword({ newPassword, confirmPassword }) {
    const res = await fetch(`${API}/account/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось изменить пароль');
    }
    return true;
}
export async function getMyTelegramLink() {
    const res = await fetch(`${API}/telegram-links/me`, { credentials: 'include' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Не удалось получить ссылку Telegram');
    return res.json(); // { username }
}


export async function adminGetTelegramLinkByUser(userId) {
    const res = await fetch(`${API}/telegram-links/by-user/${userId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить Telegram-связку пользователя');
    return res.json(); // { username } | null
}

export async function adminUpsertTelegramLink({ userId, telegram, telegramUserId }) {
    const res = await fetch(`${API}/telegram-links`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, telegram, telegramUserId })
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось привязать Telegram');
    }
    return res.json(); // { username }
}

export async function adminUnlinkTelegram(userId) {
    const res = await fetch(`${API}/telegram-links/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Не удалось отвязать Telegram');
    return true;
}
