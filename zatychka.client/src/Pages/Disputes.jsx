import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Disputes.css';
import Breadcrumbs from '../components/Breadcrumbs';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';

import Spinner from '../components/Spinner';
import { fetchDisputes, createDispute, deleteDispute } from '../api/disputes';
import { lookupRequisites, lookupDevices } from '../api/payin';

const STATUS_OPTIONS = [
    { value: 'InProgress', label: 'В процессе' },
    { value: 'Completed', label: 'Завершено' },
    { value: 'Cancelled', label: 'Отменено' },
    { value: 'Frozen', label: 'Заморожено' },
];

function fmtHMS(total) {
    total = Math.max(0, Number(total) || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function Disputes() {
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const canEdit = isAdmin && editMode;

    // фильтры
    const [selectedStatuses, setSelectedStatuses] = useState([]); // по умолчанию активные
    const toggleStatus = (val) => {
        setSelectedStatuses(prev =>
            prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
        );
    };

    // данные
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // локальный тик таймера
    const tickRef = useRef(null);
    useEffect(() => {
        tickRef.current = setInterval(() => {
            setRows(prev => prev.map(r => {
                if (r.status === 'InProgress' && r.remainingSeconds > 0) {
                    return { ...r, remainingSeconds: r.remainingSeconds - 1 };
                }
                return r;
            }));
        }, 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    // периодический рефреш, чтобы база лениво закрывала просроченные
    useEffect(() => {
        const reload = async () => {
            try {
                setErr('');
                setLoading(true);
                const list = await fetchDisputes({ statuses: selectedStatuses });
                setRows(list);
            } catch (e) {
                setErr(e?.message || 'Не удалось загрузить споры');
            } finally {
                setLoading(false);
            }
        };
        reload();
        const id = setInterval(reload, 30000); // каждые 30 сек
        return () => clearInterval(id);
    }, [selectedStatuses]);

    // --- форма добавления (только админ)
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);

    const [transactionId, setTransactionId] = useState('');
    const [status, setStatus] = useState('InProgress');

    const [rqLogin, setRqLogin] = useState('');
    const [rqList, setRqList] = useState([]);
    const [rqId, setRqId] = useState('');

    const [devLogin, setDevLogin] = useState('');
    const [devList, setDevList] = useState([]);
    const [devId, setDevId] = useState('');

    const [amount, setAmount] = useState('');
    const [filesText, setFilesText] = useState(''); // через запятую

    const [hh, setHh] = useState('0');
    const [mm, setMm] = useState('30');
    const [ss, setSs] = useState('0');

    async function searchRq() {
        try {
            const list = await lookupRequisites(rqLogin, 20);
            setRqList(list);
        } catch (e) { setErr(e?.message || 'Не удалось получить реквизиты'); }
    }
    async function searchDev() {
        try {
            const list = await lookupDevices(devLogin, 20);
            setDevList(list);
        } catch (e) { setErr(e?.message || 'Не удалось получить устройства'); }
    }

    async function addDispute() {
        try {
            setSaving(true);
            setErr('');

            if (!amount) throw new Error('Укажите сумму сделки');
            const body = {
                transactionId: transactionId ? Number(transactionId) : null,
                status,
                requisiteId: rqId ? Number(rqId) : null,
                deviceId: devId ? Number(devId) : null,
                dealAmount: Number(amount),
                files: filesText
                    ? filesText.split(',').map(x => x.trim()).filter(Boolean)
                    : null,
                hours: Number(hh || 0),
                minutes: Number(mm || 0),
                seconds: Number(ss || 0),
            };

            await createDispute(body);
            setShowAdd(false);

            // очистим форму
            setTransactionId(''); setStatus('InProgress');
            setRqLogin(''); setRqList([]); setRqId('');
            setDevLogin(''); setDevList([]); setDevId('');
            setAmount(''); setFilesText('');
            setHh('0'); setMm('30'); setSs('0');

            const list = await fetchDisputes({ statuses: selectedStatuses });
            setRows(list);
        } catch (e) {
            setErr(e?.message || 'Не удалось создать спор');
        } finally {
            setSaving(false);
        }
    }

    async function removeRow(id) {
        if (!window.confirm('Удалить спор?')) return;
        try {
            await deleteDispute(id);
            setRows(r => r.filter(x => x.id !== id));
        } catch (e) {
            setErr(e?.message || 'Не удалось удалить спор');
        }
    }

    return (
        <div className="disputes-page">
            <Breadcrumbs />
            <h2>Споры</h2>

            {/* Фильтр статусов (чипсы) */}
            <div className="filters-card">
                <div className="filters-title">Типы</div>
            <div className="chips">
                {STATUS_OPTIONS.map(o => (
                    <span
                        key={o.value}
                        className={`chip ${selectedStatuses.includes(o.value) ? 'active' : ''}`}
                        onClick={() => toggleStatus(o.value)}
                    >
                        {o.label}
                    </span>
                ))}
                </div>
            </div>


            {/* Кнопка «добавить» для админа */}
            {canEdit && (
                <div style={{ margin: '12px 0' }}>
                    <button className="add-btn" onClick={() => setShowAdd(v => !v)}>
                        {showAdd ? 'Скрыть форму' : 'Добавить спор'}
                    </button>
                </div>
            )}

            {err && <div className="error">{err}</div>}
            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Форма добавления */}
            {showAdd && canEdit && (
                <div className="add-form">
                    <div className="field">
                        <label>ID транзакции (опц.)</label>
                        <input type="number" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Статус</label>
                        <select value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Реквизиты (по нику)</label>
                        <div className="inline">
                            <input type="text" placeholder="login" value={rqLogin} onChange={e => setRqLogin(e.target.value)} />
                            <button type="button" onClick={searchRq}>Найти</button>
                        </div>
                        <select value={rqId} onChange={e => setRqId(e.target.value)}>
                            <option value="">— не выбрано —</option>
                            {rqList.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.ownerLogin ?? r.ownerEmail} — {r.display}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Устройство (по нику)</label>
                        <div className="inline">
                            <input type="text" placeholder="login" value={devLogin} onChange={e => setDevLogin(e.target.value)} />
                            <button type="button" onClick={searchDev}>Найти</button>
                        </div>
                        <select value={devId} onChange={e => setDevId(e.target.value)}>
                            <option value="">— не выбрано —</option>
                            {devList.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.ownerLogin} — {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label>Сумма сделки (USDT)</label>
                        <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>

                    <div className="field wide">
                        <label>Файлы (через запятую)</label>
                        <input type="text" placeholder="https://... , file2.png" value={filesText} onChange={e => setFilesText(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Таймер (ч/м/с)</label>
                        <div className="inline">
                            <input type="number" min="0" value={hh} onChange={e => setHh(e.target.value)} />
                            <span style={{ opacity: .6 }}>ч</span>
                            <input type="number" min="0" value={mm} onChange={e => setMm(e.target.value)} />
                            <span style={{ opacity: .6 }}>м</span>
                            <input type="number" min="0" value={ss} onChange={e => setSs(e.target.value)} />
                            <span style={{ opacity: .6 }}>с</span>
                        </div>
                        <div className="hint" style={{ opacity: .7, fontSize: 12, marginTop: 4 }}>
                            При статусе «Заморожено» время не уходит и показывается как задано.
                        </div>
                    </div>

                    <div className="actions">
                        <button className="submit" onClick={addDispute} disabled={saving}>
                            {saving ? 'Сохраняем…' : 'Добавить'}
                        </button>
                    </div>
                </div>
            )}

            <div className="disputes-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID транзакции</th>
                            <th>Статус</th>
                            <th>Реквизиты</th>
                            <th>Устройство</th>
                            <th>Сумма сделки</th>
                            <th>Файлы</th>
                            <th>Таймер</th>
                            {canEdit && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={canEdit ? 8 : 7} className="no-disputes">
                                    <div className="empty-message-table">Споров пока нет</div>
                                </td>
                            </tr>
                        ) : rows.map(r => (
                            <tr key={r.id}>
                                <td>{r.transactionId ?? '—'}</td>
                                <td>{STATUS_OPTIONS.find(x => x.value === r.status)?.label ?? r.status}</td>
                                <td>{r.requisiteDisplay ?? '—'}</td>
                                <td>{r.deviceName ?? '—'}</td>
                                <td>{Number(r.dealAmount).toFixed(2)} USDT</td>
                                <td>
                                    {r.files?.length
                                        ? r.files.map((f, i) => (
                                            <a key={i} href={f} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>
                                                {f.length > 24 ? f.slice(0, 24) + '…' : f}
                                            </a>
                                        ))
                                        : '—'}
                                </td>
                                <td>{fmtHMS(r.remainingSeconds)}</td>
                                {canEdit && (
                                    <td>
                                        <button className="delete-btn" onClick={() => removeRow(r.id)}>Удалить</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
