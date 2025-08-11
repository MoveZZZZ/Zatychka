// src/Pages/AddOwnerModal.jsx
import React, { useState } from 'react';
import './AddOwnerModal.css';
import { banks } from '../constants/banks';
import { addOwner } from '../api/owners';
import { useToast } from '../context/ToastContext';
import BankDropdown from './BankDropdown'; 
const AddOwnerModal = ({ onClose, onAdded }) => {
    const toast = useToast();
    const [form, setForm] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
    });
    const [selectedBankName, setSelectedBankName] = useState(''); // Храним bank.name
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');

        if (!form.lastName.trim() || !form.firstName.trim()) {
            toast.error('Введите фамилию и имя');
            setErr('Введите фамилию и имя');
            return;
        }

        const bankName = selectedBankName.trim();
        if (!bankName || bankName === 'Не выбран') {
            toast.error('Выберите банк.');
            return;
        }

        const payload = {
            lastName: form.lastName.trim(),
            firstName: form.firstName.trim(),
            middleName: form.middleName.trim() || null,
            bankName, // Используем selectedBankName
        };

        setLoading(true);
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
            toast.success('Владелец добавлен');
            onClose();
        } catch (e) {
            setErr(e?.message || 'Не удалось добавить владельца');
            toast.error('Не удалось добавить владельца');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Добавить нового владельца</h2>
                <form onSubmit={handleSubmit} className="owner-form">
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Фамилия"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        name="firstName"
                        placeholder="Имя"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        name="middleName"
                        placeholder="Отчество или второе имя владельца (при наличии)"
                        value={form.middleName}
                        onChange={handleChange}
                        disabled={loading}
                    />

                    <BankDropdown
                        value={selectedBankName}
                        onChange={setSelectedBankName}
                    />

                    {err && <div className="form-error">{err}</div>}

                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Добавляем…' : 'Добавить'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddOwnerModal;
