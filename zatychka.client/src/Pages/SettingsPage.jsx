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
    const showToast = (type, msg) => setToast({ open: true, type, msg });



    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [ok, setOk] = useState('');

    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [pwd, setPwd] = useState('');
    const [pwd2, setPwd2] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setErr(''); setOk('');
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
            setSaving(true);
            setErr(''); setOk('');

            if (!loginRe.test(login)) throw new Error('Логин: 3–32 символа, латиница/цифры/._-');
            if (!emailRe.test(email)) throw new Error('Некорректный email');
            if (!phone || phone.length < 5 || phone.length > 32) throw new Error('Некорректный номер телефона');

            const updated = await updateMyProfile({ login: login.trim(), email: email.trim(), phone: phone.trim() });

            // если поля пароля заполнены — меняем пароль
            if (pwd || pwd2) {
                if (pwd.length < 6) throw new Error('Пароль должен быть не короче 6 символов');
                if (pwd !== pwd2) throw new Error('Пароли не совпадают');
                await changeMyPassword({ newPassword: pwd, confirmPassword: pwd2 });
                setPwd(''); setPwd2('');
            }

            toast.success('Изменения сохранены');
            setLogin(updated.login); setEmail(updated.email); setPhone(updated.phone);

        } catch (e) {
            setErr(e?.message || 'Не удалось сохранить изменения');
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="settings-page">
            <Breadcrumbs />
            <h2 className="page-title">Настройки</h2>

            {err && <div className="error">{err}</div>}
            {ok && <div className="success">{ok}</div>}
            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Telegram block */}
            <div className="settings-block">
                <p className="settings-hint">
                    Подключитесь к телеграм боту и получайте уведомления о транзакциях. Вы больше не пропустите споры и важные уведомления о работе
                </p>
                <div className="telegram-notification">
                    <div className="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                            <circle cx="24" cy="34.748" r=".75" fill="currentColor" />
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M23.975 30.275V12.502" strokeWidth="1" />
                            <circle cx="24" cy="24" r="21.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        </svg>
                    </div>
                    <p className="telegram-text">
                        Вы еще не связали <b>Telegram</b> аккаунт с сайтом
                    </p>
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
                <label>Логин</label>
                <input type="text" value={login} onChange={e => setLogin(e.target.value)} />

                <label>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />

                <label>Номер телефона</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} />

                <div className="password-fields">
                    <div className="password-input">
                        <label>Пароль</label>
                        <input type="password" placeholder="Введите пароль" value={pwd} onChange={e => setPwd(e.target.value)} />
                    </div>
                    <div className="password-input">
                        <label>Повтор пароля</label>
                        <input type="password" placeholder="Введите пароль ещё раз" value={pwd2} onChange={e => setPwd2(e.target.value)} />
                    </div>
                </div>

                <button className="save-btn" onClick={onSave} disabled={saving}>
                    {saving ? 'Сохраняем…' : 'Сохранить'}
                </button>
            </div>
        </div>
    );
}
