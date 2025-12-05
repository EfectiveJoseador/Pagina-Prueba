import products from './products-data.js';

// Performance detection
function detectLowPerformance() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
    }

    // Check device memory (if available)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        return true;
    }

    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return true;
    }

    // Check if mobile device with touch
    if ('ontouchstart' in window && window.innerWidth < 768) {
        return true;
    }

    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    // Detect low performance devices
    if (detectLowPerformance()) {
        document.body.classList.add('low-performance');
    }

    // Check if animation was already seen this session
    if (sessionStorage.getItem('homeAnimationSeen')) {
        // Skip animations - add class immediately
        document.body.classList.add('animation-seen');
    } else {
        // First visit - mark as seen after animations complete
        setTimeout(() => {
            sessionStorage.setItem('homeAnimationSeen', 'true');
        }, 1500); // Faster animations now complete in ~1.5s
    }

    initHome();
});

function initHome() {
    // Apply special pricing rules (same as tienda.js)
    applySpecialPricing();

    // Render Best Sellers
    renderBestSellers();
}

function applySpecialPricing() {
    products.forEach(product => {
        const nameLower = product.name.toLowerCase();
        const isKids = nameLower.includes('kids') || nameLower.includes('niño');
        const isRetro = product.name.trim().endsWith('R') || product.league === 'retro';
        const isNBA = product.category === 'nba' || product.league === 'nba';

        // Default to Normal
        let oldPrice = 25.00;
        let newPrice = 19.90;

        if (isNBA) {
            oldPrice = 30.00;
            newPrice = 24.90;
        } else if (isRetro) {
            oldPrice = 30.00;
            newPrice = 24.90;
        } else if (isKids) {
            oldPrice = 27.00;
            newPrice = 21.90;
        }

        // Apply changes
        product.oldPrice = oldPrice;
        product.price = newPrice;
        product.sale = true; // Always on sale
    });
}

function renderBestSellers() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    // Get weekly rotated products
    const bestSellerIds = getWeeklyBestSellers();
    const bestSellers = bestSellerIds.map(id => products.find(p => p.id === id)).filter(Boolean);

    grid.innerHTML = bestSellers.map(product => `
        <article class="product-card">
            <div class="product-image">
                ${product.sale ? '<span class="badge-sale">OFERTA</span>' : ''}
                <a href="/pages/producto.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </a>
                <button class="btn-quick-view"><i class="fas fa-eye"></i></button>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    <span class="price-old">€${product.oldPrice.toFixed(2)}</span>
                    <span class="price">€${product.price.toFixed(2)}</span>
                </div>
            </div>
        </article>
    `).join('');
}

// Weekly rotation system for "Más Vendidos"
function getWeeklyBestSellers() {
    const ROTATION_KEY = 'bestSellers_week';
    const ROTATION_DATE_KEY = 'bestSellers_date';
    const PRODUCTS_COUNT = 6; // Show 6 products

    const stored = localStorage.getItem(ROTATION_KEY);
    const storedDate = localStorage.getItem(ROTATION_DATE_KEY);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    // Return stored if less than 1 week old AND same count
    if (stored && storedDate && (now - parseInt(storedDate)) < oneWeek) {
        try {
            const parsed = JSON.parse(stored);
            // Regenerate if count changed
            if (parsed.length === PRODUCTS_COUNT) {
                return parsed;
            }
        } catch (e) {
            // If parse fails, generate new
        }
    }

    // Generate new random selection
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, PRODUCTS_COUNT).map(p => p.id);

    // Store for next week
    localStorage.setItem(ROTATION_KEY, JSON.stringify(selected));
    localStorage.setItem(ROTATION_DATE_KEY, now.toString());

    return selected;
}
