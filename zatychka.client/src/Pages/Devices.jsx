import React, { useEffect, useState } from 'react';
import './Devices.css';
import AddDeviceModal from './AddDeviceModal';
import { WifiOff, ChevronRight } from 'lucide-react';
import EditDeviceModal from './EditDeviceModal';
import { getDevices } from '../api/devices';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Devices() {
    const [showModal, setShowModal] = useState(false);
    const [devices, setDevices] = useState([]);         
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null); 
    const [error, setError] = useState('');

    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                const data = await getDevices();
                if (!ac.signal.aborted) setDevices(data);
            } catch (e) {
                if (e.name !== 'AbortError') setError('Не удалось загрузить устройства');
            }
        })();
        return () => ac.abort();
    }, []);

    const handleUpdateDevice = (updated) =>
        setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));

    const handleDeleteDevice = (id) =>
        setDevices(prev => prev.filter(d => d.id !== id));

    return (
        <div className="devices-page">
            <Breadcrumbs/>
            <div className="devices-header">
                <h2 className="page-title">
                    {devices.length > 0 ? 'Устройства' : 'Устройств пока нет'}
                </h2>
                <button className="add-device-btn" onClick={() => setShowModal(true)}>
                    + Добавить устройство
                </button>
            </div>


            <div className="devices-table">
                <div className="devices-row devices-header-row">
                    <div className="device-col status">Статус</div>
                    <div className="device-col name">Название</div>
                    <div className="device-col model">Модель</div>
                    <div className="device-col actions" />
                </div>

                {devices.length === 0 ? (
                    <div className="empty-message-table">Устройств пока нет</div>
                ) : (
                    devices.map(device => (
                        <div key={device.id} className="devices-row">
                            <div className="device-col status">
                                <WifiOff size={20} className="offline-icon" />
                                <span className="status-label offline">Офлайн</span>
                            </div>
                            <div className="device-col name">{device.name}</div>
                            <div className="device-col model">{device.model || ''}</div>
                            <div className="device-col actions">
                                <button
                                    className="arrow-btn"
                                    onClick={() => { setSelectedDevice(device); setEditModalOpen(true); }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {editModalOpen && selectedDevice && (
                <EditDeviceModal
                    device={selectedDevice}
                    onClose={() => setEditModalOpen(false)}
                    onUpdate={handleUpdateDevice}
                    onDelete={handleDeleteDevice}
                />
            )}

            {showModal && (
                <AddDeviceModal
                    onClose={() => setShowModal(false)}
                    onAdded={(created) => setDevices(prev => [...prev, created])}
                />
            )}
        </div>
    );
}
