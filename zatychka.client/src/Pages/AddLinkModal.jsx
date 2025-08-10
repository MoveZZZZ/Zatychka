// src/Pages/AddLinkModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './AddLinkModal.css';

import { getDevices } from '../api/devices';
import { listOwners } from '../api/owners';
import { createLink } from '../api/links';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
const humanType = (t) => {
    switch (t) {
        case 'Card': return 'Карта';
        case 'Phone': return 'Телефон';
        case 'Email': return 'Email';
        default: return t;
    }
};

export default function AddLinkModal({ isOpen, onClose, onCreated }) {
    if (!isOpen) return null;
    const toast = useToast();
    const [devices, setDevices] = useState([]);
    const [owners, setOwners] = useState([]); // [{id, lastName, firstName, middleName, bankName, requisites:[{id,type,value}]}]

    const [deviceId, setDeviceId] = useState('');
    const [requisiteId, setRequisiteId] = useState('');

    const [formValues, setFormValues] = useState({
        minAmount: '',
        maxAmount: '',
        perDay: '',
        perMonth: '',
        allTime: '',
        receiveDay: '',
        receiveMonth: '',
        receiveAll: '',
        maxSimultaneous: '',
        minutesBetween: '',
    });

    const [hasChanged, setHasChanged] = useState({
        minAmount: false,
        maxAmount: false,
        perDay: false,
        perMonth: false,
        allTime: false,
        receiveDay: false,
        receiveMonth: false,
        receiveAll: false,
        maxSimultaneous: false,
        minutesBetween: false,
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    const [fieldErrs, setFieldErrs] = useState({});

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
            } catch (e) {
                if (!cancelled) setErr('Не удалось загрузить устройства/реквизиты');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

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

    const handleNumberChange = (field) => (e) => {
        const raw = e.target.value;
        const normalized = raw.replace(',', '.');
        if (normalized === '' || /^-?\d*\.?\d*$/.test(normalized)) {
            setFormValues((prev) => ({ ...prev, [field]: normalized }));
        }
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
            deviceId: Number(deviceId),
            requisiteId: Number(requisiteId),

            minUsdt: formValues.minAmount,
            maxUsdt: formValues.maxAmount,

            txPerDay: formValues.perDay,
            txPerMonth: formValues.perMonth,
            txTotal: formValues.allTime,

            amountPerDay: formValues.receiveDay,
            amountPerMonth: formValues.receiveMonth,
            amountTotal: formValues.receiveAll,

            concurrentLimit: formValues.maxSimultaneous,
            minutesBetween: formValues.minutesBetween,
        };

        try {
            setSubmitting(true);
            const created = await createLink(payload); 
            onCreated?.(created);
            toast.success('Связка создана');
            onClose();
        } catch (e) {
            const msg = e?.message || 'Не удалось создать связку';
            setErr(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Добавить новую связку</h2>

                {loading ? (
                    <Spinner center label="Загрузка…" size={30} />
                ) : (
                    <>
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
                                <input type="number" min="0" value={formValues.minAmount} onChange={handleNumberChange('minAmount')} />
                            </div>
                            <div className="input-group">
                                <label>Макс. сумма (USDT)</label>
                                <input type="number" min="0" value={formValues.maxAmount} onChange={handleNumberChange('maxAmount')} />
                            </div>
                        </div>

                        <h3 className="section-title">Количество транзакций</h3>
                        <div className="form-row">
                            <div className="input-group">
                                <label>В день</label>
                                <input type="number" min="0" value={formValues.perDay} onChange={handleNumberChange('perDay')} />
                            </div>
                            <div className="input-group">
                                <label>В месяц</label>
                                <input type="number" min="0" value={formValues.perMonth} onChange={handleNumberChange('perMonth')} />
                            </div>
                            <div className="input-group">
                                <label>За всё время</label>
                                <input type="number" min="0" value={formValues.allTime} onChange={handleNumberChange('allTime')} />
                            </div>
                        </div>

                        <h3 className="section-title">Лимит суммы приёма</h3>
                        <div className="form-row">
                            <div className="input-group">
                                <label>В сутки (USDT)</label>
                                <input type="number" min="0" value={formValues.receiveDay} onChange={handleNumberChange('receiveDay')} />
                            </div>
                            <div className="input-group">
                                <label>В месяц (USDT)</label>
                                <input type="number" min="0" value={formValues.receiveMonth} onChange={handleNumberChange('receiveMonth')} />
                            </div>
                            <div className="input-group">
                                <label>За всё время (USDT)</label>
                                <input type="number" min="0" value={formValues.receiveAll} onChange={handleNumberChange('receiveAll')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Макс. одновременных транзакций</label>
                            <input
                                type="number"
                                min="0"
                                value={formValues.maxSimultaneous}
                                onChange={handleNumberChange('maxSimultaneous')}
                            />
                        </div>

                        <div className="form-group">
                            <label>Минут между транзакциями</label>
                            <input
                                type="number"
                                min="0"
                                value={formValues.minutesBetween}
                                onChange={handleNumberChange('minutesBetween')}
                            />
                        </div>

                        {err && <div className="error-text" style={{ marginTop: 8 }}>{err}</div>}

                        <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Добавляем…' : 'Добавить'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
