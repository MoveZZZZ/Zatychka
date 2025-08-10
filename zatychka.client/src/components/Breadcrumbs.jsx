import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const LABELS = {
    statistics: 'Дэшборд',
    balance: 'Баланс',
    referrals: 'Рефералы',
    workspace: 'Рабочая зона',
    transactions: 'Транзакции',
    disputes: 'Споры',
    payment: 'Реквизиты',
    devices: 'Устройства',
    notifications: 'Уведомления',
    settings: 'Настройки',

    'payin': 'Приёим',
    'quasi': 'Quasi-приём',
    'quasi/payment': 'Транзакции',
    'quasi/disuptes': 'Споры', 
};

export default function Breadcrumbs() {
    const { pathname } = useLocation();

    // пример: '/quasi/payment' -> ['quasi','payment']
    const segments = pathname.split('/').filter(Boolean);

    const items = [];

    // 1-й пункт — Дэшборд
    const isDashboard = segments.length === 0 || segments[0] === 'statistics';
    items.push({
        to: '/statistics',
        label: LABELS['statistics'],
        current: isDashboard,
    });

    if (!isDashboard) {
        let acc = '';
        segments.forEach((seg, idx) => {
            acc = acc ? `${acc}/${seg}` : seg; // накапливаем путь: 'quasi' -> 'quasi/payment'
            const last = idx === segments.length - 1;

            // Берём подпись: приоритет у полного пути ('quasi/payment'), иначе по сегменту ('quasi'/'payment')
            const label = LABELS[acc] || LABELS[seg] || seg;

            items.push({
                to: `/${acc}`,
                label,
                current: last,
            });
        });
    }

    return (
        <nav className="breadcrumbs" aria-label="breadcrumb">
            {items.map((it, i) => (
                <span key={it.to} className="crumb">
                    {it.current ? (
                        <span className="crumb-current">{it.label}</span>
                    ) : (
                        <NavLink to={it.to} className="crumb-link">
                            {it.label}
                        </NavLink>
                    )}
                    {i < items.length - 1 && <span className="crumb-sep">›</span>}
                </span>
            ))}
        </nav>
    );
}
