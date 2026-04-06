import { renderAppShell, bindLogout } from './layout.js';
import { getCurrentUser } from './auth.js';
import { showToast } from './toast.js';

export async function renderSettings() {
    const app = document.getElementById('app');
    
    const loading = `
    <div class="flex-1 p-8">
        <h1 class="text-3xl font-extrabold text-on-surface tracking-tight mb-8">Settings</h1>
        <div class="space-y-4">
            <div class="skeleton h-48 rounded-xl w-full max-w-2xl"></div>
            <div class="skeleton h-32 rounded-xl w-full max-w-2xl"></div>
        </div>
    </div>`;
    
    app.innerHTML = renderAppShell('settings', loading);
    bindLogout();

    const main = document.getElementById('main-content');
    const user = getCurrentUser() || { name: 'Demo User', role: 'Viewer', email: 'demo@example.com' };
    
    // Check current theme
    const isDark = document.documentElement.classList.contains('dark');
    
    // Check mock notifications (retrieve from localStorage for demo)
    const storedEmail = localStorage.getItem('prefs_email_notif') !== 'false';
    const storedPush = localStorage.getItem('prefs_push_notif') === 'true';

    const contentHtml = `
    <div class="p-8 max-w-4xl mx-auto space-y-8">
        <div>
            <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h1>
            <p class="text-sm text-on-surface-variant mt-1">Manage your account preferences and application settings.</p>
        </div>

        <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-sm">
            <h2 class="text-xl font-extrabold font-headline text-on-surface mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">person</span>
                Profile Details
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-label">Full Name</label>
                    <input type="text" disabled value="${user.name}" class="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-label">Role</label>
                    <input type="text" disabled value="${user.role}" class="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
                </div>
                <!-- Hacky way to enforce email if not there -->
                <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 font-label">Email Address (Read Only)</label>
                    <input type="email" disabled value="${user.name.toLowerCase().replace(' ', '.')}@finance.local" class="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm rounded-xl px-4 py-3 opacity-70 cursor-not-allowed">
                </div>
            </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-sm">
            <h2 class="text-xl font-extrabold font-headline text-on-surface mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">palette</span>
                Appearance View
            </h2>
            <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div>
                    <p class="font-bold text-on-surface">Dark Mode</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">Switch the interface to a darker, high-contrast palette</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="toggle-dark-mode" class="sr-only peer" ${isDark ? 'checked' : ''}>
                    <div class="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
        </div>

        <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-sm">
            <h2 class="text-xl font-extrabold font-headline text-on-surface mb-6 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">notifications_active</span>
                Notifications
            </h2>
            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div>
                        <p class="font-bold text-on-surface">Email Updates</p>
                        <p class="text-xs text-on-surface-variant mt-0.5">Receive weekly financial summaries via email</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggle-email-notif" class="sr-only peer" ${storedEmail ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div class="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <div>
                        <p class="font-bold text-on-surface">Push Notifications</p>
                        <p class="text-xs text-on-surface-variant mt-0.5">Get instant browser alerts for new transactions</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggle-push-notif" class="sr-only peer" ${storedPush ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-outline-variant/50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
            <div class="mt-8 flex justify-end">
                <button id="save-settings-btn" class="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm focus:ring-2 focus:ring-primary/20">
                    Save Preferences
                </button>
            </div>
        </div>
    </div>`;

    main.innerHTML = contentHtml;

    // Bind settings logic
    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
        const darkCheck = document.getElementById('toggle-dark-mode').checked;
        const emailCheck = document.getElementById('toggle-email-notif').checked;
        const pushCheck = document.getElementById('toggle-push-notif').checked;

        if (darkCheck) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.setItem('prefs_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('prefs_theme', 'light');
        }

        localStorage.setItem('prefs_email_notif', emailCheck);
        localStorage.setItem('prefs_push_notif', pushCheck);

        showToast('Settings saved successfully.', 'success');
    });
}
