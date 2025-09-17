(function() {
    'use strict';

    const config = {
        webpQuality: 85,
        fallbackFormats: ['jpg', 'jpeg', 'png'],
        enableProgressiveLoading: true,
        enablePerformanceMonitoring: true,
        cacheExpiry: 7 * 24 * 60 * 60 * 1000,
        compressionRatio: 0.8
    };

    
    let webpSupported = null;
    let avifSupported = null;

    
    const performanceMetrics = {
        originalSize: 0,
        optimizedSize: 0,
        loadTime: 0,
        imagesProcessed: 0
    };

    
    const imageCache = new Map();

    
    function detectWebPSupport() {
        return new Promise((resolve) => {
            if (webpSupported !== null) {
                resolve(webpSupported);
                return;
            }

            const webP = new Image();
            webP.onload = webP.onerror = function () {
                webpSupported = (webP.height === 2);
                resolve(webpSupported);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    
    function detectAVIFSupport() {
        return new Promise((resolve) => {
            if (avifSupported !== null) {
                resolve(avifSupported);
                return;
            }

            const avif = new Image();
            avif.onload = avif.onerror = function () {
                avifSupported = (avif.height === 2);
                resolve(avifSupported);
            };
            avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        });
    }

    
    async function getOptimalFormat() {
        const avif = await detectAVIFSupport();
        const webp = await detectWebPSupport();
        
        if (avif) return 'avif';
        if (webp) return 'webp';
        return 'original';
    }

    
    function getOptimizedImageUrl(originalUrl, format) {
        if (format === 'original') return originalUrl;
        
        
        const urlParts = originalUrl.split('.');
        const extension = urlParts.pop().toLowerCase();
        
        
        if (!config.fallbackFormats.includes(extension)) {
            return originalUrl;
        }
        
        
        const basePath = urlParts.join('.');
        return `${basePath}.${format}`;
    }

    
    // Añadido: comprobar si una URL de imagen carga correctamente
    function testImage(url) {
        return new Promise(resolve => {
            try {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            } catch (e) {
                resolve(false);
            }
        });
    }

    
    function createPictureElement(img, originalSrc) {
        const picture = document.createElement('picture');
        
        
        const attributes = ['class', 'id', 'alt', 'title', 'data-src', 'data-lazy-src'];
        attributes.forEach(attr => {
            if (img.hasAttribute(attr)) {
                picture.setAttribute(attr, img.getAttribute(attr));
            }
        });
        
        
        const avifSource = document.createElement('source');
        avifSource.srcset = getOptimizedImageUrl(originalSrc, 'avif');
        avifSource.type = 'image/avif';
        picture.appendChild(avifSource);
        
        
        const webpSource = document.createElement('source');
        webpSource.srcset = getOptimizedImageUrl(originalSrc, 'webp');
        webpSource.type = 'image/webp';
        picture.appendChild(webpSource);
        
        
        const fallbackImg = img.cloneNode(true);
        fallbackImg.src = originalSrc;
        picture.appendChild(fallbackImg);
        
        return picture;
    }

    
    async function optimizeImage(img) {
        const startTime = performance.now();
        const originalSrc = img.src || img.dataset.src || img.dataset.lazySrc;
        
        if (!originalSrc || imageCache.has(originalSrc)) {
            return;
        }
        
        try {
            const optimalFormat = await getOptimalFormat();
            
            if (optimalFormat === 'original') {
                imageCache.set(originalSrc, originalSrc);
                return;
            }
            
            
            if (img.dataset.src || img.dataset.lazySrc) {
                const optimizedUrl = getOptimizedImageUrl(originalSrc, optimalFormat);
                
                
                const testImg = new Image();
                testImg.onload = function() {
                    if (img.dataset.src) {
                        img.dataset.src = optimizedUrl;
                    }
                    if (img.dataset.lazySrc) {
                        img.dataset.lazySrc = optimizedUrl;
                    }
                    
                    
                    if (config.enablePerformanceMonitoring) {
                        performanceMetrics.imagesProcessed++;
                        performanceMetrics.loadTime += performance.now() - startTime;
                    }
                    
                    imageCache.set(originalSrc, optimizedUrl);
                };
                
                testImg.onerror = function() {
                    
                    imageCache.set(originalSrc, originalSrc);
                };
                
                testImg.src = getOptimizedImageUrl(originalSrc, optimalFormat);
            } else {
                
                // Nuevo: comprobar qué formatos optimizados existen antes de crear <picture>
                const avifUrl = getOptimizedImageUrl(originalSrc, 'avif');
                const webpUrl = getOptimizedImageUrl(originalSrc, 'webp');
                const [avifOk, webpOk] = await Promise.all([
                    testImage(avifUrl),
                    testImage(webpUrl)
                ]);

                // NUEVO: Evitar envolver con <picture> en tarjetas que dependen de .product-item > img
                const isCardImage = !!(img.closest && img.closest('.product-item, .pedido-mini-card'));
                if (isCardImage) {
                    let newSrc = originalSrc;
                    if (avifSupported && avifOk) newSrc = avifUrl; else if (webpSupported && webpOk) newSrc = webpUrl;
                    img.src = newSrc;
                    imageCache.set(originalSrc, newSrc);
                    if (config.enablePerformanceMonitoring) {
                        performanceMetrics.imagesProcessed++;
                        performanceMetrics.loadTime += performance.now() - startTime;
                    }
                    return;
                }

                if (!avifOk && !webpOk) {
                    // Ninguna versión optimizada existe: mantener la imagen original
                    imageCache.set(originalSrc, originalSrc);
                    if (config.enablePerformanceMonitoring) {
                        performanceMetrics.imagesProcessed++;
                        performanceMetrics.loadTime += performance.now() - startTime;
                    }
                    return;
                }

                // Crear <picture> pero solo añadir los <source> que realmente existen
                const picture = document.createElement('picture');

                // Copiar atributos (clases, id, etc.) al <picture>
                ['class', 'id', 'title'].forEach(attr => {
                    if (img.hasAttribute(attr)) {
                        picture.setAttribute(attr, img.getAttribute(attr));
                    }
                });

                if (avifOk) {
                    const avifSource = document.createElement('source');
                    avifSource.srcset = avifUrl;
                    avifSource.type = 'image/avif';
                    picture.appendChild(avifSource);
                }
                if (webpOk) {
                    const webpSource = document.createElement('source');
                    webpSource.srcset = webpUrl;
                    webpSource.type = 'image/webp';
                    picture.appendChild(webpSource);
                }

                // Imagen fallback (la misma IMG con su src original y clases intactas)
                const fallbackImg = img.cloneNode(true);
                fallbackImg.src = originalSrc;
                picture.appendChild(fallbackImg);

                // Reemplazar en el DOM
                img.parentNode.replaceChild(picture, img);
                
                imageCache.set(originalSrc, 'picture-element');
            }
            
        } catch (error) {
            console.warn('Image optimization failed:', error);
            imageCache.set(originalSrc, originalSrc);
        }
    }

    async function optimizeAllImages() {
        const images = document.querySelectorAll('img');
        const promises = Array.from(images).map(img => optimizeImage(img));
        try {
            await Promise.all(promises);
            if (config.enablePerformanceMonitoring) {
                logPerformanceMetrics();
            }
        } catch (error) {
            console.warn('Batch image optimization failed:', error);
        }
    }

    function observeNewImages() {
        try {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node && node.tagName === 'IMG') {
                                optimizeImage(node);
                            } else if (node && node.querySelectorAll) {
                                node.querySelectorAll('img').forEach(img => optimizeImage(img));
                            }
                        });
                    } else if (mutation.type === 'attributes' && mutation.target && mutation.target.tagName === 'IMG') {
                        if (mutation.attributeName === 'src' || mutation.attributeName === 'data-src' || mutation.attributeName === 'data-lazy-src') {
                            optimizeImage(mutation.target);
                        }
                    }
                });
            });
            observer.observe(document.documentElement || document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'data-src', 'data-lazy-src']
            });
            return observer;
        } catch (e) {
            console.warn('Image observer failed to start:', e);
            return null;
        }
    }

    
    function logPerformanceMetrics() {
        if (!config.enablePerformanceMonitoring) return;
        
        console.group('🖼️ Image Optimization Metrics');
        console.log(`Images processed: ${performanceMetrics.imagesProcessed}`);
        console.log(`Average load time: ${(performanceMetrics.loadTime / performanceMetrics.imagesProcessed).toFixed(2)}ms`);
        console.log(`WebP supported: ${webpSupported}`);
        console.log(`AVIF supported: ${avifSupported}`);
        console.groupEnd();
    }

    
    function addProgressiveStyles() {
        if (!config.enableProgressiveLoading) return;
        
        const style = document.createElement('style');
        style.id = 'webp-optimization-styles';
        style.textContent = `
            picture {
                display: inline-block;
                line-height: 0;
            }
            
            picture img {
                transition: opacity 0.3s ease-in-out;
            }
            
            .webp-loading {
                opacity: 0.7;
                filter: blur(2px);
            }
            
            .webp-loaded {
                opacity: 1;
                filter: none;
            }
            
            
            picture img {
                max-width: 100%;
                height: auto;
            }
        `;
        document.head.appendChild(style);
    }

    
    function registerImageCaching() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'CACHE_IMAGES',
                        config: {
                            cacheExpiry: config.cacheExpiry,
                            formats: ['webp', 'avif']
                        }
                    });
                }
            });
        }
    }

    
    window.WebPOptimizer = {
        optimize: optimizeImage,
        optimizeAll: optimizeAllImages,
        detectSupport: {
            webp: detectWebPSupport,
            avif: detectAVIFSupport
        },
        getMetrics: () => ({ ...performanceMetrics }),
        config: config
    };

    async function initialize() {
        await Promise.all([
            detectWebPSupport(),
            detectAVIFSupport()
        ]);
        
        addProgressiveStyles();
        registerImageCaching();
        
        
        await optimizeAllImages();
        
        
        observeNewImages();
        
        
        window.addEventListener('load', () => {
            setTimeout(optimizeAllImages, 1000);
        });
    }

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();