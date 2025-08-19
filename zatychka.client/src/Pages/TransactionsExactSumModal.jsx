import React, { useState } from 'react';
import './TransactionsExactSumModal.css';
import { generateExactSumPublic, generateExactSumPrivate } from '../api/payin';

export default function TransactionsExactSumModal({ scope, open, onClose, onDone }) {
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [count, setCount] = useState(10);
    const [minAmount, setMinAmount] = useState('0.01');
    const [maxAmount, setMaxAmount] = useState('100.00');
    const [totalAmount, setTotalAmount] = useState('1000.00');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    if (!open) return null;

    function validate() {
        const c = Number(count);
        const min = Number(minAmount);
        const max = Number(maxAmount);
        const tot = Number(totalAmount);
        if (!Number.isFinite(c) || c <= 0) return 'Укажите положительное Count';
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return 'Проверьте Min/Max';
        if (!Number.isFinite(tot) || tot <= 0) return 'Укажите положительную TotalAmount';
        const lo = c * min;
        const hi = c * max;
        if (tot + 1e-9 < lo || tot - 1e-9 > hi) return `Total должен быть между ${lo.toFixed(2)} и ${hi.toFixed(2)}`;
        return '';
    }

    async function submit() {
        const v = validate();
        if (v) { setErr(v); return; }
        setErr('');
        setSaving(true);
        try {
            const body = {
                date: new Date(date + 'T00:00:00Z').toISOString(),
                count: Number(count),
                minAmount: Number(minAmount),
                maxAmount: Number(maxAmount),
                totalAmount: Number(totalAmount)
            };
            if (scope === 'private') await generateExactSumPrivate(body);
            else await generateExactSumPublic(body);
            onDone?.();
        } catch (e) {
            setErr(e?.message || 'Не удалось сгенерировать');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="tx-modal-overlay">
            <div className="tx-modal">
                <div className="tx-modal-header">
                    <h3>Генерация по точной сумме — {scope === 'private' ? 'Приватные' : 'Публичные'}</h3>
                    <button className="tx-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="tx-modal-body">
                    {err && <div className="tx-error-box">{err}</div>}

                    <div className="tx-field">
                        <label>Дата</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>

                    <div className="tx-field">
                        <label>Количество транзакций</label>
                        <input type="number" min="1" step="1" value={count} onChange={e => setCount(e.target.value)} />
                    </div>

                    <div className="tx-field">
                        <label>Минимальная сумма (USDT)</label>
                        <input type="number" min="0" step="0.01" value={minAmount} onChange={e => setMinAmount(e.target.value)} />
                    </div>

                    <div className="tx-field">
                        <label>Максимальная сумма (USDT)</label>
                        <input type="number" min="0" step="0.01" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} />
                    </div>

                    <div className="tx-field">
                        <label>Общая сумма (USDT)</label>
                        <input type="number" min="0" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                    </div>
                </div>

                <div className="tx-modal-actions">
                    <button className="tx-btn secondary" onClick={onClose} disabled={saving}>Отмена</button>
                    <button className="tx-btn" onClick={submit} disabled={saving}>{saving ? 'Генерируем…' : 'Сгенерировать'}</button>
                </div>
            </div>
        </div>
    );
}
