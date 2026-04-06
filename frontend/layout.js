// Shared layout: sidebar + topbar + main content area (exact Stitch markup)
import { getCurrentUser, canAccessRecords, canAccessUsers, logout } from './auth.js';
import { showToast } from './toast.js';

export function renderAppShell(activePage, contentHtml) {
    const user = getCurrentUser();
    const name = user ? user.name : '';
    const role = user ? user.role : '';


    const dashActive = activePage === 'dashboard';
    const recActive = activePage === 'records';
    const usrActive = activePage === 'users';

    const activeClass = 'flex items-center gap-3 px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-transform active:scale-95';
    const inactiveClass = 'flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors duration-200';

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
<div class="flex h-screen overflow-hidden">
<!-- SideNavBar (exact Stitch) -->
<aside class="hidden md:flex flex-col h-full py-6 px-4 bg-slate-50 dark:bg-slate-900 w-64 border-r-0 shrink-0">
    <div class="mb-10 px-2 flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">account_balance</span>
        </div>
        <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Finance Dashboard System</span>
    </div>
    <nav class="flex-1 space-y-2">
        <a class="${dashActive ? activeClass : inactiveClass}" href="#/dashboard" data-nav="dashboard">
            <span class="material-symbols-outlined">dashboard</span>
            <span class="font-body">Dashboard</span>
        </a>
        <a class="${recActive ? activeClass : inactiveClass}" href="#/records" data-nav="records">
            <span class="material-symbols-outlined">receipt_long</span>
            <span class="font-body">Records</span>
        </a>
        <a class="${usrActive ? activeClass : inactiveClass}" href="#/users" data-nav="users">
            <span class="material-symbols-outlined">group</span>
            <span class="font-body">Users</span>
        </a>
    </nav>
    <div class="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 px-2">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">${initials}</div>
            <div>
                <p class="text-sm font-bold text-slate-900 dark:text-slate-50">${name}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wider">${role}</p>
            </div>
        </div>
    </div>
</aside>
<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- TopNavBar (exact Stitch) -->
    <header class="flex justify-between items-center px-8 w-full border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md h-16 sticky top-0 z-40">
        <div class="flex items-center flex-1 max-w-xl">
            <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input id="global-search" class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm" placeholder="Search transactions, users, or reports..." type="text"/>
            </div>
        </div>
        <div class="flex items-center gap-6 ml-8">
            <div class="flex items-center gap-4">
                <button id="notification-btn" class="relative p-2 text-on-surface-variant hover:text-primary transition-all">
                    <span class="material-symbols-outlined">notifications</span>
                </button>
                <button id="settings-btn" class="p-2 text-on-surface-variant hover:text-primary transition-all">
                    <span class="material-symbols-outlined">settings</span>
                </button>
            </div>
            <div class="h-8 w-[1px] bg-outline-variant/30"></div>
            <button id="logout-btn" class="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-600 transition-all">Logout</button>
            <div class="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">${initials}</div>
        </div>
    </header>
    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto bg-surface" id="main-content">
        ${contentHtml}
    </main>
</div>
</div>
<!-- BottomNavBar (Mobile Only, exact Stitch) -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white flex items-center justify-around z-50 border-t-0 shadow-[0_-12px_40px_rgba(21,28,39,0.06)] px-4">
    <a class="flex flex-col items-center gap-1 ${dashActive ? 'text-blue-700' : 'text-slate-500'}" href="#/dashboard">
        <span class="material-symbols-outlined" ${dashActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>dashboard</span>
        <span class="text-[10px] font-bold">Dashboard</span>
    </a>
    <a class="flex flex-col items-center gap-1 ${recActive ? 'text-blue-700' : 'text-slate-500'}" href="#/records">
        <span class="material-symbols-outlined" ${recActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>receipt_long</span>
        <span class="text-[10px] font-bold">Records</span>
    </a>
    <a class="flex flex-col items-center gap-1 ${usrActive ? 'text-blue-700' : 'text-slate-500'}" href="#/users">
        <span class="material-symbols-outlined" ${usrActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>group</span>
        <span class="text-[10px] font-bold">Users</span>
    </a>
</nav>`;
}

export function bindLogout() {
    const btn = document.getElementById('logout-btn');
    if (btn) btn.addEventListener('click', () => logout());

    const notifBtn = document.getElementById('notification-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            showToast('You have no new notifications.', 'info');
        });
    }

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
             window.location.hash = '#/settings';
        });
    }

    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim().toLowerCase();
                if (query.length > 0) {
                    if (query.includes('user')) {
                        window.location.hash = '#/users?search=' + encodeURIComponent(query);
                    } else if (query.includes('record') || query.includes('transaction')) {
                        window.location.hash = '#/records';
                    } else {
                        // For any general search request, redirect to Records since that's
                        // where they would usually search for items/transactions.
                        showToast(`Searching for "${query}" across records...`, 'success');
                        window.location.hash = '#/records?search=' + encodeURIComponent(query);
                    }
                }
            }
        });
    }
}
