import React, { useEffect, useState } from 'react';
import './StatisticsPage.css';

import useUserInfo from '../hooks/useUserInfo';
import { isAdminRole } from '../utils/roles';
import { getStatisticsTexts, getStatisticsNumbers as getPublicNumbers, saveStatisticsNumbers as savePublicNumbers } from '../api/settings';
import { getMyStatisticsNumbers as getPrivateNumbers, saveMyStatisticsNumbers as savePrivateNumbers } from '../api/privateStatisticsUser';
import { useEditMode } from '../context/EditModeContext';
import { useDataScope } from '../context/DataScopeContext';

import Spinner from '../components/Spinner';

const defaultTexts = {
    pageTitle: 'Статистика',
    intake: {
        title: 'Приём',
        totalTxLabel: 'Всего транзакций',
        totalTxSubPrefix: 'На сумму',
        activeTxLabel: 'Активных транзакций',
        activeTxSubPrefix: 'На сумму',
        successTxLabel: 'Успешных транзакций',
        profitLabel: 'Прибыль',
    },
    disputes: {
        title: 'Споры',
        totalLabel: 'Всего споров',
        activeLabel: 'Активных споров',
    },
};

const defaultNumbers = {
    intake: {
        totalTxCount: 0,
        totalTxAmountUSDT: 0,
        activeTxCount: 0,
        activeTxAmountUSDT: 0,
        successRateValue: 100,
        successRateSuffix: '%',
        profitUSDT: 0,
    },
    disputes: {
        totalCount: 0,
        activeCount: 0,
    },
};

const mergeTexts = (base, inc) => ({
    ...base,
    ...(inc || {}),
    intake: { ...base.intake, ...(inc?.intake || {}) },
    disputes: { ...base.disputes, ...(inc?.disputes || {}) },
});

const mergeNumbers = (base, inc) => ({
    intake: { ...base.intake, ...(inc?.intake || {}) },
    disputes: { ...base.disputes, ...(inc?.disputes || {}) },
});

function EditableText({ editing, value, onChange, className }) {
    if (!editing) return <span className={className}>{value}</span>;
    return <input className={className} value={value} onChange={(e) => onChange(e.target.value)} />;
}
function EditableNumber({ editing, value, onChange, className, min = 0 }) {
    if (!editing) return <span className={className}>{value}</span>;
    return (
        <input
            className={className}
            type="number"
            min={min}
            value={value ?? ''}
            onChange={(e) => {
                const v = e.target.value;
                onChange(v === '' ? '' : Number(v));
            }}
        />
    );
}

