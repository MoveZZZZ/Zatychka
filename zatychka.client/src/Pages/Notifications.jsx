import React, { useState, useEffect, useRef } from 'react';
import './Notifications.css';
import { banks } from '../constants/banks';
import Breadcrumbs from '../components/Breadcrumbs';

const notificationTypes = ['Все', 'Важные', 'Приём', 'Неизвестные'];

const Notifications = () => {
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const [selectedType, setSelectedType] = useState('Тип');

    const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [selectedBank, setSelectedBank] = useState('Банк');

    const typeRef = useRef(null);
    const bankRef = useRef(null);

    // Закрытие по клику вне и по Esc
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                typeRef.current &&
                !typeRef.current.contains(event.target) &&
                bankRef.current &&
                !bankRef.current.contains(event.target)
            ) {
                setTypeDropdownOpen(false);
                setBankDropdownOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setTypeDropdownOpen(false);
                setBankDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const filteredTypes = notificationTypes.filter(type =>
        type.toLowerCase().includes(typeSearch.toLowerCase())
    );

    const filteredBanks = banks.filter(bank =>
        bank.name.toLowerCase().includes(bankSearch.toLowerCase())
    );

    const handleSelectType = (type) => {
        setSelectedType(type);
        setTypeDropdownOpen(false);
        setTypeSearch('');
    };

    const handleSelectBank = (bankName) => {
        setSelectedBank(bankName);
        setBankDropdownOpen(false);
        setBankSearch('');
    };

    return (
        <div className="notifications-page">
            <Breadcrumbs />

            <div className="notifications-header">
                <h2 className="notifications-title">Уведомлений пока нет</h2>
            </div>

            <div className="notification-filters">
                {/* Тип */}
                <div className="filter-dropdown" ref={typeRef}>
                    <button
                        className="filter-button"
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={typeDropdownOpen}
                        onClick={() => {
                            setTypeDropdownOpen(prev => !prev);
                            setBankDropdownOpen(false);
                        }}
                    >
                        {selectedType} ▾
                    </button>

                    {typeDropdownOpen && (
                        <div className="dropdown-menu">
                            <input
                                type="text"
                                placeholder="Поиск…"
                                className="dropdown-search-type-not"
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                            />
                            <ul className="dropdown-list" role="listbox">
                                {filteredTypes.map((type, index) => (
                                    <li key={index} onClick={() => handleSelectType(type)} role="option">
                                        {type}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Банк */}
                <div className="filter-dropdown" ref={bankRef}>
                    <button
                        className="filter-button"
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={bankDropdownOpen}
                        onClick={() => {
                            setBankDropdownOpen(prev => !prev);
                            setTypeDropdownOpen(false);
                        }}
                    >
                        {selectedBank} ▾
                    </button>

                    {bankDropdownOpen && (
                        <div className="dropdown-menu">
                            <input
                                type="text"
                                placeholder="Поиск банка…"
                                className="dropdown-search-bank-not"
                                value={bankSearch}
                                onChange={(e) => setBankSearch(e.target.value)}
                            />
                            <ul className="dropdown-list" role="listbox">
                                {filteredBanks.map((bank) => (
                                    <li key={bank.name} onClick={() => handleSelectBank(bank.name)} role="option">
                                        {bank.logo && (
                                            <img src={bank.logo} alt={bank.name} className="bank-logo" />
                                        )}
                                        {bank.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Поиск */}
                <div className="filter-search">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск..."
                    />
                </div>
            </div>
        </div>
    );
};

export default Notifications;
