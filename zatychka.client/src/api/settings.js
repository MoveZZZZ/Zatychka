// src/api/settings.js
import { get, put } from './client';
const API = 'https://localhost:5132/api';
export const getStatisticsTexts = () => get('/api/settings/statistics-texts');
export const saveStatisticsTexts = (payload) => put('/api/settings/statistics-texts', payload);

export const getStatisticsNumbers = () => get('/api/settings/statistics-numbers');
export const saveStatisticsNumbers = (payload) => put('/api/settings/statistics-numbers', payload);
export async function getIntakeDateSettings() {
    const res = await fetch(`${API}/settings/intake-date`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить настройку даты');
    return res.json();
}

export async function saveIntakeDateSettings(body) {
    const res = await fetch(`${API}/settings/intake-date`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Не удалось сохранить настройку даты');
    }
    return true;
}