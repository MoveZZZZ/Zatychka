import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getPageTitle(pathname) {
    const p = pathname.toLowerCase();

    if (p.startsWith('/statistics')) return 'Статистика';
    if (p.startsWith('/balance')) return 'Баланс';
    if (p.startsWith('/settings')) return 'Настройки';
    if (p.startsWith('/referrals')) return 'Рефералы';

    if (p.startsWith('/payin')) {
        if (p.includes('/devices')) return 'Устройства';
        if (p.includes('/transactions')) return 'Приём';
        if (p.includes('/disputes')) return 'Споры';
        if (p.includes('/payment')) return 'Реквизиты';
        if (p.includes('/notifications')) return 'Уведомления';
        if (p.includes('/workspace')) return 'Рабочая зона';
        return 'Приём';
    }
    if (p.startsWith('/quasi')) {
        if (p.includes('/payment')) return 'Quasi-приём';
        if (p.includes('/disuptes')) return 'Quasi-споры';
        return 'Quasi';
    }

    return 'Sharq';
}

export default function useDocumentTitle(suffix = 'Sharq') {
    const { pathname } = useLocation();

    useEffect(() => {
        const title = getPageTitle(pathname);
        document.title = title === 'Sharq' ? 'Sharq' : `${title} — ${suffix}`;
    }, [pathname, suffix]);
}
