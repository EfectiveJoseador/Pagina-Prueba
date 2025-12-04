/**
 * Optimizaciones para dispositivos móviles
 * Este archivo contiene funciones para mejorar la experiencia de usuario en dispositivos móviles
 */

document.addEventListener('DOMContentLoaded', function() {
    // Detectar si es un dispositivo móvil
    const isMobile = window.innerWidth <= 768;
    
    // Optimizaciones para la sección tienda
    optimizeProductGallery();
    
    // Optimizaciones para la modal de personalización
    optimizePersonalizationModal();
    
    // Optimizaciones para la visualización de imágenes
    optimizeImageViewing();
    
    // Ajustar altura de la ventana en dispositivos móviles (fix para 100vh en móviles)
    if (isMobile) {
        fixMobileViewportHeight();
    }
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            fixMobileViewportHeight();
        }
    });
});

/**
 * Optimiza la galería de productos para dispositivos móviles
 */
function optimizeProductGallery() {
    // Mejorar el rendimiento de carga de imágenes
    const productImages = document.querySelectorAll('.product-item img, .pedido-carrusel-img');
    
    if (productImages.length > 0) {
        // Aplicar lazy loading a todas las imágenes
        productImages.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Asegurar que las imágenes tengan alt text para accesibilidad
            if (!img.hasAttribute('alt') || img.getAttribute('alt') === '') {
                const parentTitle = img.closest('.product-item')?.querySelector('h4')?.textContent || 'Producto';
                img.setAttribute('alt', parentTitle);
            }
        });
    }
    
    // Mejorar la interacción táctil con las tarjetas de producto
    const productItems = document.querySelectorAll('.product-item');
    
    if (productItems.length > 0) {
        productItems.forEach(item => {
            // Añadir efecto de feedback táctil
            item.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            item.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }
}

/**
 * Optimiza la modal de personalización para dispositivos móviles
 */
function optimizePersonalizationModal() {
    // Mejorar el scroll dentro de la modal
    document.addEventListener('click', function(e) {
        // Detectar apertura de modal de personalización
        if (e.target.matches('#modalTiendaPersonalizar, #_addCart') || 
            e.target.closest('.product-item, .pedido-mini-card')) {
            
            // Esperar a que la modal se abra
            setTimeout(function() {
                const modal = document.querySelector('#modal-tienda-carrusel, .modal-personalizacion');
                
                if (modal) {
                    // Ocultar el toast del carrito mientras la modal de personalización esté activa
                    try {
                        document.body.classList.add('personalization-modal-open');
                        // Suprimir de forma persistente el toast hasta nueva adición al carrito
                        const toast = document.getElementById('cartTotalToast');
                        if (toast) {
                            toast.classList.add('suppressed');
                            toast.classList.remove('show');
                        }
                        const isVisible = function(el){
                            if (!el) return false;
                            const cs = window.getComputedStyle(el);
                            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
                            const r = el.getBoundingClientRect();
                            return !!(r.width || r.height);
                        };
                        const cleanup = function(){
                            document.body.classList.remove('personalization-modal-open');
                            if (observer) observer.disconnect();
                            document.removeEventListener('click', onDocumentClick, true);
                        };
                        const onDocumentClick = function(ev){
                            if (ev.target && (ev.target.matches('#modalTiendaClose, #_closeModal') || ev.target.closest('#modalTiendaClose, #_closeModal'))){
                                // Esperar al cierre efectivo
                                setTimeout(cleanup, 0);
                            }
                        };
                        document.addEventListener('click', onDocumentClick, true);
                        const observer = new MutationObserver(function(){
                            // Sincronizar estado cada vez que cambie el DOM
                            const exists = document.querySelector('#modal-tienda-carrusel, .modal-personalizacion');
                            if (exists) {
                                document.body.classList.add('personalization-modal-open');
                            } else {
                                cleanup();
                            }
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                        // Manejar cierre por tecla Escape
                        const onKey = function(k){ if (k.key === 'Escape') setTimeout(cleanup, 0); };
                        document.addEventListener('keydown', onKey, true);
                    } catch(_e) { /* noop */ }
                    // Prevenir que el scroll de la página se mueva cuando se hace scroll en la modal
                    modal.addEventListener('touchmove', function(e) {
                        e.stopPropagation();
                    }, { passive: true });
                    
                    // Mejorar la experiencia de formularios en la modal
                    const inputs = modal.querySelectorAll('input, select');
                    
                    inputs.forEach(input => {
                        // Ajustar el scroll al enfocar un input
                        input.addEventListener('focus', function() {
                            // Esperar a que el teclado aparezca
                            setTimeout(() => {
                                // Scroll al elemento
                                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        });
                    });
                    
                    // Mejorar la navegación del carrusel de imágenes
                    const carousel = modal.querySelector('#modalTiendaCarousel');
                    
                    if (carousel) {
                        enableTouchSwipe(carousel);
                    }
                }
            }, 300);
        }
    });
}

/**
 * Habilita el deslizamiento táctil para carruseles de imágenes
 * @param {HTMLElement} carousel - El elemento del carrusel
 */
function enableTouchSwipe(carousel) {
    let startX, endX;
    const track = carousel.querySelector('.carousel-track');
    
    if (!track) return;
    
    // Obtener el número de slides
    const slides = track.querySelectorAll('div[style*="flex:0 0 100%"]');
    let currentIndex = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    carousel.addEventListener('touchmove', function(e) {
        endX = e.touches[0].clientX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', function() {
        if (!startX || !endX) return;
        
        const diff = startX - endX;
        const threshold = 50; // Umbral mínimo para considerar un swipe
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe izquierda - siguiente slide
                currentIndex = Math.min(currentIndex + 1, slides.length - 1);
            } else {
                // Swipe derecha - slide anterior
                currentIndex = Math.max(currentIndex - 1, 0);
            }
            
            // Actualizar la posición del carrusel
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // Actualizar miniaturas activas
            const thumbs = carousel.closest('#modal-tienda-carrusel')?.querySelector('#modalTiendaThumbs');
            
            if (thumbs) {
                const thumbImages = thumbs.querySelectorAll('img');
                
                thumbImages.forEach((img, i) => {
                    if (i === currentIndex) {
                        img.classList.add('active-thumb');
                    } else {
                        img.classList.remove('active-thumb');
                    }
                });
            }
        }
        
        // Resetear valores
        startX = null;
        endX = null;
    }, { passive: true });
}

/**
 * Optimiza la visualización de imágenes en dispositivos móviles
 */
function optimizeImageViewing() {
    // Mejorar la visualización de imágenes en el carrusel
    const carouselImages = document.querySelectorAll('#modalTiendaCarousel img');
    
    if (carouselImages.length > 0) {
        carouselImages.forEach(img => {
            // Permitir zoom con doble toque
            img.addEventListener('dblclick', function(e) {
                e.preventDefault();
                
                if (this.style.transform === 'scale(2)') {
                    this.style.transform = '';
                    this.style.cursor = 'zoom-in';
                } else {
                    this.style.transform = 'scale(2)';
                    this.style.cursor = 'zoom-out';
                }
            });
        });
    }
}

/**
 * Soluciona el problema de altura de viewport en dispositivos móviles
 * (100vh es inconsistente en móviles debido a la barra de direcciones del navegador)
 */
function fixMobileViewportHeight() {
    // Obtener la altura real de la ventana
    const vh = window.innerHeight * 0.01;
    
    // Establecer la variable CSS personalizada
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Aplicar la altura correcta a elementos que usan 100vh
    const fullHeightElements = document.querySelectorAll('#modal-tienda-carrusel .tienda-panel, .modal-personalizacion > div');
    
    if (fullHeightElements.length > 0) {
        fullHeightElements.forEach(el => {
            el.style.height = 'calc(var(--vh, 1vh) * 100)';
        });
    }
}