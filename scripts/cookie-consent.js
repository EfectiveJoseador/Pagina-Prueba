(function() {
    const COOKIE_CONSENT_KEY = 'camisetazo_cookie_consent';
    
    function hasConsent() {
        return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
    }
    
    function saveConsent() {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    }
    
    function showCookieBanner() {
        if (hasConsent()) return;
        
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Utilizamos cookies para mejorar tu experiencia en nuestra web. Al continuar navegando, aceptas nuestra 
                <a href="politica-cookies.html" target="_blank" rel="noopener noreferrer">política de cookies</a> y 
                <a href="politica-privacidad.html" target="_blank" rel="noopener noreferrer">política de privacidad</a>.</p>
                <div class="cookie-buttons">
                    <button id="cookie-accept" class="cookie-btn accept">Aceptar</button>
                    <button id="cookie-settings" class="cookie-btn settings">Configurar</button>
                </div>
            </div>
        `;
        
        
        const style = document.createElement('style');
        style.textContent = `
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(10, 31, 61, 0.95);
                color: #fff;
                padding: 15px;
                z-index: 9999;
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 14px;
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
            }
            .cookie-banner.show {
                transform: translateY(0);
            }
            .cookie-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 15px;
            }
            .cookie-content p {
                margin: 0;
                flex: 1;
                min-width: 280px;
            }
            .cookie-content a {
                color: var(--azul-acento);
                text-decoration: none;
            }
            .cookie-content a:hover {
                text-decoration: underline;
            }
            .cookie-buttons {
                display: flex;
                gap: 10px;
            }
            .cookie-btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s ease;
            }
            .cookie-btn.accept {
                background: var(--azul-acento);
                color: #fff;
            }
            .cookie-btn.settings {
                background: transparent;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .cookie-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .cookie-btn.accept:hover {
                background: #1e5bb0;
            }
            .cookie-btn.settings:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            @media (max-width: 600px) {
                .cookie-content {
                    flex-direction: column;
                    align-items: flex-start;
                }
                .cookie-buttons {
                    width: 100%;
                    justify-content: space-between;
                }
            }
        `;
        
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
        
        
        setTimeout(() => {
            banner.classList.add('show');
        }, 500);
        
        
        document.getElementById('cookie-accept').addEventListener('click', function() {
            saveConsent();
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 300);
        });
        
        
        document.getElementById('cookie-settings').addEventListener('click', function() {
            window.location.href = 'politica-cookies.html';
        });
    }
    
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showCookieBanner);
    } else {
        showCookieBanner();
    }
})();