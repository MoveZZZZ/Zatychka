import React, { useEffect, useState } from 'react';
import { banks } from '../constants/banks';
import './EditOwnerModal.css';
import { useToast } from '../context/ToastContext';
export default function EditOwnerModal({ owner, onClose, onSave, onDelete }) {
    const toast = useToast();
    const [lastName, setLastName] = useState(owner.lastName || '');
    const [firstName, setFirstName] = useState(owner.firstName || '');
    const [middleName, setMiddleName] = useState(owner.middleName || '');
    const [bankValue, setBankValue] = useState('');

    useEffect(() => {
        const v = banks.find(b => b.name === owner.bankName)?.value || '';
        setBankValue(v);
    }, [owner.bankName]);

    function handleSubmit(e) {
        e.preventDefault();

        const bankName =
            banks.find(b => b.value === bankValue)?.name || owner.bankName || '';

        onSave({
            id: owner.id,
            lastName: lastName.trim(),
            firstName: firstName.trim(),
            middleName: middleName.trim() || null,
            bankName, 
        });
        toast.success("Владелец изменен");

    }

    return (
        <div className="edit-owner-modal-overlay" onClick={onClose}>
            <div className="edit-owner-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Редактировать владельца</h2>

                <form onSubmit={handleSubmit} className="owner-form">
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Фамилия"
                        required
                    />
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Имя"
                        required
                    />
                    <input
                        type="text"
                        value={middleName || ''}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Отчество (если есть)"
                    />

                    <select
                        value={bankValue}
                        onChange={(e) => setBankValue(e.target.value)}
                        required
                    >
                        {banks.map((b, i) => (
                            <option key={i} value={b.value}>
                                {b.name}
                            </option>
                        ))}
                    </select>

                    <div className="modal-buttons">
                        <button type="submit" className="submit-button">Сохранить</button>
                        <button type="button" className="cancel-button" onClick={onClose}>Отмена</button>
                        <button type="button" className="danger-button" onClick={() => onDelete(owner.id)}>
                            Удалить владельца
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
