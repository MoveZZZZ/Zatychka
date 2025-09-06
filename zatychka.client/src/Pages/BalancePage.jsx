import React, { useEffect, useState } from 'react';
import './BalancePage.css';
import { WALLETS, getRandomWallet } from '../constants/wallets';

import BinLogo from '../assets/b.png';
import BBLogo from '../assets/bb.png';
import OKXLogo from '../assets/okx.png';
import HTXLogo from '../assets/htx.png';
import WithdrawModal from "./WithdrawModal"

import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { getPublicWallet, savePublicWallet } from '../api/publicwalletUser';
import { getMyWallet, saveMyWallet } from '../api/walletUser';
import Spinner from '../components/Spinner';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext';
import Breadcrumbs from '../components/Breadcrumbs';
import { fetchBalanceHistory, createBalanceHistory, deleteBalanceHistory } from '../api/balanceHistory';
import { useToast } from '../context/ToastContext';
import qr1 from '../assets/qr.png';
import { checkDepositsApi } from '../api/deposits';




import {lookupUsers} from '../api/payin';


const TYPE_LABELS = {
    Deposit: 'Пополнение',
    Withdrawal: 'Вывод',
    Transaction: 'Транзакция',
    TraderReward: 'Награда трейдеру',
    MerchantEarning: 'Заработок мерчанта',
    Dispute: 'Спор',
};
const TYPE_ORDER = ['Deposit', 'Withdrawal', 'Transaction', 'TraderReward', 'MerchantEarning', 'Dispute'];
const TYPE_OPTIONS = TYPE_ORDER.map(v => ({ value: v, label: TYPE_LABELS[v] }));

function Card({ title, value, editable, editing, onClick, onChange, onCommit, saving }) {
    return (
        <div className="card">
            <h3 className="balance-title">{title}</h3>
            {!editing ? (
                <p
                    className={`casa-style ${editable ? 'clickable' : ''}`}
                    title={editable ? 'Нажмите, чтобы изменить' : ''}
                    onClick={editable ? onClick : undefined}
                >
                    {value} USDT
                </p>
            ) : (
                <input
                    className="balance-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onCommit}
                    onKeyDown={(e) => e.key === 'Enter' && onCommit()}
                    disabled={saving}
                    autoFocus
                />
            )}
        </div>
    );
}

