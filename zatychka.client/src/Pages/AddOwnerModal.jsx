import React, { useState } from 'react';
import './AddOwnerModal.css';
import { addOwner } from '../api/owners';
import { useToast } from '../context/ToastContext';
import BankDropdown from './BankDropdown';

const AddOwnerModal = ({ onClose, onAdded }) => {
    const toast = useToast();

    const [form, setForm] = useState({ lastName: '', firstName: '', middleName: '' });
    const [selectedBankName, setSelectedBankName] = useState('');
    const [err, setErr] = useState('');
    const [addOwnerLoading, setAddOwnerLoading] = useState(false);
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');

        if (!form.lastName.trim() || !form.firstName.trim()) {
            toast.error('Введите фамилию и имя');
            setErr('Введите фамилию и имя');
            return;
        }

        const bankName = (selectedBankName || '').trim();
        if (!bankName || bankName === 'Не выбран') {
            toast.error('Выберите банк.');
            return;
        }

        const payload = {
            lastName: form.lastName.trim(),
            firstName: form.firstName.trim(),
            middleName: form.middleName.trim() || null,
            bankName,
        };


        try {
            const created = await addOwner(payload);
            onAdded?.({
                id: created.id,
                firstName: payload.firstName,
                lastName: payload.lastName,
                middleName: payload.middleName,
                bankName: payload.bankName,
                requisites: [],
            });
            setAddOwnerLoading(true); await new Promise(r => setTimeout(r, 1800)); setAddOwnerLoading(true);
            toast.success('Владелец добавлен');
            onClose();
        } catch (e) {
            toast.error('Не удалось добавить владельца');
        } finally {
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-window"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-owner-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="add-owner-title" className="modal-title">Добавить нового владельца</h2>

                <form onSubmit={handleSubmit} className="owner-form">
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Фамилия"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        disabled={addOwnerLoading}
                        autoFocus
                    />
                    <input
                        type="text"
                        name="firstName"
                        placeholder="Имя"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        disabled={addOwnerLoading}
                    />
                    <input
                        type="text"
                        name="middleName"
                        placeholder="Отчество или второе имя владельца (при наличии)"
                        value={form.middleName}
                        onChange={handleChange}
                        disabled={addOwnerLoading}
                    />

                    <div className="owner-bank-dropdown-wrap">
                        <BankDropdown value={selectedBankName} onChange={setSelectedBankName} />
                    </div>

                    <button type="submit" className="submit-button" disabled={addOwnerLoading}>
                        {addOwnerLoading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span className="btn-spinner" aria-label="Загрузка" />
                                Добавляем…
                            </span>
                        ) : 'Добавить'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddOwnerModal;
