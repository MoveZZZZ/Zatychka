import React, { useState } from 'react';
import './AddDeviceModal.css';
import { addDevice } from '../api/devices'; 
import { useToast } from '../context/ToastContext';

const AddDeviceModal = ({ onClose, onAdded }) => {
    const toast = useToast();
    const showToast = (type, msg) => setToast({ open: true, type, msg });
    const [deviceName, setDeviceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleAdd = async () => {
        const name = deviceName.trim().replace(/\s+/g, ' ');
        if (!name) return;

        setLoading(true);
        setErr('');

        try {
            const created = await addDevice(name);
            if (onAdded) onAdded(created);
            toast.success('Устройство добавленно');
            onClose();
        } catch (e) {
            const msg = e?.message || 'Не удалось добавить устройство';
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="device-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Добавить новое устройство</h2>
                <p>Укажите название вашего устройства</p>

                <input
                    className="device-modal-input"
                    type="text"
                    placeholder="Введите название устройства"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    disabled={loading}
                />


                <button className="modal-add-btn" onClick={handleAdd} disabled={loading}>
                    {loading ? 'Добавляем…' : 'Добавить'}
                </button>
            </div>
        </div>
    );
};

export default AddDeviceModal;
