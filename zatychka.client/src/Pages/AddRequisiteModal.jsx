import React, { useState, useEffect } from 'react';
import './AddRequisiteModal.css';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';
import { banks } from '../constants/banks';
import { useToast } from '../context/ToastContext';
const TYPE_MAP = { card: 'Card', phone: 'Phone', email: 'Email' };

export default function AddRequisiteModal({ owner, onClose, onAdd }) {
    const toast = useToast();
    const [type, setType] = useState('');
    const [value, setValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');

    const getBankLogo = (bankName) => {
        const bank = banks.find((b) => b.name === bankName);
        return bank?.logo || null;
    };

    const formatOwnerName = (o) => {
        const l = o?.lastName ?? '';
        const f = o?.firstName ? `${o.firstName[0]}.` : '';
        const m = o?.middleName ? ` ${o.middleName[0]}.` : '';
        return `${l} ${f}${m}`.trim();
    };

    const requisitesTypes = [
        { value: 'card', label: 'Номер карты' },
        { value: 'phone', label: 'Номер телефона' },
        { value: 'email', label: 'E-mail' },
    ];

    const [search, setSearch] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const filteredTypes = requisitesTypes.filter(t =>
        t.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.type-dropdown-wrapper')) {
                setShowTypeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleSubmit(e) {
        e?.preventDefault?.();
        setErr('');

        if (!type) { toast.error('Выберите тип реквизита'); return; }
        if (!value.trim()) {toast.error('Укажите значение'); return; }

        const apiType = TYPE_MAP[type]; // приводим к формату бэка
        try {
            setSubmitting(true);
            await onAdd({ type: apiType, value: value.trim(), ownerId: owner.id });
            toast.success('Реквезит успешно добавлен')
            onClose(); 
        } catch (e) {
            toast.error(e?.message||'Не удалось добавить реквизит');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="add-requisite-modal-overlay" onClick={() => !submitting && onClose()}>
            <div className="add-requisite-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Добавить новый реквизит</h2>

                <div className="owner-preview">
                    {getBankLogo(owner.bankName) && (
                        <img src={getBankLogo(owner.bankName)} alt={owner.bankName} className="bank-icon" />
                    )}
                    <div className="owner-info">
                        <span className="bank-name">{owner.bankName}</span>
                        <strong className="owner-name">{formatOwnerName(owner)}</strong>
                    </div>
                </div>

                <div className="type-dropdown-wrapper">
                    <div
                        className="bank-dropdown-selected"
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    >
                        {requisitesTypes.find(t => t.value === type)?.label || 'Выберите тип реквизита'}
                        <span className="arrow">▼</span>
                    </div>

                    {showTypeDropdown && (
                        <div className="bank-dropdown-menu">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                className="add-requisite-modal-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <ul className="bank-list">
                                {filteredTypes.map((t) => (
                                    <li
                                        key={t.value}
                                        className={type === t.value ? 'selected' : ''}
                                        onClick={() => {
                                            setType(t.value);
                                            setShowTypeDropdown(false);
                                            setSearch('');
                                        }}
                                    >
                                        {t.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {type === 'phone' ? (
                    <PhoneInput
                        value={value}
                        onChange={setValue}
                        inputClass="phone-input"
                        buttonClass="flag-dropdown"
                        containerClass="phone-input"
                        preferredCountries={['ru']}
                        disabled={submitting}
                    />
                ) : (
                    <input
                        type={type === 'email' ? 'email' : 'text'}
                        placeholder="Укажите реквизит"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="other-input"
                        disabled={submitting}
                    />
                )}


                <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Добавляем…' : 'Добавить'}
                </button>
            </div>
        </div>
    );
}
