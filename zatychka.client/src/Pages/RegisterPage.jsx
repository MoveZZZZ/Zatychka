import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import logo from '../assets/logo_without.png';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();

    const [role, setRole] = useState('trader');
    const [login, setLogin] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState(null);

    const [loginError, setLoginError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    useEffect(() => {
        if (location.pathname.includes('merchant')) {
            setRole('merchant');
        } else {
            setRole('trader');
        }
    }, [location.pathname]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        setLoginError('');
        setPhoneError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        let hasError = false;

        if (!login) {
            setLoginError('login is a required field');
            hasError = true;
        }
        if (!phone) {
            setPhoneError('phone is a required field');
            hasError = true;
        }
        if (!email) {
            setEmailError('email is a required field');
            hasError = true;
        }
        if (!password) {
            setPasswordError('password is a required field');
            hasError = true;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Пароли не совпадают');
            hasError = true;
        }
        if (!acceptedTerms) {
            setError('Вы должны принять условия использования');
            hasError = true;
        }

        if (hasError) return;

        try {
            const response = await fetch('https://localhost:5132/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, phone, email, password, role })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ошибка регистрации');

            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleRegister} className="login-form">
                <div className="login-header">
                    <img src={logo} alt="Logo" className="login-logo" />
                    <h2 className="login-title">Регистрация {role}</h2>
                </div>

                <input
                    type="text"
                    placeholder="Придумайте логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className={`login-input email ${loginError ? 'error' : ''}`}
                />
                {loginError && <p className="login-error-message">{loginError}</p>}

                <div className="phone-wrapper">
                    <span className="phone-icon">📞</span>
                    <input
                        type="tel"
                        placeholder=""
                        value={phone}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (!value.startsWith('+')) {
                                setPhone('+' + value.replace(/\D/g, ''));
                            } else {
                                setPhone(value.replace(/[^\d+]/g, ''));
                            }
                        }}
                        onFocus={() => {
                            if (!phone.startsWith('+')) {
                                setPhone('+' + phone);
                            }
                        }}
                        className={`login-input phone ${phoneError ? 'error' : ''}`}
                    />
                </div>
                {phoneError && <p className="login-error-message">{phoneError}</p>}

                <input
                    type="email"
                    placeholder="Введите ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`login-input password ${emailError ? 'error' : ''}`}
                />
                {emailError && <p className="login-error-message">{emailError}</p>}

                <input
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`login-input password ${passwordError ? 'error' : ''}`}
                />
                {passwordError && <p className="login-error-message">{passwordError}</p>}

                <input
                    type="password"
                    placeholder="Введите пароль ещё раз"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`login-input password ${confirmPasswordError ? 'error' : ''}`}
                />
                {confirmPasswordError && <p className="login-error-message">{confirmPasswordError}</p>}

                <label className="text-sm text-white mt-2">
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mr-2"
                    />
                    Я принимаю условия пользования и соглашаюсь на обработку персональных данных
                </label>

                {error && <p className="login-error-message">{error}</p>}

                <button type="submit" className="login-button mt-2">
                    Зарегистрироваться
                </button>

                <div className="login-footer mt-4">
                    Уже зарегистрированы?
                    <a href="/login" className="login-link">Войти</a>
                </div>
            </form>
        </div>
    );
}