import React, { useState, useEffect, useRef } from 'react';
import './QuasiPage.css';
import Breadcrumbs from '../components/Breadcrumbs';

const tabs = ['Все', 'В работе', 'Свободные'];

const sampleTransactions = [
    //{
    //    id: '1',
    //    date: '08.08.2025 13:45',
    //    status: 'Создана',
    //    requisites: 'Карта VISA •••• 1234',
    //    requester: 'Trader123',
    //    info: 'Ожидает оплаты',
    //    sum: '500 USDT',
    //    type: 'В работе',
    //},
    //{
    //    id: '2',
    //    date: '08.08.2025 11:20',
    //    status: 'Ожидает оплаты',
    //    requisites: 'BTC Wallet',
    //    requester: 'TraderX',
    //    info: 'Ожидает 3-DS',
    //    sum: '1200 USDT',
    //    type: 'Все',
    //},
    //{
    //    id: '3',
    //    date: '07.08.2025 19:05',
    //    status: 'Ожидает спор админа',
    //    requisites: 'USDT TRC-20',
    //    requester: 'CryptoGuy',
    //    info: 'Спор открыт',
    //    sum: '800 USDT',
    //    type: 'Свободные',
    //},
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

export default function QuasiPage() {
    const [selectedTab, setSelectedTab] = useState('Все');
    const [searchId, setSearchId] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [statusSearch, setStatusSearch] = useState('');

    const dropRef = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const toggleStatus = (status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        );
    };

    const filteredStatuses = quasiStatuses.filter((s) =>
        s.toLowerCase().includes(statusSearch.toLowerCase())
    );

    const filteredTransactions = sampleTransactions.filter(
        (tx) =>
            (selectedTab === 'Все' || tx.type === selectedTab) &&
            (searchId === '' || tx.id.toLowerCase().includes(searchId.toLowerCase())) &&
            (selectedStatuses.length === 0 || selectedStatuses.includes(tx.status))
    );

    return (
        <div className="quasi-container">
            <Breadcrumbs />
            <h2 className="page-title-quasi">Quasi-приём</h2>


            <div className="tabs">
                {tabs.map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`tab-btn ${selectedTab === t ? 'active' : ''}`}
                        onClick={() => setSelectedTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>


            <div className="transactions-filters">
                <div className="search-box">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path
                            fill="currentColor"
                            d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="ID транзакции"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                </div>

                <div className="status-dropdown-wrapper" ref={dropRef}>
                    <button
                        className="status-dropdown"
                        type="button"
                        onClick={() => setDropdownOpen((p) => !p)}
                        aria-expanded={dropdownOpen}
                    >
                        {selectedStatuses.length > 0
                            ? `Выбрано: ${selectedStatuses.length}`
                            : 'Статус'}
                        <span className="arrow">▼</span>
                    </button>

                    {dropdownOpen && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Поиск статуса…"
                                className="dropdown-search"
                                value={statusSearch}
                                onChange={(e) => setStatusSearch(e.target.value)}
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

            {/* Таблица с горизонтальным скроллом на узких */}
            <div className="disputes-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID и дата</th>
                            <th>Статус</th>
                            <th>Реквизиты</th>
                            <th>Запроситель</th>
                            <th>Информация</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="no-disputes">
                                    <div className="empty-message-table">Транзакций пока нет</div>
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span>{tx.id}</span>
                                            <small style={{ opacity: 0.7 }}>
                                                {tx.date
                                                    ? (() => {
                                                        const d = new Date(tx.date);
                                                        return isNaN(d) ? tx.date : d.toLocaleDateString('ru-RU');
                                                    })()
                                                    : '—'}
                                            </small>
                                        </div>
                                    </td>
                                    <td>{tx.status ?? '—'}</td>
                                    <td>{tx.requisites ?? '—'}</td>
                                    <td>{tx.requester ?? '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span>{tx.info ?? '—'}</span>
                                            {tx.sum != null && <b>{tx.sum}</b>}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
