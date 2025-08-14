import React, { useEffect, useState } from 'react';
import './Requisites.css';
import AddOwnerModal from './AddOwnerModal';
import EditOwnerModal from './EditOwnerModal';
import AddRequisiteModal from './AddRequisiteModal';
import Spinner from '../components/Spinner';
import { banks } from '../constants/banks';
import { useToast } from '../context/ToastContext';
import {
    listOwners,
    addRequisite as apiAddRequisite,
    updateOwner as apiUpdateOwner,
    deleteOwner as apiDeleteOwner,
    updateRequisite as apiUpdateRequisite,
    deleteRequisite as apiDeleteRequisite,
} from '../api/owners';
import Breadcrumbs from '../components/Breadcrumbs';

/* ===== helpers ===== */
function getBankLogo(bankName) {
    const bank = banks.find(b => b.name === bankName);
    return bank?.logo || null;
}
function shortFio({ lastName, firstName, middleName }) {
    const i = firstName ? `${firstName[0]}.` : '';
    const o = middleName ? ` ${middleName[0]}.` : '';
    return `${lastName} ${i}${o}`.trim();
}
function humanType(t) {
    const s = String(t || '').toLowerCase();
    if (s === 'card') return 'Карта';
    if (s === 'phone') return 'Телефон';
    if (s === 'email') return 'Email';
    return s;
}

/* ===== icons ===== */
function RqTypeIcon({ type }) {
    const t = String(type || '').toLowerCase();
    if (t === 'email') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2m8 6l10-6H2z" />
            </svg>
        );
    }
    if (t === 'phone') {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M20 15.5c-1.25 0-2.45-.2-3.57-.58a1 1 0 0 0-.97.19l-2.2 1.65a15.05 15.05 0 0 1-6.62-6.62l1.65-2.2a1 1 0 0 0 .19-.97A11.4 11.4 0 0 1 8.5 4H5a1 1 0 0 0-1 1A15 15 0 0 0 19 20a1 1 0 0 0 1-1v-3.5z" />
            </svg>
        );
    }
    // card / default
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M20 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2M4 8v2h16V8z" />
        </svg>
    );
}

/* ===== small UI bits ===== */
function Tag({ children }) {
    return <span className="rq-tag">{children}</span>;
}

function ReqChip({ ownerId, req, onCopy, onDelete }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard?.writeText(req.value);
            setCopied(true);
            onCopy?.();
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // no-op
        }
    }

    return (
        <div className="rq-chip">
            <div className="rq-chip-ico">
                <RqTypeIcon type={req.type} />
            </div>
            <div className="rq-chip-main">
                <span className="rq-chip-label">{humanType(req.type)}</span>
                <span className="rq-chip-value">
                    {req.type === 'phone' ? `+${req.value}` : req.value}
                </span>
            </div>
            <div className="rq-chip-actions">
                <button className="rq-icon-btn" onClick={handleCopy} title="Копировать" type="button">
                    ⧉
                </button>
                <button className="rq-icon-btn danger" onClick={() => onDelete(ownerId, req.id)} title="Удалить" type="button">
                    ✕
                </button>
                {copied && <div className="rq-copied-pop">Скопировано</div>}
            </div>
        </div>
    );
}

function OwnerCard({
    owner,
    onAddReq,
    onEditOwner,
    onDeleteReq,
    onCopyReq,
}) {
    const logo = getBankLogo(owner.bankName);
    return (
        <div className="rq-card">
            <div className="rq-topbar" />
            <div className="rq-card-head">
                <div className="rq-owner">
                    {logo ? (
                        <img src={logo} alt={owner.bankName} className="rq-bank-logo" />
                    ) : (
                        <div className="rq-bank-logo placeholder" aria-hidden>₿</div>
                    )}
                    <div className="rq-owner-meta">
                        <div className="rq-owner-title">{shortFio(owner)}</div>
                        <div className="rq-owner-sub">
                            <Tag>Банк: {owner.bankName || '—'}</Tag>
                        </div>
                    </div>
                </div>

                <div className="rq-actions">
                    <button className="rq-btn ghost" onClick={() => onAddReq(owner)} type="button">
                        + Реквизит
                    </button>
                    <button className="rq-btn" onClick={() => onEditOwner(owner)} type="button">
                        Редактировать
                    </button>
                </div>
            </div>

            {(owner.requisites && owner.requisites.length > 0) ? (
                <div className="rq-chip-grid">
                    {owner.requisites.map(r => (
                        <ReqChip
                            key={r.id}
                            ownerId={owner.id}
                            req={r}
                            onDelete={onDeleteReq}
                            onCopy={onCopyReq}
                        />
                    ))}
                </div>
            ) : (
                <div className="rq-empty">Реквизитов пока нет</div>
            )}
        </div>
    );
}

