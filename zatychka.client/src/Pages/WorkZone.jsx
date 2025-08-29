import React, { useCallback, useEffect, useState } from 'react';
import './WorkZone.css';
import AddLinkModal from './AddLinkModal';
import EditLinkModal from './EditLinkModal';
import Breadcrumbs from '../components/Breadcrumbs';
import Spinner from '../components/Spinner';
import ImportantLineModal from './ImportantLineModal';
import {
    listLinks,
    deleteLink as apiDeleteLink,
    updateLink as apiUpdateLink,
} from '../api/links';
import { useToast } from '../context/ToastContext';

// кошельки (как в BalancePage)
import { WALLETS, getRandomWallet } from '../constants/wallets';
import WalletModal from './WalletModal';

// режимы и права — как в Балансе
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext';
import {
    getPublicReserve, updatePublicReserve,
    getMyPrivateReserve, updateMyPrivateReserve
} from '../api/reserve.js';
/* ===================== utils ===================== */
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

/* ===================== UI bits for cards ===================== */
function IconWallet() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M3 6a3 3 0 0 1 3-3h10a1 1 0 1 1 0 2H6a1 1 0 0 0-1 1v1h14a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zM20 10H6v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM16 12h3v3h-3a1.5 1.5 0 0 1 0-3Z" />
        </svg>
    );
}
function IconTx() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="m8.5 3l-3 3l3 3V7h7v3l3-3l-3-3v2h-7V3Zm7 11H8v-2l-3 3l3 3v-2h7v2l3-3l-3-3v2Z" />
        </svg>
    );
}
function IconClock() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M11 7h2v6h-4v-2h2zm1-5a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z" />
        </svg>
    );
}
function IconUsers() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M16 11a4 4 0 1 0-4-4a4 4 0 0 0 4 4M8 12a3 3 0 1 0-3-3a3 3 0 0 0 3 3m8 2a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6M8 14c-3.314 0-6 2.686-6 6h4.5a7.5 7.5 0 0 1 5.142-5.742A5.97 5.97 0 0 0 8 14" />
        </svg>
    );
}

function Tag({ children }) {
    return <span className="bz-tag">{children}</span>;
}
function Chip({ icon, label, value, suffix }) {
    return (
        <div className="bz-chip">
            <span className="bz-chip-ico">{icon}</span>
            <div className="bz-chip-main">
                <span className="bz-chip-label">{label}</span>
                <span className="bz-chip-value">{value}{suffix ? ` ${suffix}` : ''}</span>
            </div>
        </div>
    );
}

function avatarContent(link) {
    const label = String(link?.requisiteLabel || '').toLowerCase();
    const req = link?.requisite || link?.requisiteInfo;
    const reqType = String(req?.type || '').toLowerCase();

    if (/(email|почта)/i.test(label)) return '✉️';
    if (/(phone|тел(ефон)?)/i.test(label)) return '📞';
    if (/(card|карта|visa|master(card)?|mc)/i.test(label)) return '💳';

    if (reqType === 'email') return '✉️';
    if (reqType === 'phone') return '📞';
    if (reqType === 'card') return '💳';

    return '⚙️';
}

