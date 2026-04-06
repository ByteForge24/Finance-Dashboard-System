// Records List page - exact Stitch markup from 66ea6992d02641ea9b0e84ac8bc61ad8
// Record Modal - exact Stitch markup from 28a545a2098548c2bd7461dacd2d0390
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, suggestCategory } from './api.js';
import { canCRUDRecords } from './auth.js';
import { renderAppShell, bindLogout } from './layout.js';
import { showToast } from './toast.js';

let currentPage = 1, currentLimit = 20, currentFilters = {};

function fmtCurrency(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function recordsContent(data, pagination, filters = {}) {
    const isAdmin = canCRUDRecords();
    const rows = data && data.length ? data.map(r => {
        const isIncome = r.type === 'income';
        const badge = isIncome
            ? `<span class="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-tertiary-fixed text-tertiary">Income</span>`
            : `<span class="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-error-container text-error">Expense</span>`;
        const amtClass = isIncome ? 'text-tertiary' : 'text-error';
        const prefix = isIncome ? '+' : '-';
        const actions = isAdmin ? `
            <td class="px-6 py-5 text-right whitespace-nowrap">
                <button class="text-xs font-semibold text-primary hover:underline mr-2" data-edit="${r.id}">Edit</button>
                <button class="text-xs font-semibold text-error hover:underline" data-delete="${r.id}">Delete</button>
            </td>` : '';
        return `<tr class="hover:bg-surface-container-low transition-colors group">
            <td class="px-6 py-5 text-sm text-on-surface-variant whitespace-nowrap">${fmtDate(r.date)}</td>
            <td class="px-6 py-5 text-sm font-semibold text-on-surface">${r.category}</td>
            <td class="px-6 py-5">${badge}</td>
            <td class="px-6 py-5 text-sm text-on-surface-variant">${r.notes || '—'}</td>
            <td class="px-6 py-5 data-font text-sm font-bold ${amtClass} text-right">${prefix}${fmtCurrency(r.amount)}</td>
            ${actions}
        </tr>`;
    }).join('') : `<tr><td colspan="${isAdmin ? 6 : 5}" class="px-6 py-12 text-center text-on-surface-variant">No records found.</td></tr>`;

    const actionsHeader = isAdmin ? `<th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest text-right whitespace-nowrap">Actions</th>` : '';

    // Pagination (exact Stitch style)
    let paginationHtml = '';
    if (pagination && pagination.totalPages > 1) {
        const pages = [];
        for (let i = 1; i <= Math.min(pagination.totalPages, 5); i++) {
            const active = i === pagination.page;
            pages.push(`<button class="w-10 h-10 flex items-center justify-center rounded-lg ${active ? 'bg-primary text-white font-bold shadow-sm' : 'hover:bg-surface-container-high transition-colors text-on-surface font-semibold'}" data-page="${i}">${i}</button>`);
        }
        if (pagination.totalPages > 5) pages.push(`<span class="px-2 text-on-surface-variant">...</span><button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface font-semibold" data-page="${pagination.totalPages}">${pagination.totalPages}</button>`);
        paginationHtml = `
        <div class="flex items-center justify-between pt-4">
            <span class="text-sm text-on-surface-variant font-medium">Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} records</span>
            <div class="flex items-center gap-1">
                <button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" data-page="${pagination.page - 1}" ${!pagination.hasPreviousPage ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                ${pages.join('')}
                <button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" data-page="${pagination.page + 1}" ${!pagination.hasNextPage ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </div>`;
    }

    return `
<!-- Filter Sidebar (exact Stitch) -->
<div class="flex-1 flex overflow-hidden bg-background">
<aside class="w-72 bg-surface-container-low p-8 overflow-y-auto hidden lg:block" id="filter-sidebar">
    <div class="space-y-10">
        <section>
            <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">Transaction Type</h3>
            <div class="space-y-3">
                <label class="flex items-center group cursor-pointer">
                    <input class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-white" type="checkbox" value="income" id="filter-income" ${filters.type === 'income' || filters._incomeRaw ? 'checked' : ''}/>
                    <span class="ml-3 text-sm text-on-surface font-medium group-hover:text-primary transition-colors">Income</span>
                </label>
                <label class="flex items-center group cursor-pointer">
                    <input class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-white" type="checkbox" value="expense" id="filter-expense" ${filters.type === 'expense' || filters._expenseRaw ? 'checked' : ''}/>
                    <span class="ml-3 text-sm text-on-surface font-medium group-hover:text-primary transition-colors">Expense</span>
                </label>
            </div>
        </section>
        <section>
            <h3 class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">Date Range</h3>
            <div class="space-y-3">
                <input type="date" id="filter-start-date" class="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" value="${filters.startDate || ''}"/>
                <input type="date" id="filter-end-date" class="w-full px-3 py-2 bg-white border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" value="${filters.endDate || ''}"/>
            </div>
        </section>
        <button class="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary-fixed-dim/30 rounded-lg transition-colors border border-transparent hover:border-primary/10" id="reset-filters">
            Reset All Filters
        </button>
    </div>
</aside>
<!-- Table Canvas (exact Stitch) -->
<div class="flex-1 p-8 overflow-y-auto scroll-smooth">
    <div class="max-w-6xl mx-auto space-y-8">
        <div class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">Financial Transactions</h1>
                <p class="text-on-surface-variant mt-1">
                    Manage and track your operational cash flow.
                    ${filters.search ? `<strong class="ml-2 px-2 py-0.5 rounded bg-primary-container text-on-primary-container text-[11px] uppercase tracking-wider">Search: "${filters.search}"</strong>` : ''}
                </p>
            </div>
            ${isAdmin ? `<button id="create-record-btn" class="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-primary/20 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-lg">add</span>
                Create Record
            </button>` : ''}
        </div>
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden" style="box-shadow: 0 12px 40px rgba(21, 28, 39, 0.06);">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse" id="records-table">
                    <thead>
                        <tr class="bg-surface-container-low/50">
                            <th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Date</th>
                            <th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Category</th>
                            <th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Type</th>
                            <th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Notes</th>
                            <th class="px-6 py-4 data-font text-xs font-semibold text-on-surface-variant uppercase tracking-widest text-right whitespace-nowrap">Amount</th>
                            ${actionsHeader}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant/10">${rows}</tbody>
                </table>
            </div>
        </div>
        ${paginationHtml}
    </div>
</div>
</div>`;
}

function recordModal(record = null) {
    const isEdit = !!record;
    const title = isEdit ? 'Edit Record' : 'Create Record';
    const subtitle = isEdit ? 'Update transaction details' : 'Add a new entry to Finance Dashboard System';
    const amount = record ? record.amount : '0.00';
    const type = record ? record.type : 'income';
    const category = record ? record.category : '';
    const date = record ? record.date : new Date().toISOString().split('T')[0];
    const notes = record ? (record.notes || '') : '';

    return `
<div class="fixed inset-0 z-50 flex items-center justify-center p-6 modal-backdrop" id="record-modal-backdrop" style="background:rgba(21,28,39,0.18);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">
<div class="bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_rgba(21,28,39,0.15)] flex flex-col overflow-hidden modal-content" style="width:100%;max-width:440px;max-height:calc(100vh - 48px);">
    <!-- Modal Header -->
    <div class="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                <span class="material-symbols-outlined text-[20px]">add_card</span>
            </div>
            <div>
                <h2 class="text-lg font-bold font-headline text-on-surface leading-tight">${title}</h2>
                <p class="text-xs text-on-surface-variant font-medium">${subtitle}</p>
            </div>
        </div>
        <button class="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline transition-colors" id="close-modal">
            <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
    </div>
    <form id="record-form" class="flex flex-col min-h-0">
    <!-- Modal Body -->
    <div class="px-6 py-5 space-y-5 overflow-y-auto custom-scrollbar" style="max-height:calc(100vh - 220px);">
        <!-- Amount -->
        <div class="text-center space-y-1">
            <label class="text-[10px] font-bold uppercase tracking-widest text-outline">Amount</label>
            <div class="flex items-center justify-center gap-2">
                <span class="text-2xl font-label text-outline">$</span>
                <input class="text-center text-3xl font-label font-bold text-on-surface bg-transparent border-none focus:ring-0 placeholder:text-surface-container-highest" style="width:180px;" type="number" step="0.01" min="0.01" name="amount" value="${amount}" required/>
            </div>
        </div>
        <!-- Type -->
        <div class="space-y-2">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Type</label>
            <div class="flex p-1 bg-surface-container-low rounded-full">
                <button type="button" class="flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 text-sm font-semibold transition-all type-toggle ${type === 'income' ? 'bg-surface-container-lowest shadow-sm text-tertiary' : 'text-outline hover:text-on-surface'}" data-type="income">
                    <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">trending_up</span>
                    Income
                </button>
                <button type="button" class="flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 text-sm font-semibold transition-all type-toggle ${type === 'expense' ? 'bg-surface-container-lowest shadow-sm text-error' : 'text-outline hover:text-on-surface'}" data-type="expense">
                    <span class="material-symbols-outlined text-base">trending_down</span>
                    Expense
                </button>
            </div>
            <input type="hidden" name="type" value="${type}" id="record-type"/>
        </div>
        <!-- Category + Date -->
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
                <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Category</label>
                <div class="relative space-y-2">
                    <input class="w-full px-3 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" name="category" value="${category}" required placeholder="e.g. Salary, Rent" id="category-input"/>
                    <button type="button" class="inline-flex items-center gap-1.5 w-fit px-3 py-2 rounded-lg bg-primary-fixed-dim/20 text-primary hover:bg-primary-fixed-dim/35 transition-colors text-xs font-semibold" id="suggest-category-btn">
                        <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                        <span>Suggest Category</span>
                    </button>
                    <div id="suggestion-results" class="hidden space-y-2"></div>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Date</label>
                <input class="w-full px-3 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all" type="date" name="date" value="${date}" required/>
            </div>
        </div>
        <!-- Notes -->
        <div class="space-y-1.5">
            <label class="text-xs font-bold font-headline text-on-surface-variant uppercase tracking-wider">Notes</label>
            <textarea class="w-full px-3 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline/60" placeholder="Add additional details about this transaction..." rows="3" name="notes">${notes}</textarea>
        </div>
        <div id="modal-error" class="hidden p-3 rounded bg-error-container text-on-error-container text-sm"></div>
    </div>
    <!-- Modal Footer -->
    <div class="px-6 py-4 bg-surface-container-low/50 flex items-center justify-end gap-3 shrink-0 border-t border-outline-variant/5">
        <button type="button" class="px-5 py-2.5 rounded-xl text-on-primary-fixed-variant font-semibold text-sm bg-surface-container-high hover:bg-surface-container-highest transition-colors" id="cancel-modal">Discard Draft</button>
        <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm shadow-[0_4px_14px_0_rgba(0,74,198,0.39)] hover:scale-[1.02] active:scale-[0.98] transition-all" id="save-record-btn">Save Record</button>
    </div>
    </form>
</div>
</div>`;
}

export async function renderRecords(queryString = null) {
    const app = document.getElementById('app');
    const loading = `<div class="flex-1 p-8"><div class="space-y-4">${Array(5).fill('<div class="skeleton h-16 rounded-xl"></div>').join('')}</div></div>`;
    app.innerHTML = renderAppShell('records', loading);
    bindLogout();

    currentFilters = {};
    let editId = null;

    if (queryString) {
        const params = new URLSearchParams(queryString);
        if (params.get('type')) currentFilters.type = params.get('type');
        if (params.get('category')) currentFilters.category = params.get('category');
        if (params.get('search')) currentFilters.search = params.get('search');
        if (params.get('edit')) editId = params.get('edit');
    }

    await loadRecords();

    // Sync UI with URL filters
    if (currentFilters.type === 'income') {
        const cb = document.getElementById('filter-income');
        if (cb) cb.checked = true;
    } else if (currentFilters.type === 'expense') {
        const cb = document.getElementById('filter-expense');
        if (cb) cb.checked = true;
    }

    if (editId) {
        try {
            const record = await getRecord(editId);
            openModal(record);
            // clear edit from URL to avoid reopening on refresh
            window.history.replaceState(null, '', '#/records');
        } catch (e) {
            showToast('Failed to load record from URL', 'error');
        }
    }
}


async function loadRecords() {
    const main = document.getElementById('main-content');
    try {
        const query = { page: currentPage, limit: currentLimit, ...currentFilters };
        const result = await getRecords(query);
        main.innerHTML = recordsContent(result.data, result.pagination, currentFilters);
        bindRecordEvents();
    } catch (err) {
        main.innerHTML = `<div class="p-8"><div class="bg-error-container text-on-error-container p-4 rounded-xl">Failed to load records: ${err.message || 'Unknown error'}</div></div>`;
    }
}

function bindRecordEvents() {
    // Pagination
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page > 0) { currentPage = page; loadRecords(); }
        });
    });
    // Create record
    const createBtn = document.getElementById('create-record-btn');
    if (createBtn) createBtn.addEventListener('click', () => openModal());
    // Edit
    document.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.edit;
            try {
                const record = await getRecord(id);
                openModal(record);
            } catch (e) { showToast('Failed to load record', 'error'); }
        });
    });
    // Delete
    document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.delete;
            if (confirm('Delete this record? This action cannot be undone.')) {
                try {
                    await deleteRecord(id);
                    showToast('Record deleted', 'success');
                    loadRecords();
                } catch (e) { showToast('Failed to delete record', 'error'); }
            }
        });
    });
    // Filters
    const incomeFilter = document.getElementById('filter-income');
    const expenseFilter = document.getElementById('filter-expense');
    const startDate = document.getElementById('filter-start-date');
    const endDate = document.getElementById('filter-end-date');
    const resetBtn = document.getElementById('reset-filters');

    function applyFilters(e) {
        if (e && e.target === incomeFilter && incomeFilter.checked) {
            if (expenseFilter) expenseFilter.checked = false;
        } else if (e && e.target === expenseFilter && expenseFilter.checked) {
            if (incomeFilter) incomeFilter.checked = false;
        }

        currentPage = 1;
        const type = [];
        if (incomeFilter?.checked) { type.push('income'); currentFilters._incomeRaw = true; } else { delete currentFilters._incomeRaw; }
        if (expenseFilter?.checked) { type.push('expense'); currentFilters._expenseRaw = true; } else { delete currentFilters._expenseRaw; }
        
        const existingCategory = currentFilters.category;
        const existingSearch = currentFilters.search;
        
        // Reset valid backend properties except category, search and date logic
        delete currentFilters.type;
        delete currentFilters.startDate;
        delete currentFilters.endDate;
        
        if (type.length === 1) currentFilters.type = type[0];
        if (startDate?.value) currentFilters.startDate = startDate.value;
        if (endDate?.value) currentFilters.endDate = endDate.value;
        loadRecords();
    }

    [incomeFilter, expenseFilter, startDate, endDate].forEach(el => {
        if (el) el.addEventListener('change', applyFilters);
    });
    if (resetBtn) resetBtn.addEventListener('click', () => {
        currentFilters = {}; currentPage = 1;
        if (incomeFilter) incomeFilter.checked = false;
        if (expenseFilter) expenseFilter.checked = false;
        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        window.history.replaceState(null, '', '#/records');
        loadRecords();
    });
}

