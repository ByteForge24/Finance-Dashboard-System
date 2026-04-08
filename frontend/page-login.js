// Login page - tab-based auth flow with signup integration
import { login, signup, setToken } from './api.js';
import { setCurrentUser } from './auth.js';
import { showToast } from './toast.js';

export function renderLogin() {
    return `
<main class="flex w-full min-h-screen overflow-hidden">
<!-- Left Side: Architectural Imagery (exact Stitch) -->
<section class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
    <div class="absolute inset-0 z-0">
        <img alt="" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV9RzSaH-7dePUvi8CuKHi7Y7vxuBa2eDThDAtQmIuZSzmNNu1WpmBfo5wIKh8Fr4Gye2rfePrNe29zAO4SxAecrSWdohmhHmWBJFNFbZO2dy5du2LOyoD1h0vqbXJnQGczYW8BKz7cubAsGvIgPtLNqCOMUQP1SWTOWUAicxWDu4AVC9PEK_f54_dUF8m9EETip1i4oOSUFIaW_A6GZN6-JQPmsEWk9mircmFR5S2FnK7lCerT-12AlYVSP_NUNW1xIXGHU2QHew"/>
        <div class="absolute inset-0 bg-gradient-to-br from-primary/60 to-on-surface/80 mix-blend-multiply"></div>
    </div>
    <!-- Brand Identity -->
    <div class="relative z-10">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-surface-container-lowest rounded-lg flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">account_balance</span>
            </div>
            <span class="font-headline font-extrabold text-2xl text-white tracking-tight">Finance Dashboard System</span>
        </div>
    </div>
    <!-- Decorative Element -->
    <div class="absolute bottom-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <svg fill="none" height="256" viewBox="0 0 256 256" width="256" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 256H256V0" stroke="white" stroke-width="2"></path>
            <path d="M40 256V40H256" stroke="white" stroke-width="1"></path>
            <path d="M80 256V80H256" stroke="white" stroke-width="0.5"></path>
        </svg>
    </div>
</section>
<!-- Right Side: Auth Form (exact Stitch with tabs) -->
<section class="w-full lg:w-1/2 flex flex-col bg-surface items-center justify-center p-6 md:p-12 lg:p-24">
    <div class="w-full max-w-[440px]">
        <!-- Tab Navigation -->
        <div class="flex gap-0 mb-8 border-b border-outline-variant/20">
            <button class="tab-button active px-4 py-3 font-headline font-bold text-sm text-on-surface border-b-2 border-primary transition-all" data-tab="login">
                Sign In
            </button>
            <button class="tab-button px-4 py-3 font-headline font-bold text-sm text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-all" data-tab="signup">
                Sign Up
            </button>
        </div>

        <!-- Sign In Tab -->
        <div class="tab-pane active" id="tab-login">
            <!-- Header -->
            <header class="mb-10">
                <h2 class="font-headline font-bold text-3xl text-on-surface mb-2">Welcome back</h2>
                <!-- Error Message -->
                <div class="hidden mt-4 p-3 rounded bg-error-container text-on-error-container text-sm font-medium" id="login-error"></div>
            </header>
            <!-- Login Card -->
            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(21,28,39,0.06)] border border-outline-variant/10">
                <form id="login-form" class="space-y-6">
                    <!-- Email Input -->
                    <div class="space-y-2">
                        <label class="block font-body text-sm font-semibold text-on-surface-variant" for="login-email">Email Address</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                            </div>
                            <input class="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border border-transparent rounded-lg font-body text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all outline-none" id="login-email" name="email" placeholder="name@organization.com" required="" type="email"/>
                        </div>
                    </div>
                    <!-- Password Input -->
                    <div class="space-y-2">
                        <label class="block font-body text-sm font-semibold text-on-surface-variant" for="login-password">Password</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                            </div>
                            <input class="block w-full pl-11 pr-12 py-3.5 bg-surface-container-low border border-transparent rounded-lg font-body text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all outline-none" id="login-password" name="password" placeholder="••••••••" required="" type="password"/>
                            <button class="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors" type="button" id="toggle-login-password">
                                <span class="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                        </div>
                    </div>
                    <!-- Sign In Button -->
                    <button class="w-full py-4 px-6 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" type="submit" id="login-submit">
                        <span id="login-btn-text">Sign In</span>
                        <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform" id="login-btn-icon">arrow_forward</span>
                    </button>
                </form>
            </div>

            <!-- Demo Access Section -->
            <div class="mt-8">
                <div class="relative flex items-center mb-5">
                    <div class="flex-grow border-t border-outline-variant/20"></div>
                    <span class="flex-shrink-0 mx-4 text-[10px] font-bold font-headline text-outline uppercase tracking-widest">Explore Demo Roles</span>
                    <div class="flex-grow border-t border-outline-variant/20"></div>
                </div>
                <div class="flex flex-col gap-2.5">
                    <button type="button" class="demo-login flex items-center justify-between px-5 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all text-left group shadow-sm" data-email="viewer@finance-dashboard.local" data-password="ViewerPassword123">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[16px]">visibility</span>
                            </div>
                            <div>
                                <div class="font-headline font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Viewer</div>
                                <div class="text-[11px] text-on-surface-variant font-medium mt-0.5">Read-only access to Dashboard</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">arrow_forward</span>
                    </button>

                    <button type="button" class="demo-login flex items-center justify-between px-5 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all text-left group shadow-sm" data-email="analyst@finance-dashboard.local" data-password="AnalystPassword123">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[16px]">analytics</span>
                            </div>
                            <div>
                                <div class="font-headline font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Analyst</div>
                                <div class="text-[11px] text-on-surface-variant font-medium mt-0.5">Dashboard + Records (Read-only)</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">arrow_forward</span>
                    </button>

                    <button type="button" class="demo-login flex items-center justify-between px-5 py-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-all text-left group shadow-sm" data-email="admin@finance-dashboard.local" data-password="AdminPassword123">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[16px]">shield_person</span>
                            </div>
                            <div>
                                <div class="font-headline font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Admin</div>
                                <div class="text-[11px] text-on-surface-variant font-medium mt-0.5">Full access including Users & Records</div>
                            </div>
                        </div>
                        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Sign Up Tab -->
        <div class="tab-pane hidden" id="tab-signup">
            <!-- Header -->
            <header class="mb-10">
                <h2 class="font-headline font-bold text-3xl text-on-surface mb-2">Create Account</h2>
                <p class="font-body text-sm text-on-surface-variant mt-2">Join to manage your finances</p>
                <!-- Error Message -->
                <div class="hidden mt-4 p-3 rounded bg-error-container text-on-error-container text-sm font-medium" id="signup-error"></div>
            </header>
            <!-- Signup Card -->
            <div class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(21,28,39,0.06)] border border-outline-variant/10">
                <form id="signup-form" class="space-y-6">
                    <!-- Name Input -->
                    <div class="space-y-2">
                        <label class="block font-body text-sm font-semibold text-on-surface-variant" for="signup-name">Full Name</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">person</span>
                            </div>
                            <input class="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border border-transparent rounded-lg font-body text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all outline-none" id="signup-name" name="name" placeholder="John Doe" type="text" required=""/>
                        </div>
                    </div>
                    <!-- Email Input -->
                    <div class="space-y-2">
                        <label class="block font-body text-sm font-semibold text-on-surface-variant" for="signup-email">Email Address</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                            </div>
                            <input class="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border border-transparent rounded-lg font-body text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all outline-none" id="signup-email" name="email" placeholder="name@organization.com" type="email" required=""/>
                        </div>
                    </div>
                    <!-- Password Input -->
                    <div class="space-y-2">
                        <label class="block font-body text-sm font-semibold text-on-surface-variant" for="signup-password">Password</label>
                        <div class="relative group">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                            </div>
                            <input class="block w-full pl-11 pr-12 py-3.5 bg-surface-container-low border border-transparent rounded-lg font-body text-on-surface placeholder-outline focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all outline-none" id="signup-password" name="password" placeholder="••••••••" type="password" required="" minlength="8"/>
                            <button class="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors" type="button" id="toggle-signup-password">
                                <span class="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                        </div>
                        <p class="text-[11px] text-on-surface-variant font-medium">Minimum 8 characters</p>
                    </div>
                    <!-- Create Account Button -->
                    <button class="w-full py-4 px-6 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-bold rounded-xl shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group" type="submit" id="signup-submit">
                        <span id="signup-btn-text">Create Account</span>
                        <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform" id="signup-btn-icon">arrow_forward</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</section>
</main>`;
}