function BundleCard({ link, v, onEdit, onDelete }) {
    const deviceName =
        link.device?.name ||
        link.deviceName ||
        (link.deviceId ? `Устройство #${link.deviceId}` : 'Без устройства');

    const reqText = link.requisiteLabel ? link.requisiteLabel : 'Реквизит не указан';

    return (
        <div className="bundle-card bz-card">
            <div className="bz-card-topbar" />
            <div className="bz-card-header">
                <div className="bz-avatar" aria-hidden>{avatarContent(link)}</div>
                <div className="bz-head-main">
                    <div className="bz-title">{deviceName}</div>
                    <div className="bz-sub">
                        <Tag>ID: {link.id}</Tag>
                        <Tag>{reqText}</Tag>
                    </div>
                </div>
                <div className="bz-actions">
                    <button className="bz-btn ghost" onClick={onEdit} type="button" title="Изменить">Изменить</button>
                    <button className="bz-btn danger" onClick={onDelete} type="button" title="Удалить">Удалить</button>
                </div>
            </div>

            <div className="bz-metrics">
                <Chip icon={<IconWallet />} label="Мин. сумма" value={v.min ?? 0} suffix="USDT" />
                <Chip icon={<IconWallet />} label="Макс. сумма" value={v.max ?? 0} suffix="USDT" />
                <Chip icon={<IconTx />} label="Транз./день" value={v.txDay ?? 0} />
                <Chip icon={<IconTx />} label="Транз./мес" value={v.txMonth ?? 0} />
                <Chip icon={<IconTx />} label="Транз. всего" value={v.txAll ?? 0} />
                <Chip icon={<IconWallet />} label="Приём/день" value={v.amtDay ?? 0} suffix="USDT" />
                <Chip icon={<IconWallet />} label="Приём/мес" value={v.amtMonth ?? 0} suffix="USDT" />
                <Chip icon={<IconWallet />} label="Приём всего" value={v.amtAll ?? 0} suffix="USDT" />
                <Chip icon={<IconUsers />} label="Одновременных" value={v.conc ?? 0} />
                <Chip icon={<IconClock />} label="Минут между" value={v.gap ?? 0} />
            </div>
        </div>
    );
}

