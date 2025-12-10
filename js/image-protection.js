

(function () {
    'use strict';
    const PROTECTED_SELECTORS = [
        '.product-image img',
        '.product-card img',
        '.main-image img',
        '.primary-image',
        '.secondary-image',
        '.thumbnails img',
        '.thumb img',
        '.gallery-image img',
        '.lightbox-image-wrapper img',
        '.lightbox-thumbnails img',
        '.lightbox-thumb img',
        '.lightbox-content img',
        '#main-img',
        '#lightbox-image',
        '.image-lightbox img',
        '.modal-thumb img',
        '.modal-gallery img',
        '.zoom-modal img',
        '.client-card img',
        '.client-image img',
        '.testimonial-image img',
        '.carousel-slide img',
        '.swiper-slide img',
        '.slider-image img'
    ];
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyProtection);
        } else {
            applyProtection();
        }
        observeDynamicContent();
    }
    function applyProtection() {
        document.addEventListener('contextmenu', handleContextMenu, true);
        protectImages();
        injectProtectionCSS();

        console.log('🛡️ Image Protection System Active');
    }
    function handleContextMenu(e) {
        const target = e.target;
        if (isProtectedElement(target)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    function isProtectedElement(element) {
        if (element.tagName === 'IMG') {
            for (const selector of PROTECTED_SELECTORS) {
                if (element.matches(selector) || element.closest(selector.replace(' img', ''))) {
                    return true;
                }
            }
        }
        if (element.classList.contains('product-image-overlay')) {
            return true;
        }
        const protectedContainer = element.closest(
            '.product-image, .product-card, .main-image, .client-card, ' +
            '.thumbnails, .thumb, .lightbox-content, .lightbox-thumbnails, ' +
            '.image-lightbox, .zoom-modal, .modal-gallery, ' +
            '.client-image, .testimonial-image, .carousel-slide'
        );
        return !!protectedContainer;
    }
    function protectImages() {
        const allSelectors = PROTECTED_SELECTORS.join(', ');
        const images = document.querySelectorAll(allSelectors);

        images.forEach(img => {
            if (img.dataset.protected) return;
            img.draggable = false;
            img.setAttribute('draggable', 'false');
            img.addEventListener('dragstart', preventDefault, true);
            img.addEventListener('selectstart', preventDefault, true);
            addOverlay(img);
            img.dataset.protected = 'true';
        });
    }
    function addOverlay(img) {
        const container = img.closest(
            '.product-image, .product-card, .main-image, .client-card, ' +
            '.thumbnails, .thumb, .lightbox-content, .lightbox-thumbnails, ' +
            '.image-lightbox, .client-image, .testimonial-image'
        );

        if (!container) return;
        if (container.querySelector('.product-image-overlay')) return;
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') {
            container.style.position = 'relative';
        }
        const overlay = document.createElement('div');
        overlay.className = 'product-image-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        if (img.nextSibling) {
            container.insertBefore(overlay, img.nextSibling);
        } else {
            container.appendChild(overlay);
        }
    }
    function injectProtectionCSS() {
        if (document.getElementById('image-protection-css')) return;

        const css = `
            /* Image Protection Styles - All protected images */
            .product-image,
            .product-image img,
            .product-card img,
            .main-image img,
            .primary-image,
            .secondary-image,
            .thumbnails img,
            .thumb img,
            .gallery-image img,
            .lightbox-image-wrapper img,
            .lightbox-thumbnails img,
            .lightbox-thumb img,
            .lightbox-content img,
            .image-lightbox img,
            .modal-thumb img,
            .modal-gallery img,
            .zoom-modal img,
            .client-card img,
            .client-image img,
            .testimonial-image img,
            .carousel-slide img,
            .swiper-slide img,
            #main-img,
            #lightbox-image {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-user-drag: none !important;
                -khtml-user-drag: none !important;
                -moz-user-drag: none !important;
                -o-user-drag: none !important;
                user-drag: none !important;
                pointer-events: auto;
            }
            
            /* Transparent overlay that blocks direct image access */
            .product-image-overlay {
                position: absolute;
                inset: 0;
                z-index: 5;
                background: transparent;
                cursor: pointer;
            }
            
            /* Ensure containers are positioned */
            .product-image,
            .product-card,
            .main-image,
            .client-card,
            .thumbnails,
            .thumb,
            .lightbox-content,
            .lightbox-thumbnails,
            .image-lightbox,
            .client-image,
            .testimonial-image {
                position: relative;
            }
        `;

        const style = document.createElement('style');
        style.id = 'image-protection-css';
        style.textContent = css;
        document.head.appendChild(style);
    }
    function observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            let shouldReprotect = false;

            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.tagName === 'IMG' || node.querySelector('img')) {
                                shouldReprotect = true;
                            }
                        }
                    });
                }
            });

            if (shouldReprotect) {
                clearTimeout(window._protectTimeout);
                window._protectTimeout = setTimeout(protectImages, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    init();

})();
