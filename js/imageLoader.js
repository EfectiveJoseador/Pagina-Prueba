/**
 * Image Loader Module - Phased Lazy Loading System
 * 
 * Phase 1: Load primary images (1_mini.webp) row-by-row, top to bottom
 * Phase 2: Preload hover images (2_mini.webp) in background after primaries
 * 
 * @module imageLoader
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    MAX_CONCURRENT_LOADS: 4,      // Max simultaneous network requests
    LOAD_DELAY_MS: 50,            // Delay between loads to prevent congestion
    PRIMARY_ROOT_MARGIN: '300px', // Start loading primaries early
    SECONDARY_ROOT_MARGIN: '50px', // Load secondaries when closer to viewport
    GRID_SELECTOR: '#product-grid',
    PRIMARY_IMAGE_SELECTOR: 'img.primary-image[data-src]',
    SECONDARY_IMAGE_SELECTOR: 'img.secondary-image[data-src]',
    PRODUCT_CARD_SELECTOR: '.product-card'
};

// ============================================
// STATE
// ============================================
const state = {
    primaryQueue: [],           // Queue of primary images waiting to load
    secondaryQueue: [],         // Queue of secondary images waiting to load
    activeLoads: 0,             // Current active network requests
    isProcessing: false,        // Whether queue processor is running
    loadedPrimaries: new Set(), // Track loaded primary images
    cachedHovers: new Set(),    // Track preloaded hover image URLs
    primaryObserver: null,
    secondaryObserver: null,
    isMobile: false
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the image loading system
 * Call this once after DOM is ready
 */
export function init() {
    // Detect mobile (no hover capability)
    state.isMobile = !window.matchMedia('(hover: hover)').matches;

    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
        fallbackLoadAll();
        return;
    }

    resetState();
    createObservers();

    console.log('[ImageLoader] Initialized', state.isMobile ? '(mobile)' : '(desktop)');
}

/**
 * Observe newly rendered product images
 * Call this after rendering/updating the product grid
 */
export function observeNewImages() {
    if (!state.primaryObserver) {
        fallbackLoadAll();
        return;
    }

    const columnsPerRow = getColumnsPerRow();

    // Observe primary images with row-based priority
    document.querySelectorAll(CONFIG.PRIMARY_IMAGE_SELECTOR).forEach((img, index) => {
        const row = Math.floor(index / columnsPerRow);
        img.dataset.loadPriority = row;
        img.dataset.loadIndex = index;
        state.primaryObserver.observe(img);
    });

    // Observe secondary images
    document.querySelectorAll(CONFIG.SECONDARY_IMAGE_SELECTOR).forEach((img, index) => {
        img.dataset.loadIndex = index;
        state.secondaryObserver.observe(img);
    });

    // Add hover listeners (desktop only)
    if (!state.isMobile) {
        document.querySelectorAll(CONFIG.PRODUCT_CARD_SELECTOR).forEach(card => {
            card.addEventListener('mouseenter', handleHover, { once: true });
        });
    }
}

/**
 * Clean up observers and state
 * Call when navigating away or before re-initializing
 */
export function destroy() {
    if (state.primaryObserver) {
        state.primaryObserver.disconnect();
        state.primaryObserver = null;
    }
    if (state.secondaryObserver) {
        state.secondaryObserver.disconnect();
        state.secondaryObserver = null;
    }
    resetState();
}

// ============================================
// INTERNAL FUNCTIONS
// ============================================

function resetState() {
    state.primaryQueue = [];
    state.secondaryQueue = [];
    state.activeLoads = 0;
    state.isProcessing = false;
    state.loadedPrimaries = new Set();
    state.cachedHovers = new Set();
}

function createObservers() {
    // PRIMARY observer - larger root margin for earlier loading
    state.primaryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                enqueuePrimary(entry.target);
                state.primaryObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: CONFIG.PRIMARY_ROOT_MARGIN,
        threshold: 0.01
    });

    // SECONDARY observer - smaller margin, loads after primary
    state.secondaryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                enqueueSecondary(entry.target);
                state.secondaryObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: CONFIG.SECONDARY_ROOT_MARGIN,
        threshold: 0.1
    });
}

function getColumnsPerRow() {
    const grid = document.querySelector(CONFIG.GRID_SELECTOR);
    if (!grid) return 4;

    const gridStyle = window.getComputedStyle(grid);
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    return columns || 4;
}

// ============================================
// QUEUE MANAGEMENT
// ============================================

