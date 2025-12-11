

const Components = {
    header: `
        <header class="main-header">
            <div class="container header-container">
                <a href="/index.html" class="logo-link">
                    <img src="/assets/logo/logo.png" alt="Camisetazo" class="logo-img">
                    <span>CAMISETAZO</span>
                </a>

                <nav class="nav-menu" id="navMenu">
                    <a href="/index.html" class="nav-link">Inicio</a>
                    <a href="/pages/catalogo.html" class="nav-link">Catálogo</a>
                    <a href="/pages/tienda.html" class="nav-link">Tienda</a>
                    <a href="/pages/quienes-somos.html" class="nav-link">Nosotros</a>
                </nav>

                <div class="header-actions">
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
                        <li><a href="/pages/contacto.html">Contacto</a></li>
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
                    <h4>Contacto</h4>
                    <ul class="footer-links">
                        <li><a href="mailto:camisetazocontacto@gmail.com"><i class="fas fa-envelope"></i> camisetazocontacto@gmail.com</a></li>
                    </ul>
                    <h4 style="margin-top: 1rem;">Síguenos</h4>
                    <div class="social-links">
                        <a href="https://www.instagram.com/camisetazo._/" target="_blank" rel="noopener" class="social-link" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.tiktok.com/@camisetazo" target="_blank" rel="noopener" class="social-link" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Camisetazo. Todos los derechos reservados.</p>
            </div>
        </footer>
    `,

    load() {
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = this.header;
        } else {
            document.body.insertAdjacentHTML('afterbegin', this.header);
        }
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = this.footer;
        } else {
            document.body.insertAdjacentHTML('beforeend', this.footer);
        }
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
        if (window.ThemeManager) {
            window.ThemeManager.init();
        }
        window.dispatchEvent(new CustomEvent('components:ready'));
        CookieConsent.init();
    }
};


const CookieConsent = {
    banner: `
        <div id="cookie-consent" class="cookie-consent" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-desc">
            <div class="cookie-consent-content">
                <div class="cookie-text">
                    <h3 id="cookie-title"><i class="fas fa-cookie-bite"></i> Usamos Cookies</h3>
                    <p id="cookie-desc">Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación y analizar el uso del sitio. 
                    <a href="/pages/cookies.html">Más información</a></p>
                </div>
                <div class="cookie-buttons">
                    <button id="cookie-accept" class="cookie-btn cookie-btn-accept">Aceptar</button>
                    <button id="cookie-reject" class="cookie-btn cookie-btn-reject">Rechazar</button>
                </div>
            </div>
        </div>
    `,

    styles: `
        <style id="cookie-consent-styles">
            .cookie-consent {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-card, #1a1a2e);
                border-top: 1px solid var(--border, rgba(255,255,255,0.1));
                padding: 1rem 1.5rem;
                z-index: 9999;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                transform: translateY(100%);
                opacity: 0;
                transition: transform 0.4s ease, opacity 0.4s ease;
            }
            .cookie-consent.show {
                transform: translateY(0);
                opacity: 1;
            }
            .cookie-consent-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
                flex-wrap: wrap;
            }
            .cookie-text {
                flex: 1;
                min-width: 280px;
            }
            .cookie-text h3 {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-main, #fff);
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .cookie-text h3 i {
                color: var(--primary, #6366f1);
            }
            .cookie-text p {
                font-size: 0.9rem;
                color: var(--text-muted, #a0a0a0);
                line-height: 1.5;
                margin: 0;
            }
            .cookie-text a {
                color: var(--primary, #6366f1);
                text-decoration: none;
                font-weight: 500;
            }
            .cookie-text a:hover {
                text-decoration: underline;
            }
            .cookie-buttons {
                display: flex;
                gap: 0.75rem;
                flex-shrink: 0;
            }
            .cookie-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            .cookie-btn-accept {
                background: #1a1a2e;
                color: #fff;
            }
            .cookie-btn-accept:hover {
                background: #0f0f1a;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            .cookie-btn-reject {
                background: transparent;
                color: var(--text-muted, #a0a0a0);
                border: 1px solid var(--border, rgba(255,255,255,0.2));
            }
            .cookie-btn-reject:hover {
                background: rgba(255,255,255,0.05);
                color: var(--text-main, #fff);
            }
            @media (max-width: 600px) {
                .cookie-consent {
                    padding: 1rem;
                }
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 1rem;
                }
                .cookie-buttons {
                    width: 100%;
                    justify-content: center;
                }
                .cookie-btn {
                    flex: 1;
                    max-width: 150px;
                }
            }
        </style>
    `,

    init() {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) return;
        document.head.insertAdjacentHTML('beforeend', this.styles);
        document.body.insertAdjacentHTML('beforeend', this.banner);
        const banner = document.getElementById('cookie-consent');
        setTimeout(() => banner.classList.add('show'), 100);
        document.getElementById('cookie-accept').addEventListener('click', () => {
            this.setConsent('accepted');
            this.hideBanner();
        });
        document.getElementById('cookie-reject').addEventListener('click', () => {
            this.setConsent('rejected');
            this.hideBanner();
        });
    },

    setConsent(value) {
        localStorage.setItem('cookieConsent', value);
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
    },

    hideBanner() {
        const banner = document.getElementById('cookie-consent');
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 400);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Components.load();
});
