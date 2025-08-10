import React, { useState } from 'react';
import './QuasiPage.css';
import Breadcrumbs from '../components/Breadcrumbs';

const tabs = ['Все', 'В работе', 'Свободные'];

const sampleTransactions = [
    {
        id: 'TX-001',
        date: '08.08.2025 13:45',
        status: 'Создана',
        requisites: 'Карта VISA •••• 1234',
        requester: 'Trader123',
        info: 'Ожидает оплаты',
        sum: '500 USDT',
        type: 'В работе'
    },
    {
        id: 'TX-002',
        date: '08.08.2025 11:20',
        status: 'Ожидает оплаты',
        requisites: 'BTC Wallet',
        requester: 'TraderX',
        info: 'Ожидает 3-DS',
        sum: '1200 USDT',
        type: 'Все'
    },
    {
        id: 'TX-003',
        date: '07.08.2025 19:05',
        status: 'Ожидает спор админа',
        requisites: 'USDT TRC-20',
        requester: 'CryptoGuy',
        info: 'Спор открыт',
        sum: '800 USDT',
        type: 'Свободные'
    }
];

const quasiStatuses = [
    'Создана',
    'Ожидает оплаты',
    'Ожидает 3-DS',
    'Ожидает спор трейдера',
    'Ожидает спор админа',
    'Ожидает спор мерчанта',
    'Подтверждена',
    'Отменена',
];

const QuasiPage = () => {
    const [selectedTab, setSelectedTab] = useState('Все');
    const [searchId, setSearchId] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');

    const toggleStatus = (status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };

    const filteredStatuses = quasiStatuses.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase())
    );

    const filteredTransactions = sampleTransactions.filter(tx =>
        (selectedTab === 'Все' || tx.type === selectedTab) &&
        (searchId === '' || tx.id.toLowerCase().includes(searchId.toLowerCase())) &&
        (selectedStatuses.length === 0 || selectedStatuses.includes(tx.status))
    );

    return (
        <div className="quasi-container">
            <Breadcrumbs/>
            <h2 className="page-title">Quasi-приём</h2>

            <div className="tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${selectedTab === tab ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="transactions-filters">
                <div className="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37" /></svg>
                    <input
                        type="text"
                        placeholder="ID транзакции"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                </div>

                <div className="status-dropdown-wrapper">
                    <div
                        className="status-dropdown"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
                        {selectedStatuses.length > 0
                            ? `Выбрано: ${selectedStatuses.length}`
                            : 'Статус'}
                        <span className="arrow">▼</span>
                    </div>

                    {dropdownOpen && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Поиск..."
                                className="dropdown-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {filteredStatuses.map((status) => (
                                <div
                                    key={status}
                                    className="dropdown-item"
                                    onClick={() => toggleStatus(status)}
                                >
                                    <span>{status}</span>
                                    {selectedStatuses.includes(status) && (
                                        <span className="checkmark">✔</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="transactions-table">
                <div className="table-header">
                    <span>ID и дата</span>
                    <span>Статус</span>
                    <span>Реквизиты</span>
                    <span>Запросите</span>
                    <span>Информация</span>
                </div>
                {filteredTransactions.length === 0 ? (
                    <div className="no-transactions">
                        <div className="icon">🍽️</div>
                        <div>Транзакций пока нет</div>
                    </div>
                ) : (
                    filteredTransactions.map(tx => (
                        <div key={tx.id} className="transaction-row">
                            <span>{tx.id}<br /><small>{tx.date}</small></span>
                            <span>{tx.status}</span>
                            <span>{tx.requisites}</span>
                            <span>{tx.requester}</span>
                            <span>{tx.info}<br /><b>{tx.sum}</b></span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuasiPage;