/* ====== Маленькая плашка (как в балансе), редактирование локально ====== */
function SmallCard({ title, value, editable, editing, onClick, onChange, onCommit, saving }) {
    return (
        <div className={`wz-small-card ${editable ? 'is-editable' : ''}`}>
            <h3 className="wz-small-title">{title}</h3>
            {!editing ? (
                <p
                    className={`wz-small-value ${editable ? 'clickable' : ''}`}
                    title={editable ? 'Нажмите, чтобы изменить' : ''}
                    onClick={editable ? onClick : undefined}
                >
                    {value} USDT
                </p>
            ) : (
                <input
                    className="wz-small-input"
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

// ...
export default function WorkZone() {
    const toast = useToast();
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const editable = isAdmin && editMode;

    const { scope, setScope } = useDataScope(); // 'public' | 'private'

    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const data = await listLinks();
                if (!cancelled) setLinks(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setErr('Не удалось загрузить связки');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const fetchLinks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listLinks();
            setLinks(Array.isArray(data) ? data : []);
            setErr('');
        } catch {
            setErr('Не удалось загрузить связки');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { fetchLinks(); }, [fetchLinks]);

    async function handleDelete(id) {
        const prev = links;
        setLinks(prev.filter(l => l.id !== id));
        try {
            await apiDeleteLink(id);
            toast.success('Связка удалена');
            await fetchLinks();
        } catch (e) {
            setLinks(prev);
            toast.error('Не удалось удалить связку');
        }
    }

    async function handleSave(updated) {
        const saved = await apiUpdateLink(updated.id, updated);
        setLinks(prev => prev.map(l => (l.id === saved.id ? { ...l, ...saved } : l)));
        toast.success('Связка обновлена');
        await fetchLinks();
        return saved;
    }

    // ====== линии (LS) ======
    const ENTRY_KEY = 'workzone_entry_active';
    const EXIT_KEY = 'workzone_exit_active';
    const [entryActive, setEntryActive] = useState(() => {
        try { return localStorage.getItem(ENTRY_KEY) === '1'; } catch { return false; }
    });
    const [exitActive, setExitActive] = useState(() => {
        try { return localStorage.getItem(EXIT_KEY) === '1'; } catch { return false; }
    });

    const [lineModalOpen, setLineModalOpen] = useState(false);
    const [lineAction, setLineAction] = useState(null);
    const [modalTitle, setModalTitle] = useState('Внимание!');
    const [modalMessage, setModalMessage] = useState('');
    const [modalContinueText, setModalContinueText] = useState('Продолжить');

    useEffect(() => { try { localStorage.setItem(ENTRY_KEY, entryActive ? '1' : '0'); } catch { } }, [entryActive]);
    useEffect(() => { try { localStorage.setItem(EXIT_KEY, exitActive ? '1' : '0'); } catch { } }, [exitActive]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === ENTRY_KEY) setEntryActive(e.newValue === '1');
            if (e.key === EXIT_KEY) setExitActive(e.newValue === '1');
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    function openLineModal(kind) {
        setLineAction(kind);
        setModalTitle('Внимание!');
        switch (kind) {
            case 'entry_on': setModalMessage('Вы хотите встать на вход. Администрация не несёт ответственности за сохранность средств при случайном нажатии кнопки.'); break;
            case 'entry_off': setModalMessage('Вы действительно хотите выйти с линии (вход)?'); break;
            case 'exit_on': setModalMessage('Вы действительно хотите встать на выход? Администрация не несёт ответственности за сохранность средств при случайном нажатии кнопки.'); break;
            case 'exit_off': setModalMessage('Вы действительно хотите выйти с линии (выход)?'); break;
            default: setModalMessage('');
        }
        setModalContinueText('Продолжить');
        setLineModalOpen(true);
    }
    const closeLineModal = () => setLineModalOpen(false);
    function continueLine() {
        if (lineAction === 'entry_on') { setEntryActive(true); toast.success('Вы на линии, следите за реквизитами'); }
        else if (lineAction === 'entry_off') { setEntryActive(false); }
        else if (lineAction === 'exit_on') { setExitActive(true); toast.success('Вы на линии, следите за реквизитами'); }
        else if (lineAction === 'exit_off') { setExitActive(false); }
        setLineModalOpen(false);
    }

    // ====== Плашка (по scope храним отдельно, но без подписи про scope) ======
    // ===== Рабочий резерв (публичный/приватный) =====
    const [cardEditing, setCardEditing] = useState(false);
    const [cardSaving, setCardSaving] = useState(false);
    const [cardValue, setCardValue] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const r = (scope === 'private' && isAdmin)
                    ? await getMyPrivateReserve()
                    : await getPublicReserve();
                if (!cancelled) setCardValue(Number(r.amount) || 0);
            } catch {
                if (!cancelled) setCardValue(0);
            }
        })();
        return () => { cancelled = true; };
    }, [scope, isAdmin]);

    useEffect(() => { if (!editable && cardEditing) setCardEditing(false); }, [editable, cardEditing]);

    function openCardEdit() {
        if (!editable) return;
        setCardEditing(true);
    }

    async function commitCardEdit() {
        if (!editable) return;
        try {
            setCardSaving(true);
            // cardValue уже число
            const num = Number(cardValue);
            if (!Number.isFinite(num)) {
                toast.error('Некорректное число');
                return;
            }
            const r = (scope === 'private' && isAdmin)
                ? await updateMyPrivateReserve(num)
                : await updatePublicReserve(num);

            setCardValue(Number(r.amount) || num);
            setCardEditing(false);
            toast.success('Сохранено');
        } catch {
            toast.error('Не удалось сохранить резерв');
        } finally {
            setCardSaving(false);
        }
    }


    // ====== Кошелёк ======
    const [walletOpen, setWalletOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    function openWalletModal() { try { setSelectedWallet(getRandomWallet(WALLETS)); } catch { setSelectedWallet(null); } setWalletOpen(true); }
    function closeWalletModal() { setWalletOpen(false); }

    return (
        <div className="workzone-container">
            <Breadcrumbs />

            <div className="rq-header workzone-header">
                <h2 className="page-title">Рабочая зона</h2>

                {editable && (
                    <div className="mode-switch">
                        <label>
                            <input
                                type="radio" name="wz-scope" value="public"
                                checked={scope === 'public'} onChange={() => setScope('public')}
                                disabled={cardSaving}
                            />
                            Публичный
                        </label>
                        <label>
                            <input
                                type="radio" name="wz-scope" value="private"
                                checked={scope === 'private'} onChange={() => setScope('private')}
                                disabled={cardSaving}
                            />
                            Приватный (мой)
                        </label>
                    </div>
                )}

                <button className="add-bundle-btn" onClick={() => setShowAdd(true)} type="button">
                    <span className="plus">+</span> Добавить связку
                </button>
            </div>

            {/* верхняя полоса */}
            {/* ===== верх: слева две кнопки, справа — плашка + кнопка кошелька ===== */}
            {/* ===== блок управления: первая строка с кнопками, ниже — резерв + кошелёк ===== */}
            <div className="wz-top-row">
                {/* 1) Линии */}
                <button
                    type="button"
                    className={`line-cta ${entryActive ? 'is-active' : ''}`}
                    onClick={() => openLineModal(entryActive ? 'entry_off' : 'entry_on')}
                    title={entryActive ? 'Выключить вход' : 'Встать на вход'}
                >
                    <span className="dot" aria-hidden />
                    <span className="label">
                        {entryActive ? 'На линии — следите за реквизитами' : 'Встать на вход'}
                    </span>
                    {entryActive && <span className="badge">АКТИВНО</span>}
                </button>

                <button
                    type="button"
                    className={`line-cta danger ${exitActive ? 'is-active' : ''}`}
                    onClick={() => openLineModal(exitActive ? 'exit_off' : 'exit_on')}
                    title={exitActive ? 'Выключить выход' : 'Встать на выход'}
                >
                    <span className="dot" aria-hidden />
                    <span className="label">
                        {exitActive ? 'На линии — следите за реквизитами' : 'Встать на выход'}
                    </span>
                    {exitActive && <span className="badge">АКТИВНО</span>}
                </button>

                {/* 2) Справа — плашка и кнопка (ровно 70% / 25%) */}
                <div className={`wz-small-card wz-cta-skin ${editable ? 'is-editable' : ''}`}>
                    <div className="wz-reserve-title">Рабочий резерв</div>

                    {!cardEditing ? (
                        <button
                            type="button"
                            className={`wz-small-value-btn ${editable ? 'clickable' : ''}`}
                            title={editable ? 'Нажмите, чтобы изменить' : ''}
                            onClick={editable ? openCardEdit : undefined}
                        >
                            {cardValue} <span className="wz-usdt">USDT</span>
                        </button>
                    ) : (
                        <input
                            className="wz-small-input"
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={Number.isFinite(cardValue) ? String(cardValue) : ''}
                            onChange={(e) => {
                                const v = e.target.value.replace(',', '.');
                                setCardValue(v === '' ? 0 : Number(v));
                            }}
                            onBlur={commitCardEdit}
                            onKeyDown={(e) => e.key === 'Enter' && commitCardEdit()}
                            disabled={cardSaving}
                            autoFocus
                        />
                    )}
                </div>

                <button className="wz-wallet-btn wz-cta-skin" type="button" onClick={openWalletModal}>
                    Кошелек
                </button>
            </div>



            {loading && <Spinner center label="Загрузка…" size={30} />}
            {err && !loading && <div className="no-bundles">{err}</div>}

            {!loading && !err && (links.length === 0 ? (
                <div className="no-bundles">Связок пока нет</div>
            ) : (
                <div className="bundles-list bz-list">
                    {links.map(link => {
                        const v = nums(link);
                        return (
                            <BundleCard
                                key={link.id}
                                link={link}
                                v={v}
                                onEdit={() => setEditingBundle(link)}
                                onDelete={() => handleDelete(link.id)}
                            />
                        );
                    })}
                </div>
            ))}

            {showAdd && (
                <AddLinkModal
                    isOpen={showAdd}
                    onClose={async () => { setShowAdd(false); await fetchLinks(); }}
                    onCreated={(createdFull) => setLinks(prev => [...prev, createdFull])}
                />
            )}

            {editingBundle && (
                <EditLinkModal
                    bundle={editingBundle}
                    onClose={async () => { setEditingBundle(null); await fetchLinks(); }}
                    onSave={handleSave}
                />
            )}

            <ImportantLineModal
                open={lineModalOpen}
                onCancel={closeLineModal}
                onContinue={continueLine}
                title={modalTitle}
                message={modalMessage}
                continueText={modalContinueText}
                cancelText="Отменить"
            />

            <WalletModal
                open={walletOpen}
                onClose={closeWalletModal}
                wallet={selectedWallet}
                onCopySuccess={() => toast.success('Адрес скопирован')}
                onCopyError={() => toast.error('Не удалось скопировать адрес')}
            />
        </div>
    );
}

