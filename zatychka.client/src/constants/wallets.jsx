import TN77VVfp59uBu7wj1z3J6CbSg7mTdLC2iM from '../assets/wallets/TN77VVfp59uBu7wj1z3J6CbSg7mTdLC2iM.png';
import TM2a2Bp7eQwfbZYKPLCH1u9117Gy85xqqM from '../assets/wallets/TM2a2Bp7eQwfbZYKPLCH1u9117Gy85xqqM.png';
import TXNgEyizmG5u5QYocebKokPTqoBKpDLv9P from '../assets/wallets/TXNgEyizmG5u5QYocebKokPTqoBKpDLv9P.png';
import TKJ287r72VbcqrQh8M1yArbDG8Z5pQLyRq from '../assets/wallets/TKJ287r72VbcqrQh8M1yArbDG8Z5pQLyRq.png';
import TBExS5HpQ5K3fXXGmhkpahkJLdxA9rABdK from '../assets/wallets/TBExS5HpQ5K3fXXGmhkpahkJLdxA9rABdK.png';


export const WALLETS = [
    {
        id: 'trc-1',
        network: 'TRC20',
        address: 'TN77VVfp59uBu7wj1z3J6CbSg7mTdLC2iM',
        qr: TN77VVfp59uBu7wj1z3J6CbSg7mTdLC2iM,
    },
    {
        id: 'trc-2',
        network: 'TRC20',
        address: 'TM2a2Bp7eQwfbZYKPLCH1u9117Gy85xqqM',
        qr: TM2a2Bp7eQwfbZYKPLCH1u9117Gy85xqqM,
    },
    {
        id: 'trc-3',
        network: 'TRC20',
        address: 'TXNgEyizmG5u5QYocebKokPTqoBKpDLv9P',
        qr: TXNgEyizmG5u5QYocebKokPTqoBKpDLv9P,
    },
    {
        id: 'trc-4',
        network: 'TRC20',
        address: 'TKJ287r72VbcqrQh8M1yArbDG8Z5pQLyRq',
        qr: TKJ287r72VbcqrQh8M1yArbDG8Z5pQLyRq,
    },
    {
        id: 'trc-5',
        network: 'TRC20',
        address: 'TBExS5HpQ5K3fXXGmhkpahkJLdxA9rABdK',
        qr: TBExS5HpQ5K3fXXGmhkpahkJLdxA9rABdK,
    },

];

export function getRandomWallet(list = WALLETS) {
    if (!list || !list.length) throw new Error('');
    const i = Math.floor(Math.random() * list.length);
    return list[i];
}
