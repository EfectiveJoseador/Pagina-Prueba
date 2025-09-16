(function() {
    function setupLazyLoading() {
        
        if ('IntersectionObserver' in window) {
            const lazyImages = document.querySelectorAll('img[loading="lazy"]');
            
            const imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        
                        
                        if (lazyImage.dataset.src) {
                            lazyImage.src = lazyImage.dataset.src;
                            delete lazyImage.dataset.src;
                        }
                        
                        
                        if (lazyImage.dataset.srcset) {
                            lazyImage.srcset = lazyImage.dataset.srcset;
                            delete lazyImage.dataset.srcset;
                        }
                        
                        imageObserver.unobserve(lazyImage);
                    }
                });
            });
            
            lazyImages.forEach(function(lazyImage) {
                imageObserver.observe(lazyImage);
            });
        }
    }
    
    function preloadCriticalImages() {
        
        const criticalImages = [
            'assets/logos/logo.jpg',
            document.querySelector('.carrusel-img-bg')?.dataset.img
        ].filter(Boolean);
        
        criticalImages.forEach(function(imageSrc) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = imageSrc;
            document.head.appendChild(link);
        });
    }
    
    function optimizeFonts() {
        
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-display: swap !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupLazyLoading();
            preloadCriticalImages();
            optimizeFonts();
        });
    } else {
        setupLazyLoading();
        preloadCriticalImages();
        optimizeFonts();
    }
})();