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
function DeviceLabel({ link }) {
    const name =
        link.device?.name ||
        link.deviceName ||
        (link.deviceId ? `Устройство #${link.deviceId}` : '—');
    return <span>{name}</span>;
}

function RequisiteLabel({ link }) {
    const r = link.requisite || link.requisiteInfo;
    if (!r) return <span>—</span>;
    const typeMap = { Card: 'Карта', Phone: 'Телефон', Email: 'Email' };
    const t = typeMap[r.type] || r.type || '';
    return <span>{t}: {r.value}</span>;
}


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
            toast.success("Связка удалена")
        } catch (e) {
            setLinks(prev);
            toast.success(e?.message || 'Не удалось удалить связку');
        }
    }

    async function handleSave(updated) {
        const saved = await apiUpdateLink(updated.id, updated);
        setLinks(prev => prev.map(l => (l.id === saved.id ? { ...l, ...saved } : l)));
        toast.success("Связка обновлена")
        return saved; 
    }

    return (
        <div className="workzone-container">
            <Breadcrumbs/>
            <div className="workzone-header">
                <h2 className="page-title">Рабочая зона</h2>
                <button className="add-bundle-btn" onClick={() => setShowAdd(true)}>
                    <span className="plus">+</span> Добавить связку
                </button>
            </div>

            {loading && <Spinner center label="Загрузка…" size={30} />}
            {err && <div className="no-bundles">{err}</div>}

            {!loading && !err && (links.length === 0 ? (
                <div className="no-bundles">Связок пока нет</div>
            ) : (
                <div className="bundles-list">
                    {links.map(link => {
                        const v = nums(link);
                        return (
                            <div key={link.id} className="bundle-card">
                                <h3 className="bundle-name">
                                    <DeviceLabel link={link} /> • <RequisiteLabel link={link} />
                                </h3>

                                <div className="bundle-details">
                                    <div>Мин: {v.min ?? 0} USDT</div>
                                    <div>Макс: {v.max ?? 0} USDT</div>

                                    <div>Транзакций/день: {v.txDay ?? 0}</div>
                                    <div>Транзакций/месяц: {v.txMonth ?? 0}</div>
                                    <div>Транзакций/всё: {v.txAll ?? 0}</div>

                                    <div>Приём/день: {v.amtDay ?? 0} USDT</div>
                                    <div>Приём/месяц: {v.amtMonth ?? 0} USDT</div>
                                    <div>Приём/всё: {v.amtAll ?? 0} USDT</div>

                                    <div>Макс. одновременных: {v.conc ?? 0}</div>
                                    <div>Минут между: {v.gap ?? 0}</div>
                                </div>

                                <div className="bundle-actions">
                                    <button onClick={() => setEditing(link)}>Изменить</button>
                                    <button className="delete" onClick={() => handleDelete(link.id)}>Удалить</button>
                                </div>
                            </div>
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
                        <button onClick={() => setToggleFor(null)}>Закрыть</button>
                    </div>
                </div>
            )}
        </div>
    );
}
