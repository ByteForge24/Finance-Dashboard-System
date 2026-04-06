// API Client - handles all backend communication
// Use environment variable if available, otherwise default to localhost
const API_BASE = (typeof window !== 'undefined' && window.ENV?.API_BASE_URL) 
  ? window.ENV.API_BASE_URL 
  : 'http://127.0.0.1:3000';
const BASE_URL = `${API_BASE}/api/v1`;

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }

async function request(method, path, body = null, query = null) {
    let url = `${BASE_URL}${path}`;
    if (query) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') params.append(k, v); });
        const qs = params.toString();
        if (qs) url += `?${qs}`;
    }
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers, cache: 'no-store' };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (res.status === 204) return null;
    if (res.status === 304) return null;
    if (res.status === 401) { clearToken(); window.location.hash = '#/login'; throw new Error('Session expired'); }
    if (res.status === 403) { window.location.hash = '#/unauthorized'; throw new Error('Access denied'); }
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
}

// Auth
export const login = (email, password) => request('POST', '/auth/login', { email, password });
export const getMe = () => request('GET', '/auth/me');

// Dashboard
export const getSummary = (q) => request('GET', '/dashboard/summary', null, q);
export const getCategoryBreakdown = (q) => request('GET', '/dashboard/category-breakdown', null, q);
export const getRecentActivity = (q) => request('GET', '/dashboard/recent-activity', null, q);
export const getTrends = (q) => request('GET', '/dashboard/trends', null, q);
export const getMonthlyInsights = (q) => request('GET', '/dashboard/monthly-insights', null, q);

// Records
export const getRecords = (q) => request('GET', '/records', null, q);
export const getRecord = (id) => request('GET', `/records/${id}`);
export const createRecord = (body) => request('POST', '/records', body);
export const updateRecord = (id, body) => request('PATCH', `/records/${id}`, body);
export const deleteRecord = (id) => request('DELETE', `/records/${id}`);
export const suggestCategory = (body) => request('POST', '/records/suggest-category', body);

// Users
export const getUsers = (q) => request('GET', '/users', null, q);
export const createUser = (body) => request('POST', '/users', body);
export const updateUser = (id, body) => request('PATCH', `/users/${id}`, body);
export const updateUserRole = (id, role) => request('PATCH', `/users/${id}/role`, { role });
export const updateUserStatus = (id, status) => request('PATCH', `/users/${id}/status`, { status });

export { getToken, setToken, clearToken };
