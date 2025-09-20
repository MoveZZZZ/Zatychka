// src/Pages/Transactions.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './Transactions.css';
import Breadcrumbs from '../components/Breadcrumbs';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext'; // ← как в Балансе
import TransactionsExactSumModal from './TransactionsExactSumModal';
import {
    fetchPayinTransactions,
    createPayinTransactionPublic,
    createPayinTransactionPrivate,
    deletePayinTransaction,
    lookupRequisites,
    lookupDevices,
    lookupUsers
} from '../api/payin';

import Spinner from '../components/Spinner';
import GenerateByLinksModal from './TransactionsGenerateModal';
import TransactionsBackfillModal from './TransactionsBackfillModal';             // PUBLIC backfill (месяц/день)
import TransactionsBackfillPrivateModal from './TransactionsBackfillPrivateModal'; // PRIVATE backfill (месяц/день)

const STATUS_OPTIONS = ['Создана', 'Выполнена', 'Заморожена'];

export default function Transactions() {
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const editable = isAdmin && editMode;

    // глобальная область данных как в BalancePage
    const { scope, setScope } = useDataScope(); // 'public' | 'private'

    // фильтры
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [statusSearch, setStatusSearch] = useState('');
    const [transactionSearch, setTransactionSearch] = useState('');

    // для админа — смотреть приват по конкретному пользователю
    const [viewUserLogin, setViewUserLogin] = useState('');
    const [viewUserList, setViewUserList] = useState([]);
    const [viewUserId, setViewUserId] = useState('');

    // данные
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 25;
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

    // только для приватного добавления
    const [userLogin, setUserLogin] = useState('');
    const [userList, setUserList] = useState([]);
    const [userId, setUserId] = useState('');

    // модалки генерации
    const [generateOpen, setGenerateOpen] = useState(false);
    const [backfillOpen, setBackfillOpen] = useState(false); // одна кнопка — внутри покажем нужную модалку
    const [exactSumOpen, setExactSumOpen] = useState(false);
    // закрытие выпадашки при клике вне её
    useEffect(() => {
        if (!dropdownOpen) return;
        const onDocClick = () => setDropdownOpen(false);
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [dropdownOpen]);

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
        try {
            setLoading(true);
            setErr('');
            const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
                ? Number(transactionSearch.trim())
                : undefined;

            const params = { id, page: currentPage, pageSize };
            if (selectedStatuses.length > 0) params.status = selectedStatuses;
            if (scope === 'private' && isAdmin && viewUserId) {
                params.userId = Number(viewUserId);
            }

            const response = await fetchPayinTransactions(scope, params);
            const items = response?.items || [];

            // ▲ сортировка по id (поменяй 'desc' на 'asc' при необходимости)
            const sortDir = 'desc'; // 'asc' | 'desc'
            const sorted = items.slice().sort((a, b) => {
                const ad = new Date(a?.date ?? 0).getTime();
                const bd = new Date(b?.date ?? 0).getTime();
                return sortDir === 'asc' ? ad - bd : bd - ad;
            });
            //const sorted = items.slice().sort((a, b) => {
            //    const ai = Number(a?.id ?? 0), bi = Number(b?.id ?? 0);
            //    return sortDir === 'asc' ? ai - bi : bi - ai;
            //});

            setItems(sorted);
            setTotal(response?.total || 0);
        } catch (e) {
            setErr(e?.message || 'Не удалось загрузить транзакции');
        } finally {
            setLoading(false);
        }
    }

    //async function reload() {
    //    try {
    //        setLoading(true);
    //        setErr('');
    //        const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
    //            ? Number(transactionSearch.trim())
    //            : undefined;

    //        const params = { id, page: currentPage, pageSize };
    //        if (selectedStatuses.length > 0) params.status = selectedStatuses;

    //        if (scope === 'private' && isAdmin && viewUserId) {
    //            params.userId = Number(viewUserId);
    //        }

    //        const response = await fetchPayinTransactions(scope, params);
    //        setItems(response?.items || []);
    //        setTotal(response?.total || 0);
    //    } catch (e) {
    //        setErr(e?.message || 'Не удалось загрузить транзакции');
    //    } finally {
    //        setLoading(false);
    //    }
    //}

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr('');

                const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
                    ? Number(transactionSearch.trim())
                    : undefined;

                const params = { id, page: currentPage, pageSize };
                if (selectedStatuses.length > 0) params.status = selectedStatuses;
                if (scope === 'private' && isAdmin && viewUserId) params.userId = Number(viewUserId);

                const response = await fetchPayinTransactions(scope, params);
                if (!cancelled) {
                    const items = response?.items || [];

                    // ▼ сортировка по id (сменить на 'asc' при необходимости)
                    const sortDir = 'desc'; // 'asc' | 'desc'
                  /*  const sorted = items.slice().sort((a, b) => {
                        const ai = Number(a?.id ?? 0), bi = Number(b?.id ?? 0);
                        return sortDir === 'asc' ? ai - bi : bi - ai;
                    });*/
                    const sorted = items.slice().sort((a, b) => {
                        const ad = new Date(a?.date ?? 0).getTime();
                        const bd = new Date(b?.date ?? 0).getTime();
                        return sortDir === 'asc' ? ad - bd : bd - ad;
                    });
                    setItems(sorted);
                    setTotal(response?.total || 0);
                }
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить транзакции');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [scope, selectedStatuses, transactionSearch, currentPage, viewUserId]);

    //useEffect(() => {
    //    let cancelled = false;
    //    (async () => {
    //        try {
    //            setLoading(true);
    //            setErr('');

    //            const id = transactionSearch.trim() && /^\d+$/.test(transactionSearch.trim())
    //                ? Number(transactionSearch.trim())
    //                : undefined;

    //            const params = { id, page: currentPage, pageSize };
    //            if (selectedStatuses.length > 0) params.status = selectedStatuses;
    //            if (scope === 'private' && isAdmin && viewUserId) params.userId = Number(viewUserId);

    //            const response = await fetchPayinTransactions(scope, params);
    //            if (!cancelled) {
    //                setItems(response?.items || []);
    //                setTotal(response?.total || 0);
    //            }
    //        } catch (e) {
    //            if (!cancelled) setErr(e?.message || 'Не удалось загрузить транзакции');
    //        } finally {
    //            if (!cancelled) setLoading(false);
    //        }
    //    })();
    //    return () => { cancelled = true; };
    //}, [scope, selectedStatuses, transactionSearch, currentPage, viewUserId]);

    // lookups
    async function searchRequisites() {
        try { setRqList(await lookupRequisites(rqLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить реквизиты'); }
    }
    async function searchDevices() {
        try { setDevList(await lookupDevices(devLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить устройства'); }
    }
    async function searchUsers() {
        try { setUserList(await lookupUsers(userLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить пользователей'); }
    }
    async function searchViewUsers() {
        try { setViewUserList(await lookupUsers(viewUserLogin, 20)); }
        catch (e) { setErr(e?.message || 'Не удалось получить пользователей'); }
    }

    async function addTx() {
        try {
            setSaving(true);
            setErr('');
            if (!dealAmount || !incomeAmount) throw new Error('Укажите суммы');

            const baseBody = {
                date: new Date(newDate).toISOString(),
                status: newStatus,
                requisiteId: rqId ? Number(rqId) : null,
                deviceId: devId ? Number(devId) : null,
                dealAmount: Number(dealAmount),
                incomeAmount: Number(incomeAmount),
            };

            if (scope === 'public') {
                await createPayinTransactionPublic(baseBody);
            } else {
                if (!userId) throw new Error('Выберите пользователя');
                await createPayinTransactionPrivate({ userId: Number(userId), ...baseBody });
            }

            setAdding(false);

            // очистка
            setNewDate(new Date().toISOString().slice(0, 10));
            setNewStatus(STATUS_OPTIONS[0]);
            setRqLogin(''); setRqList([]); setRqId(null);
            setDevLogin(''); setDevList([]); setDevId(null);
            setDealAmount(''); setIncomeAmount('');
            setUserLogin(''); setUserList([]); setUserId('');

            await reload();
        } catch (e) {
            setErr(e?.message || 'Не удалось создать транзакцию');
        } finally {
            setSaving(false);
        }
    }

    async function removeTx(id) {
        if (!editable) return;
        if (!window.confirm(`Удалить транзакцию #${id}?`)) return;
        try {
            await deletePayinTransaction(scope, id);
            await reload();
        } catch (e) {
            setErr(e?.message || 'Не удалось удалить транзакцию');
        }
    }

    const totalPages = Math.ceil(total / pageSize);
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };



    const columnsCount = 7;
    const actionsHidden = !editable;
    return (
        <div className="transactions-container">
            <Breadcrumbs />

            <div className="rq-header">
                <h2 className="page-title">Приём</h2>

                {/* Переключатель области данных — как в BalancePage */}
                {editable && (
                    <div className="mode-switch">
                        <label>
                            <input
                                type="radio"
                                name="tx-scope"
                                value="public"
                                checked={scope === 'public'}
                                onChange={() => setScope('public')}
                                disabled={loading}
                            /> Публичные
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="tx-scope"
                                value="private"
                                checked={scope === 'private'}
                                onChange={() => setScope('private')}
                                disabled={loading}
                            /> Приватные
                        </label>
                    </div>
                )}
            </div>

            {editable && scope === "private" && isAdmin && (
                <div className="admin-view-user">
                    <div className="inline">
                        <input placeholder="Логин пользователя (для просмотра)" value={viewUserLogin} onChange={e => setViewUserLogin(e.target.value)} />
                        <button onClick={searchViewUsers}>Найти</button>
                    </div>
                    <select value={viewUserId} onChange={e => setViewUserId(e.target.value)}>
                        <option value="">— Мои / все —</option>
                        {viewUserList.map(u => <option key={u.id} value={u.id}>{u.login} (id {u.id})</option>)}
                    </select>
                </div>
            )}

            <div className="transactions-filters">
                <div className="search-box-trans">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path fill="currentColor" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37" />
                    </svg>
                    <input
                        type="text"
                        placeholder="ID транзакции"
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                    />
                </div>

                <div className="status-dropdown-wrapper-trans" onClick={(e) => e.stopPropagation()}>
                    <div className="status-dropdown-trans" onClick={() => setDropdownOpen(prev => !prev)}>
                        {selectedStatuses.length > 0 ? `Выбрано ${selectedStatuses.length} статуса` : 'Статус'}
                        <span className="arrow">▼</span>
                    </div>
                    {dropdownOpen && (
                        <div className="dropdown-menu-trans" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Поиск статуса…"
                                className="dropdown-search-priem"
                                value={statusSearch}
                                onChange={(e) => setStatusSearch(e.target.value)}
                            />
                            {filteredStatuses.map((status) => (
                                <div key={status} className="dropdown-search-priem-item" onClick={() => toggleStatus(status)}>
                                    <span>{status}</span>
                                    {selectedStatuses.includes(status) && <span className="checkmark">✔</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editable && (
                    <div className="actions-row">
                        <button className="add-btn" onClick={() => setAdding(v => !v)}>
                            {adding ? 'Скрыть форму' : 'Добавить транзакцию'}
                        </button>

                        {/* 1) Генерация по связкам (public/private — внутри модалки по scope) */}
                        <button className="add-btn secondary" onClick={() => setGenerateOpen(true)}>
                            Сгенерировать по связкам
                        </button>

                        {/* 2) Генерация за месяц/день (без связок, пары device+requisite; для private — ещё user) */}
                        <button className="add-btn secondary" onClick={() => setBackfillOpen(true)}>
                            Сгенерировать за месяц/день
                        </button>

                        <button className="add-btn secondary" onClick={() => setExactSumOpen(true)}>
                            Генерировать по сумме (день)
                        </button>
                    </div>
                )}
            </div>

            {adding && editable && (
                <div className="add-form">
                    {scope === 'private' && (
                        <div className="field wide">
                            <label>Пользователь (логин)</label>
                            <div className="inline">
                                <input type="text" placeholder="login" value={userLogin} onChange={e => setUserLogin(e.target.value)} />
                                <button onClick={searchUsers} type="button">Найти</button>
                            </div>
                            <select value={userId} onChange={e => setUserId(e.target.value)}>
                                <option value="">— не выбрано —</option>
                                {userList.map(u => <option key={u.id} value={u.id}>{u.login} (id {u.id})</option>)}
                            </select>
                        </div>
                    )}

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
                                <option key={r.id} value={r.id}>{r.ownerLogin} — {r.display}</option>
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
                                <option key={d.id} value={d.id}>{d.ownerLogin} — {d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label>Сумма сделки (USDT)</label>
                        <input type="number" min="0" step="0.01" value={dealAmount} onChange={e => setDealAmount(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Сумма поступления (EUR)</label>
                        <input type="number" min="0" step="0.01" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
                    </div>

                    <div className="actions">
                        <button className="submit" onClick={addTx} disabled={saving}>
                            {saving ? 'Сохраняем…' : 'Добавить'}
                        </button>
                    </div>
                </div>
            )}

            {/* сама таблица */}
            <div className="disputes-table tx-table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>ID и дата</th>
                            <th>Статус</th>
                            <th>Реквизиты</th>
                            <th>Устройство</th>
                            <th>Сумма сделки</th>
                            <th>Сумма поступления</th>
                            <th className={`actions-col ${actionsHidden ? 'is-hidden' : ''}`}></th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columnsCount/*editable ? (scope === 'private' ? 7 : 6) : (scope === 'private' ? 7 : 6)*/} className="no-disputes">
                                    <Spinner center label="Загрузка…" size={30} />
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                    <td colSpan={columnsCount/*editable ? (scope === 'private' ? 7 : 6) : (scope === 'private' ? 7 : 6)*/} className="no-disputes">
                                        <div className="empty-message-table">Транзакций пока нет (Транзакции хранятся 30 дней)</div>
                                </td>
                            </tr>
                        ) : (
                            items.map((tx) => (
                                <tr key={tx.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span>{tx.id}</span>
                                            <small style={{ opacity: .7 }}>
                                                {tx.date ? new Date(tx.date).toLocaleDateString('ru-RU') : '—'}
                                            </small>
                                        </div>
                                    </td>
                                    <td>{tx.status ?? '—'}</td>
                                    <td>{tx.requisiteDisplay ?? (tx.requisiteId ? `ID ${tx.requisiteId}` : '—')}</td>
                                    <td>{tx.deviceName ?? (tx.deviceId ? `ID ${tx.deviceId}` : '—')}</td>
                                    <td>{tx.dealAmount != null ? Number(tx.dealAmount).toFixed(2) : '0.00'} USDT</td>
                                    <td>{tx.incomeAmount != null ? Number(tx.incomeAmount).toFixed(2) : '0.00'} EUR</td>
                                    <td className={`actions-col ${actionsHidden ? 'is-hidden' : ''}`}>
                                        {editable && (
                                            <button className="delete-btn" onClick={() => removeTx(tx.id)}>Удалить</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="tx-hint">
                В истории транзакций показаны операции за последние 3 дня фактической работы
            </div>
            {total > 0 && (
                <div className="pagination">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Предыдущая</button>
                    <span>Страница {currentPage} из {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Следующая</button>
                </div>
            )}

            {/* Модалки генерации */}
            {editable && generateOpen && (
                <GenerateByLinksModal
                    scope={scope}
                    onClose={() => setGenerateOpen(false)}
                    onDone={() => { setGenerateOpen(false); reload(); }}
                />
            )}

            {editable && backfillOpen && scope === 'public' && (
                <TransactionsBackfillModal
                    open={backfillOpen}
                    onClose={() => setBackfillOpen(false)}
                    onDone={() => { setBackfillOpen(false); reload(); }}
                />
            )}
            {editable && backfillOpen && scope === 'private' && (
                <TransactionsBackfillPrivateModal
                    open={backfillOpen}
                    onClose={() => setBackfillOpen(false)}
                    onDone={() => { setBackfillOpen(false); reload(); }}
                />
            )}

            {editable && exactSumOpen && (
                <TransactionsExactSumModal
                    scope={scope}
                    open={exactSumOpen}
                    onClose={() => setExactSumOpen(false)}
                    onDone={() => { setExactSumOpen(false); reload(); }}
                />
            )}
        </div>
    );
}
