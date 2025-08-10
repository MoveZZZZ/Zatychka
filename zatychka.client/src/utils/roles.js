export function isAdminRole(role) {
    if (!role) return false;
    const r = String(role).trim().toLowerCase();
    return ['admin', 'админ', 'administrator', 'администратор'].includes(r);
}