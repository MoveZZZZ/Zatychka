import React, { useState } from 'react';
import './main_styles.css';

export default function SharqDashboard() {
    const [tab, setTab] = useState('stats');

    return (
        <div className="dashboard">
            <div className="sidebar">
                <h2>SHARQ</h2>
                <button onClick={() => setTab('stats')}>Zopa</button>
                <button onClick={() => setTab('balance')}>Баланс</button>
                <button onClick={() => setTab('referrals')}>Рефералы</button>
                <button onClick={() => setTab('receive')}>Приём</button>
                <button onClick={() => setTab('quasi')}>Quasi-приём</button>
                <button onClick={() => setTab('settings')}>Настройки</button>
            </div>

            <div className="content">
                {tab === 'stats' && (
                    <div>
                        <h2>Статистика</h2>
                        <div className="grid">
                            <div className="card"><h3>Всего транзакций</h3><p>0</p><p>На сумму 0 USDT</p></div>
                            <div className="card"><h3>Активных транзакций</h3><p>0</p><p>На сумму NaN USDT</p></div>
                            <div className="card"><h3>Успешных транзакций</h3><p>100%</p></div>
                            <div className="card"><h3>Прибыль</h3><p>0 USDT</p></div>
                            <div className="card"><h3>Всего споров</h3><p>0</p></div>
                            <div className="card"><h3>Активных споров</h3><p>0</p></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
