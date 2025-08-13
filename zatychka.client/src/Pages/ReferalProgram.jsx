import React, { useState } from 'react';
import './ReferalProgram.css';
import InviteModal from './InviteModal';

const ReferralProgram = () => {
    const [showInvite, setShowInvite] = useState(false);
    const [referralLink, setreferralLink] = useState("");

    const [referalLoading, setReferalLoading] = useState(false);


    async function handleAddReferralClick() {
        try {
            const RNG_Link = Math.floor(Math.random() * (89797897899 - 63397897899 + 1)) + 63397897899;
            const RNG_Link_string = String(RNG_Link);
            const ref_link = "https://sharq.space/auth/register/trader?referrer=" + RNG_Link_string;
            setreferralLink(ref_link);
            setReferalLoading(true);
            await new Promise(r => setTimeout(r, 1800));
            setShowInvite(true);
        } finally {
            setReferalLoading(false);
        }
    }

    return (
        <div className="referral-container">
            <div className="referral-header">
                <h2 className="page-title">Реферальная система</h2>
                <button onClick={() => handleAddReferralClick()} className="invite-btn">
                    {referalLoading ? <span className="btn-spinner" aria-label="Загрузка" /> : '+ Пригласить реферала'}
                </button>
                {showInvite && (
                    <InviteModal
                        onClose={() => setShowInvite(false)}
                        referralLink={referralLink}
                    />
                )}
            </div>

            <div className="referral-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5m8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5" /></svg>
                <span>Список рефералов</span>
            </div>

            <div className="referral-table-wrapper">
                <table className="referral-table">
                    <thead>
                        <tr>
                            <th>Трейдер</th>
                            <th>Приём</th>
                            <th>Вознаграждение</th>
                            <th>Баланс</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="empty-row">
                            <td colSpan={4}>
                                <div className="empty-message-table">Данных пока нет</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReferralProgram;
