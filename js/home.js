import products from './products-data.js';
import { db } from './firebase-config.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
const FEATURED_CONFIG = {
    PRODUCT_COUNT: 6,
    ROTATION_DAYS: 7
};
const LABEL_TYPES = {
    NUEVO: { text: 'NUEVO', class: 'badge-nuevo', color: '#10b981' },
    TENDENCIA: { text: 'TENDENCIA', class: 'badge-trending', color: '#8b5cf6' },
    POPULAR: { text: 'POPULAR', class: 'badge-popular', color: '#f59e0b' },
    TOP_PICKS: { text: 'TOP PICKS', class: 'badge-top', color: '#3b82f6' }
};
const CURRENT_SEASON = '25/26';

function getProductLabel(product, index) {
    const name = product.name || '';
    const isRetro = product.retro || product.league === 'retro' || name.toLowerCase().includes('retro');
    const isCurrentSeason = name.includes(CURRENT_SEASON) || name.includes('24/25');
    if (isRetro) {
        const retroLabels = [LABEL_TYPES.TENDENCIA, LABEL_TYPES.POPULAR, LABEL_TYPES.TOP_PICKS];
        return retroLabels[index % retroLabels.length];
    }
    if (isCurrentSeason && product.new !== false) {
        return LABEL_TYPES.NUEVO;
    }
    const labels = [LABEL_TYPES.TENDENCIA, LABEL_TYPES.POPULAR, LABEL_TYPES.TOP_PICKS];
    return labels[index % labels.length];
}
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
document.addEventListener('DOMContentLoaded', () => {
    if (detectLowPerformance()) {
        document.body.classList.add('low-performance');
    }
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
    applySpecialPricing();
    initCatalogoCarousel();
    initCatalogoCards();
    await renderBestSellers();
}
function initCatalogoCarousel() {
    const carousel = document.getElementById('catalogo-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const prevBtn = document.getElementById('catalogo-prev');
    const nextBtn = document.getElementById('catalogo-next');
    const carouselContainer = carousel.querySelector('.carousel-container');

    if (!track || !prevBtn || !nextBtn) return;

    const originalCards = Array.from(track.querySelectorAll('.catalogo-card'));
    if (originalCards.length === 0) return;

    const cardWidth = 220 + 24; // width + gap (coincide con CSS)
    const totalCards = originalCards.length;

    // Clonar tarjetas para el loop infinito
    originalCards.forEach(card => {
        const cloneEnd = card.cloneNode(true);
        const cloneStart = card.cloneNode(true);
        cloneEnd.classList.add('carousel-clone');
        cloneStart.classList.add('carousel-clone');
        track.appendChild(cloneEnd);
        track.insertBefore(cloneStart, track.firstChild);
    });

    let currentIndex = totalCards;
    let isJumping = false;
    let autoPlayInterval = null;
    let isPaused = false;

    // Configuración de auto-play
    const AUTO_PLAY_DELAY = 4000; // 4 segundos entre movimientos
    const TRANSITION_DURATION = 600; // Transición más lenta para auto-play (0.6s)

    function setPosition(index, animate = true, slow = false) {
        if (animate) {
            // Transición más lenta para auto-play, rápida para clicks
            const duration = slow ? TRANSITION_DURATION : 150;
            track.style.transition = `transform ${duration}ms ease-out`;
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = `translateX(${-(index * cardWidth)}px)`;
    }

    function handleTransitionEnd() {
        if (isJumping) return;

        // Verificar si necesitamos hacer el salto silencioso
        if (currentIndex >= totalCards * 2) {
            isJumping = true;
            currentIndex = totalCards;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setPosition(currentIndex, false);
                    isJumping = false;
                });
            });
        } else if (currentIndex < totalCards) {
            isJumping = true;
            currentIndex = totalCards + currentIndex;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setPosition(currentIndex, false);
                    isJumping = false;
                });
            });
        }
    }

    track.addEventListener('transitionend', handleTransitionEnd);

    // Función de auto-play
    function autoAdvance() {
        if (isJumping || isPaused) return;
        currentIndex++;
        setPosition(currentIndex, true, true); // slow = true para transición suave
    }

    function startAutoPlay() {
        if (autoPlayInterval) return;
        autoPlayInterval = setInterval(autoAdvance, AUTO_PLAY_DELAY);
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    function pauseAutoPlay() {
        isPaused = true;
        stopAutoPlay();
    }

    function resumeAutoPlay() {
        isPaused = false;
        startAutoPlay();
    }

    // Pausar al interactuar, reanudar después de 5 segundos
    let resumeTimeout = null;
    function handleUserInteraction() {
        pauseAutoPlay();
        if (resumeTimeout) clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(resumeAutoPlay, 5000);
    }

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isJumping) return;
        handleUserInteraction();
        currentIndex--;
        setPosition(currentIndex, true, false); // fast
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isJumping) return;
        handleUserInteraction();
        currentIndex++;
        setPosition(currentIndex, true, false); // fast
    });

    // Pausar al hacer hover
    carousel.addEventListener('mouseenter', pauseAutoPlay);
    carousel.addEventListener('mouseleave', () => {
        if (resumeTimeout) clearTimeout(resumeTimeout);
        resumeAutoPlay();
    });

    // Posición inicial sin animación
    setPosition(currentIndex, false);
    track.offsetHeight;

    // Iniciar auto-play
    startAutoPlay();

    // En móvil: implementar scroll infinito con clones dinámicos
    const isMobile = window.innerWidth <= 768;
    if (isMobile && carouselContainer) {
        // Listener para añadir clones dinámicamente cuando se acerca al final
        carouselContainer.addEventListener('scroll', () => {
            const scrollLeft = carouselContainer.scrollLeft;
            const scrollWidth = carouselContainer.scrollWidth;
            const clientWidth = carouselContainer.clientWidth;

            // Si está cerca del final (a menos de 2 tarjetas del borde)
            if (scrollLeft + clientWidth >= scrollWidth - 400) {
                // Añadir una copia de todas las tarjetas originales al final
                originalCards.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.classList.add('carousel-clone');
                    track.appendChild(clone);
                });
            }

            // Si está cerca del inicio (a menos de 2 tarjetas del borde)
            if (scrollLeft <= 400) {
                // Añadir una copia de todas las tarjetas originales al principio
                const currentScrollLeft = carouselContainer.scrollLeft;
                const cardsToAdd = [...originalCards].reverse();
                let addedWidth = 0;

                cardsToAdd.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.classList.add('carousel-clone');
                    track.insertBefore(clone, track.firstChild);
                    addedWidth += clone.offsetWidth + 16; // width + gap
                });

                // Mantener la posición visual
                carouselContainer.scrollLeft = currentScrollLeft + addedWidth;
            }

            // Ocultar indicador visual
            carouselContainer.classList.add('scrolled');
            carousel.classList.add('scrolled');
        }, { passive: true });
    } else {
        // Desktop: ocultar indicador al scrollear
        if (carouselContainer) {
            carouselContainer.addEventListener('scroll', () => {
                carouselContainer.classList.add('scrolled');
                carousel.classList.add('scrolled');
                handleUserInteraction();
            }, { passive: true });
        }
    }
}
let catalogoCardsInitialized = false;