function enqueuePrimary(img) {
    const priority = parseInt(img.dataset.loadPriority) || 0;
    const index = parseInt(img.dataset.loadIndex) || 0;

    state.primaryQueue.push({
        img,
        priority,  // Row number (lower = higher priority)
        index,     // Column position within row
        type: 'primary'
    });

    // Sort: by row first, then by column within row
    state.primaryQueue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.index - b.index;
    });

    processQueue();
}

function enqueueSecondary(img) {
    // Only queue secondary if its primary is already loaded
    const card = img.closest(CONFIG.PRODUCT_CARD_SELECTOR);
    const primaryImg = card?.querySelector('.primary-image');

    if (!primaryImg || !state.loadedPrimaries.has(primaryImg)) {
        // Primary not loaded yet - will be queued when primary completes
        return;
    }

    const index = parseInt(img.dataset.loadIndex) || 0;

    state.secondaryQueue.push({
        img,
        priority: 1000 + index, // Lower priority than primaries, but ordered by position
        index,
        type: 'secondary'
    });

    // Sort secondaries by their original index (top to bottom)
    state.secondaryQueue.sort((a, b) => a.index - b.index);

    processQueue();
}

function processQueue() {
    if (state.isProcessing) return;
    state.isProcessing = true;

    const processNext = () => {
        // Check concurrent load limit
        if (state.activeLoads >= CONFIG.MAX_CONCURRENT_LOADS) {
            state.isProcessing = false;
            return;
        }

        // Prioritize primaries over secondaries
        let item = state.primaryQueue.shift();

        // If no primaries, try secondaries
        if (!item && state.secondaryQueue.length > 0) {
            item = state.secondaryQueue.shift();
        }

        if (!item) {
            state.isProcessing = false;
            return;
        }

        state.activeLoads++;

        loadImage(item.img, item.type, () => {
            state.activeLoads--;
            // Stagger next load to prevent network congestion
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS);
        });

        // Continue processing if we have capacity
        if (state.activeLoads < CONFIG.MAX_CONCURRENT_LOADS) {
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS * 2);
        }
    };

    processNext();
}

// ============================================
// IMAGE LOADING
// ============================================

function loadImage(img, type, callback) {
    const src = img.dataset.src;
    if (!src) {
        callback();
        return;
    }

    const tempImg = new Image();

    tempImg.onload = () => {
        // Apply loaded image
        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');

        if (type === 'primary') {
            state.loadedPrimaries.add(img);

            // Trigger secondary loading for this card
            const card = img.closest(CONFIG.PRODUCT_CARD_SELECTOR);
            const secondaryImg = card?.querySelector(CONFIG.SECONDARY_IMAGE_SELECTOR);
            if (secondaryImg && state.secondaryObserver) {
                state.secondaryObserver.observe(secondaryImg);
            }
        } else if (type === 'secondary') {
            // Track as cached for hover functionality
            state.cachedHovers.add(src);
        }

        callback();
    };

    tempImg.onerror = () => {
        img.classList.add('load-error');
        callback();
    };

    tempImg.src = src;
}

// ============================================
// HOVER HANDLING
// ============================================

function handleHover(e) {
    const card = e.currentTarget;
    const secondaryImg = card.querySelector('.secondary-image');

    if (!secondaryImg) return;

    const hoverSrc = secondaryImg.dataset.src;

    // If already loaded (has src, no data-src), nothing to do
    if (!hoverSrc) return;

    // If already cached in memory, apply immediately
    if (state.cachedHovers.has(hoverSrc)) {
        secondaryImg.src = hoverSrc;
        secondaryImg.classList.add('loaded');
        secondaryImg.removeAttribute('data-src');
        return;
    }

    // Not cached - force immediate priority load
    // Add loading state
    secondaryImg.classList.add('loading');

    const tempImg = new Image();

    tempImg.onload = () => {
        secondaryImg.src = hoverSrc;
        secondaryImg.classList.remove('loading');
        secondaryImg.classList.add('loaded');
        secondaryImg.removeAttribute('data-src');
        state.cachedHovers.add(hoverSrc);
    };

    tempImg.onerror = () => {
        secondaryImg.classList.remove('loading');
        secondaryImg.classList.add('load-error');
    };

    tempImg.src = hoverSrc;
}

// ============================================
// FALLBACK
// ============================================

function fallbackLoadAll() {
    console.log('[ImageLoader] Fallback mode - loading all images');
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });
}

// ============================================
// EXPORTS
// ============================================

export default {
    init,
    observeNewImages,
    destroy
};
