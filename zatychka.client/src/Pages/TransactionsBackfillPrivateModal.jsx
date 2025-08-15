// src/Pages/TransactionsBackfillPrivateModal.jsx
import React, { useEffect, useState } from 'react';
import './TransactionsBackfillModal.css';
import { lookupDevices, lookupRequisites, lookupUsers } from '../api/payin';
import { backfillByMonthPrivate } from '../api/payin';
import { useToast } from '../context/ToastContext';

const now = new Date();
const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const toMonthValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function TransactionsBackfillPrivateModal({ open, onClose, onDone }) {
    const toast = useToast();
    const [monthVal, setMonthVal] = useState(toMonthValue(prevMonth));
    const [pairs, setPairs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    // выбор пользователя
    const [uLogin, setULogin] = useState('');
    const [uList, setUList] = useState([]);
    const [uId, setUId] = useState('');

    // девайсы/реквизиты
    const [devLogin, setDevLogin] = useState('');
    const [rqLogin, setRqLogin] = useState('');
    const [devList, setDevList] = useState([]);
    const [rqList, setRqList] = useState([]);
    const [deviceId, setDeviceId] = useState('');
    const [requisiteId, setRequisiteId] = useState('');

    // лимиты
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [dailyLimit, setDailyLimit] = useState('');
    const [monthlyLimit, setMonthlyLimit] = useState('');

    useEffect(() => {
        if (!open) {
            setPairs([]);
            setErr('');
            setULogin(''); setUList([]); setUId('');
            setDevLogin(''); setRqLogin('');
            setDevList([]); setRqList([]);
            setDeviceId(''); setRequisiteId('');
            setMinAmount(''); setMaxAmount('');
            setDailyLimit(''); setMonthlyLimit('');
        }
    }, [open]);

    if (!open) return null;

    async function searchUsers() {
        try { setUList(await lookupUsers(uLogin || '', 50)); }
        catch (e) { setErr(e?.message || 'Не удалось получить пользователей'); }
    }
    async function searchDevices() {
        try { setDevList(await lookupDevices(devLogin || '', 50)); }
        catch (e) { setErr(e?.message || 'Не удалось получить устройства'); }
    }
    async function searchRequisites() {
        try { setRqList(await lookupRequisites(rqLogin || '', 50)); }
        catch (e) { setErr(e?.message || 'Не удалось получить реквизиты'); }
    }

    function addPair() {
        const userId = Number(uId || 0);
        const dId = Number(deviceId || 0);
        const rId = Number(requisiteId || 0);
        const min = Number(minAmount);
        const max = Number(maxAmount);
        const dayL = Number(dailyLimit);
        const monL = Number(monthlyLimit);

        if (!userId) { setErr('Выберите пользователя'); return; }
        if (!dId || !rId) { setErr('Выберите устройство и реквизит'); return; }
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min || min < 0) { setErr('Неверные суммы'); return; }
        if (!Number.isInteger(dayL) || !Number.isInteger(monL) || dayL < 0 || monL < 0) { setErr('Неверные лимиты'); return; }

        const uLabel = uList.find(x => x.id === userId)?.login || `user#${userId}`;
        const dLabel = devList.find(x => x.id === dId)?.name || `dev#${dId}`;
        const rLabel = rqList.find(x => x.id === rId)?.display || `req#${rId}`;

        setPairs(arr => [...arr, {
            id: `${userId}:${dId}:${rId}:${Date.now()}`,
            userId,
            userLabel: uLabel,
            deviceId: dId,
            deviceLabel: dLabel,
            requisiteId: rId,
            requisiteLabel: rLabel,
            min, max, daily: dayL, monthly: monL
        }]);

        setDeviceId(''); setRequisiteId('');
        setMinAmount(''); setMaxAmount('');
        setDailyLimit(''); setMonthlyLimit('');
    }

    function updatePair(id, field, value) {
        setPairs(arr => arr.map(p => {
            if (p.id !== id) return p;
            const updated = { ...p, [field]: Number(value) };
            if (field === 'min' && updated.max < updated.min) updated.max = updated.min;
            if (field === 'max' && updated.max < updated.min) updated.min = updated.max;
            return updated;
        }));
    }
    function removePair(id) { setPairs(arr => arr.filter(p => p.id !== id)); }

    async function run() {
        try {
            if (pairs.length === 0) { toast.info('Добавьте хотя бы одну пару'); return; }
            const [yStr, mStr] = monthVal.split('-');
            const year = Number(yStr), month = Number(mStr);
            if (!year || !month) { toast.error('Выберите месяц'); return; }

            setLoading(true);
            setErr('');

            const payload = {
                year,
                month,
                pairs: pairs.map(p => ({
                    userId: p.userId,
                    deviceId: p.deviceId,
                    requisiteId: p.requisiteId,
                    minAmountUsdt: p.min,
                    maxAmountUsdt: p.max,
                    dailyLimit: p.daily,
                    monthlyLimit: p.monthly
                }))
            };
            const res = await backfillByMonthPrivate(payload);
            toast.success(`Создано записей: ${res.created}`);
            onDone?.(res);
        } catch (e) {
            setErr(e?.message || 'Не удалось сгенерировать');
            toast.error(e?.message || 'Ошибка генерации');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="tbm-overlay" onClick={onClose}>
            <div className="tbm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tbm-head">
                    <h3>Генерация за месяц (приват)</h3>
                    <button className="tbm-close" onClick={onClose}>×</button>
                </div>

                <div className="tbm-row">
                    <label>Месяц</label>
                    <input type="month" value={monthVal} onChange={e => setMonthVal(e.target.value)} />
                </div>

                <div className="tbm-row group">
                    <div className="tbm-col">
                        <label>Пользователь (по логину)</label>
                        <div className="inline">
                            <input className="tbm-input" placeholder="Логин" value={uLogin} onChange={e => setULogin(e.target.value)} />
                            <button className="tbm-btn" onClick={searchUsers}>Найти</button>
                        </div>
                        <select className="tbm-select" value={uId} onChange={e => setUId(Number(e.target.value))}>
                            <option value="">— Выберите пользователя —</option>
                            {uList.map(u => <option key={u.id} value={u.id}>{u.login} (id {u.id})</option>)}
                        </select>
                    </div>

                    <div className="tbm-col">
                        <label>Поиск устройств (по логину владельца)</label>
                        <div className="inline">
                            <input className="tbm-input" placeholder="Логин устройства" value={devLogin} onChange={e => setDevLogin(e.target.value)} />
                            <button className="tbm-btn" onClick={searchDevices}>Найти</button>
                        </div>
                        <select className="tbm-select" value={deviceId} onChange={e => setDeviceId(Number(e.target.value))}>
                            <option value="">— Выберите устройство —</option>
                            {devList.map(d => <option key={d.id} value={d.id}>{d.ownerLogin} — {d.name}</option>)}
                        </select>
                    </div>

                    <div className="tbm-col">
                        <label>Поиск реквизитов (по логину владельца)</label>
                        <div className="inline">
                            <input className="tbm-input" placeholder="Логин реквизита" value={rqLogin} onChange={e => setRqLogin(e.target.value)} />
                            <button className="tbm-btn" onClick={searchRequisites}>Найти</button>
                        </div>
                        <select className="tbm-select" value={requisiteId} onChange={e => setRequisiteId(Number(e.target.value))}>
                            <option value="">— Выберите реквизит —</option>
                            {rqList.map(r => <option key={r.id} value={r.id}>{r.ownerLogin} — {r.display}</option>)}
                        </select>
                    </div>
                </div>

                <div className="tbm-row group">
                    <div className="tbm-col sm">
                        <label>Мин. сумма (USDT)</label>
                        <input className="tbm-input" type="number" min="0" step="0.01" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
                    </div>
                    <div className="tbm-col sm">
                        <label>Макс. сумма (USDT)</label>
                        <input className="tbm-input" type="number" min="0" step="0.01" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
                    </div>
                    <div className="tbm-col sm">
                        <label>Лимит в день</label>
                        <input className="tbm-input" type="number" min="0" step="1" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
                    </div>
                    <div className="tbm-col sm">
                        <label>Лимит в месяц</label>
                        <input className="tbm-input" type="number" min="0" step="1" value={monthlyLimit} onChange={e => setMonthlyLimit(e.target.value)} />
                    </div>
                    <div className="tbm-col sm align-end">
                        <button className="tbm-btn primary" onClick={addPair}>Добавить пару</button>
                    </div>
                </div>

                {err && <div className="tbm-error">{err}</div>}

                <div className="tbm-pairs">
                    {pairs.length === 0 ? (
                        <div className="tbm-empty">Пары пока не добавлены</div>
                    ) : (
                        <table className="tbm-table">
                            <thead>
                                <tr>
                                    <th>Пользователь</th>
                                    <th>Устройство</th>
                                    <th>Реквизит</th>
                                    <th>Мин. сумма</th>
                                    <th>Макс. сумма</th>
                                    <th>Лимит/день</th>
                                    <th>Лимит/месяц</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pairs.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.userLabel}</td>
                                        <td>{p.deviceLabel}</td>
                                        <td>{p.requisiteLabel}</td>
                                        <td><input className="tbm-input table-input" type="number" min="0" step="0.01" value={p.min} onChange={e => updatePair(p.id, 'min', e.target.value)} /></td>
                                        <td><input className="tbm-input table-input" type="number" min="0" step="0.01" value={p.max} onChange={e => updatePair(p.id, 'max', e.target.value)} /></td>
                                        <td><input className="tbm-input table-input" type="number" min="0" step="1" value={p.daily} onChange={e => updatePair(p.id, 'daily', e.target.value)} /></td>
                                        <td><input className="tbm-input table-input" type="number" min="0" step="1" value={p.monthly} onChange={e => updatePair(p.id, 'monthly', e.target.value)} /></td>
                                        <td><button className="tbm-remove" onClick={() => removePair(p.id)}>Удалить</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="tbm-actions">
                    <button className="tbm-btn ghost" onClick={onClose}>Отмена</button>
                    <button className="tbm-btn primary" onClick={run} disabled={loading}>
                        {loading ? 'Генерация…' : 'Сгенерировать'}
                    </button>
                </div>
            </div>
        </div>
    );
}
