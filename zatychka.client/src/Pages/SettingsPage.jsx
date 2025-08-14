// SettingsPage.jsx
import React, { useEffect, useState } from 'react';
import './SettingsPage.css';
import Breadcrumbs from '../components/Breadcrumbs';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../api/account';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const loginRe = /^[a-zA-Z0-9._-]{3,32}$/;

export default function SettingsPage() {
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [saving, setSaving] = useState(false);

    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setErr('');
                setLoading(true);
                const me = await getMyProfile();
                if (!cancelled) {
                    setLogin(me.login || '');
                    setEmail(me.email || '');
                    setPhone(me.phone || '');
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

            // смена пароля при заполненных полях
            if (pwd || pwd2) {
                if (pwd.length < 6) throw new Error('Пароль должен быть не короче 6 символов');
                if (pwd !== pwd2) throw new Error('Пароли не совпадают');
                await changeMyPassword({ newPassword: pwd, confirmPassword: pwd2 });
                setPwd('');
                setPwd2('');
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
        } finally {
        }
    }

    return (
        <div className="settings-page">
            <Breadcrumbs />
            <h2 className="settings-title">Настройки</h2>

            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Telegram */}
            <div className="settings-block">
                <p className="settings-hint">
                    Подключитесь к Telegram-боту и получайте уведомления о транзакциях. Вы больше не пропустите споры и важные события.
                </p>

                <div className="telegram-notification">
                    <div className="icon" aria-hidden>
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
            </div>

            {/* Account form */}
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
            </div>
        </div>
    );
}