export default function StatisticsPage() {
    const me = useUserInfo();
    const isAdmin = isAdminRole(me?.role);
    const { editMode } = useEditMode();
    const { scope } = useDataScope(); // 'public' | 'private'

    const [texts, setTexts] = useState(defaultTexts);

    const [pubNums, setPubNums] = useState(defaultNumbers);
    const [privNums, setPrivNums] = useState(defaultNumbers);

    const [draft, setDraft] = useState(defaultNumbers);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [editing, setEditing] = useState(false);

    const numbers = scope === 'public' ? pubNums : privNums;
    const setNumbers = scope === 'public' ? setPubNums : setPrivNums;
    const saver = scope === 'public' ? savePublicNumbers : savePrivateNumbers;
    const loader = scope === 'public' ? getPublicNumbers : getPrivateNumbers;

    useEffect(() => {
        if (!editMode && editing) setEditing(false);
    }, [editMode, editing]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [t, nPub, nPriv] = await Promise.all([
                    getStatisticsTexts().catch(() => null),
                    getPublicNumbers().catch(() => null),
                    getPrivateNumbers().catch(() => null),
                ]);
                if (cancelled) return;

                if (t) setTexts(mergeTexts(defaultTexts, t));
                if (nPub) setPubNums(mergeNumbers(defaultNumbers, nPub));
                if (nPriv) setPrivNums(mergeNumbers(defaultNumbers, nPriv));
                setDraft(mergeNumbers(defaultNumbers, scope === 'public' ? (nPub || defaultNumbers) : (nPriv || defaultNumbers)));
            } catch (e) {
                if (!cancelled) setErr(e?.message || 'Не удалось загрузить данные');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // при смене scope — обновим драфт из соответствующего стейта
    useEffect(() => {
        setDraft(numbers);
        setEditing(false);
    }, [scope]); // eslint-disable-line

    function startEdit() {
        setDraft(numbers);
        setEditing(true);
        setErr('');
    }
    function cancelEdit() {
        setDraft(numbers);
        setEditing(false);
        setErr('');
    }

    async function save() {
        try {
            setSaving(true);
            setErr('');

            // Преобразуем в patch-форму (как в контроллере приватки),
            // Публичный — пусть тоже принимает ту же структуру: { intake, disputes }
            const patch = {
                intake: {
                    totalTxCount: draft.intake.totalTxCount,
                    totalTxAmountUSDT: draft.intake.totalTxAmountUSDT,
                    activeTxCount: draft.intake.activeTxCount,
                    activeTxAmountUSDT: draft.intake.activeTxAmountUSDT,
                    successRateValue: draft.intake.successRateValue,
                    successRateSuffix: draft.intake.successRateSuffix,
                    profitUSDT: draft.intake.profitUSDT,
                },
                disputes: {
                    totalCount: draft.disputes.totalCount,
                    activeCount: draft.disputes.activeCount,
                },
            };

            const saved = await saver(patch);
            const merged = mergeNumbers(defaultNumbers, saved);
            setNumbers(merged);
            setDraft(merged);
            setEditing(false);
        } catch (e) {
            setErr(e?.message || 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    }

    const t = texts;
    const n = editing ? draft : numbers;

    return (
        <div className="statistics-container">
            <div className="stats-head">
                <h2 className="page-title">{t.pageTitle}</h2>

                {/* Кнопки только если админ и включён глобальный editMode */}
                {isAdmin && editMode && (
                    <div className="edit-controls">
                        {!editing ? (
                            <button onClick={startEdit}>Редактировать ({scope === 'public' ? 'Публичные' : 'Приватные'})</button>
                        ) : (
                            <>
                                <button onClick={cancelEdit} disabled={saving}>Отмена</button>
                                <button onClick={save} disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {err && <div className="error">{err}</div>}
            {loading && <Spinner center label="Загрузка…" size={30} />}

            {/* Приём */}
            <div className="section">
                <h3 className="section-heading">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16V8m0 8c-.7 0-2.008-1.994-2.5-2.5M12 16c.7 0 2.008-1.994 2.5-2.5" />
                        </g>
                    </svg>
                    <span className="section-title-text">{t.intake.title}</span>
                </h3>

                <div className="stats-grid">
                    <div className="stat-card">
                        <p className="label">{t.intake.totalTxLabel}</p>
                        <p className="value">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.intake.totalTxCount}
                                onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, totalTxCount: v } })}
                            />
                        </p>
                        <p className="sub">
                            {t.intake.totalTxSubPrefix}&nbsp;
                            <span className="amount">
                                <EditableNumber
                                    editing={editing && isAdmin && editMode}
                                    value={n.intake.totalTxAmountUSDT}
                                    onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, totalTxAmountUSDT: v } })}
                                />
                            </span>
                            &nbsp;<span className="currency">USDT</span>
                        </p>
                    </div>

                    <div className="stat-card">
                        <p className="label">{t.intake.activeTxLabel}</p>
                        <p className="value">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.intake.activeTxCount}
                                onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, activeTxCount: v } })}
                            />
                        </p>
                        <p className="sub">
                            {t.intake.activeTxSubPrefix}&nbsp;
                            <span className="amount">
                                <EditableNumber
                                    editing={editing && isAdmin && editMode}
                                    value={n.intake.activeTxAmountUSDT}
                                    onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, activeTxAmountUSDT: v } })}
                                />
                            </span>
                            &nbsp;<span className="currency">USDT</span>
                        </p>
                    </div>

                    <div className="stat-card">
                        <p className="label">{t.intake.successTxLabel}</p>
                        <p className="value value-inline">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.intake.successRateValue}
                                onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, successRateValue: v } })}
                            />
                            <EditableText
                                editing={editing && isAdmin && editMode}
                                value={n.intake.successRateSuffix}
                                onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, successRateSuffix: v } })}
                                className="suffix"
                            />
                        </p>
                    </div>

                    <div className="stat-card">
                        <p className="label">{t.intake.profitLabel}</p>
                        <p className="value">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.intake.profitUSDT}
                                onChange={(v) => setDraft({ ...draft, intake: { ...draft.intake, profitUSDT: v } })}
                            />
                            &nbsp;USDT
                        </p>
                    </div>
                </div>
            </div>

            {/* Споры */}
            <div className="section">
                <h3 className="section-heading">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                            fill="currentColor"
                            d="M14.27 1.48a1.3 1.3 0 0 0-.65.18a6.3 6.3 0 0 1-3 1.1c-1.66 0-3.65-1-5.65-1a11.4 11.4 0 0 0-3.18.46v-.09a.63.63 0 0 0-1.25 0v11.76a.63.63 0 1 0 1.25 0V11a10.6 10.6 0 0 1 3.18-.46c1.66 0 4.4 1 6.45 1A5.86 5.86 0 0 0 15 10.11a1.17 1.17 0 0 0 .47-.93V2.66a1.21 1.21 0 0 0-1.2-1.18m0 7.65a4.58 4.58 0 0 1-2.87 1.08a17.7 17.7 0 0 1-3.29-.49a16 16 0 0 0-3.16-.48A12.3 12.3 0 0 0 2 9.57v-6.1A9.9 9.9 0 0 1 4.93 3a11.6 11.6 0 0 1 2.78.48a12 12 0 0 0 2.87.52a7.5 7.5 0 0 0 3.67-1.27z"
                        />
                    </svg>
                    <span className="section-title-text">{t.disputes.title}</span>
                </h3>

                <div className="stats-grid">
                    <div className="stat-card">
                        <p className="label">{t.disputes.totalLabel}</p>
                        <p className="value">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.disputes.totalCount}
                                onChange={(v) => setDraft({ ...draft, disputes: { ...draft.disputes, totalCount: v } })}
                            />
                        </p>
                    </div>
                    <div className="stat-card">
                        <p className="label">{t.disputes.activeLabel}</p>
                        <p className="value">
                            <EditableNumber
                                editing={editing && isAdmin && editMode}
                                value={n.disputes.activeCount}
                                onChange={(v) => setDraft({ ...draft, disputes: { ...draft.disputes, activeCount: v } })}
                            />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
