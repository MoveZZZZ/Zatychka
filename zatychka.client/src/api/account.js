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
