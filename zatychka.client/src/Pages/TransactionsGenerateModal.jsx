import React, { useEffect, useState } from 'react';
import './TransactionsGenerateModal.css';
import { searchLinks, generateTransactions } from '../api/links';
import { useToast } from '../context/ToastContext';

export default function TransactionsGenerateModal({ onClose }) {
    const toast = useToast();
    const [login, setLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const [links, setLinks] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [count, setCount] = useState(100);
    const [err, setErr] = useState('');

    const toggle = (id) => {
        setSelected(prev => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });
    };

    const toggleAll = () => {
        setSelected(prev => {
            if (prev.size === links.length) {
                return new Set();
            } else {
                return new Set(links.map(l => l.id));
            }
        });
    };

    async function load() {
        try {
            setLoading(true);
            setErr('');
            const data = await searchLinks({ login, activeOnly: false, take: 500 });
            setLinks(data);
            setSelected(new Set()); // Reset selection on new load
        } catch (e) {
            setErr(e?.message || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    async function run() {
        try {
            if (selected.size === 0) { toast.info('Выберите хотя бы одну связку'); return; }
            setLoading(true);
            const linkIds = Array.from(selected);
            const res = await generateTransactions(linkIds, Number(count || 0));
            toast.success(`Создано транзакций: ${res.created}`);
            onClose?.();
        } catch (e) {
            toast.error(e?.message || 'Не удалось сгенерировать');
        } finally {
            setLoading(false);
        }
    }

    const allSelected = selected.size === links.length && links.length > 0;

    return (
        <div className="tg-overlay" onClick={onClose}>
            <div className="tg-modal" onClick={e => e.stopPropagation()}>
                <div className="tg-head">
                    <h3>Генерация транзакций</h3>
                    <button className="tg-close" onClick={onClose}>×</button>
                </div>

                <div className="tg-row">
                    <input
                        className="tg-input"
                        placeholder="Поиск по логину пользователя…"
                        value={login}
                        onChange={e => setLogin(e.target.value)}
                    />
                    <button className="tg-btn" onClick={load} disabled={loading}>Найти</button>
                </div>

                <div className="tg-row">
                    <label>Сколько создать сейчас</label>
                    <input
                        className="tg-input small"
                        type="number"
                        min="1"
                        value={count}
                        onChange={e => setCount(e.target.value)}
                    />
                </div>

                {err && <div className="tg-err">{err}</div>}

                <div className="tg-list">
                    {loading ? <div className="tg-empty">Загрузка…</div> :
                        links.length === 0 ? <div className="tg-empty">Связки не найдены</div> :
                            <>
                                <div className="tg-select-all">
                                    <button className="tg-btn ghost" onClick={toggleAll}>
                                        {allSelected ? 'Снять все' : 'Выбрать все'}
                                    </button>
                                </div>
                                <table className="tg-table">
                                    <thead>
                                        <tr>
                                            <th>Выбрать</th>
                                            <th>Логин</th>
                                            <th>Устройство</th>
                                            <th>Реквизиты</th>
                                            <th>Лимиты USDT</th>
                                            <th>Ограничения</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {links.map(l => (
                                            <tr key={l.id} className={!l.isActive ? 'muted' : ''}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.has(l.id)}
                                                        onChange={() => toggle(l.id)}
                                                    />
                                                </td>
                                                <td>{l.userLogin}</td>
                                                <td>{l.deviceName}</td>
                                                <td>{l.requisiteDisplay}</td>
                                                <td>{l.minAmountUsdt}–{l.maxAmountUsdt}</td>
                                                <td>
                                                    {l.dailyTxCountLimit && <span>День: {l.dailyTxCountLimit}<br /></span>}
                                                    {l.monthlyTxCountLimit && <span>Месяц: {l.monthlyTxCountLimit}<br /></span>}
                                                    {l.totalTxCountLimit && <span>Всего: {l.totalTxCountLimit}<br /></span>}
                                                    {l.maxConcurrentTransactions && <span>Конкурентно: {l.maxConcurrentTransactions}<br /></span>}
                                                    {l.minMinutesBetweenTransactions && <span>Пауза: {l.minMinutesBetweenTransactions} мин<br /></span>}
                                                </td>
                                                <td>{l.isActive ? 'Активна' : 'Неактивна'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>}
                </div>

                <div className="tg-actions">
                    <button className="tg-btn ghost" onClick={onClose}>Отмена</button>
                    <button className="tg-btn primary" onClick={run} disabled={loading}>Сгенерировать</button>
                </div>
            </div>
        </div>
    );
}