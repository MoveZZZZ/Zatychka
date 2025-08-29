import React from 'react';
import './WalletModal.css';

export default function WalletModal({ open, onClose, wallet, onCopySuccess, onCopyError }) {
    if (!open) return null;

    async function handleCopy() {
        try {
            if (!wallet?.address) throw new Error('no address');
            await navigator.clipboard.writeText(wallet.address);
            onCopySuccess?.();
        } catch {
            onCopyError?.();
        }
    }

    const address = wallet?.address || '••••••••••••••••••••••••••';
    const network = wallet?.network || 'TRC20';

    return (
        <div className="wm-backdrop" onClick={onClose}>
            <div className="wm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="wm-head">
                    <h3>Кошелёк для пополнения</h3>
                </div>

                <div className="wm-body">
                    <div className="wm-box">
                        <div className="wm-qr">
                            {wallet?.qr ? <img src={wallet.qr} alt="QR" /> : <div className="wm-qr-ph">QR</div>}
                        </div>

                        <div className="wm-info">
                            <label className="wm-label">Адрес</label>

                            {/* Адрес + сеть (бейдж справа) */}
                            <div className="wm-address">
                                <span className="wm-addr">{address}</span>
                                <span className="wm-net" title="Сеть">{network}</span>
                            </div>

                            <button className="wm-copy" type="button" onClick={handleCopy}>
                                Копировать
                            </button>

                            <p className="wm-note">
                                <span className="wm-warn" aria-hidden>⚠</span>
                                Кошелёк может обновляться. Пополняйте строго в указанной сети.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="wm-actions">
                    <button className="wm-confirm" type="button" onClick={onClose}>Понятно</button>
                </div>
            </div>
        </div>
    );
}
