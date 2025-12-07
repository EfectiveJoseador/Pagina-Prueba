import products from './products-data.js';
import { db } from './firebase-config.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ============================================
// CONFIGURATION
// ============================================
const FEATURED_CONFIG = {
    PRODUCT_COUNT: 6,          // Number of products to show
    ROTATION_DAYS: 7           // Days before rotation
};

// ============================================
// SMART LABEL SYSTEM FOR "LO MÁS VENDIDO"
// ============================================
const LABEL_TYPES = {
    NUEVO: { text: 'NUEVO', class: 'badge-nuevo', color: '#10b981' },
    TENDENCIA: { text: 'TENDENCIA', class: 'badge-trending', color: '#8b5cf6' },
    POPULAR: { text: 'POPULAR', class: 'badge-popular', color: '#f59e0b' },
    TOP_PICKS: { text: 'TOP PICKS', class: 'badge-top', color: '#3b82f6' }
};

// Current season detection (25/26 for 2024-2025)
const CURRENT_SEASON = '25/26';

function getProductLabel(product, index) {
    const name = product.name || '';
    const isRetro = product.retro || product.league === 'retro' || name.toLowerCase().includes('retro');
    const isCurrentSeason = name.includes(CURRENT_SEASON) || name.includes('24/25');

    // Never show NUEVO for retro products
    if (isRetro) {
        // Assign varied labels for retro products
        const retroLabels = [LABEL_TYPES.TENDENCIA, LABEL_TYPES.POPULAR, LABEL_TYPES.TOP_PICKS];
        return retroLabels[index % retroLabels.length];
    }

    // Show NUEVO only for current season products
    if (isCurrentSeason && product.new !== false) {
        return LABEL_TYPES.NUEVO;
    }

    // For other products, rotate through professional labels
    const labels = [LABEL_TYPES.TENDENCIA, LABEL_TYPES.POPULAR, LABEL_TYPES.TOP_PICKS];
    return labels[index % labels.length];
}

// ============================================
// PERFORMANCE DETECTION
// ============================================
function detectLowPerformance() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
    }
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        return true;
    }
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        return true;
    }
    if ('ontouchstart' in window && window.innerWidth < 768) {
        return true;
    }
    return false;
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Detect low performance devices
    if (detectLowPerformance()) {
        document.body.classList.add('low-performance');
    }

    // Check if animation was already seen this session
    if (sessionStorage.getItem('homeAnimationSeen')) {
        document.body.classList.add('animation-seen');
    } else {
        setTimeout(() => {
            sessionStorage.setItem('homeAnimationSeen', 'true');
        }, 1500);
    }

    initHome();
});

async function initHome() {
    // Apply special pricing rules
    applySpecialPricing();

    // Initialize Catalog Carousel (must be first to clone cards)
    initCatalogoCarousel();

    // Initialize Catalogo Cards (dropdowns and clickable cards) - after carousel clones cards
    initCatalogoCards();

    // Render Best Sellers from Firebase
    await renderBestSellers();
}

// ============================================
// CATALOGO CAROUSEL - Infinite Seamless Loop
// ============================================
function initCatalogoCarousel() {
    const carousel = document.getElementById('catalogo-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const prevBtn = document.getElementById('catalogo-prev');
    const nextBtn = document.getElementById('catalogo-next');

    if (!track || !prevBtn || !nextBtn) return;

    const originalCards = Array.from(track.querySelectorAll('.catalogo-card'));
    if (originalCards.length === 0) return;

    const cardWidth = 280 + 24; // card width + gap (1.5rem = 24px)
    const totalCards = originalCards.length;

    // Clone all cards and append/prepend for seamless loop
    originalCards.forEach(card => {
        const cloneEnd = card.cloneNode(true);
        const cloneStart = card.cloneNode(true);
        cloneEnd.classList.add('carousel-clone');
        cloneStart.classList.add('carousel-clone');
        track.appendChild(cloneEnd);
        track.insertBefore(cloneStart, track.firstChild);
    });

    // Start at the first "real" card (after the prepended clones)
    let currentIndex = totalCards;
    let isTransitioning = false;

    function updateCarousel(animate = true) {
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.3s ease';
        }
        const translateX = -(currentIndex * cardWidth);
        track.style.transform = `translateX(${translateX}px)`;
    }

    function handleTransitionEnd() {
        isTransitioning = false;
        // If we've scrolled to the cloned section at the end, jump to the real start
        if (currentIndex >= totalCards * 2) {
            currentIndex = totalCards;
            updateCarousel(false);
        }
        // If we've scrolled to the cloned section at the start, jump to the real end
        if (currentIndex < totalCards) {
            currentIndex = totalCards + (currentIndex);
            updateCarousel(false);
        }
    }

    track.addEventListener('transitionend', handleTransitionEnd);

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex--;
        updateCarousel();
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        updateCarousel();
    });

    // Initial position (no animation)
    updateCarousel(false);
    // Force a reflow then enable transitions
    track.offsetHeight;
    track.style.transition = 'transform 0.3s ease';
}


