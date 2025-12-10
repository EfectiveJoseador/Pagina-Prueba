

document.addEventListener('DOMContentLoaded', function() {
    const isMobile = window.innerWidth <= 768;
    optimizeProductGallery();
    optimizePersonalizationModal();
    optimizeImageViewing();
    if (isMobile) {
        fixMobileViewportHeight();
    }
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            fixMobileViewportHeight();
        }
    });
});


function optimizeProductGallery() {
    const productImages = document.querySelectorAll('.product-item img, .pedido-carrusel-img');
    
    if (productImages.length > 0) {
        productImages.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            if (!img.hasAttribute('alt') || img.getAttribute('alt') === '') {
                const parentTitle = img.closest('.product-item')?.querySelector('h4')?.textContent || 'Producto';
                img.setAttribute('alt', parentTitle);
            }
        });
    }
    const productItems = document.querySelectorAll('.product-item');
    
    if (productItems.length > 0) {
        productItems.forEach(item => {
            item.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            item.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    }
}


function optimizePersonalizationModal() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('#modalTiendaPersonalizar, #_addCart') || 
            e.target.closest('.product-item, .pedido-mini-card')) {
            setTimeout(function() {
                const modal = document.querySelector('#modal-tienda-carrusel, .modal-personalizacion');
                
                if (modal) {
                    try {
                        document.body.classList.add('personalization-modal-open');
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
                                setTimeout(cleanup, 0);
                            }
                        };
                        document.addEventListener('click', onDocumentClick, true);
                        const observer = new MutationObserver(function(){
                            const exists = document.querySelector('#modal-tienda-carrusel, .modal-personalizacion');
                            if (exists) {
                                document.body.classList.add('personalization-modal-open');
                            } else {
                                cleanup();
                            }
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                        const onKey = function(k){ if (k.key === 'Escape') setTimeout(cleanup, 0); };
                        document.addEventListener('keydown', onKey, true);
                    } catch(_e) { /* noop */ }
                    modal.addEventListener('touchmove', function(e) {
                        e.stopPropagation();
                    }, { passive: true });
                    const inputs = modal.querySelectorAll('input, select');
                    
                    inputs.forEach(input => {
                        input.addEventListener('focus', function() {
                            setTimeout(() => {
                                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                        });
                    });
                    const carousel = modal.querySelector('#modalTiendaCarousel');
                    
                    if (carousel) {
                        enableTouchSwipe(carousel);
                    }
                }
            }, 300);
        }
    });
}


function enableTouchSwipe(carousel) {
    let startX, endX;
    const track = carousel.querySelector('.carousel-track');
    
    if (!track) return;
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
        const threshold = 50;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                currentIndex = Math.min(currentIndex + 1, slides.length - 1);
            } else {
                currentIndex = Math.max(currentIndex - 1, 0);
            }
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
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
        startX = null;
        endX = null;
    }, { passive: true });
}


function optimizeImageViewing() {
    const carouselImages = document.querySelectorAll('#modalTiendaCarousel img');
    
    if (carouselImages.length > 0) {
        carouselImages.forEach(img => {
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


function fixMobileViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    const fullHeightElements = document.querySelectorAll('#modal-tienda-carrusel .tienda-panel, .modal-personalizacion > div');
    
    if (fullHeightElements.length > 0) {
        fullHeightElements.forEach(el => {
            el.style.height = 'calc(var(--vh, 1vh) * 100)';
        });
    }
}