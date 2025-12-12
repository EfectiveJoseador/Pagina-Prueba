const CONFIG = {
    MAX_CONCURRENT_CARDS: 4,
    LOAD_DELAY_MS: 30,
    ROOT_MARGIN: '200px',
    GRID_SELECTOR: '#product-grid',
    PRODUCT_CARD_SELECTOR: '.product-card',
    PRIMARY_IMAGE_SELECTOR: '.primary-image[data-src]',
    SECONDARY_IMAGE_SELECTOR: '.secondary-image[data-src]'
};
const state = {
    cardQueue: [],
    activeCardLoads: 0,
    isProcessing: false,
    observer: null,
    isMobile: false
};


export function init() {
    state.isMobile = !window.matchMedia('(hover: hover)').matches;

    if (!('IntersectionObserver' in window)) {
        fallbackLoadAll();
        return;
    }

    resetState();
    createObserver();

}


export function observeNewImages() {
    if (!state.observer) {
        fallbackLoadAll();
        return;
    }

    const columnsPerRow = getColumnsPerRow();
    document.querySelectorAll(CONFIG.PRODUCT_CARD_SELECTOR).forEach((card, index) => {
        const row = Math.floor(index / columnsPerRow);
        const col = index % columnsPerRow;
        card.dataset.loadRow = row;
        card.dataset.loadCol = col;
        card.dataset.loadIndex = index;

        state.observer.observe(card);
    });
}


export function destroy() {
    if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }
    resetState();
}

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
        loadCardImages(item.card, () => {
            state.activeCardLoads--;
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS);
        });
        if (state.activeCardLoads < CONFIG.MAX_CONCURRENT_CARDS) {
            setTimeout(processNext, CONFIG.LOAD_DELAY_MS);
        }
    };

    processNext();
}

function loadCardImages(card, callback) {
    const primaryImg = card.querySelector(CONFIG.PRIMARY_IMAGE_SELECTOR);
    const secondaryImg = card.querySelector(CONFIG.SECONDARY_IMAGE_SELECTOR);

    const promises = [];
    if (primaryImg && primaryImg.dataset.src) {
        promises.push(loadSingleImage(primaryImg));
    }
    if (secondaryImg && secondaryImg.dataset.src) {
        promises.push(loadSingleImage(secondaryImg));
    }
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
            resolve();
        };

        tempImg.src = src;
    });
}

function fallbackLoadAll() {
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    });
}

export default {
    init,
    observeNewImages,
    destroy
};
