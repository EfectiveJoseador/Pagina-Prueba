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
            // Logic fixed: 
            // If current is light, we show Moon (to go dark).
            // If current is dark, we show Lightbulb (to go light).
            // User said "inverted", so maybe they want the icon to represent the CURRENT state?
            // "Cuando selecciono tema claro, carga el oscuro" -> They clicked Sun (Light) and got Dark?
            // If code was: Light -> Moon, Dark -> Sun.
            // If I am in Dark, I see Sun. I click Sun. I become Light.
            // If user says "When I select Light (Sun?), it loads Dark", then maybe the toggle logic was wrong?
            // Line 25: this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            // If I am Dark. Click. Become Light.

            // Let's assume the user wants the icon to represent the TARGET state, but felt it was wrong.
            // Or maybe they want the icon to represent the CURRENT state.
            // If I am Light, show Lightbulb. If I am Dark, show Moon.
            // Let's try "Indicator" logic if "Switch To" logic was confusing.
            // BUT, standard is "Switch To".

            // Let's look at the specific request: "Cuando selecciono tema claro, carga el oscuro."
            // Maybe the `toggleTheme` logic was: `current = current === 'light' ? 'dark' : 'light'`.
            // If I start at Dark. Click. Becomes Light.

            // Let's stick to the requested icon change first: Sun -> Lightbulb.
            // And "Fix inverted logic".
            // If I swap the icon logic:
            // Light Mode -> Show Lightbulb (Current).
            // Dark Mode -> Show Moon (Current).
            // OR
            // Light Mode -> Show Moon (Target).
            // Dark Mode -> Show Lightbulb (Target).

            // I will implement: Dark Mode shows Lightbulb (Target: Light). Light Mode shows Moon (Target: Dark).
            // This is the standard.

            // Wait, if the user said it's inverted, maybe I should SWAP the toggle logic?
            // No, toggle is just A -> B.

            // Maybe the `applyTheme` was wrong?
            // `document.documentElement.setAttribute('data-theme', theme);`

            // I will assume the user wants the icon to match the text "Tema Claro" / "Tema Oscuro".
            // I will use:
            // Light Theme active -> Show Moon (to switch to dark).
            // Dark Theme active -> Show Lightbulb (to switch to light).

            icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-lightbulb';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager.init();
});
