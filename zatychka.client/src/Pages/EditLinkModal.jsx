import React, { useEffect, useMemo, useState } from 'react';
import './AddLinkModal.css'; 
import { getDevices } from '../api/devices';
import { listOwners } from '../api/owners';
import Spinner from '../components/Spinner';
function pick(obj, ...keys) {
    for (const k of keys) {
        if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
    }
    return undefined;
}

function nums(link) {
    return {
        min: pick(link, 'minUsdt', 'minAmountUsdt', 'minAmountUSDT'),
        max: pick(link, 'maxUsdt', 'maxAmountUsdt', 'maxAmountUSDT'),

        txDay: pick(link, 'txPerDay', 'dailyTxLimit', 'dailyTxCountLimit'),
        txMonth: pick(link, 'txPerMonth', 'monthlyTxLimit', 'monthlyTxCountLimit'),
        txAll: pick(link, 'txTotal', 'totalTxLimit', 'totalTxCountLimit'),

        amtDay: pick(link, 'amountPerDay', 'dailyAmountLimit', 'dailyAmountLimitUsdt', 'dailyAmountLimitUSDT'),
        amtMonth: pick(link, 'amountPerMonth', 'monthlyAmountLimit', 'monthlyAmountLimitUsdt', 'monthlyAmountLimitUSDT'),
        amtAll: pick(link, 'amountTotal', 'totalAmountLimit', 'totalAmountLimitUsdt', 'totalAmountLimitUSDT'),

        conc: pick(link, 'concurrentLimit', 'maxConcurrent', 'maxConcurrentTransactions'),
        gap: pick(link, 'minutesBetween', 'minutesBetweenTx', 'minMinutesBetweenTransactions'),
    };
}

function getDeviceIdFromBundle(b) {
    return pick(b, 'deviceId') ?? b?.device?.id ?? null;
}
function getRequisiteIdFromBundle(b) {
    return pick(b, 'requisiteId') ?? b?.requisite?.id ?? b?.requisiteInfo?.id ?? null;
}

const humanType = (t) => {
    switch (t) {
        case 'Card': return 'Карта';
        case 'Phone': return 'Телефон';
        case 'Email': return 'Email';
        default: return t || 'Реквизит';
    }
};