function initCatalogoCards() {
    if (catalogoCardsInitialized) return;
    catalogoCardsInitialized = true;
    document.addEventListener('click', (e) => {
        const dropdownBtn = e.target.closest('.dropdown-btn');
        if (dropdownBtn) {
            e.stopPropagation();
            e.preventDefault();
            const card = dropdownBtn.closest('.catalogo-card');
            document.querySelectorAll('.catalogo-card.dropdown-open').forEach(openCard => {
                if (openCard !== card) openCard.classList.remove('dropdown-open');
            });
            card.classList.toggle('dropdown-open');
            return;
        }
        const dropdownLink = e.target.closest('.dropdown-menu a');
        if (dropdownLink) {
            e.stopPropagation();
            return;
        }
        const catalogoBtn = e.target.closest('.catalogo-btn:not(.dropdown-btn)');
        if (catalogoBtn) {
            e.stopPropagation();
            return;
        }
        const clickableCard = e.target.closest('.catalogo-card-clickable');
        if (clickableCard) {
            if (e.target.closest('.dropdown-menu') || e.target.closest('.dropdown-btn') || e.target.closest('.catalogo-btn')) {
                return;
            }

            const link = clickableCard.dataset.link;
            if (link) window.location.href = link;
            return;
        }
        if (!e.target.closest('.catalogo-card')) {
            document.querySelectorAll('.catalogo-card.dropdown-open').forEach(card => {
                card.classList.remove('dropdown-open');
            });
        }
    });
}
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
async function renderBestSellers() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading-placeholder" style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Cargando productos...</div>';

    try {
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
async function getGlobalFeaturedProducts() {
    const configRef = ref(db, 'config/featured_products');
    const snapshot = await get(configRef);
    const now = Date.now();

    if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.week_end > now &&
            data.products &&
            data.products.length === FEATURED_CONFIG.PRODUCT_COUNT) {
            console.log('Using existing featured products from Firebase');
            return data.products;
        }
    }
    console.log('Generating new featured products rotation');
    return await generateNewFeaturedProducts(configRef, now);
}
async function generateNewFeaturedProducts(configRef, now) {
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
    }

    return selected;
}
