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

export default function Requisites() {
    const [owners, setOwners] = useState([]); // [{id, firstName,lastName,middleName,bankName,requisites:[{id,type,value}]}]
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
            toast.success("Реквизит удален")
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
            toast.success("Владелец удален")
        } finally {
            setEditOwner(null);
        }
    }

    return (
        <div className="requisites-page">
            <Breadcrumbs/>
            <div className="requisites-header">
                <h2>Реквизиты</h2>
                <button className="add-owner-button" onClick={() => setShowAddOwner(true)}>
                    + Добавить владельца
                </button>
            </div>

            {loading && <Spinner center label="Загрузка…" size={30} />}
            {err && <p className="error">{err}</p>}

            {!loading && owners.length === 0 ? (
                <p className="empty-message-table">Владельцев пока нет</p>
            ) : (
                    <div className="requisites-grid">
                        {owners.map((o) => (
                            <div key={o.id} className="owner-card">
                                <div className="owner-header">
                                    <div className="owner-left">
                                        {getBankLogo(o.bankName) && (
                                            <img
                                                src={getBankLogo(o.bankName)}
                                                alt={o.bankName}
                                                className="bank-badge"
                                            />
                                        )}
                                        <div className="owner-meta">
                                            <div className="owner-title">{shortFio(o)}</div>
                                            <div className="owner-sub">{o.bankName}</div>
                                        </div>
                                    </div>

                                    <div className="owner-actions">
                                        <button
                                            className="btn-ghost"
                                            onClick={() => setAddReqOwner(o)}
                                            title="Добавить реквизит"
                                        >
                                            + Реквизит
                                        </button>
                                        <button
                                            className="btn-ghost"
                                            onClick={() => setEditOwner(o)}
                                            title="Редактировать владельца"
                                        >
                                            Редактировать
                                        </button>
                                    </div>
                                </div>

                                {(o.requisites && o.requisites.length > 0) ? (
                                    <div className="requisites-chips">
                                        {o.requisites.map(r => (
                                            <div key={r.id} className="chip">
                                                <span className="chip-type">{humanType(r.type)}</span>
                                                <span className="chip-value">{r.type === 'phone' ? "+"+r.value : r.value}</span>
                                                <div className="chip-actions">
                                                    <button
                                                        className="chip-btn"
                                                        onClick={() => navigator.clipboard?.writeText(r.value)}
                                                        title="Копировать"
                                                    >
                                                        ⧉
                                                    </button>
                                                    <button
                                                        className="chip-btn danger"
                                                        onClick={() => handleDeleteRequisite(o.id, r.id)}
                                                        title="Удалить"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="requisites-empty">Реквизитов пока нет</div>
                                )}
                            </div>
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