export default function EditLinkModal({ bundle, onClose, onSave }) {
    if (!bundle) return null;

    // списки для селектов
    const [devices, setDevices] = useState([]);
    const [owners, setOwners] = useState([]);

    // локальное состояние формы; храним строки, чтобы позволять пустые значения
    const v = nums(bundle);
    const [deviceId, setDeviceId] = useState(getDeviceIdFromBundle(bundle) ?? '');
    const [requisiteId, setRequisiteId] = useState(getRequisiteIdFromBundle(bundle) ?? '');

    const [min, setMin] = useState(v.min ?? '');
    const [max, setMax] = useState(v.max ?? '');

    const [txDay, setTxDay] = useState(v.txDay ?? '');
    const [txMonth, setTxMonth] = useState(v.txMonth ?? '');
    const [txAll, setTxAll] = useState(v.txAll ?? '');

    const [amtDay, setAmtDay] = useState(v.amtDay ?? '');
    const [amtMonth, setAmtMonth] = useState(v.amtMonth ?? '');
    const [amtAll, setAmtAll] = useState(v.amtAll ?? '');

    const [conc, setConc] = useState(v.conc ?? '');
    const [gap, setGap] = useState(v.gap ?? '');

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [fieldErrs, setFieldErrs] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [devs, own] = await Promise.all([getDevices(), listOwners()]);
                if (!cancelled) {
                    setDevices(Array.isArray(devs) ? devs : []);
                    setOwners(Array.isArray(own) ? own : []);
                }
            } catch {
                if (!cancelled) setErr('Не удалось загрузить устройства/реквизиты');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // плоский список реквизитов для селекта
    const allRequisites = useMemo(() => {
        const out = [];
        owners.forEach(o => {
            (o.requisites || []).forEach(r => {
                out.push({
                    id: r.id,
                    label: `${humanType(r.type)} • ${r.value}`,
                    ownerLabel: `${o.lastName} ${o.firstName?.[0] || ''}.${o.middleName ? ' ' + o.middleName[0] + '.' : ''}`.trim(),
                });
            });
        });
        return out;
    }, [owners]);

    const toNum = (x) => {
        const s = typeof x === 'string' ? x.replace(',', '.').trim() : x;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    };
    const toInt = (x) => {
        const n = Number(x);
        return Number.isFinite(n) ? n : null;
    };

    function validate() {
        const fe = {};
        if (!deviceId) fe.deviceId = 'Укажите устройство';
        if (!requisiteId) fe.requisiteId = 'Укажите реквизит';
        setFieldErrs(fe);
        return Object.keys(fe).length === 0;
    }

    async function handleSubmit() {
        setErr('');
        if (!validate()) return;

        const payload = {
            id: bundle.id,
            deviceId: toInt(deviceId),
            requisiteId: toInt(requisiteId),
            minUsdt: toNum(min),
            maxUsdt: toNum(max),
            txPerDay: toInt(txDay),
            txPerMonth: toInt(txMonth),
            txTotal: toInt(txAll),
            amountPerDay: toNum(amtDay),
            amountPerMonth: toNum(amtMonth),
            amountTotal: toNum(amtAll),
            concurrentLimit: toInt(conc),
            minutesBetween: toInt(gap),
        };

        try {
            setSubmitting(true);
            const saved = await onSave?.(payload); // ← ждём родителя
            if (saved) onClose?.();                // ← закрываемся после обновления родителя
        } catch (e) {
            setErr(e?.message || 'Не удалось сохранить изменения');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Редактировать связку</h2>

                {loading ? (
                    <Spinner center label="Загрузка…" size={30} />
                ) : (
                    <>
                        {/* Устройство */}
                        <div className={`form-group ${fieldErrs.deviceId ? 'error' : ''}`}>
                            <select
                                className={`form-select ${fieldErrs.deviceId ? 'error-border' : ''}`}
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                            >
                                <option value="" disabled>Выберите устройство</option>
                                {devices.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name || `Устройство #${d.id}`}
                                    </option>
                                ))}
                            </select>
                            {fieldErrs.deviceId && <p className="error-text">{fieldErrs.deviceId}</p>}
                        </div>

                        {/* Реквизит */}
                        <div className={`form-group ${fieldErrs.requisiteId ? 'error' : ''}`}>
                            <select
                                className={`form-select ${fieldErrs.requisiteId ? 'error-border' : ''}`}
                                value={requisiteId}
                                onChange={(e) => setRequisiteId(e.target.value)}
                            >
                                <option value="" disabled>Выберите реквизит</option>
                                {allRequisites.length === 0 && <option disabled>Реквизитов нет</option>}
                                {allRequisites.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.label} — {r.ownerLabel}
                                    </option>
                                ))}
                            </select>
                            {fieldErrs.requisiteId && <p className="error-text">{fieldErrs.requisiteId}</p>}
                        </div>

                        <h3 className="section-title">Лимит суммы</h3>
                        <div className="form-row-second">
                            <div className="input-group">
                                <label>Мин. сумма (USDT)</label>
                                <input type="number" min="0" value={min ?? ''} onChange={(e) => setMin(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Макс. сумма (USDT)</label>
                                <input type="number" min="0" value={max ?? ''} onChange={(e) => setMax(e.target.value)} />
                            </div>
                        </div>

                        <h3 className="section-title">Количество транзакций</h3>
                        <div className="form-row">
                            <div className="input-group">
                                <label>В день</label>
                                <input type="number" min="0" value={txDay ?? ''} onChange={(e) => setTxDay(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>В месяц</label>
                                <input type="number" min="0" value={txMonth ?? ''} onChange={(e) => setTxMonth(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>За всё время</label>
                                <input type="number" min="0" value={txAll ?? ''} onChange={(e) => setTxAll(e.target.value)} />
                            </div>
                        </div>

                        <h3 className="section-title">Лимит суммы приёма</h3>
                        <div className="form-row">
                            <div className="input-group">
                                <label>В сутки (USDT)</label>
                                <input type="number" min="0" value={amtDay ?? ''} onChange={(e) => setAmtDay(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>В месяц (USDT)</label>
                                <input type="number" min="0" value={amtMonth ?? ''} onChange={(e) => setAmtMonth(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>За всё время (USDT)</label>
                                <input type="number" min="0" value={amtAll ?? ''} onChange={(e) => setAmtAll(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Макс. одновременных транзакций</label>
                            <input
                                type="number"
                                min="0"
                                value={conc ?? ''}
                                onChange={(e) => setConc(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Минут между транзакциями</label>
                            <input
                                type="number"
                                min="0"
                                value={gap ?? ''}
                                onChange={(e) => setGap(e.target.value)}
                            />
                        </div>

                        {err && <div className="error-text" style={{ marginTop: 8 }}>{err}</div>}

                            <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Сохраняем…' : 'Сохранить'}
                            </button>
                    </>
                )}
            </div>
        </div>
    );
}
