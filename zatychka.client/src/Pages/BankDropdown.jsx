import React, { useState, useEffect, useRef } from 'react';
import { banks } from '../constants/banks';
import './BankDropdown.css';

const BankDropdown = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const filteredBanks = banks.filter(bank =>
        bank.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (bankName) => {
        onChange(bankName);
        setOpen(false);
        setSearch('');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedBank = banks.find(bank => bank.name === value);

    return (
        <div className="bank-dropdown" ref={dropdownRef}>
            <div className="bank-dropdown-selected" onClick={() => setOpen(!open)}>
                {selectedBank?.logo && (
                    <img src={selectedBank.logo} alt={selectedBank.name} className="bank-logo" />
                )}
                {selectedBank?.name || 'Выберите банк'}
                <span className="arrow">▾</span>
            </div>

            {open && (
                <div className="bank-dropdown-menu">
                    <input
                        type="text"
                        placeholder="Поиск..."
                        className="bank-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <ul className="bank-list">
                        {filteredBanks.map((bank, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelect(bank.name)}
                                className={value === bank.name ? 'selected' : ''}
                            >
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
    );
};

export default BankDropdown;
