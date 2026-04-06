// Access Denied page - exact Stitch markup from 5679b16974684b91a52e2e4fec21aa7e
import { getCurrentUser } from './auth.js';

export function renderUnauthorized() {
    const user = getCurrentUser();
    const role = user ? user.role : 'unknown';

    return `
<div class="bg-background text-on-surface font-body min-h-screen flex items-center justify-center p-6 overflow-hidden">
<!-- Global Background Texture (exact Stitch) -->
<div class="fixed inset-0 z-0">
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[120px]"></div>
</div>
<!-- Main Content Container (exact Stitch) -->
<main class="relative z-10 w-full max-w-xl">
    <!-- Branding Anchor -->
    <div class="mb-10 flex justify-center">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">account_balance</span>
            </div>
            <h1 class="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Finance Dashboard System</h1>
        </div>
    </div>
    <!-- Access Denied Card (exact Stitch) -->
    <div class="shadow-2xl rounded-2xl bg-surface-container-lowest overflow-hidden">
        <div class="p-10 lg:p-16 flex flex-col items-center text-center">
            <div class="w-20 h-20 rounded-2xl bg-error-container flex items-center justify-center mb-8">
                <span class="material-symbols-outlined text-error text-5xl" style="font-variation-settings: 'FILL' 1;">gpp_maybe</span>
            </div>
            <h2 class="font-headline font-extrabold text-4xl mb-6 text-on-surface tracking-tight">Access Denied</h2>
            <p class="font-body text-lg text-on-surface-variant leading-relaxed mb-10 max-w-md">
                You don't have permission to view this page. Your current role (<strong>${role}</strong>) does not have the necessary privileges to access this resource.
            </p>
            <div class="flex justify-center w-full">
                <a href="#/dashboard" class="btn-gradient text-on-primary font-body font-semibold px-10 py-4 rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-xl">dashboard</span>
                    Back to Dashboard
                </a>
            </div>
        </div>
        <!-- Bottom Border Accent -->
        <div class="h-1.5 w-full bg-error/20"></div>
    </div>
    <!-- System Footer -->
    <div class="mt-8 text-center">
        <p class="text-on-surface-variant/40 font-label text-xs uppercase tracking-[0.2em]">
            System Security Protocol Active
        </p>
    </div>
</main>
<!-- Background Decorative Element (exact Stitch) -->
<div class="fixed bottom-0 left-0 p-8 z-0">
    <div class="text-on-surface-variant/5 font-headline font-black text-[12vw] leading-none uppercase select-none pointer-events-none">
        RESTRICTED
    </div>
</div>
</div>`;
}
