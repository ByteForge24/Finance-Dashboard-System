// Dashboard page - exact Stitch markup from ed22772d6e544d959337a545c051c6b0
import { getSummary, getCategoryBreakdown, getRecentActivity, getTrends, getMonthlyInsights } from './api.js';
import { renderAppShell, bindLogout } from './layout.js';

function fmtCurrency(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
let trendsChartInstance = null;
let categoryChartInstance = null;

function dashboardHeader(timeframe) {
    return `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        <div>
            <h1 class="text-3xl font-extrabold text-on-surface tracking-tight">Financial Overview</h1>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
            <button id="refresh-dashboard-btn" class="flex items-center justify-center gap-1.5 bg-white hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-primary text-sm font-bold px-4 py-2 rounded-xl border border-outline-variant/30 shadow-sm active:scale-95 disabled:opacity-50">
                <span class="material-symbols-outlined text-[18px]">refresh</span>
                <span class="hidden sm:inline">Refresh</span>
            </button>
            <div class="relative w-full sm:w-auto">
                <select id="timeframe-filter" class="w-full sm:w-auto appearance-none bg-surface-container-lowest border border-outline-variant/30 text-sm font-semibold rounded-xl px-4 py-2 pr-10 focus:ring-2 focus:ring-primary/20 text-on-surface outline-none cursor-pointer shadow-sm hover:border-outline-variant/60 transition-colors">
                    <option value="all" ${timeframe === 'all' ? 'selected' : ''}>All Time</option>
                    <option value="thisMonth" ${timeframe === 'thisMonth' ? 'selected' : ''}>This Month</option>
                    <option value="lastMonth" ${timeframe === 'lastMonth' ? 'selected' : ''}>Last Month</option>
                    <option value="last7" ${timeframe === 'last7' ? 'selected' : ''}>Last 7 Days</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
            </div>
        </div>
    </div>`;
}

function summaryCards(data) {
    if (!data) return skeletonCards();
    const net = data.totalIncome - data.totalExpense;
    return `
<section class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Total Income (exact Stitch) -->
    <a href="#/records?type=income" class="block bg-surface-container-lowest p-6 rounded-xl border border-transparent transition-all hover:bg-white hover:shadow-xl hover:shadow-on-surface/5 hover:scale-[1.02]">
        <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">payments</span>
            </div>
            <span class="flex items-center gap-1 text-tertiary text-xs font-bold bg-tertiary-fixed px-2 py-1 rounded-full">
                <span class="material-symbols-outlined text-[14px]">trending_up</span>
                Income
            </span>
        </div>
        <p class="text-on-surface-variant text-sm font-medium mb-1">Total Income</p>
        <h3 class="text-2xl font-bold text-on-surface data-value">${fmtCurrency(data.totalIncome)}</h3>
    </a>
    <!-- Total Expense (exact Stitch) -->
    <a href="#/records?type=expense" class="block bg-surface-container-lowest p-6 rounded-xl border border-transparent transition-all hover:bg-white hover:shadow-xl hover:shadow-on-surface/5 hover:scale-[1.02]">
        <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
            </div>
            <span class="flex items-center gap-1 text-error text-xs font-bold bg-error-container px-2 py-1 rounded-full">
                <span class="material-symbols-outlined text-[14px]">trending_down</span>
                Expense
            </span>
        </div>
        <p class="text-on-surface-variant text-sm font-medium mb-1">Total Expense</p>
        <h3 class="text-2xl font-bold text-on-surface data-value">${fmtCurrency(data.totalExpense)}</h3>
    </a>
    <!-- Net Balance (Signature Card, exact Stitch) -->
    <div class="bg-gradient-to-br from-primary to-primary-container p-6 rounded-xl shadow-lg shadow-primary/20">

        <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">account_balance_wallet</span>
            </div>
        </div>
        <p class="text-primary-fixed/80 text-sm font-medium mb-1">Net Balance</p>
        <h3 class="text-2xl font-bold text-white data-value">${fmtCurrency(net)}</h3>
    </div>
</section>`;
}

function skeletonCards() {
    const sk = `<div class="bg-surface-container-lowest p-6 rounded-xl"><div class="skeleton h-12 w-12 rounded-full mb-4"></div><div class="skeleton h-4 w-24 mb-2"></div><div class="skeleton h-8 w-36"></div></div>`;
    return `<section class="grid grid-cols-1 md:grid-cols-3 gap-6">${sk}${sk}${sk}</section>`;
}

function trendsChart(data) {
    if (!data || !data.data || data.data.length === 0) {
        return `<div class="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8"><h2 class="text-xl font-extrabold font-headline text-on-surface">Trends</h2><p class="text-sm text-on-surface-variant mt-2">No trend data available.</p></div>`;
    }
    return `
<div class="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 overflow-hidden relative">
    <div class="flex justify-between items-end mb-8">
        <div>
            <h2 class="text-xl font-extrabold font-headline text-on-surface">Trends</h2>
            <p class="text-sm text-on-surface-variant">Financial performance overview</p>
        </div>
    </div>
    <div class="h-64 relative w-full pt-4">
        <canvas id="trendsCanvas"></canvas>
    </div>
</div>`;
}

function categoryBreakdown(data) {
    if (!data || !data.data || data.data.length === 0) {
        return `<div class="bg-surface-container-lowest rounded-xl p-8"><h2 class="text-xl font-extrabold font-headline text-on-surface mb-6">Category Breakdown</h2><p class="text-sm text-on-surface-variant">No data available.</p></div>`;
    }
    const items = data.data;
    const total = items.reduce((s, i) => s + i.total, 0) || 1;
    const colors = ['#004ac6', '#006242', '#ba1a1a', '#0058be', '#007d55', '#434655'];
    
    const legend = items.slice(0, 6).map((it, idx) => `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background:${colors[idx % colors.length]}"></div>
                <span class="text-sm font-medium">${it.category}</span>
            </div>
            <span class="text-sm font-bold data-value">${Math.round((it.total / total) * 100)}%</span>
        </div>`).join('');

    return `
<div class="bg-surface-container-lowest rounded-xl p-8">
    <h2 class="text-xl font-extrabold font-headline text-on-surface mb-6">Category Breakdown</h2>
    <div class="flex flex-col items-center">
        <div class="relative w-full h-48 mb-6 flex justify-center items-center">
            <canvas id="categoryCanvas" style="max-height: 192px;"></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-2">Total</span>
            </div>
        </div>
        <div class="w-full space-y-3">${legend}</div>
    </div>
</div>`;
}

function initTrendsChart(items) {
    const ctx = document.getElementById('trendsCanvas');
    if (!ctx || !window.Chart) return;
    if (trendsChartInstance) trendsChartInstance.destroy();
    
    trendsChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
            labels: items.map(i => i.period),
            datasets: [
                {
                    label: 'Income',
                    data: items.map(i => i.income),
                    borderColor: '#006242',
                    backgroundColor: 'rgba(0, 98, 66, 0.05)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#006242',
                    pointBorderWidth: 0,
                    pointRadius: 3,
                    pointHoverRadius: 6
                },
                {
                    label: 'Expense',
                    data: items.map(i => i.expense),
                    borderColor: '#ba1a1a',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: '#ba1a1a',
                    pointBorderWidth: 0,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { usePointStyle: true, padding: 20, boxWidth: 8, font: { family: 'Inter', size: 12, weight: '500' } } 
                },
                tooltip: { 
                    backgroundColor: 'rgba(21, 28, 39, 0.9)', 
                    titleFont: { family: 'Inter', size: 13 }, 
                    bodyFont: { family: 'Space Grotesk', size: 14, weight: 'bold' }, 
                    padding: 12, 
                    cornerRadius: 8, 
                    callbacks: { 
                        label: function(ctx) { return ' ' + ctx.dataset.label + ': ' + fmtCurrency(ctx.raw); } 
                    } 
                }
            },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { font: { family: 'Space Grotesk', size: 10, weight: 'bold' }, color: '#737686' } 
                },
                y: { 
                    grid: { color: 'rgba(67, 70, 85, 0.06)' }, 
                    border: { display: false },
                    ticks: { font: { family: 'Space Grotesk', size: 11, weight: 'bold' }, color: '#737686', maxTicksLimit: 6, callback: function(value) { return '$' + value; } } 
                }
            }
        }
    });
}

