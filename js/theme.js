/**
 * Theme Manager
 * Handles Light/Dark mode toggling and persistence.
 */

window.ThemeManager = {
    init() {
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        this.applyTheme(this.currentTheme);

        if (this.themeToggleBtn) {
            // Remove old listeners to avoid duplicates if re-initialized
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
            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager.init();
});
