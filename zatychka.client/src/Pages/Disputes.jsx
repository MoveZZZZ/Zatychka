// src/Pages/Disputes.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Disputes.css';
import Breadcrumbs from '../components/Breadcrumbs';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext';

import Spinner from '../components/Spinner';
import { fetchDisputes, createDispute, deleteDispute } from '../api/disputes';
import { lookupRequisites, lookupDevices, lookupUsers } from '../api/payin';

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
    const editable = isAdmin && editMode;

    // ВАЖНО: для админа всегда используем сохранённый scope,
    // даже если панель скрыта. Для обычного юзера — всегда public.
    const { scope, setScope } = useDataScope(); // 'public' | 'private'
    const effectiveScope = isAdmin ? scope : 'public';
    const isPrivate = effectiveScope === 'private';

    // фильтры
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const toggleStatus = (val) => {
        setSelectedStatuses((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );
    };

    // чипсы
    const [chipsCollapsed, setChipsCollapsed] = useState(true);
    const activeCount = selectedStatuses.length;

    // данные
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // тикер таймера
    const tickRef = useRef(null);
    useEffect(() => {
        tickRef.current = setInterval(() => {
            setRows((prev) =>
                prev.map((r) =>
                    r.status === 'InProgress' && r.remainingSeconds > 0
                        ? { ...r, remainingSeconds: r.remainingSeconds - 1 }
                        : r
                )
            );
        }, 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    // загрузка + автообновление
    useEffect(() => {
        let cancelled = false;
        const reload = async () => {
            try {
                setErr('');
                setLoading(true);
                const list = await fetchDisputes(effectiveScope, { statuses: selectedStatuses });
                if (!cancelled) setRows(list);
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить споры');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        reload();
        const id = setInterval(reload, 30000);
        return () => { cancelled = true; clearInterval(id); };
    }, [effectiveScope, selectedStatuses]);

    // форма добавления (только для админа в editMode)
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
    const [filesText, setFilesText] = useState('');

    const [hh, setHh] = useState('0');
    const [mm, setMm] = useState('30');
    const [ss, setSs] = useState('0');

    // выбор пользователя — только при создании private админом
    const [userLogin, setUserLogin] = useState('');
    const [userList, setUserList] = useState([]);
    const [userId, setUserId] = useState('');

    async function searchRq() {
        try { setRqList(await lookupRequisites(rqLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить реквизиты'); }
    }
    async function searchDev() {
        try { setDevList(await lookupDevices(devLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить устройства'); }
    }
    async function searchUsers() {
        try { setUserList(await lookupUsers(userLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось найти пользователей'); }
    }

    async function addDispute() {
        try {
            if (!editable) return;
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
                    ? filesText.split(',').map((x) => x.trim()).filter(Boolean)
                    : null,
                hours: Number(hh || 0),
                minutes: Number(mm || 0),
                seconds: Number(ss || 0),
                ...(isPrivate && userId ? { userId: Number(userId) } : {}),
            };

            await createDispute(effectiveScope, body);
            setShowAdd(false);

            // очистка
            setTransactionId('');
            setStatus('InProgress');
            setRqLogin(''); setRqList([]); setRqId('');
            setDevLogin(''); setDevList([]); setDevId('');
            setAmount(''); setFilesText('');
            setHh('0'); setMm('30'); setSs('0');
            setUserLogin(''); setUserList([]); setUserId('');

            const list = await fetchDisputes(effectiveScope, { statuses: selectedStatuses });
            setRows(list);
        } catch (e) {
            setErr(e?.message || 'Не удалось создать спор');
        } finally {
            setSaving(false);
        }
    }

    async function removeRow(id) {
        if (!editable) return;
        if (!window.confirm('Удалить спор?')) return;
        try {
            await deleteDispute(effectiveScope, id);
            setRows((r) => r.filter((x) => x.id !== id));
        } catch (e) {
            setErr(e?.message || 'Не удалось удалить спор');
        }
    }

    return (
        <div className="transactions-container">
            <Breadcrumbs />

            <div className="head-row">
                <h2 className="page-title">Споры</h2>

                {/* Переключатель области — как в Transactions. Показываем только при editable,
            но выбранный scope сохраняется и используется даже когда панель скрыта. */}
                {editable && (
                    <div className="mode-switch">
                        <label>
                            <input
                                type="radio"
                                name="disputes-scope"
                                value="public"
                                checked={scope === 'public'}
                                onChange={() => setScope('public')}
                                disabled={loading}
                            /> Публичные
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="disputes-scope"
                                value="private"
                                checked={scope === 'private'}
                                onChange={() => setScope('private')}
                                disabled={loading}
                            /> Приватные
                        </label>
                    </div>
                )}
            </div>

            {/* Фильтры статусов */}
            <div className={`filters-card ${chipsCollapsed ? '' : 'open'}`}>
                <button
                    type="button"
                    className="filters-toggle"
                    onClick={() => setChipsCollapsed((v) => !v)}
                    aria-expanded={!chipsCollapsed}
                >
                    <span className="filters-toggle-label">Статусы</span>
                    <span className="filters-summary">
                        {activeCount ? `Выбрано: ${activeCount}` : 'Все'}
                    </span>
                </button>

                <div className="filters-title">Статусы</div>

                <div className="filters-inner">
                    <div className="chips chips-scroll">
                        {STATUS_OPTIONS.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className={`chip ${selectedStatuses.includes(o.value) ? 'active' : ''}`}
                                onClick={() => toggleStatus(o.value)}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Кнопка «добавить» — только для админа в editMode */}
            {editable && (
                <div className="toolbar-row" style={{ marginTop: 8 }}>
                    <button className="add-btn" onClick={() => setShowAdd((v) => !v)}>
                        {showAdd ? 'Скрыть форму' : 'Добавить спор'}
                    </button>
                </div>
            )}

            {err && <div className="error-banner">{err}</div>}
            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Форма добавления */}
            {editable && showAdd && (
                <div className="add-form">
                    {/* Только если создаём private — выбор пользователя */}
                    {isPrivate && (
                        <div className="field wide">
                            <label>Пользователь (по логину)</label>
                            <div className="inline">
                                <input
                                    type="text"
                                    placeholder="login"
                                    value={userLogin}
                                    onChange={(e) => setUserLogin(e.target.value)}
                                />
                                <button type="button" onClick={searchUsers}>Найти</button>
                            </div>
                            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                                <option value="">— я сам —</option>
                                {userList.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.login}{u.email ? ` — ${u.email}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="field">
                        <label>ID транзакции (опц.)</label>
                        <input
                            type="number"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Статус</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Реквизиты (по нику)</label>
                        <div className="inline">
                            <input
                                type="text"
                                placeholder="login"
                                value={rqLogin}
                                onChange={(e) => setRqLogin(e.target.value)}
                            />
                            <button type="button" onClick={searchRq}>Найти</button>
                        </div>
                        <select value={rqId} onChange={(e) => setRqId(e.target.value)}>
                            <option value="">— не выбрано —</option>
                            {rqList.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.ownerLogin ?? r.ownerEmail} — {r.display}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Устройство (по нику)</label>
                        <div className="inline">
                            <input
                                type="text"
                                placeholder="login"
                                value={devLogin}
                                onChange={(e) => setDevLogin(e.target.value)}
                            />
                            <button type="button" onClick={searchDev}>Найти</button>
                        </div>
                        <select value={devId} onChange={(e) => setDevId(e.target.value)}>
                            <option value="">— не выбрано —</option>
                            {devList.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.ownerLogin} — {d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label>Сумма сделки (USDT)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="field wide">
                        <label>Файлы (через запятую)</label>
                        <input
                            type="text"
                            placeholder="https://... , file2.png"
                            value={filesText}
                            onChange={(e) => setFilesText(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Таймер (ч/м/с)</label>
                        <div className="inline">
                            <input type="number" min="0" value={hh} onChange={(e) => setHh(e.target.value)} />
                            <span className="unit">ч</span>
                            <input type="number" min="0" value={mm} onChange={(e) => setMm(e.target.value)} />
                            <span className="unit">м</span>
                            <input type="number" min="0" value={ss} onChange={(e) => setSs(e.target.value)} />
                            <span className="unit">с</span>
                        </div>
                        <div className="hint">
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
                <div className="table-scroll">
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
                                {editable && <th></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={editable ? 8 : 7} className="no-disputes">
                                        <div className="empty-message-table">Споров пока нет</div>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.transactionId ?? '—'}</td>
                                        <td>{STATUS_OPTIONS.find((x) => x.value === r.status)?.label ?? r.status}</td>
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
                                        {editable && (
                                            <td>
                                                <button className="delete-btn" onClick={() => removeRow(r.id)}>Удалить</button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