function initCategoryChart(items) {
    const ctx = document.getElementById('categoryCanvas');
    if (!ctx || !window.Chart) return;
    if (categoryChartInstance) categoryChartInstance.destroy();
    
    // Sort items by total to have the largest slices first
    const sortedItems = [...items].sort((a,b) => b.total - a.total);
    const colors = ['#004ac6', '#006242', '#ba1a1a', '#0058be', '#007d55', '#434655'];
    
    categoryChartInstance = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedItems.map(i => i.category),
            datasets: [{
                data: sortedItems.map(i => i.total),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            onClick: (e, activeElements) => {
                if (activeElements.length > 0) {
                    const idx = activeElements[0].index;
                    const cat = sortedItems[idx].category;
                    window.location.hash = '#/records?category=' + encodeURIComponent(cat);
                }
            },
            onHover: (e, activeElements) => {
                e.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    backgroundColor: 'rgba(21, 28, 39, 0.9)', 
                    titleFont: { family: 'Inter', size: 13 }, 
                    bodyFont: { family: 'Space Grotesk', size: 14, weight: 'bold' }, 
                    padding: 12, 
                    cornerRadius: 8,
                    callbacks: { 
                        label: function(ctx) { return ' ' + fmtCurrency(ctx.raw); } 
                    } 
                }
            }
        }
    });
}

