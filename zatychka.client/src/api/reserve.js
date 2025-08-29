// src/api/reserve.js
import { get, put } from './client';

// PUBLIC (видят все, менять могут админы)
export function getPublicReserve() {
    return get('/api/reserve/public');
}
export function updatePublicReserve(amount) {
    return put('/api/reserve/public', { amount });
}

// PRIVATE (личный для текущего админа)
export function getMyPrivateReserve() {
    return get('/api/reserve/private/my');
}
export function updateMyPrivateReserve(amount) {
    return put('/api/reserve/private/my', { amount });
}
