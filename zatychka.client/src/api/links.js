
import { get, post, put, del } from './client';

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
