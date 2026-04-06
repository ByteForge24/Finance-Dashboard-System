// Auth state management
import { getMe, getToken, clearToken } from './api.js';

let currentUser = null;

export function setCurrentUser(user) { currentUser = user; }
export function getCurrentUser() { return currentUser; }
export function isLoggedIn() { return !!currentUser && !!getToken(); }

export function hasRole(...roles) {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
}

export function canAccessRecords() { return hasRole('analyst', 'admin'); }
export function canAccessUsers() { return hasRole('admin'); }
export function canCRUDRecords() { return hasRole('admin'); }
export function canCRUDUsers() { return hasRole('admin'); }

export async function restoreSession() {
    const token = getToken();
    if (!token) return false;
    try {
        const user = await getMe();
        currentUser = user;
        return true;
    } catch (e) {
        clearToken();
        currentUser = null;
        return false;
    }
}

export function logout() {
    clearToken();
    currentUser = null;
    window.location.hash = '#/login';
}
