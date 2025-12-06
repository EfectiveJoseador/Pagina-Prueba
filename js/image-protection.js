/**
 * Image Protection System
 * Prevents downloading, dragging, right-clicking on product images
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const PROTECTED_SELECTORS = [
        '.product-image img',
        '.product-card img',
        '.main-image img',
        '.thumbnails img',
        '.gallery-image img',
        '.lightbox-image-wrapper img',
        '#main-img',
        '#lightbox-image',
        '.client-card img',
        '.carousel-slide img'
    ];

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyProtection);
        } else {
            applyProtection();
        }

        // Re-apply on dynamic content (MutationObserver)
        observeDynamicContent();
    }

    // ============================================
    // MAIN PROTECTION FUNCTION
    // ============================================
    function applyProtection() {
        // 1. Disable right-click on document for images
        document.addEventListener('contextmenu', handleContextMenu, true);

        // 2. Protect all existing images
        protectImages();

        // 3. Add global CSS protection
        injectProtectionCSS();

        console.log('🛡️ Image Protection System Active');
    }

    // ============================================
    // CONTEXT MENU HANDLER
    // ============================================
    function handleContextMenu(e) {
        const target = e.target;

        // Check if target is a protected image or within protected container
        if (isProtectedElement(target)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    // ============================================
    // CHECK IF ELEMENT IS PROTECTED
    // ============================================
    function isProtectedElement(element) {
        // Check if it's an image
        if (element.tagName === 'IMG') {
            // Check if it matches protected selectors
            for (const selector of PROTECTED_SELECTORS) {
                if (element.matches(selector) || element.closest(selector.replace(' img', ''))) {
                    return true;
                }
            }
        }

        // Check if it's an overlay
        if (element.classList.contains('product-image-overlay')) {
            return true;
        }

        // Check if it's within a protected container
        const protectedContainer = element.closest('.product-image, .product-card, .main-image, .client-card');
        return !!protectedContainer;
    }

    // ============================================
    // PROTECT INDIVIDUAL IMAGES
    // ============================================
    function protectImages() {
        const allSelectors = PROTECTED_SELECTORS.join(', ');
        const images = document.querySelectorAll(allSelectors);

        images.forEach(img => {
            if (img.dataset.protected) return; // Already protected

            // 1. Disable dragging
            img.draggable = false;
            img.setAttribute('draggable', 'false');

            // 2. Prevent dragstart
            img.addEventListener('dragstart', preventDefault, true);

            // 3. Prevent selection
            img.addEventListener('selectstart', preventDefault, true);

            // 4. Add overlay if container exists and doesn't have one
            addOverlay(img);

            // Mark as protected
            img.dataset.protected = 'true';
        });
    }

    // ============================================
    // ADD TRANSPARENT OVERLAY
    // ============================================
    function addOverlay(img) {
        const container = img.closest('.product-image, .product-card, .main-image, .client-card');

        if (!container) return;
        if (container.querySelector('.product-image-overlay')) return; // Already has overlay

        // Ensure container has relative positioning
        const computedStyle = window.getComputedStyle(container);
        if (computedStyle.position === 'static') {
            container.style.position = 'relative';
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'product-image-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        // Insert overlay after the image
        if (img.nextSibling) {
            container.insertBefore(overlay, img.nextSibling);
        } else {
            container.appendChild(overlay);
        }
    }

    // ============================================
    // INJECT PROTECTION CSS
    // ============================================
    function injectProtectionCSS() {
        if (document.getElementById('image-protection-css')) return;

        const css = `
            /* Image Protection Styles */
            .product-image,
            .product-image img,
            .product-card img,
            .main-image img,
            .thumbnails img,
            .gallery-image img,
            .client-card img,
            .carousel-slide img,
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
            .client-card {
                position: relative;
            }
        `;

        const style = document.createElement('style');
        style.id = 'image-protection-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ============================================
    // OBSERVE DYNAMIC CONTENT
    // ============================================
    function observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            let shouldReprotect = false;

            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'IMG' || node.querySelector('img')) {
                                shouldReprotect = true;
                            }
                        }
                    });
                }
            });

            if (shouldReprotect) {
                // Debounce protection
                clearTimeout(window._protectTimeout);
                window._protectTimeout = setTimeout(protectImages, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // ============================================
    // START
    // ============================================
    init();

})();
