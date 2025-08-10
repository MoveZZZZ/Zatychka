import { authFetch, get, post, put, del } from '../api/client';

// Владелец
export function addOwner({ lastName, firstName, middleName, bankName }) {
    return post('/api/owners', { lastName, firstName, middleName, bankName });
}

export function listOwners() {
    return get('/api/owners');
}

export function updateOwner(id, { lastName, firstName, middleName, bankName }) {
    return put(`/api/owners/${id}`, { lastName, firstName, middleName, bankName });
}

export function deleteOwner(id) {
    return del(`/api/owners/${id}`);
}

// Реквизиты владельца
export function addRequisite(ownerId, { type, value }) {
    return post(`/api/owners/${ownerId}/requisites`, { type, value });
}

export function updateRequisite(ownerId, requisiteId, { type, value }) {
    return put(`/api/owners/${ownerId}/requisites/${requisiteId}`, { type, value });
}

export function deleteRequisite(ownerId, requisiteId) {
    return del(`/api/owners/${ownerId}/requisites/${requisiteId}`);
}
