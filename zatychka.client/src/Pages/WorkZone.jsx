import React, { useEffect, useState } from 'react';
import './WorkZone.css';
import AddLinkModal from './AddLinkModal';
import EditLinkModal from './EditLinkModal';
import Breadcrumbs from '../components/Breadcrumbs';
import Spinner from '../components/Spinner';
import {
    listLinks,
    deleteLink as apiDeleteLink,
    updateLink as apiUpdateLink,
} from '../api/links';
import { useToast } from '../context/ToastContext';

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
        <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3 6a3 3 0 0 1 3-3h10a1 1 0 1 1 0 2H6a1 1 0 0 0-1 1v1h14a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zM20 10H6v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1zM16 12h3v3h-3a1.5 1.5 0 0 1 0-3Z" />
        </svg>
    );
}
function IconTx() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="m8.5 3l-3 3l3 3V7h7v3l3-3l-3-3v2h-7V3Zm7 11H8v-2l-3 3l3 3v-2h7v2l3-3l-3-3v2Z" />
        </svg>
    );
}
function IconClock() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M11 7h2v6h-4v-2h2zm1-5a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z" />
        </svg>
    );
}
function IconUsers() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24">
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

function initialsFrom(text = '') {
    const s = String(text).trim();
    if (!s) return '∑';
    const parts = s.split(/\s+/);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
}
function avatarContent(link) {
    const label = String(link?.requisiteLabel || '').toLowerCase();
    const req = link?.requisite || link?.requisiteInfo;
    const reqType = String(req?.type || '').toLowerCase();

    // сначала пытаемся распознать по requisiteLabel
    if (/(email|почта)/i.test(label)) return '✉️';
    if (/(phone|тел(ефон)?)/i.test(label)) return '📞';
    if (/(card|карта|visa|master(card)?|mc)/i.test(label)) return '💳';

    // затем по типу реквизита (если label пустой)
    if (reqType === 'email') return '✉️';
    if (reqType === 'phone') return '📞';
    if (reqType === 'card') return '💳';

    // дефолт
    return '⚙️';
}
function BundleCard({ link, v, onEdit, onDelete }) {
    const deviceName =
        link.device?.name ||
        link.deviceName ||
        (link.deviceId ? `Устройство #${link.deviceId}` : 'Без устройства');

    const typeMap = { Card: 'Карта', Phone: 'Телефон', Email: 'Email' };
    const reqText = link.requisiteLabel ? link.requisiteLabel : 'Реквизит не указан';

    return (
        <div className="bundle-card bz-card">
            {/* Верхняя акцентная полоска */}
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
                    <button className="bz-btn ghost" onClick={onEdit} type="button" title="Изменить">
                        Изменить
                    </button>
                    <button className="bz-btn danger" onClick={onDelete} type="button" title="Удалить">
                        Удалить
                    </button>
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

/* ===================== page ===================== */
export default function WorkZone() {
    const toast = useToast();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toggleFor, setToggleFor] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const data = await listLinks();
                console.log(data);
                if (!cancelled) setLinks(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setErr('Не удалось загрузить связки');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function handleDelete(id) {
        const prev = links;
        setLinks(prev.filter(l => l.id !== id));
        try {
            await apiDeleteLink(id);
            toast.success('Связка удалена');
        } catch (e) {
            setLinks(prev);
            toast.error(e?.message || 'Не удалось удалить связку');
        }
    }

    async function handleSave(updated) {
        const saved = await apiUpdateLink(updated.id, updated);
        setLinks(prev => prev.map(l => (l.id === saved.id ? { ...l, ...saved } : l)));
        toast.success('Связка обновлена');
        return saved;
    }

    return (
        <div className="workzone-container">
            <Breadcrumbs />
            <div className="workzone-header">
                <h2 className="page-title">Рабочая зона</h2>
                <button className="add-bundle-btn" onClick={() => setShowAdd(true)} type="button">
                    <span className="plus">+</span> Добавить связку
                </button>
            </div>

            {loading && <Spinner center label="Загрузка…" size={30} />}

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
                                onEdit={() => setEditing(link)}
                                onDelete={() => handleDelete(link.id)}
                            />
                        );
                    })}
                </div>
            ))}

            {showAdd && (
                <AddLinkModal
                    isOpen={showAdd}
                    onClose={() => setShowAdd(false)}
                    onCreated={(createdFull) => setLinks(prev => [...prev, createdFull])}
                />
            )}

            {editing && (
                <EditLinkModal
                    bundle={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleSave}
                />
            )}

            {toggleFor && (
                <div className="wz-tmp-modal" onClick={() => setToggleFor(null)}>
                    <div className="wz-tmp-box" onClick={e => e.stopPropagation()}>
                        <h3>Управление связкой</h3>
                        <p>ID: {toggleFor.id}</p>
                        <p>Здесь будет модалка с опциями (позже).</p>
                        <button onClick={() => setToggleFor(null)} type="button">Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    );
}
