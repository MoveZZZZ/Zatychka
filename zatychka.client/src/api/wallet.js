// src/api/wallet.js
import { get, put } from './client';

export const getMyWallet = () => get('/api/wallet');
export const saveMyWallet = (payload) => put('/api/wallet', payload);           // admin
export const saveUserWallet = (userId, payload) => put(`/api/wallet/${userId}`, payload); // admin
