/**
 * Component Loader
 * Injects shared Header and Footer into pages.
 */

const Components = {
    header: `
        <header class="main-header">
            <div class="container header-container">
                <a href="/index.html" class="logo-link">
                    <img src="/assets/logo/logo.jpg" alt="Camisetazo" class="logo-img">
                    <span>CAMISETAZO</span>
                </a>

                <nav class="nav-menu" id="navMenu">
                    <a href="/index.html" class="nav-link">Inicio</a>
                    <a href="/pages/catalogo.html" class="nav-link">Colecciones</a>
                    <a href="/pages/tienda.html" class="nav-link">Tienda</a>
                    <a href="/pages/quienes-somos.html" class="nav-link">Nosotros</a>
                </nav>

                <div class="header-actions">
                    <button class="icon-btn" id="search-btn" aria-label="Buscar"><i class="fas fa-search"></i></button>
                    <a href="/pages/carrito.html" class="icon-btn" aria-label="Carrito">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="cart-badge" id="cart-count">0</span>
                    </a>
                    <a href="/pages/login.html" class="icon-btn" aria-label="Usuario"><i class="fas fa-user"></i></a>
                    <button class="icon-btn" id="theme-toggle" aria-label="Cambiar tema"><i class="fas fa-moon"></i></button>
                    <button class="icon-btn mobile-menu-btn" id="mobile-menu-toggle" aria-label="Menú"><i class="fas fa-bars"></i></button>
                </div>
            </div>
        </header>
    `,

    footer: `
        <footer class="main-footer">
            <div class="container footer-grid">
                <div class="footer-col">
                    <h4>Camisetazo</h4>
                    <p class="text-muted">Tu tienda de confianza para camisetas de fútbol y ropa deportiva premium.</p>
                </div>
                <div class="footer-col">
                    <h4>Enlaces Rápidos</h4>
                    <ul class="footer-links">
                        <li><a href="/pages/catalogo.html">Catálogo</a></li>
                        <li><a href="/pages/quienes-somos.html">Sobre Nosotros</a></li>
                        <li><a href="/pages/envios.html">Envíos y Devoluciones</a></li>
                        <li><a href="/pages/faq.html">Preguntas Frecuentes</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Legal</h4>
                    <ul class="footer-links">
                        <li><a href="/pages/privacidad.html">Política de Privacidad</a></li>
                        <li><a href="/pages/cookies.html">Política de Cookies</a></li>
                        <li><a href="/pages/terminos.html">Términos y Condiciones</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Síguenos</h4>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Camisetazo. Todos los derechos reservados.</p>
            </div>
        </footer>
    `,

    load() {
        // Insert Header
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = this.header;
        } else {
            document.body.insertAdjacentHTML('afterbegin', this.header);
        }

        // Insert Footer
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = this.footer;
        } else {
            document.body.insertAdjacentHTML('beforeend', this.footer);
        }

        // Initialize Mobile Menu
        const menuBtn = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('navMenu');
        if (menuBtn && navMenu) {
            menuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('open');
                const icon = menuBtn.querySelector('i');
                if (navMenu.classList.contains('open')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }

        // Re-init theme toggle listener because the button was just injected
        if (window.ThemeManager) {
            window.ThemeManager.init();
        }

        // Dispatch event to notify that components are loaded
        window.dispatchEvent(new CustomEvent('components:ready'));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Components.load();
});
