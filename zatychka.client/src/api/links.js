
import { get, post, put, del } from './client';
//links.js
export function listLinks() {
    return get('/api/links');
}
export function getLink(id) {
    return get(`/api/links/${id}`);
}
export function createLink(payload) {
    return post('/api/links', toBackendPayload(payload));
}
export function updateLink(id, payload) {
    return put(`/api/links/${id}`, toBackendPayload(payload));
}
export function deleteLink(id) {
    return del(`/api/links/${id}`);
}

function toBackendPayload({
    deviceId,
    requisiteId,
    minUsdt,
    maxUsdt,
    txPerDay,
    txPerMonth,
    txTotal,
    amountPerDay,
    amountPerMonth,
    amountTotal,
    concurrentLimit,
    minutesBetween,
    isActive = true,
}) {
    const toInt = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    const toNum = (v) => {
        const n = Number(typeof v === 'string' ? v.replace(',', '.').trim() : v);
        return Number.isFinite(n) ? n : null;
    };

    // Имена ключей — ровно как в CreateLinkRequest на бэке
    return {
        DeviceId: toInt(deviceId),
        RequisiteId: toInt(requisiteId),

        MinAmountUsdt: toNum(minUsdt),
        MaxAmountUsdt: toNum(maxUsdt),

        DailyTxCountLimit: toInt(txPerDay),
        MonthlyTxCountLimit: toInt(txPerMonth),
        TotalTxCountLimit: toInt(txTotal),

        DailyAmountLimitUsdt: toNum(amountPerDay),
        MonthlyAmountLimitUsdt: toNum(amountPerMonth),
        TotalAmountLimitUsdt: toNum(amountTotal),

        MaxConcurrentTransactions: toInt(concurrentLimit),
        MinMinutesBetweenTransactions: toInt(minutesBetween),

        IsActive: !!isActive,
    };
}


function numberOrNull(v) {
    const n = typeof v === 'string' ? v.replace(',', '.').trim() : v;
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : null;
}

const API = 'https://localhost:5132/api';

function qs(obj = {}) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}

export async function searchLinks({ login, activeOnly = true, take = 200 } = {}) {
    const res = await fetch(`${API}/links/search${qs({ login, activeOnly, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить связки');
    return res.json();
}

export async function generateTransactions(linkIds, count) {
    const res = await fetch(`${API}/payin/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds, count }),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось запустить генерацию');
    }
    return res.json(); 
}
