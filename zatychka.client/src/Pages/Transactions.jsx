import React, { useEffect, useMemo, useState } from 'react';
import './Transactions.css';
import Breadcrumbs from '../components/Breadcrumbs';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';
import {
    fetchPayinTransactions,
    createPayinTransaction,
    deletePayinTransaction,
    lookupRequisites,
    lookupDevices,
} from '../api/payin';
import Spinner from '../components/Spinner';
const STATUS_OPTIONS = ['Создана', 'В процессе', 'Выполнена', 'Заморожена'];

export default function Transactions() {
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const canEdit = isAdmin && editMode;

    // фильтры
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [statusSearch, setStatusSearch] = useState('');
    const [transactionSearch, setTransactionSearch] = useState('');

    // данные
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // добавление
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [newStatus, setNewStatus] = useState(STATUS_OPTIONS[0]);

    const [rqLogin, setRqLogin] = useState('');
    const [rqList, setRqList] = useState([]);
    const [rqId, setRqId] = useState(null);

    const [devLogin, setDevLogin] = useState('');
    const [devList, setDevList] = useState([]);
    const [devId, setDevId] = useState(null);

    const [dealAmount, setDealAmount] = useState('');
    const [incomeAmount, setIncomeAmount] = useState('');

    // статусы в выпадашке
    const filteredStatuses = useMemo(
        () => STATUS_OPTIONS.filter(s => s.toLowerCase().includes(statusSearch.toLowerCase())),
        [statusSearch]
    );

    const toggleStatus = (s) => {
        setSelectedStatuses(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    async function reload() {
        const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
            ? Number(transactionSearch.trim())
            : undefined;
        const status = selectedStatuses.length === 1 ? selectedStatuses[0] : undefined;
        const list = await fetchPayinTransactions({ status, id });
        setItems(list);
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr('');
                const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
                    ? Number(transactionSearch.trim())
                    : undefined;
                const status = selectedStatuses.length === 1 ? selectedStatuses[0] : undefined;
                const list = await fetchPayinTransactions({ status, id });
                if (!cancelled) setItems(list);
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить транзакции');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedStatuses, transactionSearch]);

    // lookup (по ЛОГИНУ)
    async function searchRequisites() {
        try {
            const list = await lookupRequisites(rqLogin, 20);
            setRqList(list);
        } catch (e) {
            setErr(e?.message || 'Не удалось получить реквизиты');
        }
    }
    async function searchDevices() {
        try {
            const list = await lookupDevices(devLogin, 20);
            setDevList(list);
        } catch (e) {
            setErr(e?.message || 'Не удалось получить устройства');
        }
    }

    async function addTx() {
        try {
            setSaving(true);
            setErr('');
            if (!dealAmount || !incomeAmount) throw new Error('Укажите суммы');

            const body = {
                date: new Date(newDate).toISOString(),
                status: newStatus,
                requisiteId: rqId ? Number(rqId) : null,
                deviceId: devId ? Number(devId) : null,
                dealAmount: Number(dealAmount),
                incomeAmount: Number(incomeAmount),
            };

            await createPayinTransaction(body);
            setAdding(false);

            // очистка
            setNewDate(new Date().toISOString().slice(0, 10));
            setNewStatus(STATUS_OPTIONS[0]);
            setRqLogin(''); setRqList([]); setRqId(null);
            setDevLogin(''); setDevList([]); setDevId(null);
            setDealAmount(''); setIncomeAmount('');

            await reload();
        } catch (e) {
            setErr(e?.message || 'Не удалось создать транзакцию');
        } finally {
            setSaving(false);
        }
    }

    async function removeTx(id) {
        if (!canEdit) return;
        if (!window.confirm(`Удалить транзакцию #${id}?`)) return;
        try {
            await deletePayinTransaction(id);
            await reload();
        } catch (e) {
            setErr(e?.message || 'Не удалось удалить транзакцию');
        }
    }

    return (
        <div className="transactions-container">
            <Breadcrumbs />
            <h2 className="page-title">Приём</h2>

            {err && <div className="error">{err}</div>}

            <div className="transactions-filters">
                <div className="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37" /></svg>
                    <input
                        type="text"
                        placeholder="ID транзакции"
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                    />
                </div>

                <div className="status-dropdown-wrapper">
                    <div className="status-dropdown" onClick={() => setDropdownOpen(prev => !prev)}>
                        {selectedStatuses.length > 0 ? `Выбрано ${selectedStatuses.length} статуса` : 'Статус'}
                        <span className="arrow">▼</span>
                    </div>

                    {dropdownOpen && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Поиск статуса…"
                                className="dropdown-search"
                                value={statusSearch}
                                onChange={(e) => setStatusSearch(e.target.value)}
                            />
                            {filteredStatuses.map((status) => (
                                <div key={status} className="dropdown-item" onClick={() => toggleStatus(status)}>
                                    <span>{status}</span>
                                    {selectedStatuses.includes(status) && <span className="checkmark">✔</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {canEdit && (
                    <button className="add-btn" onClick={() => setAdding(v => !v)}>
                        {adding ? 'Скрыть форму' : 'Добавить транзакцию'}
                    </button>
                )}
            </div>

            {adding && canEdit && (
                <div className="add-form">
                    <div className="field">
                        <label>Дата</label>
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Статус</label>
                        <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Реквизиты (по логину владельца)</label>
                        <div className="inline">
                            <input type="text" placeholder="login" value={rqLogin} onChange={e => setRqLogin(e.target.value)} />
                            <button onClick={searchRequisites} type="button">Найти</button>
                        </div>
                        <select value={rqId ?? ''} onChange={e => setRqId(e.target.value || null)}>
                            <option value="">— не выбрано —</option>
                            {rqList.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.ownerLogin} — {r.display}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field wide">
                        <label>Устройство (по логину владельца)</label>
                        <div className="inline">
                            <input type="text" placeholder="login" value={devLogin} onChange={e => setDevLogin(e.target.value)} />
                            <button onClick={searchDevices} type="button">Найти</button>
                        </div>
                        <select value={devId ?? ''} onChange={e => setDevId(e.target.value || null)}>
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
                        <input type="number" min="0" step="0.01" value={dealAmount} onChange={e => setDealAmount(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Сумма поступления (USDT)</label>
                        <input type="number" min="0" step="0.01" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
                    </div>

                    <div className="actions">
                        <button className="submit" onClick={addTx} disabled={saving}>
                            {saving ? 'Сохраняем…' : 'Добавить'}
                        </button>
                    </div>
                </div>
            )}

            <div className="transactions-table">
                <div className="table-header">
                    <span>ID и дата</span>
                    <span>Статус</span>
                    <span>Реквизиты</span>
                    <span>Устройство</span>
                    <span>Сумма сделки</span>
                    <span>Сумма поступления</span>
                    {canEdit && <span />}
                </div>

                {loading ? (
                    <div className="no-transactions"><Spinner center label="Загрузка…" size={30} /></div>
                ) : items.length === 0 ? (
                    <div className="no-transactions"><div className="text">Транзакций пока нет</div></div>
                ) : (
                    items.map(tx => (
                        <div key={tx.id} className="table-row">
                            <span>{tx.id}<br /><small>{new Date(tx.date).toLocaleDateString('ru-RU')}</small></span>
                            <span>{tx.status}</span>
                            <span>{tx.requisiteDisplay ?? (tx.requisiteId ? `ID ${tx.requisiteId}` : '—')}</span>
                            <span>{tx.deviceName ?? (tx.deviceId ? `ID ${tx.deviceId}` : '—')}</span>
                            <span>{tx.dealAmount} USDT</span>
                            <span>{tx.incomeAmount} USDT</span>
                            {canEdit && (
                                <span>
                                    <button className="danger small" onClick={() => removeTx(tx.id)} title="Удалить">✕</button>
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
