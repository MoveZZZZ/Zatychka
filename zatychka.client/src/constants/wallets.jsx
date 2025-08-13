import qr1 from '../assets/qr.png';


export const WALLETS = [
    {
        id: 'trc-1',
        network: 'TRC20',
        address: 'THtizmopwxsNdBGNTxGAT1fnaPxGNNLnGw',
        qr: qr1,
    },
    {
        id: 'trc-2',
        network: 'ERC20',
        address: 'sosihujsosihujsosihuj',
        qr: qr1,
    },
    {
        id: 'trc-1',
        network: 'BEP20',
        address: 'pizdapizdapizdapizda',
        qr: qr1,
    },

];

export function getRandomWallet(list = WALLETS) {
    if (!list || !list.length) throw new Error('');
    const i = Math.floor(Math.random() * list.length);
    return list[i];
}
