(function() {
    'use strict';

    const config = {
        rootMargin: '50px 0px',
        threshold: 0.01,
        loadingClass: 'lazy-loading',
        loadedClass: 'lazy-loaded',
        errorClass: 'lazy-error',
        placeholderColor: '#1a3b6d',
        fadeInDuration: 300
    };

    const loadedImages = new WeakSet();
    let observer;
    let isIntersectionObserverSupported = false;

    
    function checkIntersectionObserverSupport() {
        isIntersectionObserverSupported = 'IntersectionObserver' in window &&
            'IntersectionObserverEntry' in window &&
            'intersectionRatio' in window.IntersectionObserverEntry.prototype;
        return isIntersectionObserverSupported;
    }

    
    function createPlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: ${img.offsetWidth || 200}px;
            height: ${img.offsetHeight || 150}px;
            background: linear-gradient(45deg, ${config.placeholderColor} 25%, transparent 25%, transparent 75%, ${config.placeholderColor} 75%), 
                        linear-gradient(45deg, ${config.placeholderColor} 25%, transparent 25%, transparent 75%, ${config.placeholderColor} 75%);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            border-radius: 8px;
            opacity: 0.7;
            animation: pulse 2s infinite;
        `;
        placeholder.innerHTML = '<span>Cargando...</span>';
        return placeholder;
    }

    
    function addStyles() {
        if (document.getElementById('lazy-loading-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'lazy-loading-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 0.4; }
            }
            
            .lazy-loading {
                opacity: 0;
                transition: opacity ${config.fadeInDuration}ms ease-in-out;
            }
            
            .lazy-loaded {
                opacity: 1;
            }
            
            .lazy-error {
                opacity: 0.5;
                filter: grayscale(100%);
            }
            
            img[data-src] {
                background: linear-gradient(45deg, ${config.placeholderColor} 25%, transparent 25%, transparent 75%, ${config.placeholderColor} 75%), 
                            linear-gradient(45deg, ${config.placeholderColor} 25%, transparent 25%, transparent 75%, ${config.placeholderColor} 75%);
                background-size: 20px 20px;
                background-position: 0 0, 10px 10px;
            }
        `;
        document.head.appendChild(style);
    }

    
    function loadImage(img) {
        return new Promise((resolve, reject) => {
            if (loadedImages.has(img)) {
                resolve(img);
                return;
            }

            const imageLoader = new Image();
            const src = img.dataset.src || img.dataset.lazySrc;
            
            if (!src) {
                reject(new Error('No data-src attribute found'));
                return;
            }

            
            img.classList.add(config.loadingClass);

            imageLoader.onload = function() {
                
                requestAnimationFrame(() => {
                    img.src = src;
                    img.classList.remove(config.loadingClass);
                    img.classList.add(config.loadedClass);
                    
                    
                    img.removeAttribute('data-src');
                    img.removeAttribute('data-lazy-src');
                    
                    
                    loadedImages.add(img);
                    
                    resolve(img);
                });
            };

            imageLoader.onerror = function() {
                img.classList.remove(config.loadingClass);
                img.classList.add(config.errorClass);
                
                
                const fallback = img.dataset.fallback || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEzYjZkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                img.src = fallback;
                
                reject(new Error('Failed to load image: ' + src));
            };

            
            imageLoader.src = src;
        });
    }

    
    function handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                loadImage(img)
                    .then(() => {
                        observer.unobserve(img);
                    })
                    .catch(error => {
                        console.warn('Lazy loading error:', error);
                        observer.unobserve(img);
                    });
            }
        });
    }

    
    function fallbackLazyLoad() {
        const images = document.querySelectorAll('img[data-src], img[data-lazy-src]');
        
        function checkImages() {
            images.forEach(img => {
                if (loadedImages.has(img)) return;
                
                const rect = img.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight + 50 && 
                                rect.bottom > -50 && 
                                rect.left < window.innerWidth + 50 && 
                                rect.right > -50;
                
                if (isVisible) {
                    loadImage(img).catch(error => {
                        console.warn('Fallback lazy loading error:', error);
                    });
                }
            });
        }

        
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkImages();
                    ticking = false;
                });
                ticking = true;
            }
        }

        
        checkImages();
        
        
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        
        return {
            disconnect: () => {
                window.removeEventListener('scroll', onScroll);
                window.removeEventListener('resize', onScroll);
            }
        };
    }

    
    function initLazyLoading() {
        addStyles();
        
        if (checkIntersectionObserverSupport()) {
            observer = new IntersectionObserver(handleIntersection, {
                rootMargin: config.rootMargin,
                threshold: config.threshold
            });
            
            
            const images = document.querySelectorAll('img[data-src], img[data-lazy-src]');
            images.forEach(img => {
                observer.observe(img);
            });
            
            return observer;
        } else {
            
            return fallbackLazyLoad();
        }
    }

    
    function convertExistingImages() {
        
        const images = document.querySelectorAll('img[data-src], img[data-lazy-src]');
        
        images.forEach(img => {
            if (observer && isIntersectionObserverSupported) {
                observer.observe(img);
            }
        });
    }

    
    function observeNewImages() {
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        
                        if (node.tagName === 'IMG' && (node.dataset.src || node.dataset.lazySrc)) {
                            if (observer && isIntersectionObserverSupported) {
                                observer.observe(node);
                            }
                        }
                        
                        
                        const images = node.querySelectorAll ? node.querySelectorAll('img[data-src], img[data-lazy-src]') : [];
                        images.forEach(img => {
                            if (observer && isIntersectionObserverSupported) {
                                observer.observe(img);
                            }
                        });
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return mutationObserver;
    }

    
    window.LazyLoader = {
        init: initLazyLoading,
        loadImage: loadImage,
        convertExisting: convertExistingImages,
        observer: () => observer,
        config: config
    };

    
    function initialize() {
        initLazyLoading();
        convertExistingImages();
        observeNewImages();
        
        
        window.addEventListener('load', () => {
            setTimeout(convertExistingImages, 1000);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();