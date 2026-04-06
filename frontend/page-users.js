// User Management page - exact Stitch markup from b4358240a9444abca06f52608bee0a24
import { getUsers, createUser, updateUser, updateUserRole, updateUserStatus } from './api.js';
import { renderAppShell, bindLogout } from './layout.js';
import { showToast } from './toast.js';

function statusBadge(status) {
    return status === 'active'
        ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-tertiary/10 text-tertiary">Active</span>`
        : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">Inactive</span>`;
}

function userRow(u) {
    const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase();
    return `<tr class="hover:bg-surface-container-low/30 transition-colors" data-user-id="${u.id}">
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary-container font-bold text-xs">${initials}</div>
                <span class="font-medium text-on-surface text-sm">${u.name}</span>
            </div>
        </td>
        <td class="px-6 py-4 text-sm text-on-surface-variant">${u.email}</td>
        <td class="px-6 py-4 text-sm text-on-surface-variant capitalize">${u.role}</td>
        <td class="px-6 py-4">${statusBadge(u.status)}</td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
            <div class="flex justify-end gap-2">
                <button class="text-xs font-semibold text-primary hover:underline" data-edit-user="${u.id}">Edit</button>
                <span class="text-outline-variant/30">|</span>
                <button class="text-xs font-semibold text-primary hover:underline" data-role-user="${u.id}" data-role="${u.role}">Role</button>
                <span class="text-outline-variant/30">|</span>
                <button class="text-xs font-semibold text-primary hover:underline" data-status-user="${u.id}" data-status="${u.status}" data-name="${u.name}">Status</button>
            </div>
        </td>
    </tr>`;
}

function usersContent(users) {
    const rows = users && users.length ? users.map(u => userRow(u)).join('') : `<tr><td colspan="5" class="px-6 py-12 text-center text-on-surface-variant">No users found.</td></tr>`;
    return `
<div class="p-8 max-w-7xl mx-auto space-y-8">
    <div class="flex justify-between items-center">
        <div>
            <h2 class="text-2xl font-bold text-on-surface font-headline tracking-tight">User Management</h2>
            <p class="text-on-surface-variant text-sm mt-1">
                Manage team member access and roles.
                ${currentSearchFilter ? `<strong class="ml-2 px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[11px] uppercase tracking-wider">Search: "${currentSearchFilter}"</strong>` : ''}
            </p>
        </div>
        <button id="create-user-btn" class="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-secondary active:scale-[0.98] transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px]">add</span>
            Create User
        </button>
    </div>
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-surface-container-low/50 border-b border-outline-variant/20">
                        <th class="px-6 py-4 text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">Name</th>
                        <th class="px-6 py-4 text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">Email</th>
                        <th class="px-6 py-4 text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">Role</th>
                        <th class="px-6 py-4 text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                        <th class="px-6 py-4 text-xs font-label font-bold text-on-surface-variant uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10" id="users-tbody">${rows}</tbody>
            </table>
        </div>
    </div>
</div>`;
}

function userModal(user = null) {
    const isEdit = !!user;
    const title = isEdit ? 'Edit User' : 'Create User';
    return `
<div class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-on-surface/20 glass-overlay modal-backdrop" id="user-modal-backdrop" style="background:rgba(21,28,39,0.18);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">
<div class="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(21,28,39,0.15)] flex flex-col overflow-hidden modal-content" style="width:100%;max-width:440px;max-height:calc(100vh - 48px);">
    <div class="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
        <h2 class="text-xl font-extrabold font-headline text-on-surface">${title}</h2>
        <button type="button" class="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors" id="close-user-modal"><span class="material-symbols-outlined text-[20px]">close</span></button>
    </div>
    <form id="user-form" class="flex flex-col min-h-0">
    <div class="px-6 py-5 space-y-5 overflow-y-auto custom-scrollbar">
        <div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Name</label>
            <input class="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" name="name" value="${user ? user.name : ''}" required placeholder="Full Name"/>
        </div>
        <div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Email</label>
            <input class="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" name="email" type="email" value="${user ? user.email : ''}" required placeholder="name@org.com"/>
        </div>
        ${!isEdit ? `<div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Password</label>
            <input class="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" name="password" type="password" required minlength="8" placeholder="Min 8 characters"/>
        </div>
        <div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Role</label>
            <select class="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" name="role">
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
            </select>
        </div>
        <div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Status</label>
            <select class="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20" name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>` : ''}
        <div id="user-modal-error" class="hidden p-3 rounded bg-error-container text-on-error-container text-sm"></div>
    </div>
    <div class="px-6 py-4 bg-surface-container-low/50 flex justify-end gap-3 shrink-0 border-t border-outline-variant/5">
        <button type="button" class="px-5 py-2.5 rounded-xl text-on-primary-fixed-variant font-semibold text-sm bg-surface-container-high hover:bg-surface-container-highest transition-colors" id="cancel-user-modal">Cancel</button>
        <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm shadow-[0_4px_14px_0_rgba(0,74,198,0.39)] hover:scale-[1.02] active:scale-[0.98] transition-all">Save</button>
    </div>
    </form>
</div>
</div>`;
}

