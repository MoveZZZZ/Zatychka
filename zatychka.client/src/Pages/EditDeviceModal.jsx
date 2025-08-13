import React, { useState } from 'react';
import './EditDeviceModal.css';
import { useToast } from '../context/ToastContext';
const EditDeviceModal = ({ device, onClose, onUpdate, onDelete }) => {
    const toast = useToast();
    const [name, setName] = useState(device.name || '');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);

    const handleUpdate = async () => {
        if (!name.trim()) return;
        setLoading(true);
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
            toast.success('Изменения сохранены');
            onClose();
        } catch (e) {
            setErr('Не удалось изменить устройство');
            toast.error('Не удалось изменить устройство');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch(`https://localhost:5132/api/devices/${device.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
            onDelete?.(device.id);
            toast.success('Устройство удалено');
            onClose();
        } catch (e) {
            setErr('Не удалось удалить устройство');
            toast.error('Не удалось удалить устройство');
        } finally {
            setLoading(false);
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
                    disabled={loading}
                />


                <button className="modal-action" onClick={handleUpdate} disabled={loading}>
                    {loading ? 'Сохраняем…' : 'Изменить устройство'}
                </button>

                <button className="modal-delete" onClick={handleDelete} disabled={loading}>
                    {loading ? 'Удаляем…' : 'Удалить устройство'}
                </button>
            </div>
        </div>
    );
};

export default EditDeviceModal;
