/**
 * Image Loader Module - Row-based Parallel Loading
 * 
 * For each product card, loads BOTH 1_mini.webp and 2_mini.webp in parallel
 * Processing order: Row 1 complete → Row 2 complete → Row 3, etc.
 * 
 * @module imageLoader
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    MAX_CONCURRENT_CARDS: 4,      // Max cards loading simultaneously (each card = 2 images)
    LOAD_DELAY_MS: 30,            // Delay between card batches
    ROOT_MARGIN: '200px',         // Start loading before cards enter viewport
    GRID_SELECTOR: '#product-grid',
    PRODUCT_CARD_SELECTOR: '.product-card',
    PRIMARY_IMAGE_SELECTOR: '.primary-image[data-src]',
    SECONDARY_IMAGE_SELECTOR: '.secondary-image[data-src]'
};

// ============================================
// STATE
// ============================================
const state = {
    cardQueue: [],              // Queue of cards waiting to load
    activeCardLoads: 0,         // Current cards being processed
    isProcessing: false,
    observer: null,
    isMobile: false
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the image loading system
 */
export function init() {
    state.isMobile = !window.matchMedia('(hover: hover)').matches;

    if (!('IntersectionObserver' in window)) {
        fallbackLoadAll();
        return;
    }

    resetState();
    createObserver();

    console.log('[ImageLoader] Initialized - parallel card loading');
}

/**
 * Observe newly rendered product cards
 */
export function observeNewImages() {
    if (!state.observer) {
        fallbackLoadAll();
        return;
    }

    const columnsPerRow = getColumnsPerRow();

    // Observe each product card with row-based priority
    document.querySelectorAll(CONFIG.PRODUCT_CARD_SELECTOR).forEach((card, index) => {
        const row = Math.floor(index / columnsPerRow);
        const col = index % columnsPerRow;

        // Store priority data on the card
        card.dataset.loadRow = row;
        card.dataset.loadCol = col;
        card.dataset.loadIndex = index;

        state.observer.observe(card);
    });
}

/**
 * Clean up
 */
export function destroy() {
    if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }
    resetState();
}

// ============================================
// INTERNAL FUNCTIONS
// ============================================

function resetState() {
    state.cardQueue = [];
    state.activeCardLoads = 0;
    state.isProcessing = false;
}

function createObserver() {
    state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                enqueueCard(entry.target);
                state.observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: CONFIG.ROOT_MARGIN,
        threshold: 0.01
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

function enqueueCard(card) {
    const row = parseInt(card.dataset.loadRow) || 0;
    const col = parseInt(card.dataset.loadCol) || 0;
    const index = parseInt(card.dataset.loadIndex) || 0;

    state.cardQueue.push({
        card,
        row,
        col,
        index
    });

    // Sort by row first, then by column within row
    state.cardQueue.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });

    processQueue();
}

function processQueue() {
    if (state.isProcessing) return;
    state.isProcessing = true;

    const processNext = () => {
        // Check concurrent limit
        if (state.activeCardLoads >= CONFIG.MAX_CONCURRENT_CARDS) {
            state.isProcessing = false;
            return;
        }

        const item = state.cardQueue.shift();

        if (!item) {
            state.isProcessing = false;
            return;
        }

        state.activeCardLoads++;

        // Load both images for this card in parallel
        loadCardImages(item.card, () => {
            state.activeCardLoads--;
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS);
        });

        // Continue if we have capacity
        if (state.activeCardLoads < CONFIG.MAX_CONCURRENT_CARDS) {
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS);
        }
    };

    processNext();
}

// ============================================
// IMAGE LOADING (PARALLEL PER CARD)
// ============================================

function loadCardImages(card, callback) {
    const primaryImg = card.querySelector(CONFIG.PRIMARY_IMAGE_SELECTOR);
    const secondaryImg = card.querySelector(CONFIG.SECONDARY_IMAGE_SELECTOR);

    const promises = [];

    // Load primary image
    if (primaryImg && primaryImg.dataset.src) {
        promises.push(loadSingleImage(primaryImg));
    }

    // Load secondary image in parallel
    if (secondaryImg && secondaryImg.dataset.src) {
        promises.push(loadSingleImage(secondaryImg));
    }

    // Wait for both to complete (or fail)
    Promise.all(promises).then(() => {
        card.classList.add('images-loaded');
        callback();
    }).catch(() => {
        callback();
    });
}

function loadSingleImage(img) {
    return new Promise((resolve) => {
        const src = img.dataset.src;
        if (!src) {
            resolve();
            return;
        }

        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
            resolve();
        };

        tempImg.onerror = () => {
            img.classList.add('load-error');
            resolve(); // Resolve anyway to not block other images
        };

        tempImg.src = src;
    });
}

// ============================================
// FALLBACK
// ============================================

function fallbackLoadAll() {
    console.log('[ImageLoader] Fallback - loading all images');
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
