import { get, put } from './client';


export function getPublicWallet() {
    return get('/api/wallet/public');
}

export function savePublicWallet(payload) {

    return put('/api/wallet/public', payload);
}