function openModal(record = null) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = recordModal(record);

    // Type toggle
    document.querySelectorAll('.type-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('record-type').value = btn.dataset.type;
            document.querySelectorAll('.type-toggle').forEach(b => {
                b.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-tertiary', 'text-error');
                b.classList.add('text-outline');
            });
            btn.classList.remove('text-outline');
            btn.classList.add('bg-surface-container-lowest', 'shadow-sm', btn.dataset.type === 'income' ? 'text-tertiary' : 'text-error');
        });
    });

    // Suggest Category button
    const suggestBtn = document.getElementById('suggest-category-btn');
    const categoryInput = document.getElementById('category-input');
    const notesInput = document.querySelector('textarea[name="notes"]');
    const typeInput = document.getElementById('record-type');
    const amountInput = document.querySelector('input[name="amount"]');
    const suggestionsDiv = document.getElementById('suggestion-results');

    if (suggestBtn) {
        suggestBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const notes = notesInput.value.trim();
            if (!notes) {
                showToast('Please enter some notes to get a suggestion', 'info');
                return;
            }

            suggestBtn.disabled = true;
            suggestBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]" style="animation:spin 1s linear infinite;">auto_awesome</span><span>Suggesting...</span>';
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.add('hidden');

            try {
                const response = await suggestCategory({
                    notes: notes,
                    type: typeInput.value,
                    amount: parseFloat(amountInput.value) || undefined
                });

                const { suggestedCategory, alternatives, confidence, source } = response;
                
                let html = `<div class="p-3 rounded-lg bg-primary-fixed-dim/30 border border-primary/20 space-y-3">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Suggested Category</p>
                            <p class="text-sm font-bold text-primary">${suggestedCategory || '—'}</p>
                            <p class="text-[10px] text-on-surface-variant mt-1">
                                Confidence: <span class="font-semibold">${confidence}</span> • 
                                Source: <span class="font-semibold">${source}</span>
                            </p>
                        </div>
                        ${suggestedCategory ? `<button type="button" class="ml-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors" id="use-suggestion">Use</button>` : ''}
                    </div>
                    ${alternatives && alternatives.length > 0 ? `<div class="border-t border-primary/10 pt-2">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Alternatives</p>
                        <div class="flex flex-wrap gap-2">
                            ${alternatives.map(alt => `<button type="button" class="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-xs font-medium alt-suggestion" data-alt="${alt}">${alt}</button>`).join('')}
                        </div>
                    </div>` : ''}
                </div>`;

                suggestionsDiv.innerHTML = html;
                suggestionsDiv.classList.remove('hidden');

                // Use suggestion button
                document.getElementById('use-suggestion')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    categoryInput.value = suggestedCategory;
                });

                // Alternative buttons
                document.querySelectorAll('.alt-suggestion').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        categoryInput.value = btn.dataset.alt;
                    });
                });
            } catch (err) {
                suggestionsDiv.innerHTML = `<div class="p-3 rounded-lg bg-error-container text-on-error-container text-xs">${err.message || 'Failed to get suggestion'}</div>`;
                suggestionsDiv.classList.remove('hidden');
            } finally {
                suggestBtn.disabled = false;
                suggestBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]" style="font-variation-settings:\'FILL\' 1;">auto_awesome</span><span>Suggest Category</span>';
            }
        });
    }

    // Close
    const close = () => { modal.innerHTML = ''; };
    document.getElementById('close-modal').addEventListener('click', close);
    document.getElementById('cancel-modal').addEventListener('click', close);
    document.getElementById('record-modal-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'record-modal-backdrop') close();
    });

    // Submit
    document.getElementById('record-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = {
            amount: parseFloat(formData.get('amount')),
            type: formData.get('type'),
            category: formData.get('category'),
            date: formData.get('date'),
            notes: formData.get('notes') || null
        };
        const errDiv = document.getElementById('modal-error');
        const saveBtn = document.getElementById('save-record-btn');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        try {
            if (record) {
                await updateRecord(record.id, body);
                showToast('Record updated', 'success');
            } else {
                await createRecord(body);
                showToast('Record created', 'success');
            }
            close();
            loadRecords();
        } catch (err) {
            errDiv.textContent = err.message || 'Failed to save record';
            errDiv.classList.remove('hidden');
            saveBtn.textContent = 'Save Record';
            saveBtn.disabled = false;
        }
    });
}