export function bindLogin() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Hide all panes
            tabPanes.forEach(pane => pane.classList.add('hidden'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Show active pane
            const activePane = document.getElementById(`tab-${targetTab}`);
            if (activePane) {
                activePane.classList.remove('hidden');
                activePane.classList.add('active');
            }
            
            // Update active button styling
            tabButtons.forEach(b => {
                b.classList.remove('active', 'text-on-surface', 'border-primary');
                b.classList.add('text-on-surface-variant', 'border-transparent');
            });
            btn.classList.add('active', 'text-on-surface', 'border-primary');
            btn.classList.remove('text-on-surface-variant', 'border-transparent');
            
            // Clear forms and errors
            if (targetTab === 'login') {
                document.getElementById('login-form').reset();
                document.getElementById('login-error').classList.add('hidden');
            } else {
                document.getElementById('signup-form').reset();
                document.getElementById('signup-error').classList.add('hidden');
            }
        });
    });
    
    // Login form handling
    const loginForm = document.getElementById('login-form');
    const loginErrDiv = document.getElementById('login-error');
    const loginTogglePw = document.getElementById('toggle-login-password');
    const loginPwInput = document.getElementById('login-password');

    if (loginTogglePw && loginPwInput) {
        loginTogglePw.addEventListener('click', () => {
            const isPassword = loginPwInput.type === 'password';
            loginPwInput.type = isPassword ? 'text' : 'password';
            loginTogglePw.querySelector('.material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    const demoButtons = document.querySelectorAll('.demo-login');
    demoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            const password = btn.getAttribute('data-password');
            if (email && password) {
                document.getElementById('login-email').value = email;
                document.getElementById('login-password').value = password;
                if (loginForm) {
                    loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = document.getElementById('login-submit');
            const btnText = document.getElementById('login-btn-text');
            const btnIcon = document.getElementById('login-btn-icon');

            submitBtn.disabled = true;
            btnText.textContent = 'Signing in...';
            btnIcon.textContent = 'hourglass_empty';
            loginErrDiv.classList.add('hidden');

            try {
                const data = await login(email, password);
                setToken(data.token);
                setCurrentUser(data.user);
                showToast('Welcome back, ' + data.user.name, 'success');
                window.location.hash = '#/dashboard';
            } catch (err) {
                loginErrDiv.textContent = err.message || err.error || 'Invalid credentials. Please try again.';
                loginErrDiv.classList.remove('hidden');
                submitBtn.disabled = false;
                btnText.textContent = 'Sign In';
                btnIcon.textContent = 'arrow_forward';
            }
        });
    }

    // Signup form handling
    const signupForm = document.getElementById('signup-form');
    const signupErrDiv = document.getElementById('signup-error');
    const signupTogglePw = document.getElementById('toggle-signup-password');
    const signupPwInput = document.getElementById('signup-password');

    if (signupTogglePw && signupPwInput) {
        signupTogglePw.addEventListener('click', () => {
            const isPassword = signupPwInput.type === 'password';
            signupPwInput.type = isPassword ? 'text' : 'password';
            signupTogglePw.querySelector('.material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const submitBtn = document.getElementById('signup-submit');
            const btnText = document.getElementById('signup-btn-text');
            const btnIcon = document.getElementById('signup-btn-icon');

            submitBtn.disabled = true;
            btnText.textContent = 'Creating account...';
            btnIcon.textContent = 'hourglass_empty';
            signupErrDiv.classList.add('hidden');

            try {
                const data = await signup(name, email, password);
                setToken(data.token);
                setCurrentUser(data.user);
                showToast(`Welcome, ${data.user.name}!`, 'success');
                window.location.hash = '#/dashboard';
            } catch (err) {
                signupErrDiv.textContent = err.message || err.error || 'Signup failed. Please try again.';
                signupErrDiv.classList.remove('hidden');
                submitBtn.disabled = false;
                btnText.textContent = 'Create Account';
                btnIcon.textContent = 'arrow_forward';
            }
        });
    }
}
