const API = 'https://localhost:5132/api';

//payin.js

export async function createPayinTransaction(body) {
    const url = `${API}/payin/transactions/public`;
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать транзакцию');
    }
    return res.json();
}


// LOOKUP по ЛОГИНУ
export async function lookupRequisites(login, take = 20) {
    const res = await fetch(`${API}/payin/lookup/requisites${qs({ login, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить реквизиты');
    return res.json();
}

export async function lookupDevices(login, take = 20) {
    const res = await fetch(`${API}/payin/lookup/devices${qs({ login, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось получить устройства');
    return res.json();
}

export async function backfillByMonth(body) {
    // body = {
    //   year, month, maxTotalCount?,
    //   pairs: [{ deviceId, requisiteId, minAmountUsdt, maxAmountUsdt, dailyLimit, monthlyLimit }, ...]
    // }
    const res = await fetch(`${API}/payin/generate/backfill-month`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось сгенерировать за месяц');
    }
    return res.json(); // { created, byPair: { "dev:req": n } }
}



function qs(obj = {}) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        p.append(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
}

// ===== список
export async function fetchPayinTransactions(scope = 'public', { status, id, page = 1, pageSize = 50, userId, userLogin } = {}) {
    const url = `${API}/payin/transactions/${scope}${qs({ status: Array.isArray(status) ? status.join(',') : status, id, page, pageSize, userId, userLogin })}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось загрузить транзакции');
    return res.json();
}

// ===== создание
export async function createPayinTransactionPublic(body) {
    const res = await fetch(`${API}/payin/transactions/public`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать');
    }
    return res.json();
}

export async function createPayinTransactionPrivate(body /* { userId, date, status, deviceId?, requisiteId?, dealAmount, incomeAmount } */) {
    const res = await fetch(`${API}/payin/transactions/private`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось создать');
    }
    return res.json();
}

// ===== удаление
export async function deletePayinTransaction(scope = 'public', id) {
    const res = await fetch(`${API}/payin/transactions/${scope}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Не удалось удалить');
    return true;
}

// ===== генерация по связкам
export async function generateTransactionsByLinks(scope = 'public', linkIds, count = 100) {
    const path = scope === 'private' ? 'private' : '';
    const url = `${API}/payin/generate${path ? '/' + path : ''}`;
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds, count }),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось сгенерировать');
    }
    return res.json();
}

// ===== backfill за месяц (private)
export async function backfillByMonthPrivate(body /* {year, month, maxTotalCount?, pairs:[{userId, deviceId, requisiteId, minAmountUsdt, maxAmountUsdt, dailyLimit, monthlyLimit}]} */) {
    const res = await fetch(`${API}/payin/generate/backfill-month-private`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Не удалось сгенерировать (private)');
    }
    return res.json();
}

// ===== lookup пользователей по логину (для приватного создания/бэкоффа)
export async function lookupUsers(login, take = 20) {
    const res = await fetch(`${API}/users/lookup${qs({ login, take })}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Не удалось найти пользователей');
    return res.json(); // [{id, login, email?}]
}

export async function generateExactSumPublic(body) {
    const res = await fetch(`${API}/payin/generate/exact-sum/public`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Ошибка генерации (public)`);
    return res.json();
}


export async function generateExactSumPrivate(body) {
    const res = await fetch(`${API}/payin/generate/exact-sum/private`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Ошибка генерации (private)`);
    return res.json();
}