function recentActivityTable(data) {
    if (!data || !data.data || data.data.length === 0) {
        return `<section class="bg-surface-container-lowest rounded-xl p-8"><h2 class="text-xl font-extrabold font-headline text-on-surface mb-6">Recent Activity</h2><p class="text-sm text-on-surface-variant">No transactions yet.</p></section>`;
    }
    const rows = data.data.map(r => {
        const isIncome = r.type === 'income';
        const amtClass = isIncome ? 'text-tertiary' : '';
        const prefix = isIncome ? '+' : '-';
        return `<tr class="group hover:bg-surface-container-low transition-colors cursor-pointer" onclick="window.location.hash='#/records?edit=${r.id}'">
            <td class="py-5 pr-4 text-sm text-on-surface-variant group-hover:text-primary transition-colors">${fmtDate(r.date)}</td>
            <td class="py-5 px-4 text-sm text-on-surface-variant">${r.category}</td>
            <td class="py-5 px-4 text-sm text-on-surface-variant font-medium">${r.type}</td>
            <td class="py-5 pl-4 text-sm font-bold text-right data-value ${amtClass}">${prefix}${fmtCurrency(r.amount)}</td>
        </tr>`;
    }).join('');

    return `
<section class="bg-surface-container-lowest rounded-xl p-8 overflow-hidden">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-extrabold font-headline text-on-surface">Recent Activity</h2>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full border-separate border-spacing-0">
            <thead>
                <tr class="text-left">
                    <th class="pb-4 pr-4 font-label text-xs uppercase tracking-widest text-outline-variant font-bold">Date</th>
                    <th class="pb-4 px-4 font-label text-xs uppercase tracking-widest text-outline-variant font-bold">Category</th>
                    <th class="pb-4 px-4 font-label text-xs uppercase tracking-widest text-outline-variant font-bold">Type</th>
                    <th class="pb-4 pl-4 font-label text-xs uppercase tracking-widest text-outline-variant font-bold text-right">Amount</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-surface-container">${rows}</tbody>
        </table>
    </div>
</section>`;
}

