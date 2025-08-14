import React, { useState } from 'react';
import './EditDeviceModal.css';
import { useToast } from '../context/ToastContext';
const EditDeviceModal = ({ device, onClose, onUpdate, onDelete }) => {
    const toast = useToast();
    const [name, setName] = useState(device.name || '');
    const [loadingChange, setLoadingChange] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [err, setErr] = useState(null);

    const handleUpdate = async () => {
        if (!name.trim()) return;
        setErr(null);
        try {
            const res = await fetch(`https://localhost:5132/api/devices/${device.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const updated = await res.json();
            onUpdate?.(updated);
            setLoadingChange(true); await new Promise(r => setTimeout(r, 1800)); setLoadingChange(true);
            toast.success('Изменения сохранены');
            onClose();
        } catch (e) {
            setErr('Не удалось изменить устройство');
            toast.error('Не удалось изменить устройство');
        } finally {
        }
    };

    const handleDelete = async () => {
        setErr(null);
        try {
            const res = await fetch(`https://localhost:5132/api/devices/${device.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
            onDelete?.(device.id);
            setLoadingDelete(true); await new Promise(r => setTimeout(r, 1800)); setLoadingDelete(true);
            toast.success('Устройство удалено');
            onClose();
        } catch (e) {
            setErr('Не удалось удалить устройство');
            toast.error('Не удалось удалить устройство');
        } finally {
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Изменение устройства</h2>

                <input
                    type="text"
                    className="modal-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loadingDelete}
                />


                <button className="modal-action" onClick={handleUpdate} disabled={loadingChange}>
                    {loadingChange ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="btn-spinner" aria-label="Загрузка" />
                            Сохраняем…
                        </span>
                    ) : 'Изменить устройство'}
                </button>

                <button className="modal-delete" onClick={handleDelete} disabled={loadingDelete}>
                    {loadingDelete ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="btn-spinner" aria-label="Загрузка" />
                            Удаляем…
                        </span>
                    ) : 'Удалить устройство'}
                </button>
            </div>
        </div>
    );
};

export default EditDeviceModal;
