// Toast notification system
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px">${icons[type] || 'info'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, type === 'error' ? 5000 : 3000);
}
