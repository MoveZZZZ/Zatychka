import React, { useState, useEffect, useRef } from 'react';
import './Notifications.css';
import { banks } from '../constants/banks';

import BR from '../assets/icons/ros.png';
import ABS from '../assets/icons/abs.png';
import Alfa from '../assets/icons/alfa.png';
import Alif from '../assets/icons/alif.png';
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

    // Закрытие по клику вне
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

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            <Breadcrumbs/>
            <h2 className="notifications-title">Уведомлений пока нет</h2>

            <div className="notification-filters">
                <div className="filter-dropdown" ref={typeRef}>
                    <button
                        className="filter-button"
                        onClick={() => {
                            setTypeDropdownOpen(prev => !prev);
                            setBankDropdownOpen(false); // закрыть банк
                        }}
                    >
                        {selectedType} ▾
                    </button>

                    {typeDropdownOpen && (
                        <div className="dropdown-menu">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="dropdown-search"
                                value={typeSearch}
                                onChange={(e) => setTypeSearch(e.target.value)}
                            />
                            <ul className="dropdown-list">
                                {filteredTypes.map((type, index) => (
                                    <li key={index} onClick={() => handleSelectType(type)}>
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
                        onClick={() => {
                            setBankDropdownOpen(prev => !prev);
                            setTypeDropdownOpen(false); // закрыть тип
                        }}
                    >
                        {selectedBank} ▾
                    </button>

                    {bankDropdownOpen && (
                        <div className="dropdown-menu">
                            <input
                                type="text"
                                placeholder="Поиск..."
                                className="dropdown-search"
                                value={bankSearch}
                                onChange={(e) => setBankSearch(e.target.value)}
                            />
                            <ul className="dropdown-list">
                                {filteredBanks.map((bank, index) => (
                                    <li key={index} onClick={() => handleSelectBank(bank.name)}>
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
