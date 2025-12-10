const Toast = {
    container: null,

    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const icons = {
            success: 'fa-check',
            error: 'fa-times',
            warning: 'fa-exclamation',
            info: 'fa-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon"><i class="fas ${icons[type]}"></i></span>
            <span class="toast-content">${message}</span>
            <button class="toast-close" aria-label="Cerrar"><i class="fas fa-times"></i></button>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        this.container.appendChild(toast);
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    },

    hide(toast) {
        if (!toast || toast.classList.contains('hiding')) return;
        
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    },
    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};
const ButtonStates = {
    setLoading(button, loadingText = 'Cargando...') {
        if (!button) return;
        
        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;
        button.innerHTML = loadingText;
        button.classList.add('btn-loading');
        button.disabled = true;
    },

    setSuccess(button, successText = '¡Hecho!', duration = 2000) {
        if (!button) return;
        
        button.classList.remove('btn-loading');
        button.classList.add('btn-success-state');
        button.innerHTML = `<i class="fas fa-check"></i> ${successText}`;
        button.disabled = true;

        if (duration > 0) {
            setTimeout(() => this.reset(button), duration);
        }
    },

    setError(button, errorText = 'Error', duration = 2000) {
        if (!button) return;
        
        button.classList.remove('btn-loading');
        button.classList.add('btn-error-state');
        button.innerHTML = `<i class="fas fa-times"></i> ${errorText}`;

        if (duration > 0) {
            setTimeout(() => this.reset(button), duration);
        }
    },

    reset(button) {
        if (!button) return;
        
        button.classList.remove('btn-loading', 'btn-success-state', 'btn-error-state');
        
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
        
        if (button.dataset.originalDisabled !== 'true') {
            button.disabled = false;
        }
    }
};
const CartBadge = {
    animate() {
        const badge = document.getElementById('cart-count');
        if (!badge) return;

        badge.classList.remove('animate');
        void badge.offsetWidth;
        badge.classList.add('animate');
        setTimeout(() => badge.classList.remove('animate'), 500);
    },

    update(count) {
        const badge = document.getElementById('cart-count');
        if (!badge) return;

        const oldCount = parseInt(badge.textContent) || 0;
        badge.textContent = count;
        if (count > oldCount) {
            this.animate();
        }
    }
};
const NavActiveState = {
    init() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const linkPath = new URL(href, window.location.origin).pathname;
            const isActive = this.isMatch(currentPath, linkPath);
            
            if (isActive) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    },

    isMatch(currentPath, linkPath) {
        if (currentPath === linkPath) return true;
        if ((currentPath === '/' || currentPath === '/index.html') && 
            (linkPath === '/' || linkPath === '/index.html')) {
            return true;
        }
        if (currentPath.includes(linkPath) && linkPath !== '/' && linkPath !== '/index.html') {
            return true;
        }

        return false;
    }
};
const FormFeedback = {
    showError(input, message) {
        this.clearError(input);
        
        const wrapper = input.closest('.form-group') || input.parentElement;
        input.classList.add('input-error');
        
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = 'color: #ef4444; font-size: 0.85rem; margin-top: 0.25rem; display: block;';
        
        wrapper.appendChild(errorEl);
    },

    clearError(input) {
        input.classList.remove('input-error');
        const wrapper = input.closest('.form-group') || input.parentElement;
        const existing = wrapper.querySelector('.form-error-message');
        if (existing) existing.remove();
    },

    clearAll(form) {
        form.querySelectorAll('.input-error').forEach(input => {
            this.clearError(input);
        });
    }
};
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
});
window.addEventListener('components:ready', () => {
    NavActiveState.init();
});
window.Toast = Toast;
window.ButtonStates = ButtonStates;
window.CartBadge = CartBadge;
window.NavActiveState = NavActiveState;
window.FormFeedback = FormFeedback;
