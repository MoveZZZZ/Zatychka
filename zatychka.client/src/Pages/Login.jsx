import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../assets/logo_without.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        let hasError = false;

        setEmailError('');
        setPasswordError('');
        setError(null);

        if (!email) {
            setEmailError('email is a required field');
            hasError = true;
        }
        if (!password) {
            setPasswordError('password is a required field');
            hasError = true;
        }
        if (hasError) return;

        try {
            const response = await fetch('https://localhost:5132/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) throw new Error('Ошибка авторизации');
            navigate('/statistics');
        } catch {
            setError('Неверный email или пароль');
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form" noValidate>
                <div className="login-header">
                    <img src={logo} alt="Logo" className="login-logo" />
                    <h2 className="login-title">Авторизация</h2>
                </div>

                <input
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите ваш email"
                    className={`login-input email ${emailError ? 'error' : ''}`}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-err' : undefined}
                />
                {emailError && <p id="email-err" className="login-error-message">{emailError}</p>}

                <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className={`login-input password ${passwordError ? 'error' : ''}`}
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'pass-err' : undefined}
                />
                {passwordError && <p id="pass-err" className="login-error-message">{passwordError}</p>}

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" className="login-button">Авторизоваться</button>

                <div className="login-footer">
                    Нет аккаунта?
                    <a href="/register/trader" className="login-link">Я трейдер</a>
                    <a href="/register/merchant" className="login-link">Я мерчант</a>
                </div>
            </form>
        </div>
    );
}