function monthlyInsightsSkeleton() {
    return `<section class="bg-surface-container-lowest rounded-xl p-8 animate-pulse">
        <!-- Header Skeleton -->
        <div class="flex items-center justify-between gap-4 mb-6">
            <div class="flex-1">
                <div class="skeleton h-8 w-48 mb-2"></div>
                <div class="skeleton h-4 w-32"></div>
            </div>
            <div class="skeleton h-10 w-32 rounded-lg"></div>
        </div>
        
        <!-- Quick Stats Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="skeleton h-24 rounded-lg"></div>
            <div class="skeleton h-24 rounded-lg"></div>
            <div class="skeleton h-24 rounded-lg"></div>
        </div>
        
        <!-- Narrative Skeleton -->
        <div class="mb-6 p-4 rounded-lg border border-outline-variant/20">
            <div class="space-y-2">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-3/4"></div>
            </div>
        </div>
        
        <!-- Highlights Skeleton -->
        <div class="mb-8">
            <div class="skeleton h-4 w-40 mb-4"></div>
            <div class="space-y-2">
                <div class="skeleton h-4 w-full"></div>
                <div class="skeleton h-4 w-full"></div>
            </div>
        </div>
        
        <!-- Categories Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="skeleton h-40 rounded-lg"></div>
            <div class="skeleton h-40 rounded-lg"></div>
        </div>
    </section>`;
}

function monthlyInsightsEmpty(data) {
    const monthName = new Date(data.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return `<section class="bg-gradient-to-br from-surface-container-lowest to-surface-container rounded-xl p-8 border border-outline-variant/30">
        <div class="flex flex-col items-center text-center">
            <div class="mb-6">
                <div class="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-4xl text-tertiary">calendar_month</span>
                </div>
            </div>
            <h2 class="text-xl font-extrabold font-headline text-on-surface mb-2">No Activity in ${monthName}</h2>
            <p class="text-sm text-on-surface-variant mb-6 max-w-sm">No financial transactions were recorded for this month. Start tracking your spending and income to see insights here.</p>
            <div class="flex gap-3 flex-wrap justify-center">
                <a href="#/records" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity">
                    Add Transaction
                </a>
                <a href="#/dashboard" onclick="window.location.reload()" class="px-4 py-2 rounded-lg border border-outline text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors">
                    Refresh
                </a>
            </div>
        </div>
    </section>`;
}

function monthlyInsightsError() {
    return `<section class="bg-gradient-to-br from-error-container/50 to-error-container rounded-xl p-8 border border-error/30">
        <div class="flex gap-4">
            <div class="flex-shrink-0 pt-1">
                <span class="material-symbols-outlined text-2xl text-error">warning</span>
            </div>
            <div>
                <h3 class="font-semibold text-on-error-container mb-1 text-base">Failed to Load Monthly Insights</h3>
                <p class="text-sm text-on-error-container/85 mb-4">We couldn't retrieve your monthly financial insights at the moment. This is usually temporary.</p>
                <div class="flex gap-2">
                    <button onclick="window.location.reload()" class="px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-semibold hover:opacity-90 transition-opacity">
                        Try Again
                    </button>
                    <button onclick="console.log('Check browser console for details')" class="px-3 py-1.5 rounded-lg border border-error text-error text-sm font-semibold hover:bg-error/5 transition-colors">
                        Details
                    </button>
                </div>
            </div>
        </div>
    </section>`;
}


function monthlyInsightsHeader(data) {
    const monthName = new Date(data.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    // Helper to format date as YYYY-MM without timezone issues
    const formatMonth = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };
    
    // Generate dropdown options for past 12 months
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = formatMonth(date);
        const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        months.push({ value: monthStr, label });
    }
    
    // Get prev/next month
    const [currYear, currMonthStr] = data.month.split('-').map(Number);
    const currMonth = currMonthStr - 1; // Convert to 0-indexed
    const prevDate = new Date(currYear, currMonth - 1, 1);
    const nextDate = new Date(currYear, currMonth + 1, 1);
    const prevMonth = formatMonth(prevDate);
    const nextMonth = formatMonth(nextDate);
    const isCurrentMonth = data.month === formatMonth(now);
    
    return `<div class="flex items-center justify-between mb-6 gap-4">
        <div class="flex-1">
            <h2 class="text-xl font-extrabold font-headline text-on-surface">Monthly Insights</h2>
            <p class="text-xs text-on-surface-variant">Financial summary for ${monthName}</p>
        </div>
        
        <div class="flex items-center gap-2">
            <button onclick="handleMonthChange('${prevMonth}')" class="px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                Prev
            </button>
            
            <select id="month-selector" class="px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors" onchange="handleMonthChange(this.value)">
                ${months.map(m => `<option value="${m.value}" ${m.value === data.month ? 'selected' : ''}>${m.label}</option>`).join('')}
            </select>
            
            <button onclick="handleMonthChange('${nextMonth}')" ${isCurrentMonth ? 'disabled' : ''} class="px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                Next
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            
            <button onclick="downloadMonthlyReport('${data.month}')" class="px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors flex items-center gap-1" title="Download as PDF">
                <span class="material-symbols-outlined text-[18px]">download</span>
            </button>
        </div>
    </div>`;
}