/* ===== page ===== */
export default function Requisites() {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const toast = useToast();
    const [showAddOwner, setShowAddOwner] = useState(false);
    const [editOwner, setEditOwner] = useState(null);
    const [addReqOwner, setAddReqOwner] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await listOwners();
                if (!cancelled) setOwners(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!cancelled) setErr('Не удалось загрузить владельцев');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function handleAddRequisite(ownerId, { type, value }) {
        const saved = await apiAddRequisite(ownerId, { type, value });
        const created = {
            id: saved?.id ?? saved?.requisiteId,
            type: saved?.type ?? type,
            value: saved?.value ?? value,
        };
        setOwners(prev =>
            prev.map(o => {
                if (o.id !== ownerId) return o;
                const clean = (o.requisites || []).filter(Boolean);
                return { ...o, requisites: [...clean, created] };
            })
        );
    }

    async function handleUpdateRequisite(ownerId, reqId, { type, value }) {
        const updated = await apiUpdateRequisite(ownerId, reqId, { type, value });
        setOwners(prev => prev.map(o => {
            if (o.id !== ownerId) return o;
            return {
                ...o,
                requisites: (o.requisites || []).map(r => r.id === reqId ? updated : r),
            };
        }));
    }

    async function handleDeleteRequisite(ownerId, reqId) {
        await apiDeleteRequisite(ownerId, reqId);
        setOwners(prev => prev.map(o => {
            if (o.id !== ownerId) return o;
            toast.success('Реквизит удалён');
            return {
                ...o,
                requisites: (o.requisites || []).filter(r => r.id !== reqId),
            };
        }));
    }

    async function handleSaveOwner(updatedOwner) {
        try {
            await apiUpdateOwner(updatedOwner.id, {
                lastName: updatedOwner.lastName,
                firstName: updatedOwner.firstName,
                middleName: updatedOwner.middleName,
                bankName: updatedOwner.bankName,
            });
            setOwners(prev =>
                prev.map(o => (o.id === updatedOwner.id ? { ...o, ...updatedOwner } : o))
            );
        } finally {
            setEditOwner(null);
        }
    }

    async function handleDeleteOwner(id) {
        try {
            await apiDeleteOwner(id);
            setOwners(prev => prev.filter(o => o.id !== id));
            toast.success('Владелец удалён');
        } finally {
            setEditOwner(null);
        }а
    }


    return (
        <div className="requisites-page rq-page">
            <Breadcrumbs />
            <div className="rq-header">
                <h2 className="rq-title">Реквизиты</h2>
                <button className="rq-btn primary" onClick={() => setShowAddOwner(true)} type="button">
                    + Добавить владельца
                </button>
            </div>

            {err && <div className="rq-error">{err}</div>}
            {loading && <Spinner center label="Загрузка…" size={30} />}

            {!loading && owners.length === 0 ? (
                <p className="rq-empty-msg">Владельцев пока нет</p>
            ) : (
                <div className="rq-grid">
                    {owners.map((o) => (
                        <OwnerCard
                            key={o.id}
                            owner={o}
                            onAddReq={setAddReqOwner}
                            onEditOwner={setEditOwner}
                            onDeleteReq={handleDeleteRequisite}
                        />
                    ))}
                </div>
            )}

            {showAddOwner && (
                <AddOwnerModal
                    onClose={() => setShowAddOwner(false)}
                    onAdded={(owner) => setOwners(prev => [...prev, owner])}
                />
            )}

            {editOwner && (
                <EditOwnerModal
                    owner={editOwner}
                    onClose={() => setEditOwner(null)}
                    onSave={handleSaveOwner}
                    onDelete={() => handleDeleteOwner(editOwner.id)}
                />
            )}

            {addReqOwner && (
                <AddRequisiteModal
                    owner={addReqOwner}
                    onClose={() => setAddReqOwner(null)}
                    onAdd={async (payload) => {
                        await handleAddRequisite(addReqOwner.id, payload);
                    }}
                />
            )}
        </div>
    );
}
