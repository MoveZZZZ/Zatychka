// src/Pages/SettingsPage.jsx
import React, { useEffect, useState } from 'react';
import './SettingsPage.css';
import Breadcrumbs from '../components/Breadcrumbs';
import {
    getMyProfile, updateMyProfile, changeMyPassword, getMyTelegramLink,
    adminGetTelegramLinkByUser, adminUpsertTelegramLink, adminUnlinkTelegram
} from '../api/account';
import { lookupUsers } from '../api/payin';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { useEditMode } from '../context/EditModeContext';

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const loginRe = /^[a-zA-Z0-9._-]{3,32}$/;

// безопасно достаём username и приводим к нижнему регистру (без @)
function pickUsername(link) {
    const raw = link?.username ?? link?.Username ?? null;
    if (!raw) return null;
    return String(raw).replace(/^@/, '').trim();
}

export default function SettingsPage() {
    const toast = useToast();
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const editable = isAdmin && editMode;

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [saving, setSaving] = useState(false);

    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');

    // Моя связка TG
    const [myTg, setMyTg] = useState(null); // { username/Username } | null

    // Админ-блок
    const [uSearch, setUSearch] = useState('');
    const [uList, setUList] = useState([]);
    const [uId, setUId] = useState('');
    const [uTg, setUTg] = useState('');
    const [uTgCurrent, setUTgCurrent] = useState(null);
    const [adminBusy, setAdminBusy] = useState(false);

    async function refreshMyLink() {
        try {
            const link = await getMyTelegramLink().catch(() => null);
            setMyTg(link);
        } catch {
            setMyTg(null);
        }
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setErr('');
                setLoading(true);
                const [meProfile, myLink] = await Promise.all([
                    getMyProfile(),
                    getMyTelegramLink().catch(() => null)
                ]);
                if (!cancelled) {
                    setLogin(meProfile.login || '');
                    setEmail(meProfile.email || '');
                    setPhone(meProfile.phone || '');
                    setMyTg(myLink);
                }
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить профиль');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function onSave() {
        try {
            setErr('');
            if (!loginRe.test(login)) throw new Error('Логин: 3–32 символа, латиница/цифры/._-');
            if (!emailRe.test(email)) throw new Error('Некорректный email');
            if (!phone || phone.length < 5 || phone.length > 32) throw new Error('Некорректный номер телефона');

            const updated = await updateMyProfile({
                login: login.trim(),
                email: email.trim(),
                phone: phone.trim(),
            });

            if (pwd || pwd2) {
                if (pwd.length < 6) throw new Error('Пароль должен быть не короче 6 символов');
                if (pwd !== pwd2) throw new Error('Пароли не совпадают');
                await changeMyPassword({ newPassword: pwd, confirmPassword: pwd2 });
                setPwd(''); setPwd2('');
            }

            setSaving(true); await new Promise(r => setTimeout(r, 1800)); setSaving(false);
            toast.success('Изменения сохранены');
            setLogin(updated.login);
            setEmail(updated.email);
            setPhone(updated.phone);
        } catch (e) {
            const msg = e?.message || 'Не удалось сохранить изменения';
            setErr(msg);
            toast.error(msg);
        }
    }

    // ---------- Админ: связки ----------
    async function searchUsersAdmin() {
        try {
            setAdminBusy(true);
            const list = await lookupUsers(uSearch, 20);
            setUList(list || []);
        } catch (e) {
            toast.error(e?.message || 'Не удалось найти пользователей');
        } finally {
            setAdminBusy(false);
        }
    }

    async function loadCurrentLink(uid) {
        try {
            setAdminBusy(true);
            const link = await adminGetTelegramLinkByUser(uid);
            setUTgCurrent(link);
        } catch {
            setUTgCurrent(null);
        } finally {
            setAdminBusy(false);
        }
    }

    useEffect(() => {
        if (!uId) { setUTgCurrent(null); return; }
        loadCurrentLink(Number(uId));
    }, [uId]);

    async function bindTelegram() {
        try {
            if (!uId) { toast.error('Выберите пользователя'); return; }
            if (!uTg.trim()) { toast.error('Укажите Telegram username или ссылку'); return; }
            setAdminBusy(true);
            const res = await adminUpsertTelegramLink({ userId: Number(uId), telegram: uTg.trim() });
            setUTgCurrent(res);
            toast.success(`Привязано: @${pickUsername(res) || 'username'}`);
            // если админ привязывал самого себя — обновим верхний блок
            if (me?.id && Number(uId) === Number(me.id)) await refreshMyLink();
        } catch (e) {
            toast.error(e?.message || 'Не удалось привязать');
        } finally {
            setAdminBusy(false);
        }
    }

    async function unbindTelegram() {
        try {
            if (!uId) return;
            if (!window.confirm('Отвязать Telegram от выбранного пользователя?')) return;
            setAdminBusy(true);
            await adminUnlinkTelegram(Number(uId));
            setUTgCurrent(null);
            toast.success('Отвязано');
            if (me?.id && Number(uId) === Number(me.id)) await refreshMyLink();
        } catch (e) {
            toast.error(e?.message || 'Не удалось отвязать');
        } finally {
            setAdminBusy(false);
        }
    }

    const myUsername = pickUsername(myTg);
    const currentUsername = pickUsername(uTgCurrent);

    return (
        <div className="settings-page">
            <Breadcrumbs />
            <h2 className="settings-title">Настройки</h2>

            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Telegram блок — показывает статус ТЕКУЩЕГО пользователя */}
            <div className="settings-block">
                {myUsername ? (
                    <div className="telegram-notification linked" role="status" aria-live="polite">
                        <div className="icon" aria-hidden>
                            {/* чек-иконка */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2m-1 14l-4-4l1.414-1.414L11 12.172l5.586-5.586L18 8z" />
                            </svg>
                        </div>
                        <p className="telegram-text">
                            Подключён Telegram:&nbsp;
                            <a href={`https://t.me/${myUsername}`} target="_blank" rel="noopener noreferrer">
                                @{myUsername}
                            </a>
                        </p>
                    </div>
                ) : (
                    <>
                        <p className="settings-hint">
                            Подключитесь к Telegram-боту и получайте уведомления о транзакциях. Вы больше не пропустите споры и важные события.
                        </p>
                        <div className="telegram-notification">
                            <div className="icon" aria-hidden>
                                {/* восклицательный знак */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                                    <circle cx="24" cy="34.748" r=".75" fill="currentColor" />
                                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M23.975 30.275V12.502" strokeWidth="1" />
                                    <circle cx="24" cy="24" r="21.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                                </svg>
                            </div>
                            <p className="telegram-text">Вы ещё не связали <b>Telegram</b> аккаунт с сайтом</p>
                            <a
                                href="https://t.me/sharqprobot?start=3lnVA2tkRRPXVqhdR4eLos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="connect-btn"
                            >
                                + Связать аккаунт
                            </a>
                        </div>
                    </>
                )}
            </div>

            {/* Блок админской привязки — только когда editable и isAdmin */}
            {editable && isAdmin && (
                <div className="settings-block">
                    <h3 className="settings-subtitle">Админ: связать Telegram с пользователем</h3>

                    <div className="account-grid">
                        <div className="form-item full">
                            <label>Поиск пользователя (логин)</label>
                            <div className="inline">
                                <input
                                    type="text"
                                    placeholder="login"
                                    value={uSearch}
                                    onChange={(e) => setUSearch(e.target.value)}
                                />
                                <button type="button" onClick={searchUsersAdmin} disabled={adminBusy}>Найти</button>
                            </div>
                            <select value={uId} onChange={(e) => setUId(e.target.value)} disabled={adminBusy}>
                                <option value="">— не выбрано —</option>
                                {uList.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.login}{u.email ? ` — ${u.email}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-item full">
                            <label>Telegram (username или ссылка)</label>
                            <input
                                type="text"
                                placeholder="@username или https://t.me/username"
                                value={uTg}
                                onChange={(e) => setUTg(e.target.value)}
                                disabled={adminBusy || !uId}
                            />
                            {currentUsername && (
                                <div className="hint">
                                    Текущая привязка:&nbsp;
                                    <a href={`https://t.me/${currentUsername}`} target="_blank" rel="noreferrer">
                                        @{currentUsername}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="actions" style={{ display: 'flex', gap: 10 }}>
                        <button className="submit" onClick={bindTelegram} disabled={adminBusy || !uId}>
                            Привязать / Обновить
                        </button>
                        <button className="submit danger" onClick={unbindTelegram} disabled={adminBusy || !uId || !currentUsername}>
                            Отвязать
                        </button>
                    </div>
                </div>
            )}

            {/* Анкета аккаунта */}
            <div className="settings-block">
                <div className="account-grid">
                    <div className="form-item">
                        <label htmlFor="login">Логин</label>
                        <input id="login" type="text" value={login} onChange={e => setLogin(e.target.value)} />
                    </div>

                    <div className="form-item">
                        <label htmlFor="email">E-mail</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="form-item full">
                        <label htmlFor="phone">Номер телефона</label>
                        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                </div>

                <div className="password-grid">
                    <div className="form-item">
                        <label htmlFor="pwd">Пароль</label>
                        <input id="pwd" type="password" placeholder="Введите пароль" value={pwd} onChange={e => setPwd(e.target.value)} />
                    </div>
                    <div className="form-item">
                        <label htmlFor="pwd2">Повтор пароля</label>
                        <input id="pwd2" type="password" placeholder="Введите пароль ещё раз" value={pwd2} onChange={e => setPwd2(e.target.value)} />
                    </div>
                </div>

                <button className="save-btn" onClick={onSave} disabled={saving}>
                    {saving ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span className="btn-spinner" aria-label="Загрузка" />
                            Сохраняем…
                        </span>
                    ) : 'Сохранить'}
                </button>

                {err && <div className="balance-error" style={{ marginTop: 10 }}>{err}</div>}
            </div>
        </div>
    );
}