// ============================================
// CATALOGO CARDS - Dropdowns & Click Handler (Event Delegation)
// ============================================
let catalogoCardsInitialized = false;

function initCatalogoCards() {
    // Prevent duplicate event listener registration
    if (catalogoCardsInitialized) return;
    catalogoCardsInitialized = true;

    // Use event delegation on document for dropdown buttons (works with clones)
    document.addEventListener('click', (e) => {
        // Handle dropdown buttons
        const dropdownBtn = e.target.closest('.dropdown-btn');
        if (dropdownBtn) {
            e.stopPropagation();
            e.preventDefault();
            const card = dropdownBtn.closest('.catalogo-card');

            // Close other dropdowns
            document.querySelectorAll('.catalogo-card.dropdown-open').forEach(openCard => {
                if (openCard !== card) openCard.classList.remove('dropdown-open');
            });

            // Toggle this dropdown
            card.classList.toggle('dropdown-open');
            return;
        }

        // Handle dropdown menu links
        const dropdownLink = e.target.closest('.dropdown-menu a');
        if (dropdownLink) {
            e.stopPropagation();
            // Let the link work normally
            return;
        }

        // Handle catalogo-btn clicks
        const catalogoBtn = e.target.closest('.catalogo-btn:not(.dropdown-btn)');
        if (catalogoBtn) {
            e.stopPropagation();
            // Let the link work normally
            return;
        }

        // Handle clickable cards
        const clickableCard = e.target.closest('.catalogo-card-clickable');
        if (clickableCard) {
            // Don't navigate if clicking dropdown menu or button
            if (e.target.closest('.dropdown-menu') || e.target.closest('.dropdown-btn') || e.target.closest('.catalogo-btn')) {
                return;
            }

            const link = clickableCard.dataset.link;
            if (link) window.location.href = link;
            return;
        }

        // Close dropdown when clicking outside
        if (!e.target.closest('.catalogo-card')) {
            document.querySelectorAll('.catalogo-card.dropdown-open').forEach(card => {
                card.classList.remove('dropdown-open');
            });
        }
    });
}

// ============================================
// SPECIAL PRICING
// ============================================
function applySpecialPricing() {
    products.forEach(product => {
        const nameLower = product.name.toLowerCase();
        const isKids = nameLower.includes('kids') || nameLower.includes('niño');
        const isRetro = product.name.trim().endsWith('R') || product.league === 'retro';
        const isNBA = product.category === 'nba' || product.league === 'nba';

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

        product.oldPrice = oldPrice;
        product.price = newPrice;
        product.sale = true;
    });
}

// ============================================
// FIREBASE-BASED GLOBAL ROTATION SYSTEM
// ============================================
async function renderBestSellers() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<div class="loading-placeholder" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Cargando productos...</div>';

    try {
        // Get products from Firebase (global for all users)
        const bestSellerIds = await getGlobalFeaturedProducts();
        const bestSellers = bestSellerIds.map(id => products.find(p => p.id === id)).filter(Boolean);

        if (bestSellers.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos destacados disponibles.</p>';
            return;
        }

        grid.innerHTML = bestSellers.map((product, index) => {
            return `
            <article class="product-card">
                <div class="product-image">
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
        `}).join('');

    } catch (error) {
        console.error('Error loading featured products:', error);
        // Fallback to random products if Firebase fails
        const fallbackProducts = products.slice(0, FEATURED_CONFIG.PRODUCT_COUNT);
        grid.innerHTML = fallbackProducts.map((product, index) => {
            return `
            <article class="product-card">
                <div class="product-image">
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
        `}).join('');
    }
}

// Get featured products from Firebase (global for all users)
async function getGlobalFeaturedProducts() {
    const configRef = ref(db, 'config/featured_products');
    const snapshot = await get(configRef);
    const now = Date.now();

    if (snapshot.exists()) {
        const data = snapshot.val();

        // Check if still valid (not expired and correct count)
        if (data.week_end > now &&
            data.products &&
            data.products.length === FEATURED_CONFIG.PRODUCT_COUNT) {
            console.log('Using existing featured products from Firebase');
            return data.products;
        }
    }

    // Generate and save new rotation
    console.log('Generating new featured products rotation');
    return await generateNewFeaturedProducts(configRef, now);
}

// Generate new random selection and save to Firebase
async function generateNewFeaturedProducts(configRef, now) {
    // Fisher-Yates shuffle for true randomness
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, FEATURED_CONFIG.PRODUCT_COUNT).map(p => p.id);

    const rotationMs = FEATURED_CONFIG.ROTATION_DAYS * 24 * 60 * 60 * 1000;

    const newData = {
        products: selected,
        week_start: now,
        week_end: now + rotationMs,
        product_count: FEATURED_CONFIG.PRODUCT_COUNT,
        rotation_days: FEATURED_CONFIG.ROTATION_DAYS,
        updated_at: new Date().toISOString()
    };

    try {
        await set(configRef, newData);
        console.log('New featured products saved to Firebase:', selected);
    } catch (error) {
        console.error('Failed to save to Firebase:', error);
        // Still return the selection even if save fails
    }

    return selected;
}
