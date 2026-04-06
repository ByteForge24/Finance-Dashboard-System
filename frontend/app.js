// Main app entry point - SPA router
import { restoreSession, isLoggedIn, canAccessRecords, canAccessUsers, getCurrentUser, setCurrentUser } from './auth.js';
import { setToken } from './api.js';
import { renderLogin, bindLogin } from './page-login.js';
import { renderDashboard } from './page-dashboard.js';
import { renderRecords } from './page-records.js';
import { renderUsers } from './page-users.js';
import { renderUnauthorized } from './page-unauthorized.js';
import { renderSettings } from './page-settings.js';

const app = document.getElementById('app');

async function route() {
    const hash = window.location.hash || '#/login';
    const fullPath = hash.replace('#', '');
    const [path, queryString] = fullPath.split('?');

    // Public route: login
    if (path === '/login') {
        if (isLoggedIn()) {
            window.location.hash = '#/dashboard';
            return;
        }
        app.innerHTML = renderLogin();
        bindLogin();
        return;
    }

    // All other routes require auth
    if (!isLoggedIn()) {
        window.location.hash = '#/login';
        return;
    }

    if (path === '/dashboard') {
        await renderDashboard();
        return;
    }

    if (path === '/records') {
        if (!canAccessRecords()) {
            window.location.hash = '#/unauthorized';
            return;
        }
        await renderRecords(queryString);
        return;
    }

    if (path === '/users') {
        if (!canAccessUsers()) {
            window.location.hash = '#/unauthorized';
            return;
        }
        await renderUsers(queryString);
        return;
    }

    if (path === '/unauthorized') {
        app.innerHTML = renderUnauthorized();
        return;
    }

    if (path === '/settings') {
        await renderSettings();
        return;
    }

    // Default redirect
    window.location.hash = '#/dashboard';
}

// Initialize
async function init() {
    // Show loading state
    app.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-background">
        <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-white">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">account_balance</span>
            </div>
            <div class="skeleton h-2 w-32 rounded"></div>
        </div>
    </div>`;

    const theme = localStorage.getItem('prefs_theme');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    }

    const restored = await restoreSession();
    if (!restored && window.location.hash !== '#/login') {
        window.location.hash = '#/login';
    }
    await route();
}

window.addEventListener('hashchange', route);
init();