window.downloadMonthlyReport = function(month) {
    const monthName = new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const data = window.currentInsightsData;
    if (!data) {
        alert('No data to export');
        return;
    }
    
    // Create simple CSV (can be extended to PDF later with a library)
    const csv = [
        ['Monthly Financial Report', monthName],
        [],
        ['Financial Summary'],
        ['Total Income', '$' + data.summary.totalIncome.toFixed(2)],
        ['Total Expense', '$' + data.summary.totalExpense.toFixed(2)],
        ['Net Balance', '$' + data.summary.netBalance.toFixed(2)],
        ['Savings Rate', window.calculateSavingsRate(data.summary) + '%'],
        [],
        ['Top Expenses'],
        ...data.topExpenseCategories.map(c => [c.category, '$' + c.amount.toFixed(2), c.percentOfTotal.toFixed(1) + '%']),
        [],
        ['Top Income'],
        ...data.topIncomeCategories.map(c => [c.category, '$' + c.amount.toFixed(2), c.percentOfTotal.toFixed(1) + '%']),
    ];
    
    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};

function monthlyQuickStats(data) {
    const income = data.summary.totalIncome || 0;
    const expense = data.summary.totalExpense || 0;
    const net = data.summary.netBalance || 0;
    const savingsRate = window.calculateSavingsRate(data.summary);
    
    const incomeArrow = income > 0 ? '↑' : '→';
    const expenseArrow = expense > 0 ? '↓' : '→';
    const netArrow = net > 0 ? '↑' : '↓';
    const savingsArrow = savingsRate > 20 ? '↑' : savingsRate > 10 ? '→' : '↓';
    
    const incomeColor = income > 0 ? 'text-tertiary' : 'text-on-surface-variant';
    const expenseColor = 'text-error';
    const netColor = net > 0 ? 'text-primary' : 'text-error';
    const savingsColor = savingsRate > 20 ? 'text-tertiary' : savingsRate > 10 ? 'text-primary' : 'text-error';
    
    return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-tertiary/10 rounded-lg p-4 border border-tertiary/20">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Income</p>
                <span class="text-lg ${incomeColor} font-bold">${incomeArrow}</span>
            </div>
            <p class="text-2xl font-bold ${incomeColor}">$${income.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        
        <div class="bg-error/10 rounded-lg p-4 border border-error/20">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Expense</p>
                <span class="text-lg ${expenseColor} font-bold">${expenseArrow}</span>
            </div>
            <p class="text-2xl font-bold ${expenseColor}">$${expense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        
        <div class="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Net Balance</p>
                <span class="text-lg ${netColor} font-bold">${netArrow}</span>
            </div>
            <p class="text-2xl font-bold ${netColor}">$${net.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        
        <div class="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Savings Rate</p>
                <span class="text-lg ${savingsColor} font-bold">${savingsArrow}</span>
            </div>
            <p class="text-2xl font-bold ${savingsColor}">${savingsRate}%</p>
        </div>
    </div>`;
}

window.calculateSavingsRate = function(summary) {
    if (!summary.totalIncome || summary.totalIncome === 0) return 0;
    const savings = summary.totalIncome - summary.totalExpense;
    const rate = (savings / summary.totalIncome) * 100;
    return Math.round(rate);
};

// Helper to format date as YYYY-MM without timezone issues
window.formatMonth = function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

window.getComparisonData = async function(currentMonth) {
    // Calculate previous month
    const [currYear, currMonthStr] = currentMonth.split('-').map(Number);
    const currMonth = currMonthStr - 1; // Convert to 0-indexed
    const prevDate = new Date(currYear, currMonth - 1, 1);
    const prevMonth = window.formatMonth(prevDate);
    
    try {
        const prevData = await getMonthlyInsights({ month: prevMonth });
        if (!prevData) return null;
        
        return {
            prevMonth: prevMonth,
            incomeChange: window.calculateChange(prevData.summary.totalIncome),
            expenseChange: window.calculateChange(prevData.summary.totalExpense),
            netChange: window.calculateChange(prevData.summary.netBalance),
            prevIncome: prevData.summary.totalIncome,
            prevExpense: prevData.summary.totalExpense,
            prevNet: prevData.summary.netBalance
        };
    } catch (error) {
        return null;
    }
};

window.calculateChange = function(value) {
    // Returns a comparison arrow
    if (value < 0) return '↓';
    if (value > 0) return '↑';
    return '→';
};

window.getChangePercent = function(current, previous) {
    if (previous === 0) return previous === current ? 0 : 100;
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
};

function monthlyComparisonSection(currentData, comparisonData) {
    if (!comparisonData) return '';
    
    const prevMonthName = new Date(comparisonData.prevMonth + '-01').toLocaleDateString('en-US', { month: 'short' });
    
    const incomeChangePercent = window.getChangePercent(currentData.summary.totalIncome, comparisonData.prevIncome);
    const expenseChangePercent = window.getChangePercent(currentData.summary.totalExpense, comparisonData.prevExpense);
    const netChangePercent = window.getChangePercent(currentData.summary.netBalance, comparisonData.prevNet);
    
    const incomeChangeColor = incomeChangePercent > 0 ? 'text-tertiary' : incomeChangePercent < 0 ? 'text-error' : 'text-on-surface-variant';
    const expenseChangeColor = expenseChangePercent < 0 ? 'text-tertiary' : expenseChangePercent > 0 ? 'text-error' : 'text-on-surface-variant';
    const netChangeColor = netChangePercent > 0 ? 'text-tertiary' : netChangePercent < 0 ? 'text-error' : 'text-on-surface-variant';
    
    return `<div class="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <h3 class="text-sm font-bold text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">trending_up</span>
            vs ${prevMonthName}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <p class="text-xs text-on-surface-variant mb-1">Income Change</p>
                <p class="text-lg font-bold ${incomeChangeColor}">
                    ${incomeChangePercent > 0 ? '+' : ''}${incomeChangePercent}%
                </p>
            </div>
            <div>
                <p class="text-xs text-on-surface-variant mb-1">Expense Change</p>
                <p class="text-lg font-bold ${expenseChangeColor}">
                    ${expenseChangePercent > 0 ? '+' : ''}${expenseChangePercent}%
                </p>
            </div>
            <div>
                <p class="text-xs text-on-surface-variant mb-1">Net Balance Change</p>
                <p class="text-lg font-bold ${netChangeColor}">
                    ${netChangePercent > 0 ? '+' : ''}${netChangePercent}%
                </p>
            </div>
        </div>
    </div>`;
}


window.handleMonthChange = async function(monthStr) {
    const params = { month: monthStr };
    const response = await getMonthlyInsights(params);
    if (response && response.month) {
        const main = document.getElementById('main-content');
        const section = main.querySelector('[data-insights-section]');
        if (section) {
            section.innerHTML = monthlyInsightsSection(response);
        }
    }
};

function monthlyInsightsSection(data) {
    if (!data) return monthlyInsightsSkeleton();
    if (data.summary.transactionCount === 0) return monthlyInsightsEmpty(data);
    
    // Store current data for export
    window.currentInsightsData = data;

    const monthName = new Date(data.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const sourceBadge = data.source === 'ai' 
        ? `<span class="flex items-center gap-1 text-tertiary text-xs font-bold bg-tertiary/10 px-3 py-1 rounded-full">
            <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
            AI-Enhanced
          </span>`
        : `<span class="flex items-center gap-1 text-on-surface-variant text-xs font-bold bg-outline-variant/20 px-3 py-1 rounded-full">
            <span class="material-symbols-outlined text-[14px]">auto_fix</span>
            Auto-Generated
          </span>`;
    
    const highlightsHtml = data.highlights.length > 0
        ? `<ul class="space-y-2">
            ${data.highlights.map(h => `<li class="flex items-start gap-3 text-sm text-on-surface">
                <span class="material-symbols-outlined text-tertiary text-[18px] shrink-0" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                <span>${h.message}</span>
            </li>`).join('')}
          </ul>`
        : `<p class="text-sm text-on-surface-variant">No notable highlights for this month.</p>`;
    
    const expenseCategories = data.topExpenseCategories.slice(0, 5);
    const incomeCategories = data.topIncomeCategories.slice(0, 5);
    
    const expensesHtml = expenseCategories.length > 0
        ? expenseCategories.map(c => `
            <div class="p-4 rounded-lg bg-surface-container-low border border-error/10 hover:bg-white transition-colors">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-semibold text-on-surface">${c.category}</span>
                    <span class="text-sm font-bold text-error data-value">${fmtCurrency(c.amount)}</span>
                </div>
                <div class="flex justify-between text-xs text-on-surface-variant">
                    <span>${Math.round(c.percentOfTotal)}% of total</span>
                    <span>${c.transactionCount} ${c.transactionCount === 1 ? 'transaction' : 'transactions'}</span>
                </div>
            </div>`).join('')
        : `<p class="text-sm text-on-surface-variant">No expense categories for this period.</p>`;
    
    const incomeHtml = incomeCategories.length > 0
        ? incomeCategories.map(c => `
            <div class="p-4 rounded-lg bg-surface-container-low border border-tertiary/10 hover:bg-white transition-colors">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-semibold text-on-surface">${c.category}</span>
                    <span class="text-sm font-bold text-tertiary data-value">${fmtCurrency(c.amount)}</span>
                </div>
                <div class="flex justify-between text-xs text-on-surface-variant">
                    <span>${Math.round(c.percentOfTotal)}% of total</span>
                    <span>${c.transactionCount} ${c.transactionCount === 1 ? 'transaction' : 'transactions'}</span>
                </div>
            </div>`).join('')
        : `<p class="text-sm text-on-surface-variant">No income categories for this period.</p>`;
    
    // Build the main section
    let html = `<section class="bg-surface-container-lowest rounded-xl p-8" data-insights-section>
        ${monthlyInsightsHeader(data)}
        
        ${monthlyQuickStats(data)}
        
        <div class="flex items-center justify-between mb-6">
            <div>
                <h3 class="text-sm font-bold text-on-surface uppercase tracking-widest">Monthly Summary</h3>
            </div>
            ${sourceBadge}
        </div>
        
        <div class="mb-6 p-4 rounded-lg bg-surface/50 border border-outline-variant/20">
            <p class="text-sm text-on-surface leading-relaxed">${data.narrative}</p>
        </div>
        
        <div id="comparison-section" class="mb-8"><!-- Comparison will be loaded here --></div>
        
        <div class="mb-8">
            <h3 class="text-sm font-bold text-on-surface uppercase tracking-widest mb-4 text-outline-variant">Key Highlights</h3>
            ${highlightsHtml}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-sm font-bold text-error uppercase tracking-widest mb-4 text-outline-variant">Top Expenses</h3>
                <div class="space-y-3">
                    ${expensesHtml}
                </div>
            </div>
            <div>
                <h3 class="text-sm font-bold text-tertiary uppercase tracking-widest mb-4 text-outline-variant">Top Income</h3>
                <div class="space-y-3">
                    ${incomeHtml}
                </div>
            </div>
        </div>
    </section>`;
    
    // Fetch and add comparison data
    setTimeout(async () => {
        const comparisonData = await window.getComparisonData(data.month);
        const comparisonSection = document.getElementById('comparison-section');
        if (comparisonSection && comparisonData) {
            comparisonSection.innerHTML = monthlyComparisonSection(data, comparisonData);
        }
    }, 0);
    
    return html;
}

export async function renderDashboard(timeframe = 'all', isSilent = false) {
    const app = document.getElementById('app');
    
    if (!isSilent) {
        const loading = `<div class="p-8 space-y-8">${skeletonCards()}<div class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-2 skeleton h-80 rounded-xl"></div><div class="skeleton h-80 rounded-xl"></div></div><div class="skeleton h-48 rounded-xl"></div></div>`;
        app.innerHTML = renderAppShell('dashboard', loading);
        bindLogout();
    }

    const main = document.getElementById('main-content');
    
    // Calculate dates
    const q = {};
    const now = new Date();
    let monthParam = {};
    
    if (timeframe === 'thisMonth') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        q.startDate = start.toISOString().split('T')[0];
        q.endDate = now.toISOString().split('T')[0];
        monthParam.month = window.formatMonth(now); // Current month: 2026-04
    } else if (timeframe === 'lastMonth') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        q.startDate = start.toISOString().split('T')[0];
        q.endDate = end.toISOString().split('T')[0];
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        monthParam.month = window.formatMonth(lastMonth); // Last month: 2026-03
    } else if (timeframe === 'last7') {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        q.startDate = start.toISOString().split('T')[0];
        q.endDate = now.toISOString().split('T')[0];
        // For last 7 days, still show current month insights
        monthParam.month = window.formatMonth(now);
    }

    try {
        const [summary, trends, categories, recent, monthly] = await Promise.allSettled([
            getSummary(q), 
            getTrends(q), 
            getCategoryBreakdown(q), 
            getRecentActivity({ ...q, limit: 10 }),
            getMonthlyInsights(monthParam)
        ]);
        const s = summary.status === 'fulfilled' ? summary.value : null;
        const t = trends.status === 'fulfilled' ? trends.value : null;
        const c = categories.status === 'fulfilled' ? categories.value : null;
        const r = recent.status === 'fulfilled' ? recent.value : null;
        const m = monthly.status === 'fulfilled' && monthly.value ? monthly.value : (monthly.status === 'rejected' ? null : monthly.status === 'fulfilled' ? monthly.value : null);

        main.innerHTML = `<div class="p-8 space-y-8">
            ${dashboardHeader(timeframe)}
            ${summaryCards(s)}
            ${m && m.month ? monthlyInsightsSection(m) : monthlyInsightsError()}
            <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                ${trendsChart(t)}
                ${categoryBreakdown(c)}
            </section>
            ${recentActivityTable(r)}
        </div>`;

        // Initialize charts
        if (t && t.data && t.data.length > 0) initTrendsChart(t.data);
        if (c && c.data && c.data.length > 0) initCategoryChart(c.data);

        // Bind filter events
        document.getElementById('timeframe-filter')?.addEventListener('change', (e) => {
            renderDashboard(e.target.value);
        });

        document.getElementById('refresh-dashboard-btn')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.querySelector('.material-symbols-outlined').classList.add('animate-spin');
            renderDashboard(document.getElementById('timeframe-filter')?.value || 'all', true);
        });

        // Setup background polling (30s)
        if (window.__dashboardRefresh) clearInterval(window.__dashboardRefresh);
        window.__dashboardRefresh = setInterval(() => {
            if (window.location.hash === '#/dashboard' || window.location.hash === '') {
                renderDashboard(document.getElementById('timeframe-filter')?.value || 'all', true);
            }
        }, 30000);

    } catch (err) {
        main.innerHTML = `<div class="p-8"><div class="bg-error-container text-on-error-container p-4 rounded-xl">Failed to load dashboard: ${err.message || 'Unknown error'}</div></div>`;
    }
}