let allUsers = [];
let currentSearchFilter = null;

export async function renderUsers(queryString = null) {
    const app = document.getElementById('app');
    const loading = `<div class="p-8"><div class="space-y-4">${Array(4).fill('<div class="skeleton h-16 rounded-xl"></div>').join('')}</div></div>`;
    app.innerHTML = renderAppShell('users', loading);
    bindLogout();
    
    currentSearchFilter = null;
    if (queryString) {
        const params = new URLSearchParams(queryString);
        if (params.get('search')) currentSearchFilter = params.get('search');
    }
    await loadUsers();
}

async function loadUsers() {
    const main = document.getElementById('main-content');
    try {
        const query = currentSearchFilter ? { search: currentSearchFilter } : null;
        const result = await getUsers(query);
        allUsers = result.data || result;
        main.innerHTML = usersContent(Array.isArray(allUsers) ? allUsers : []);
        bindUserEvents();
    } catch (err) {
        main.innerHTML = `<div class="p-8"><div class="bg-error-container text-on-error-container p-4 rounded-xl">Failed to load users: ${err.message || 'Unknown error'}</div></div>`;
    }
}

function bindUserEvents() {
    document.getElementById('create-user-btn')?.addEventListener('click', () => openUserModal());

    document.querySelectorAll('[data-edit-user]').forEach(btn => {
        btn.addEventListener('click', () => {
            const user = allUsers.find(u => u.id === btn.dataset.editUser);
            if (user) openUserModal(user);
        });
    });

    document.querySelectorAll('[data-role-user]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const roles = ['viewer', 'analyst', 'admin'];
            const current = btn.dataset.role;
            const next = prompt(`Change role from "${current}" to:\n(viewer, analyst, admin)`, current);
            if (next && roles.includes(next) && next !== current) {
                try {
                    await updateUserRole(btn.dataset.roleUser, next);
                    showToast('Role updated', 'success');
                    loadUsers();
                } catch (e) { showToast('Failed to update role', 'error'); }
            }
        });
    });

    document.querySelectorAll('[data-status-user]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const current = btn.dataset.status;
            const next = current === 'active' ? 'inactive' : 'active';
            const action = next === 'inactive' ? 'Deactivate' : 'Activate';
            if (confirm(`${action} ${btn.dataset.name}?`)) {
                try {
                    await updateUserStatus(btn.dataset.statusUser, next);
                    showToast(`User ${action.toLowerCase()}d`, 'success');
                    loadUsers();
                } catch (e) { showToast(`Failed to ${action.toLowerCase()} user`, 'error'); }
            }
        });
    });
}

function openUserModal(user = null) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = userModal(user);

    const close = () => { modal.innerHTML = ''; };
    document.getElementById('close-user-modal').addEventListener('click', close);
    document.getElementById('cancel-user-modal').addEventListener('click', close);
    document.getElementById('user-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'user-modal-backdrop') close(); });

    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const errDiv = document.getElementById('user-modal-error');
        try {
            if (user) {
                await updateUser(user.id, { name: fd.get('name'), email: fd.get('email') });
                showToast('User updated', 'success');
            } else {
                await createUser({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password'), role: fd.get('role'), status: fd.get('status') });
                showToast('User created', 'success');
            }
            close();
            loadUsers();
        } catch (err) {
            errDiv.textContent = err.message || 'Failed to save user';
            errDiv.classList.remove('hidden');
        }
    });
}
