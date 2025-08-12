// src/components/Sidebar.jsx
import React, { useRef, useEffect, useState } from 'react';
import './Sidebar.css';
import logo from '../assets/logo-with-name.png';
import usdtIcon from '../assets/usdt.png';
import { Icon } from '@iconify/react';
import AutomationModal from './AutomationModal';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { getMyWallet, saveMyWallet } from '../api/wallet';
import { getPublicWallet, savePublicWallet } from '../api/publicwallet';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext';
import { fetchUsdtRub } from '../api/rates';
import ComingSoon from './ComingSoon';
export default function Sidebar() {
    const { editMode } = useEditMode();
    const { scope, setScope } = useDataScope(); 
    const isPublic = scope === 'public';
    const [rate, setRate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [openSection, setOpenSection] = useState('main');
    const [activePage, setActivePage] = useState('statistics');
    const user = useUserInfo();

    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (paths) => {
        const arr = Array.isArray(paths) ? paths : [paths];
        const p = location.pathname.toLowerCase();
        return arr.some(base => p === base.toLowerCase() || p.startsWith((base + '/').toLowerCase()));
    };


    const computeInitialSection = () => {
        const p = location.pathname.toLowerCase();
        const [, first] = p.split('/');

        if (first === 'quasi') return 'quasi';

        if (first === 'payin') return 'priem';

        if (['workspace', 'transactions', 'disputes', 'payment', 'devices', 'notifications'].includes(first)) {
            return 'priem';
        }

        return 'main';
    };

    useEffect(() => { setOpenSection(computeInitialSection()); }, [location.pathname]);
    const [currentTime, setCurrentTime] = useState('');


    useEffect(() => {
        let alive = true;

        const updateTime = () => {
            const now = new Date();
            const formatted = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
            setCurrentTime(formatted);

            const load = async () => {
                try {
                    const { rate: r, source: s } = await fetchUsdtRub(); // Извлекаем rate и source
                    if (!alive) return;

                    const numeric = typeof r === 'number'
                        ? r
                        : Number(String(r).replace(',', '.'));

                    if (!Number.isFinite(numeric)) {
                        throw new Error(`Bad rate from API: ${r}`);
                    }

                    setRate(numeric);
                } catch (e) {
                    if (!alive) return;
                    console.error(e); // Для отладки
                }
            };
            load();
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => {
            alive = false;
            clearInterval(interval);
        };
    }, []);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const handleLogout = async () => {
        try {
            await fetch('https://localhost:5132/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.error('Ошибка при выходе:', err);
        } finally {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const scrollRef = useRef(null);
    useEffect(() => {
        const slider = scrollRef.current;
        if (!slider) return;

        let isDown = false, startX, scrollLeft;
        const down = e => { isDown = true; slider.classList.add('active'); startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; };
        const leave = () => { isDown = false; slider.classList.remove('active'); };
        const up = () => { isDown = false; slider.classList.remove('active'); };
        const move = e => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 1.5; slider.scrollLeft = scrollLeft - walk; };
        slider.addEventListener('mousedown', down);
        slider.addEventListener('mouseleave', leave);
        slider.addEventListener('mouseup', up);
        slider.addEventListener('mousemove', move);
        return () => {
            slider.removeEventListener('mousedown', down);
            slider.removeEventListener('mouseleave', leave);
            slider.removeEventListener('mouseup', up);
            slider.removeEventListener('mousemove', move);
        };
    }, []);

    const handleMenuClick = (page, path) => { setActivePage(page); navigate(path); };

    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);

    const [mainUsdt, setMainUsdt] = useState(0);
    const [frozenUsdt, setFrozenUsdt] = useState(0);

    const [curMain, setCurMain] = useState('USDT');
    const [curFrozen, setCurFrozen] = useState('USDT');

    const [edit, setEdit] = useState({ main: false, frozen: false });
    const [draft, setDraft] = useState({ main: '', frozen: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!editMode && (edit.main || edit.frozen)) {
            setEdit({ main: false, frozen: false });
            setErr('');
        }
    }, [editMode, edit.main, edit.frozen]);

    useEffect(() => {
        (async () => {
            try {
                const LOAD = isPublic ? getPublicWallet : getMyWallet;
                const w = await LOAD();
                setMainUsdt(Number(w?.MainUsdt ?? w?.mainUsdt ?? 0));
                setFrozenUsdt(Number(w?.FrozenUsdt ?? w?.frozenUsdt ?? 0));
            } catch (e) {
                setErr(e?.message || 'Не удалось загрузить баланс');
            } finally {
                setEdit({ main: false, frozen: false }); // закрыть инпуты при смене режима
            }
        })();
    }, [isPublic]);

    function toDisplay(amountUsdt, currency) {
        const n = currency === 'USDT' ? amountUsdt : amountUsdt * usdtRate;
        return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    }

    function canEdit() { return isAdmin && editMode; }
    const editable = canEdit();

    function openEdit(which) {
        if (!editable) return;
        setErr('');
        if (which === 'main') {
            setDraft(d => ({ ...d, main: String(curMain === 'USDT' ? mainUsdt : mainUsdt * usdtRate) }));
            setEdit(e => ({ ...e, main: true }));
        } else {
            setDraft(d => ({ ...d, frozen: String(curFrozen === 'USDT' ? frozenUsdt : frozenUsdt * usdtRate) }));
            setEdit(e => ({ ...e, frozen: true }));
        }
    }

    async function commitEdit(which) {
        if (!editable) return;
        try {
            setSaving(true);
            setErr('');

            const SAVE = isPublic ? savePublicWallet : saveMyWallet;

            if (which === 'main') {
                const raw = String(draft.main ?? '').replace(',', '.').trim();
                const value = Number(raw);
                if (!Number.isFinite(value)) throw new Error('Некорректное число');
                const newMainUsdt = curMain === 'USDT' ? value : value / usdtRate;

                const saved = await SAVE({ mainUsdt: newMainUsdt, frozenUsdt });
                const mainSaved = Number(saved?.MainUsdt ?? saved?.mainUsdt ?? newMainUsdt);
                setMainUsdt(mainSaved);
                setEdit(e => ({ ...e, main: false }));
            } else {
                const raw = String(draft.frozen ?? '').replace(',', '.').trim();
                const value = Number(raw);
                if (!Number.isFinite(value)) throw new Error('Некорректное число');
                const newFrozenUsdt = curFrozen === 'USDT' ? value : value / usdtRate;

                const saved = await SAVE({ mainUsdt, frozenUsdt: newFrozenUsdt });
                const frozenSaved = Number(saved?.FrozenUsdt ?? saved?.frozenUsdt ?? newFrozenUsdt);
                setFrozenUsdt(frozenSaved);
                setEdit(e => ({ ...e, frozen: false }));
            }
        } catch (e) {
            setErr(e?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="SHARQ Logo" className="logo" />

                <div className="sidebar-rate">
                    <img src={usdtIcon} alt="USDT" className="rate-icon" />
                    <div className="rate-text">{rate} RUB</div>
                    <div className="rate-time">{currentTime}</div>
                </div>

                {/* Радио переключатель режима — только для админа в editMode */}
                {editable && (
                    <div className="mode-switch">
                        <label>
                            <input
                                type="radio"
                                name="sb_mode"
                                value="public"
                                checked={scope === 'public'}
                                onChange={() => setScope('public')}
                                disabled={saving}
                            /> Публичный
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="sb_mode"
                                value="private"
                                checked={scope === 'private'}
                                onChange={() => setScope('private')}
                                disabled={saving}
                            /> Приватный (мой)
                        </label>
                    </div>
                )}

                <div className="sidebar-balance">
                    {/* Основной */}
                    <div className="balance-box">
                        <div className="balance-label">Основной</div>

                        {!edit.main ? (
                            <div
                                className={`balance-amount ${editable ? 'clickable' : ''}`}
                                title={editable ? 'Нажмите, чтобы изменить' : ''}
                                onClick={() => editable && openEdit('main')}
                            >
                                {toDisplay(mainUsdt, curMain)}
                            </div>
                        ) : (
                            <input
                                className="balance-input"
                                value={draft.main}
                                disabled={saving}
                                onChange={e => setDraft(d => ({ ...d, main: e.target.value }))}
                                onBlur={() => commitEdit('main')}
                                onKeyDown={e => (e.key === 'Enter') && commitEdit('main')}
                                autoFocus
                            />
                        )}

                        <select
                            className="balance-select"
                            value={curMain}
                            onChange={e => setCurMain(e.target.value)}
                            disabled={edit.main || editable}
                        >
                            <option>USDT</option>
                            <option>RUB</option>
                        </select>
                    </div>

                    {/* Заморожено */}
                    <div className="balance-box">
                        <div className="balance-label">Заморожено</div>

                        {!edit.frozen ? (
                            <div
                                className={`balance-amount ${editable ? 'clickable' : ''}`}
                                title={editable ? 'Нажмите, чтобы изменить' : ''}
                                onClick={() => editable && openEdit('frozen')}
                            >
                                {toDisplay(frozenUsdt, curFrozen)}
                            </div>
                        ) : (
                            <input
                                className="balance-input"
                                value={draft.frozen}
                                disabled={saving}
                                onChange={e => setDraft(d => ({ ...d, frozen: e.target.value }))}
                                onBlur={() => commitEdit('frozen')}
                                onKeyDown={e => (e.key === 'Enter') && commitEdit('frozen')}
                                autoFocus
                            />
                        )}

                        <select
                            className="balance-select"
                            value={curFrozen}
                            onChange={e => setCurFrozen(e.target.value)}
                            disabled={edit.frozen || editable}
                        >
                            <option>USDT</option>
                            <option>RUB</option>
                        </select>
                    </div>

                    {err && <div className="balance-error">{err}</div>}
                </div>
            </div>

            <div className="sidebar-section">
                <div className="section-header" onClick={() => setOpenSection(openSection === 'main' ? null : 'main')}>
                    <span className={`section-icon ${openSection === 'main' ? 'active' : ''}`}>
                        {/* иконка */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26"><g fill="currentColor" fillRule="evenodd" clipRule="evenodd"><path d="M13.5 26C20.404 26 26 20.404 26 13.5S20.404 1 13.5 1S1 6.596 1 13.5S6.596 26 13.5 26m0-2C19.299 24 24 19.299 24 13.5S19.299 3 13.5 3S3 7.701 3 13.5S7.701 24 13.5 24" opacity="0.2" /><path d="M7.5 6a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.855.352L13 15.676l-4.645 4.676A.5.5 0 0 1 7.5 20zm1 .5v12.287l4.145-4.172a.5.5 0 0 1 .71 0l4.145 4.172V6.5z" /></g></svg>
                    </span>
                    <span className="section-title">Основные страницы</span>
                    <Icon icon="heroicons:chevron-down" className={`section-toggle ${openSection === 'main' ? 'rotated' : ''}`} />
                </div>

                {openSection === 'main' && (
                    <ul className="menu-list">
                        <li>
                            <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''}>
                                Статистика
                            </NavLink>
                            </li>

                        <li>
                            <NavLink to="/balance" className={({ isActive }) => isActive ? 'active' : ''}>
                                Баланс
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/referrals" className={({ isActive }) => isActive ? 'active' : ''}>
                                Рефералы
                            </NavLink>
                        </li>
                    </ul>
                )}
            </div>

            {/* Приём */}
            <div className="sidebar-section">
                <div className="section-header" onClick={() => setOpenSection(openSection === 'priem' ? null : 'priem')}>
                    <span className={`section-icon ${openSection === 'priem' ? 'active' : ''}`}>
                        {/* иконка */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M16.002 13.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 0 0-3 0" /><path d="M2.002 11c0-3.771 0-5.657 1.172-6.828S6.23 3 10.002 3h4c.93 0 1.395 0 1.776.102A3 3 0 0 1 17.9 5.224c.102.381.102.846.102 1.776m-8 0h6c2.828 0 4.243 0 5.121.879c.879.878.879 2.293.879 5.121v2c0 2.828 0 4.243-.879 5.121c-.878.879-2.293.879-5.121.879h-3.501M10 17H6m0 0H2m4 0v4m0-4v-4" /></g></svg>
                    </span>
                    <span className="section-title">Приём</span>
                    <Icon icon="heroicons:chevron-down" className={`section-toggle ${openSection === 'priem' ? 'rotated' : ''}`} />
                </div>

                {openSection === 'priem' && (
                    <ul className="menu-list">
                        <li>
                            <NavLink to="/payin/workspace" className={({ isActive }) => isActive ? 'active' : ''}>
                                Рабочая зона
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/payin/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
                                Транзакции
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/payin/disputes" className={({ isActive }) => isActive ? 'active' : ''}>
                                Споры
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/payin/payment" className={({ isActive }) => isActive ? 'active' : ''}>
                                Реквизиты
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/payin/devices" className={({ isActive }) => isActive ? 'active' : ''}>
                                Устройства
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/payin/notifications" className={({ isActive }) => isActive ? 'active' : ''}>
                                Уведомления
                            </NavLink>
                        </li>
                    </ul>
                )}
            </div>

            {/* Quasi-приём */}
            <div className="sidebar-section">
                <div className="section-header" onClick={() => setOpenSection(openSection === 'quasi' ? null : 'quasi')}>
                    <span className={`section-icon ${openSection === 'quasi' ? 'active' : ''}`}>
                        {/* иконка */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M16.002 13.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 0 0-3 0" /><path d="M2.002 11c0-3.771 0-5.657 1.172-6.828S6.23 3 10.002 3h4c.93 0 1.395 0 1.776.102A3 3 0 0 1 17.9 5.224c.102.381.102.846.102 1.776m-8 0h6c2.828 0 4.243 0 5.121.879c.879.878.879 2.293.879 5.121v2c0 2.828 0 4.243-.879 5.121c-.878.879-2.293.879-5.121.879h-3.501M10 17H6m0 0H2m4 0v4m0-4v-4" /></g></svg>
                    </span>
                    <span className="section-title">Quasi-приём</span>
                    <Icon icon="heroicons:chevron-down" className={`section-toggle ${openSection === 'quasi' ? 'rotated' : ''}`} />
                </div>

                {openSection === 'quasi' && (
                    <ul className="menu-list">
                        <li>
                            <NavLink to="/quasi/payment" className={({ isActive }) => isActive ? 'active' : ''}>
                                Транзакции
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/quasi/disuptes" className={({ isActive }) => isActive ? 'active' : ''}>
                                Споры
                            </NavLink>

                        </li>
                    </ul>
                )}
            </div>

            {/* Настройки */}
            <div className="sidebar-section">
                <div className="section-header">
                    <span className="section-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="currentColor" d="m19.59 15.5-1.82-1.3c.3-1.08.32-2.25 0-3.42l1.82-1.28L18.14 7l-2.03.92c-.79-.8-1.79-1.42-2.96-1.71L12.95 4h-2.9l-.2 2.21c-1.17.29-2.17.91-2.96 1.71L4.86 7 3.41 9.5l1.82 1.28c-.32 1.17-.3 2.34 0 3.42l-1.82 1.3L4.86 18l2.03-.93c.79.79 1.79 1.39 2.96 1.7l.2 2.23h2.9l.2-2.23c1.17-.31 2.17-.91 2.96-1.7l2.03.93zM13.5 3c.27 0 .5.2.5.46l.18 2.04c.76.28 1.44.69 2.05 1.18l1.85-.87c.23-.12.52-.04.66.19l2 3.5c.14.21.06.5-.16.65l-1.67 1.17c.13.8.12 1.59 0 2.36l1.67 1.17c.22.15.3.44.16.65l-2 3.5c-.14.21-.43.29-.66.17l-1.85-.86c-.61.49-1.29.89-2.05 1.19l-.18 2c0 .29-.23.5-.5.5h-4a.5.5 0 0 1-.5-.5l-.18-2c-.76-.3-1.44-.7-2.05-1.19l-1.85.86c-.23.12-.52.04-.66-.17l-2-3.5c-.14-.21-.06-.5.16-.65l1.67-1.17c-.12-.77-.13-1.56 0-2.36l-1.67-1.17c-.22-.15-.3-.44-.16-.65l2-3.5c.14-.23.43-.31.66-.19l1.85.87c.61-.49 1.29-.9 2.05-1.18L9 3.46c0-.26.23-.46.5-.46zm-2 6a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8 12.5A3.5 3.5 0 0 1 11.5 9m0 1A2.5 2.5 0 0 0 9 12.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5" /></svg>
                    </span>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `section-title ${isActive ? 'active' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Настройки
                    </NavLink>
                </div>
            </div>

            <div className="sidebar-footer">
                <div className="footer-scroll-wrapper" ref={scrollRef}>
                    <div className="footer-links">
                        <button className="footer-btn"
                            onClick={() => window.open('https://t.me/sharqchannel', '_blank')}                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256"><defs><linearGradient id="logosTelegram0" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#2aabee" /><stop offset="100%" stop-color="#229ed9" /></linearGradient></defs><path fill="url(#logosTelegram0)" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0" /><path fill="#fff" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072" /></svg>
                            Telegram
                        </button>
                        <button className="footer-btn" onClick={() => navigate('/faq')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 32 32"><g fill="none"><g filter="url(#f1579idc)"><path fill="#3e6aca" d="M3.578 11.031c-.69 0-1.25.56-1.25 1.25v16.39c0 .691.56 1.25 1.25 1.25h11.005a1.863 1.863 0 0 0 3.256 0h11.005c.69 0 1.25-.559 1.25-1.25v-16.39c0-.69-.56-1.25-1.25-1.25z" /></g><g filter="url(#f1579idd)"><path fill="url(#f1579id0)" d="M3.578 10.063c-.69 0-1.25.56-1.25 1.25v16.39c0 .69.56 1.25 1.25 1.25h11.005a1.863 1.863 0 0 0 3.256 0h11.005c.69 0 1.25-.56 1.25-1.25v-16.39c0-.69-.56-1.25-1.25-1.25z" /></g><g filter="url(#f1579ide)"><path fill="#3f9bea" d="m4.81 9.094l-1.565 1.941a.96.96 0 0 0-.214.602V25.93c0 .672.56 1.217 1.25 1.217H27.72c.69 0 1.25-.545 1.25-1.217V11.637a.96.96 0 0 0-.214-.602L27.19 9.094L25.348 23.74H6.652z" /></g><path fill="url(#f1579idj)" d="M14.773 25.703h2.875v1.578a1.438 1.438 0 1 1-2.875 0z" /><path fill="url(#f1579id1)" d="M14.773 25.703h2.875v1.578a1.438 1.438 0 1 1-2.875 0z" /><g filter="url(#f1579idf)"><path fill="url(#f1579id2)" d="M3.424 10.455L4.99 8.46L6.832 23.5h9.348V27H4.46c-.69 0-1.25-.56-1.25-1.25V11.072a1 1 0 0 1 .214-.617" /></g><g filter="url(#f1579idg)"><path fill="url(#f1579id3)" d="M28.935 10.455L27.369 8.46L25.528 23.5H16.18V27h11.718c.69 0 1.25-.56 1.25-1.25V11.072a1 1 0 0 0-.213-.617" /><path fill="url(#f1579id4)" d="M28.935 10.455L27.369 8.46L25.528 23.5H16.18V27h11.718c.69 0 1.25-.56 1.25-1.25V11.072a1 1 0 0 0-.213-.617" /></g><path fill="url(#f1579id5)" d="M28.935 10.455L27.369 8.46L25.528 23.5H16.18V27h11.718c.69 0 1.25-.56 1.25-1.25V11.072a1 1 0 0 0-.213-.617" /><g filter="url(#f1579idh)"><path fill="url(#f1579id6)" d="M4.805 9.031a1 1 0 0 1 1-1h7.875a2.5 2.5 0 0 1 2.5 2.5v16.461c0-1.1-1.133-1.992-2.446-1.992h-7.68c-.69 0-1.25-.56-1.25-1.25z" /><path fill="url(#f1579id7)" d="M4.805 9.031a1 1 0 0 1 1-1h7.875a2.5 2.5 0 0 1 2.5 2.5v16.461c0-1.1-1.133-1.992-2.446-1.992h-7.68c-.69 0-1.25-.56-1.25-1.25z" /><path fill="url(#f1579id8)" d="M4.805 9.031a1 1 0 0 1 1-1h7.875a2.5 2.5 0 0 1 2.5 2.5v16.461c0-1.1-1.133-1.992-2.446-1.992h-7.68c-.69 0-1.25-.56-1.25-1.25z" /></g><g filter="url(#f1579idi)"><path fill="url(#f1579id9)" d="M27.555 9.031a1 1 0 0 0-1-1H18.68a2.5 2.5 0 0 0-2.5 2.5v16.461c0-1.1 1.133-1.992 2.445-1.992h7.68c.69 0 1.25-.56 1.25-1.25z" /><path fill="url(#f1579ida)" d="M27.555 9.031a1 1 0 0 0-1-1H18.68a2.5 2.5 0 0 0-2.5 2.5v16.461c0-1.1 1.133-1.992 2.445-1.992h7.68c.69 0 1.25-.56 1.25-1.25z" /><path fill="url(#f1579idb)" d="M27.555 9.031a1 1 0 0 0-1-1H18.68a2.5 2.5 0 0 0-2.5 2.5v16.461c0-1.1 1.133-1.992 2.445-1.992h7.68c.69 0 1.25-.56 1.25-1.25z" /></g><defs><linearGradient id="f1579id0" x1="16.211" x2="16.211" y1="14.438" y2="29.91" gradientUnits="userSpaceOnUse"><stop stop-color="#5dd8fb" /><stop offset="1" stop-color="#41aef2" /></linearGradient><linearGradient id="f1579id1" x1="16.211" x2="16.211" y1="26.781" y2="27.531" gradientUnits="userSpaceOnUse"><stop stop-color="#1748a6" /><stop offset="1" stop-color="#1748a6" stop-opacity="0" /></linearGradient><linearGradient id="f1579id2" x1="12.516" x2="5.266" y1="28.656" y2="21.938" gradientUnits="userSpaceOnUse"><stop offset=".75" stop-color="#b3a9cf" /><stop offset=".932" stop-color="#b6bac5" /></linearGradient><linearGradient id="f1579id3" x1="19.844" x2="27.094" y1="28.656" y2="21.938" gradientUnits="userSpaceOnUse"><stop offset=".717" stop-color="#bbb3d9" /><stop offset=".913" stop-color="#dcdde8" /></linearGradient><linearGradient id="f1579id4" x1="27.976" x2="27.976" y1="8.886" y2="13.327" gradientUnits="userSpaceOnUse"><stop stop-color="#d8dae2" /><stop offset="1" stop-color="#d8dae2" stop-opacity="0" /></linearGradient><linearGradient id="f1579id5" x1="16.18" x2="17.797" y1="27" y2="25.094" gradientUnits="userSpaceOnUse"><stop stop-color="#a699c9" /><stop offset="1" stop-color="#a699c9" stop-opacity="0" /></linearGradient><linearGradient id="f1579id6" x1="4.805" x2="15.328" y1="17.512" y2="17.512" gradientUnits="userSpaceOnUse"><stop stop-color="#f3f1fa" /><stop offset="1" stop-color="#f0ebf9" /></linearGradient><linearGradient id="f1579id7" x1="16.18" x2="13.453" y1="25.688" y2="25.688" gradientUnits="userSpaceOnUse"><stop stop-color="#d5cce8" /><stop offset="1" stop-color="#f2ebff" stop-opacity="0" /></linearGradient><linearGradient id="f1579id8" x1="16.234" x2="16.016" y1="25.906" y2="25.906" gradientUnits="userSpaceOnUse"><stop offset=".179" stop-color="#bfb3d1" /><stop offset="1" stop-color="#bfb3d1" stop-opacity="0" /></linearGradient><linearGradient id="f1579id9" x1="16.18" x2="26.703" y1="17.512" y2="17.512" gradientUnits="userSpaceOnUse"><stop stop-color="#f3f1fa" /><stop offset="1" stop-color="#f0ebf9" /></linearGradient><linearGradient id="f1579ida" x1="16.18" x2="18.984" y1="25.688" y2="25.688" gradientUnits="userSpaceOnUse"><stop stop-color="#d5cce8" /><stop offset="1" stop-color="#f2ebff" stop-opacity="0" /></linearGradient><linearGradient id="f1579idb" x1="16.152" x2="16.359" y1="25.906" y2="25.906" gradientUnits="userSpaceOnUse"><stop stop-color="#bfb3d1" /><stop offset="1" stop-color="#bfb3d1" stop-opacity="0" /></linearGradient><filter id="f1579idc" width="27.916" height="19.998" x="2.328" y="10.881" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx=".15" dy="-.15" /><feGaussianBlur stdDeviation=".25" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.305882 0 0 0 0 0.541176 0 0 0 0 0.780392 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /></filter><filter id="f1579idd" width="27.966" height="19.948" x="2.228" y="9.963" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx="-.1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.45098 0 0 0 0 0.941176 0 0 0 0 1 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx=".1" dy="-.1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.286275 0 0 0 0 0.666667 0 0 0 0 0.901961 0 0 0 1 0" /><feBlend in2="effect1_innerShadow_18_20736" result="effect2_innerShadow_18_20736" /></filter><filter id="f1579ide" width="26.938" height="19.055" x="2.531" y="8.594" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur result="effect1_foregroundBlur_18_20736" stdDeviation=".25" /></filter><filter id="f1579idf" width="13.069" height="18.639" x="3.211" y="8.461" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx=".1" dy=".1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.694118 0 0 0 0 0.705882 0 0 0 0 0.733333 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /></filter><filter id="f1579idg" width="13.069" height="18.639" x="16.18" y="8.461" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx=".1" dy=".1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.831373 0 0 0 0 0.835294 0 0 0 0 0.854902 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /></filter><filter id="f1579idh" width="11.475" height="19.011" x="4.805" y="8.031" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy=".05" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.827451 0 0 0 0 0.819608 0 0 0 0 0.854902 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx=".1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.980392 0 0 0 0 0.976471 0 0 0 0 1 0 0 0 1 0" /><feBlend in2="effect1_innerShadow_18_20736" result="effect2_innerShadow_18_20736" /></filter><filter id="f1579idi" width="11.475" height="19.011" x="16.08" y="8.031" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dx="-.1" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.980392 0 0 0 0 0.976471 0 0 0 0 1 0 0 0 1 0" /><feBlend in2="shape" result="effect1_innerShadow_18_20736" /><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" /><feOffset dy=".05" /><feGaussianBlur stdDeviation=".15" /><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" /><feColorMatrix values="0 0 0 0 0.827451 0 0 0 0 0.819608 0 0 0 0 0.854902 0 0 0 1 0" /><feBlend in2="effect1_innerShadow_18_20736" result="effect2_innerShadow_18_20736" /></filter><radialGradient id="f1579idj" cx="0" cy="0" r="1" gradientTransform="matrix(2 -1 1.40312 2.80625 15.375 28.531)" gradientUnits="userSpaceOnUse"><stop offset=".232" stop-color="#306ab3" /><stop offset="1" stop-color="#1a4ca8" /></radialGradient></defs></g></svg>
                            FAQ
                        </button>
                        <button className="footer-btn" onClick={() => navigate('/learn')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 128 128"><path fill="#424242" d="M99.06 91.42S83.95 105.6 63.97 105.6S28.89 91.42 28.89 91.42s-2.81-13.49 4.45-36.78c3.83-12.28 58.33-13.53 62.6-2.79c7.26 18.23 3.12 39.57 3.12 39.57" /><path fill="#212121" d="m28.89 91.42l4.79 3.84s-.04-7.6 2.31-14.69c.88-2.65 4.02-3.76 6.38-2.27l18.29 11.47a6.39 6.39 0 0 0 6.7.05c8.74-5.3 31.54-19.17 32.58-20.02c0 0 0-1.71-.43-3.89L28.63 66z" /><path fill="#424242" d="m122.81 52.03l-56.8 33.83c-1.24.74-2.79.74-4.04 0L5.19 52.03c-1.58-.94-1.58-3.23 0-4.17l56.8-33.83c1.24-.74 2.79-.74 4.04 0l56.8 33.83c1.57.94 1.57 3.23-.02 4.17" /><path fill="#9e9e9e" d="M64.04 83.38c-.01 0-.03.01-.04.01c-.16 0-.32-.04-.46-.13L4.18 49.04s-.29.55 0 1.54c.3.99.76 1.31 1.01 1.46l56.8 33.83c.62.37 1.32.56 2.02.56h.04v-3.05z" /><path fill="#616161" d="M64 83.38c.01 0 .03.01.04.01c.16 0 .32-.04.46-.13l59.36-34.22s.29.55 0 1.54c-.3.99-.76 1.31-1.01 1.46l-56.8 33.83c-.62.37-1.32.56-2.02.56h-.04v-3.05z" /><path fill="#424242" d="m35.45 70.06l.32-2.81S60.28 53.92 62.7 52.52s4.96-2.96 6.09-4.21c2-2.2.56-3.58.56-3.58s-1.58 2.56-5.35 2.11c-2.16-.26-4.97-2.01-5.44-2.83s-27.67 19.9-27.67 19.9l-.19 3.33z" /><path fill="#e2a610" d="M69.35 44.74c-2.62 3.66-7.06 2.06-7.06 2.06s-13.91 6.67-14.43 5.66s11.49-7.19 11.49-7.19s-.67-2.46-.6-3.51c0 0-21.72 13.82-29.87 18.47c-4.27 2.44-5.18 4.74-5.17 7.98c0 1.42.02 6.03.04 8.78c0 .51-.22.99-.61 1.31a5.16 5.16 0 0 0-1.89 3.99c0 1.53.67 2.9 1.73 3.85c.57.51.45 1.61.5 2.32c.1 1.36 0 1.98-.56 3.24c-.55 1.23-1.06 2.49-1.41 3.79c-.27 1-.45 2.03-.63 3.05c-1.19 6.83-1.73 14.13-4.88 20.41a.993.993 0 0 0 .45 1.34a1.007 1.007 0 0 0 1.35-.44c1.64-3.27 2.49-6.85 3.19-10.4c-.04 3.21-.06 6.45-.17 9.95c-.02.68-.07 2.05.55 2.35c2.33 1.13 2.33-2.35 2.33-2.35s.03 3.13 3.2 3.13s3.4-3.13 3.4-3.13s.23 2.87 1.86 2.73c.66-.06 1.53-.46 1.22-3.89c-.31-3.42-1.08-15.68-1.41-19.56c-.46-5.37-2.22-8.56-2.58-10.46c-.13-.72-.14-1.47.43-1.94a5.165 5.165 0 0 0 .13-7.88a1.71 1.71 0 0 1-.58-1.42c.19-2.59.4-6.35.57-7.22c.74-3.91 2.67-4.61 4.65-5.77c1.98-1.17 30.66-14.19 32.33-15.3c3.09-2.07 2.43-3.95 2.43-3.95" /><path fill="#ffca28" d="M69.35 44.74c-2.47 3.49-7.6 1.93-7.6 1.93s-13.11 5.81-12.24 4.76c.86-1.05 9.84-6.16 9.84-6.16s-.67-2.46-.6-3.51c0 0-22.1 12.77-30.67 18.91c-2.21 1.59-4.95 4.19-2.72 6.78c1.03 1.19 3.02 1.44 4.29.5c.77-.56 1.37-1.38 2.05-2.03c.84-.82 1.86-1.34 2.86-1.93c1.98-1.17 30.66-14.19 32.33-15.3c3.12-2.07 2.46-3.95 2.46-3.95" /><path fill="#9e740b" d="M26.11 91.86c-1.32 0-2.21-.11-3.02-.3a.62.62 0 0 1-.48-.65l.26-3.82c.03-.39.4-.66.78-.55c.9.26 2.7.52 5.64-.1c.36-.08.72.17.76.54l.4 3.8c.03.31-.17.6-.47.67c-1.53.35-2.64.41-3.87.41" /><path fill="#616161" d="M99.06 91.42s1.77-9.24 1.06-19.07c-.12-1.66-1.14-3.09-1.93 2.72c-.45 3.33-1.43 13.3-3.1 19.53c2.55-1.84 3.97-3.18 3.97-3.18M65.73 36.79c.73.23 1.4.79 1.59 1.54c.25 1-.38 2-1.06 2.78c-1.33 1.53-3.16 2.87-5.19 2.8c-.67-.02-1.39-.24-1.8-.77c-.29-.37-.39-.85-.42-1.32c-.18-3.43 3.7-6.03 6.88-5.03" /></svg>
                            Обучение
                        </button>
                        <>
                            <button className="footer-btn" onClick={() => setShowModal(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 48 48">
                                    <path fill="#7cb342" d="M12 29.001a2 2 0 0 1-4 0v-9a2 2 0 0 1 4 0zm28 0a2 2 0 0 1-4 0v-9a2 2 0 0 1 4 0zM22 40a2 2 0 0 1-4 0v-9a2 2 0 0 1 4 0zm8 0a2 2 0 0 1-4 0v-9a2 2 0 0 1 4 0z" />
                                    <path fill="#7cb342" d="M14 18.001V33a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V18.001zM24 8c-6 0-9.655 3.645-10 8h20c-.346-4.355-4-8-10-8m-4 5.598a1 1 0 1 1 0-2a1 1 0 0 1 0 2m8 0a1 1 0 1 1 0-2a1 1 0 0 1 0 2" />
                                    <path fill="none" stroke="#7cb342" strokeLinecap="round" strokeWidth="2" d="m30 7l-1.666 2.499M18 7l1.333 2.082" />
                                </svg>
                                Автоматика
                            </button>
                            {showModal && <AutomationModal onClose={() => setShowModal(false)} />}
                        </>
                    </div>
                </div>

                <div className="footer-user">
                    <div className="user-email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10a9.96 9.96 0 0 1-2.258 6.33l.02.022l-.132.112A9.98 9.98 0 0 1 12 22c-2.95 0-5.6-1.277-7.43-3.307l-.2-.23l-.132-.11l.02-.024A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2m0 15c-1.86 0-3.541.592-4.793 1.406A7.97 7.97 0 0 0 12 20a7.97 7.97 0 0 0 4.793-1.594A8.9 8.9 0 0 0 12 17m0-13a8 8 0 0 0-6.258 12.984C7.363 15.821 9.575 15 12 15s4.637.821 6.258 1.984A8 8 0 0 0 12 4m0 2a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 2a2 2 0 1 0 0 4a2 2 0 0 0 0-4" /></g></svg>
                        <span><strong>{user?.email ?? 'Гость'}</strong></span>
                    </div>

                    <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
                        Выйти
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
                    </button>


                    {showLogoutModal && (
                        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <h2>Выход из аккаунта</h2>
                                <p>Вы действительно хотите выйти из аккаунта <span className="highlight">{user?.email ?? 'Гость'}</span>?</p>
                                <button className="confirm-btn" onClick={handleLogout}>Подтвердить</button>
                                <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>Отмена</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
