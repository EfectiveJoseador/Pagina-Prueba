
(function () {
    const SW_VERSION = 'v2';
    const CLEANUP_KEY = 'sw_cleanup_' + SW_VERSION;
    if (localStorage.getItem(CLEANUP_KEY)) return;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            registrations.forEach(function (registration) {
                registration.unregister().then(function (success) {
                    if (success) {
                        console.log('🧹 Service Worker desregistrado para actualización');
                    }
                });
            });
        });
        if ('caches' in window) {
            caches.keys().then(function (names) {
                names.forEach(function (name) {
                    caches.delete(name);
                    console.log('🧹 Cache eliminado:', name);
                });
            });
        }
        localStorage.setItem(CLEANUP_KEY, Date.now().toString());
        navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
            console.log('✅ Nuevo Service Worker registrado');
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        }).catch(function (error) {
            console.log('Service Worker registration failed:', error);
        });
    }
})();



window.ThemeManager = {
    init() {
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        this.applyTheme(this.currentTheme);

        if (this.themeToggleBtn) {
            const newBtn = this.themeToggleBtn.cloneNode(true);
            this.themeToggleBtn.parentNode.replaceChild(newBtn, this.themeToggleBtn);
            this.themeToggleBtn = newBtn;

            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateIcon();
        }
    },

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateIcon();
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    },

    updateIcon() {
        if (!this.themeToggleBtn) return;
        const icon = this.themeToggleBtn.querySelector('i');
        if (icon) {

            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-lightbulb';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager.init();
});