export default function BalancePage() {
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const editable = isAdmin && editMode;

    const { scope, setScope } = useDataScope(); 

    const [showWallet, setShowWallet] = useState(false);


    const [pub, setPub] = useState({ mainUsdt: 0, frozenUsdt: 0, insuranceUsdt: 0 });
    const [priv, setPriv] = useState({ mainUsdt: 0, frozenUsdt: 0, insuranceUsdt: 0 });


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');


    const [editing, setEditing] = useState({ main: false, frozen: false, insurance: false });
    const [draft, setDraft] = useState({ main: '', frozen: '', insurance: '' });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [p, m] = await Promise.all([
                    getPublicWallet().catch(() => ({ mainUsdt: 0, frozenUsdt: 0, insuranceUsdt: 0 })),
                    getMyWallet().catch(() => ({ mainUsdt: 0, frozenUsdt: 0, insuranceUsdt: 0 })),
                ]);
                if (cancelled) return;

                setPub({
                    mainUsdt: Number(p?.mainUsdt ?? p?.MainUsdt ?? 0),
                    frozenUsdt: Number(p?.frozenUsdt ?? p?.FrozenUsdt ?? 0),
                    insuranceUsdt: Number(p?.insuranceUsdt ?? p?.InsuranceUsdt ?? 0),
                });
                setPriv({
                    mainUsdt: Number(m?.mainUsdt ?? m?.MainUsdt ?? 0),
                    frozenUsdt: Number(m?.frozenUsdt ?? m?.FrozenUsdt ?? 0),
                    insuranceUsdt: Number(m?.insuranceUsdt ?? m?.InsuranceUsdt ?? 0),
                });
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить балансы');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const isPublic = scope === 'public';
    const data = isPublic ? pub : priv;
    const setData = isPublic ? setPub : setPriv;
    const saver = isPublic ? savePublicWallet : saveMyWallet;

    useEffect(() => {
        if (!editable && (editing.main || editing.frozen || editing.insurance)) {
            setEditing({ main: false, frozen: false, insurance: false });
            setErr('');
        }
    }, [editable, editing.main, editing.frozen, editing.insurance]);

    useEffect(() => {
        setEditing({ main: false, frozen: false, insurance: false });
        setErr('');
    }, [scope]);

    function openEdit(field) {
        if (!editable) return;
        setErr('');
        const current = Number(data?.[field + 'Usdt'] ?? 0);
        setDraft(d => ({ ...d, [field]: String(current) }));
        setEditing(e => ({ ...e, [field]: true }));
    }

    async function commitEdit(field) {
        if (!editable) return;
        try {
            setSaving(true);
            setErr('');

            const raw = String(draft[field] ?? '').replace(',', '.').trim();
            const value = Number(raw);
            if (!Number.isFinite(value)) throw new Error('Некорректное число');

            const patch = {};
            if (field === 'main') patch.mainUsdt = value;
            if (field === 'frozen') patch.frozenUsdt = value;
            if (field === 'insurance') patch.insuranceUsdt = value;

            const saved = await saver(patch);
            const next = {
                mainUsdt: Number(saved?.mainUsdt ?? saved?.MainUsdt ?? data.mainUsdt),
                frozenUsdt: Number(saved?.frozenUsdt ?? saved?.FrozenUsdt ?? data.frozenUsdt),
                insuranceUsdt: Number(saved?.insuranceUsdt ?? saved?.InsuranceUsdt ?? data.insuranceUsdt),
            };
            setData(next);
            setEditing(e => ({ ...e, [field]: false }));
        } catch (e) {
            setErr(e?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    }


    const [historyKind, setHistoryKind] = useState('simple'); 


    const [selectedTypes, setSelectedTypes] = useState([]); 
    const toggleType = (t) => {
        setSelectedTypes(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        );
    };

    const [rows, setRows] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [histErr, setHistErr] = useState('');


    const canAddHistory = editable;
    const [showAdd, setShowAdd] = useState(false);
    const [savingHist, setSavingHist] = useState(false);


    const [hDate, setHDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [hType, setHType] = useState('Deposit');
    const [hAmount, setHAmount] = useState('');
    const [hBefore, setHBefore] = useState('');
    const [hAfter, setHAfter] = useState('');
    const [hUserId, setHUserId] = useState(''); 


    const [fFreeze, setFFreeze] = useState(() => new Date().toISOString().slice(0, 10));
    const [fUnfreeze, setFUnfreeze] = useState('');
    const [fType, setFType] = useState('Deposit');
    const [fAmount, setFAmount] = useState('');
    const [fUserId, setFUserId] = useState(''); 

    const toast = useToast();
    const TELEGRAM_MANAGER_URL = 'https://t.me/ebrag_wd';

    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    async function handleWithdrawClick() {
        if (!withdrawAddress.trim()) {
            toast.error('Введите кошелек');
            return;
        } else if (!String(withdrawAmount).trim()) {
            toast.error('Введите корректную сумму');
            return;
        } else if (withdrawAmount > data.mainUsdt) {
            toast.error('Сумма вывода больше балланса');
            return;
        }
        try {
            setWithdrawLoading(true);
            await new Promise(r => setTimeout(r, 1800));
            setShowWithdrawModal(true);
        } finally {
            setWithdrawLoading(false);
            setWithdrawAddress("");
            setWithdrawAmount(0);
        }
    }

    const [checkLoading, setCheckLoading] = useState(false);
    async function handleCheckDeposits() {
        try {
            if (!selectedWallet?.address) {
                toast.error('Сначала покажите кошелёк и скопируйте адрес.');
                return;
            }
            setCheckLoading(true);

            const userId = scope === 'private' ? Number(me?.id || me?.userId || 0) || null : null;

            const dataRes = await checkDepositsApi({
                address: selectedWallet.address,
                userId
            });

            const added = Number(dataRes?.count || 0);

            if (added > 0) {
                toast.success(`Новые поступления: ${added}`);
                try {
                    const list = await fetchBalanceHistory(scope, historyKind, {
                        types: selectedTypes && selectedTypes.length ? selectedTypes : undefined,
                    });
                    setRows(list);
                } catch { }
            } else {
                toast.error('Новых поступлений нет');
            }
        } catch (e) {
            toast.error(e?.message || 'Ошибка проверки депозита');
        } finally {
            setCheckLoading(false);
        }
    }

    const [copied, setCopied] = useState(false);
    async function handleCopyAddress() {
        try {
            if (!selectedWallet?.address) {
                toast.error('Адрес кошелька ещё не загружен.');
                return;
            }
            await navigator.clipboard.writeText(selectedWallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (e) {
            toast.error('Не удалось скопировать адрес.');
        }
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setHistLoading(true);
                setHistErr('');
                const list = await fetchBalanceHistory(scope, historyKind, {
                    types: selectedTypes && selectedTypes.length ? selectedTypes : undefined,
                });
                if (!cancelled) setRows(list);
            } catch (e) {
                if (!cancelled) setHistErr(e?.message || 'Не удалось загрузить историю');
            } finally {
                if (!cancelled) setHistLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [scope, historyKind, selectedTypes]);

    async function addHistory() {
        try {
            setSavingHist(true);
            setHistErr('');

            if (historyKind === 'simple') {
                if (hAmount === '' || hBefore === '' || hAfter === '') throw new Error('Заполните суммы');
                const body = {
                    date: new Date(hDate).toISOString(),
                    type: hType,
                    amount: Number(hAmount),
                    balanceBefore: Number(hBefore),
                    balanceAfter: Number(hAfter),
                };
                if (scope === 'private') {
                    if (!/^\d+$/.test(hUserId || '')) throw new Error('UserId обязателен (число) для private');
                    body.userId = Number(hUserId);
                }
                await createBalanceHistory(scope, 'simple', body);
            } else {
                if (fAmount === '') throw new Error('Укажите сумму');
                const body = {
                    freezeDate: new Date(fFreeze).toISOString(),
                    unfreezeDate: fUnfreeze ? new Date(fUnfreeze).toISOString() : null,
                    type: fType,
                    amount: Number(fAmount),
                };
                if (scope === 'private') {
                    if (!/^\d+$/.test(fUserId || '')) throw new Error('UserId обязателен (число) для private');
                    body.userId = Number(fUserId);
                }
                await createBalanceHistory(scope, 'frozen', body);
            }

            setShowAdd(false);
            setHDate(new Date().toISOString().slice(0, 10));
            setHType('Deposit');
            setHAmount(''); setHBefore(''); setHAfter(''); setHUserId('');

            setFFreeze(new Date().toISOString().slice(0, 10));
            setFUnfreeze('');
            setFType('Deposit');
            setFAmount(''); setFUserId('');

            const list = await fetchBalanceHistory(scope, historyKind, {
                types: selectedTypes && selectedTypes.length ? selectedTypes : undefined,
            });
            setRows(list);
        } catch (e) {
            setHistErr(e?.message || 'Не удалось добавить запись');
        } finally {
            setSavingHist(false);
        }
    }

    async function removeRow(id) {
        if (!window.confirm('Удалить запись?')) return;
        try {
            await deleteBalanceHistory(scope, historyKind, id);
            setRows(rows => rows.filter(x => x.id !== id));
        } catch (e) {
            setHistErr(e?.message || 'Не удалось удалить запись');
        }
    }

    const [selectedWallet, setSelectedWallet] = useState(null);
    const [showWalletLoading, setShowWalletLoading] = useState(false);
    async function handleShowWallet() {
        try {
            setShowWalletLoading(true);
            await new Promise(r => setTimeout(r, 1700));
            const w = getRandomWallet(WALLETS);
            setSelectedWallet(w);
            setShowWallet(true);
        } finally {
            setShowWalletLoading(false);
        }
    }
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const selectedCount = selectedTypes.length; 

    const [userList, setUserList] = useState([]);
    const [userLogin, setUserLogin] = useState('');
    async function searchUsers() {
        try {
            setUserList(await lookupUsers(userLogin, 20));}
        catch (e) {
            setErr(e?.message || 'Не удалось получить пользователей');}
    }


    return (
        <div className="balance-page">
            <Breadcrumbs />

            <div className="rq-header">
                <h2 className="page-title">Баланс</h2>

                {editable && (
                    <div className="mode-switch">
                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value="public"
                                checked={scope === 'public'}
                                onChange={() => setScope('public')}
                                disabled={saving}
                            /> Публичный
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="mode"
                                value="private"
                                checked={scope === 'private'}
                                onChange={() => setScope('private')}
                                disabled={saving}
                            /> Приватный (мой)
                        </label>
                    </div>
                )}
            </div>

            {loading && <Spinner center label="Загрузка…" size={30} />}

            <div className="balance-cards">
                <Card
                    title="Основной баланс"
                    editable={editable}
                    value={editing.main ? draft.main : (data.mainUsdt ?? 0)}
                    editing={editing.main}
                    onClick={() => openEdit('main')}
                    onChange={(v) => setDraft(d => ({ ...d, main: v }))}
                    onCommit={() => commitEdit('main')}
                    saving={saving}
                />
                <Card
                    title="Заморожено"
                    editable={editable}
                    value={editing.frozen ? draft.frozen : (data.frozenUsdt ?? 0)}
                    editing={editing.frozen}
                    onClick={() => openEdit('frozen')}
                    onChange={(v) => setDraft(d => ({ ...d, frozen: v }))}
                    onCommit={() => commitEdit('frozen')}
                    saving={saving}
                />
                <Card
                    title="Страховой депозит"
                    editable={editable}
                    value={editing.insurance ? draft.insurance : (data.insuranceUsdt ?? 0)}
                    editing={editing.insurance}
                    onClick={() => openEdit('insurance')}
                    onChange={(v) => setDraft(d => ({ ...d, insurance: v }))}
                    onCommit={() => commitEdit('insurance')}
                    saving={saving}
                />
            </div>

            <div className="balance-sections">
                <div className="withdraw-section">
                    <div className="withdraw">
                        <h3 className="balance-title">Вывод USDT</h3>
                        <p>Сеть для вывода: <span className="badge">TRC20</span></p>

                        <input
                            className="input-koshelok"
                            type="text"
                            placeholder="Адрес кошелька"
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                        />

                        <p className="warning">Будьте внимательны при вводе адреса, отменить операцию невозможно</p>

                        <div className="input-row">
                            <input
                                type="number"
                                placeholder="0"
                                min="0"
                                className="amount-input"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                            />
                            <button
                                className="all-btn"
                                type="button"
                                onClick={() => setWithdrawAmount(String(data.mainUsdt ?? 0))}
                            >
                                Всё
                            </button>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Доступно</span>
                            <span className="info-value">{(data.mainUsdt ?? 0)} USDT</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Комиссия</span>
                            <span className="info-value">5%</span>
                        </div>

                        <button
                            className="submit-btn"
                            type="button"
                            onClick={handleWithdrawClick}
                            disabled={withdrawLoading}
                        >
                            {withdrawLoading ? <span className="btn-spinner" aria-label="Загрузка" /> : 'Вывести'}
                        </button>
                    </div>
                </div>

                <div className="deposit-section">
                    <div className="deposit">
                        <h3 className="balance-title">Пополнение USDT</h3>
                        <p className="deposit-warning">
                            Зачисляем перевод только с доверенных бирж: <b>Binance, Bybit, OKX, HTX</b><br />
                            Депозиты с Garantеx запрещены
                        </p>
                        <div className="exchange-logos">
                            <a href="https://www.binance.com/" target="_blank" rel="noopener noreferrer">
                                <img src={BinLogo} width="200" alt="Binance" />
                            </a>
                            <a href="https://www.bybit.com/" target="_blank" rel="noopener noreferrer">
                                <img src={BBLogo} width="90" alt="Bybit" />
                            </a>
                            <a href="https://www.okx.com/" target="_blank" rel="noopener noreferrer">
                                <img src={OKXLogo} width="90" alt="OKX" />
                            </a>
                            <a href="https://www.htx.com/" target="_blank" rel="noopener noreferrer">
                                <img src={HTXLogo} alt="HTX" />
                            </a>
                        </div>

                        <div className="wallet-container">
                            <div className={`wallet-blur-wrap ${!showWallet ? 'blurred' : ''}`}>
                                <div className="wallet-info">
                                    <div className="wallet-body">
                                        {selectedWallet ? (
                                            <img src={selectedWallet.qr} alt="QR-код" className="qr-code" />
                                        ) : (
                                            <img
                                                src={qr1}
                                                alt="QR-код (по умолчанию)"
                                                className="qr-code"
                                            />
                                        )}

                                        <div className="wallet-content">
                                            <div className="wallet-label-row">
                                                <span className="wallet-label">Адрес кошелька</span>
                                                {selectedWallet ? (
                                                    <span className="badge">{selectedWallet.network}</span>
                                                ) : (
                                                    <span className="badge">TRC20</span>
                                                )}
                                            </div>

                                            <div className="wallet-address-box">
                                                <div className="copy-wrap">
                                                    <svg
                                                        onClick={handleCopyAddress}
                                                        className="copy-btn"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                                            <path d="M7 9.667A2.667 2.667 0 0 1 9.667 7h8.666A2.667 2.667 0 0 1 21 9.667v8.666A2.667 2.667 0 0 1 18.333 21H9.667A2.667 2.667 0 0 1 7 18.333z" />
                                                            <path d="M4.012 16.737A2 2 0 0 1 3 15V5c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1" />
                                                        </g>
                                                    </svg>
                                                    {copied && <div className="copied-popover">Адрес скопирован</div>}
                                                </div>

                                                <span className="info-value">
                                                    {selectedWallet?.address || '••••••••••••••••••••••••••'}
                                                </span>
                                            </div>

                                            <div className="wallet-bottom">
                                                <button
                                                    className="check-deposit-btn"
                                                    type="button"
                                                    onClick={handleCheckDeposits}
                                                    disabled={checkLoading}
                                                >
                                                    {checkLoading ? <span className="btn-spinner btn-spinner-sm" aria-label="Загрузка" /> : 'Проверить зачисления'}
                                                </button>

                                                <p className="wallet-note"><span>⚠</span> Кошелёк может обновляться</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!showWallet && (
                                <button
                                    className="overlay-btn"
                                    onClick={handleShowWallet}
                                    disabled={showWalletLoading}
                                    type="button"
                                >
                                    {showWalletLoading ? <span className="btn-spinner" aria-label="Загрузка" /> : 'Показать кошелёк для пополнения'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="history-section">
                <div className="history-head">
                    <div className="segmented" data-active={historyKind}>
                        <span className="segmented-thumb" aria-hidden />
                        <button
                            className={`seg ${historyKind === 'simple' ? 'active' : ''}`}
                            onClick={() => setHistoryKind('simple')}
                            type="button"
                        >
                            <span className="ico" aria-hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3zM3 11h18v2H3zm0 5h12v2H3z" /></svg>
                            </span>
                            История баланса
                        </button>

                        <button
                            className={`seg ${historyKind === 'frozen' ? 'active' : ''}`}
                            onClick={() => setHistoryKind('frozen')}
                            type="button"
                        >
                            <span className="ico" aria-hidden>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5h2v14H8zM14 5h2v14h-2z" /></svg>
                            </span>
                            Замороженный баланс
                        </button>
                    </div>
                </div>
                {canAddHistory && (
                    <div>
                        <button className="add-btn" onClick={() => setShowAdd(v => !v)}>
                            {showAdd ? 'Скрыть форму' : 'Добавить запись'}
                        </button>
                    </div>
                )}


                <div className={`filters-card ${mobileFiltersOpen ? 'open' : ''}`}>

                    <button
                        type="button"
                        className="filters-toggle"
                        onClick={() => setMobileFiltersOpen(v => !v)}
                    >
                        <span className="filters-toggle-label">Фильтры</span>
                        <span className="filters-summary">
                            {selectedCount ? selectedCount : 'Все'}
                        </span>
                        <svg className={`chev ${mobileFiltersOpen ? 'rot' : ''}`} width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                            <path fill="currentColor" d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>


                    <div className="filters-inner">
                        <div className="filters-title">Типы</div>
                        <div className="chips chips-scroll">
                            {TYPE_ORDER.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`chip ${selectedTypes.includes(t) ? 'active' : ''}`}
                                    onClick={() => toggleType(t)}
                                >
                                    {TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                {histLoading && <Spinner center label="Загрузка…" size={30} />}


                {showAdd && canAddHistory && (
                    <div className="add-form">
                        {historyKind === 'simple' ? (
                            <>
                                <div className="field">
                                    <label>Дата</label>
                                    <input type="date" value={hDate} onChange={e => setHDate(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Тип</label>
                                    <select value={hType} onChange={e => setHType(e.target.value)}>
                                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                {scope === 'private' && (
                                    <div className="field">
                                        <div className="inline">
                                            <input placeholder="ID пользователя" value={userLogin} onChange={e => setUserLogin(e.target.value)} />
                                            <button onClick={searchUsers}>Найти</button>
                                        </div>
                                        <select value={hUserId} onChange={e => setHUserId(e.target.value)}>
                                            {userList.map(u => <option key={u.id} value={u.id}>{u.login} (id {u.id})</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="field">
                                    <label>Сумма (USDT)</label>
                                    <input type="number" min="0" step="0.01" value={hAmount} onChange={e => setHAmount(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Баланс до (USDT)</label>
                                    <input type="number" min="0" step="0.01" value={hBefore} onChange={e => setHBefore(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Баланс после (USDT)</label>
                                    <input type="number" min="0" step="0.01" value={hAfter} onChange={e => setHAfter(e.target.value)} />
                                </div>
                                <div className="actions">
                                    <button className="submit" onClick={addHistory} disabled={savingHist}>
                                        {savingHist ? 'Сохраняем…' : 'Добавить'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="field">
                                    <label>Дата заморозки</label>
                                    <input type="date" value={fFreeze} onChange={e => setFFreeze(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Дата разморозки (опц.)</label>
                                    <input type="date" value={fUnfreeze} onChange={e => setFUnfreeze(e.target.value)} />
                                </div>
                                <div className="field">
                                    <label>Тип</label>
                                    <select value={fType} onChange={e => setFType(e.target.value)}>
                                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                {scope === 'private' && (
                                    <div className="field">
                                        <label>UserId</label>
                                        <input type="number" value={fUserId} onChange={e => setFUserId(e.target.value)} placeholder="ID пользователя" />
                                    </div>
                                )}
                                <div className="field">
                                    <label>Сумма (USDT)</label>
                                    <input type="number" min="0" step="0.01" value={fAmount} onChange={e => setFAmount(e.target.value)} />
                                </div>
                                <div className="actions">
                                    <button className="submit" onClick={addHistory} disabled={savingHist}>
                                        {savingHist ? 'Сохраняем…' : 'Добавить'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}


                {historyKind === 'simple' ? (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Тип</th>
                                    <th>Сумма</th>
                                    <th>Баланс до</th>
                                    <th>Баланс после</th>
                                    {canAddHistory && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={canAddHistory ? 6 : 5} style={{ textAlign: 'center', opacity: 0.4 }}>Здесь пока пусто</td></tr>
                                ) : rows.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.date).toLocaleDateString('ru-RU')}</td>
                                        <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                                        <td>{Number(r.amount).toFixed(2)} USDT</td>
                                        <td>{Number(r.before).toFixed(2)} USDT</td>
                                        <td>{Number(r.after).toFixed(2)} USDT</td>
                                        {canAddHistory && (
                                            <td>
                                                <button className="delete-btn" onClick={() => removeRow(r.id)}>Удалить</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Дата заморозки</th>
                                    <th>Дата разморозки</th>
                                    <th>Тип</th>
                                    <th>Сумма</th>
                                    {canAddHistory && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={canAddHistory ? 5 : 4} style={{ textAlign: 'center', opacity: 0.4 }}>Здесь пока пусто</td></tr>
                                ) : rows.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.freezeDate).toLocaleDateString('ru-RU')}</td>
                                        <td>{r.unfreezeDate ? new Date(r.unfreezeDate).toLocaleDateString('ru-RU') : '—'}</td>
                                        <td>{TYPE_LABELS[r.type] ?? r.type}</td>
                                        <td>{Number(r.amount).toFixed(2)} USDT</td>
                                        {canAddHistory && (
                                            <td>
                                                <button className="delete-btn" onClick={() => removeRow(r.id)}>Удалить</button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <WithdrawModal
                open={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                managerUrl={TELEGRAM_MANAGER_URL}
            />
        </div>
    );
}
