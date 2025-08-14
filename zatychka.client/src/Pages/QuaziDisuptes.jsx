// Disputes.jsx
import React from 'react';
import './Disputes.css';
import { FaDatabase } from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Disputes() {
    const disputes = []; // заглушка

    return (
        <div className="disputes-page">
            <Breadcrumbs />
            <h2 className="page-title-dis">Споры</h2>

            <div className="disputes-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID транзакции</th>
                            <th>Статус</th>
                            <th>Реквизиты</th>
                            <th>Устройство</th>
                            <th>Сумма сделки</th>
                            <th>Файлы</th>
                            <th>Таймер</th>
                        </tr>
                    </thead>

                    <tbody>
                        {disputes.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="no-disputes">
                                    <div className="empty-message-table">
                                        <FaDatabase style={{ marginRight: 8, opacity: .7 }} />
                                        Споров пока нет
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            disputes.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.transactionId ?? '—'}</td>
                                    <td>{item.status ?? '—'}</td>
                                    <td>{item.requisite ?? '—'}</td>
                                    <td>{item.device ?? '—'}</td>
                                    <td>{item.amount ?? '—'}</td>
                                    <td>{item.files ?? '—'}</td>
                                    <td>{item.timer ?? '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
