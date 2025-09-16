(function() {
    
    function enhanceImagesAccessibility() {
        
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            
            let altText = '';
            
            
            const parent = img.closest('div, a, button');
            if (parent && parent.textContent.trim()) {
                altText = parent.textContent.trim().split('\n')[0].trim();
                
                if (altText.length > 100) {
                    altText = altText.substring(0, 97) + '...';
                }
            } else if (img.src) {
                
                const filename = img.src.split('/').pop().split('?')[0];
                const name = filename.split('.')[0].replace(/[-_]/g, ' ');
                altText = 'Imagen: ' + name;
            } else {
                altText = 'Imagen decorativa';
            }
            
            img.setAttribute('alt', altText);
        });
        
        
        const bgImages = document.querySelectorAll('.carrusel-img-bg:not([aria-label])');
        bgImages.forEach(el => {
            if (!el.hasAttribute('aria-label')) {
                
                if (el.dataset.img) {
                    const imgName = el.dataset.img.split('/').pop().split('.')[0];
                    el.setAttribute('aria-label', 'Imagen: ' + imgName.replace(/[-_]/g, ' '));
                } else {
                    el.setAttribute('aria-label', 'Imagen de carrusel');
                }
            }
        });
    }
    
    
    function enhanceContrast() {
        
        const style = document.createElement('style');
        style.textContent = `
            
            a:not(.btn-primary):not(.btn-secondary):not(.boton-seccion):not(.catalogo-btn) {
                color: var(--azul-acento) !important;
                text-decoration: underline !important;
            }
            
            
            .catalogo-header h2,
            .seccion h2,
            .seccion h3 {
                text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
            }
            
            
            .btn-primary,
            .btn-secondary,
            .boton-seccion {
                text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
            }
            
            
            a:focus,
            button:focus,
            input:focus,
            select:focus,
            textarea:focus,
            [tabindex]:focus {
                outline: 3px solid var(--azul-acento) !important;
                outline-offset: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    
    function enhanceAriaAttributes() {
        
        const buttons = document.querySelectorAll('button:not([aria-label]):not(:has(*)):empty');
        buttons.forEach(btn => {
            
            if (btn.classList.contains('close') || btn.classList.contains('cerrar')) {
                btn.setAttribute('aria-label', 'Cerrar');
            } else if (btn.classList.contains('remove') || btn.classList.contains('eliminar')) {
                btn.setAttribute('aria-label', 'Eliminar');
            } else {
                btn.setAttribute('aria-label', 'Botón');
            }
        });
        
        
        const dropdownToggles = document.querySelectorAll('[data-toggle="dropdown"]');
        dropdownToggles.forEach(toggle => {
            if (!toggle.hasAttribute('aria-expanded')) {
                toggle.setAttribute('aria-expanded', 'false');
                toggle.addEventListener('click', function() {
                    const expanded = toggle.getAttribute('aria-expanded') === 'true';
                    toggle.setAttribute('aria-expanded', !expanded);
                });
            }
        });
    }
    
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            enhanceImagesAccessibility();
            enhanceContrast();
            enhanceAriaAttributes();
        });
    } else {
        enhanceImagesAccessibility();
        enhanceContrast();
        enhanceAriaAttributes();
    }
})();