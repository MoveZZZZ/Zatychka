import React from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';
import logo from '../../public/favicon-32x32.png';

function SharqLogo({ size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="brand-logo"
        >
            <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffb44a" />
                    <stop offset="1" stopColor="#ff6a3d" />
                </linearGradient>
            </defs>
            <rect x="5" y="5" width="38" height="38" rx="12" fill="url(#g1)" />
            <path d="M16 27c0-6 7-6 10-8c2-1 2-3 0-4c-3-2-8-2-11 1" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 21c0 6-7 6-10 8c-2 1-2 3 0 4c3 2 8 2 11-1" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

export default function ComingSoon() {
    return (
        <div className="wip">
            <header className="wip-header container">
                <div className="brand">
                    <img src={logo} alt="SHARQ" />
                    <span className="brand-name">SHARQ</span>
                </div>

                <nav className="wip-nav">
                    <span className="pill pill-muted">Для кого</span>
                    <span className="pill pill-muted">Как начать</span>
                    <span className="pill pill-muted">Блог</span>
                    <span className="pill pill-muted">Контакты</span>
                </nav>

                <div className="wip-actions">
                    <Link to="/login" className="pill pill-action">Войти</Link>
                    <div className="pill pill-lang">
                        RU
                        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            </header>

            <main className="wip-main container">
                <h1>Страница в разработке</h1>
            </main>
        </div>
    );
}
