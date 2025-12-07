/**
 * Tienda.js - Store page with pagination & lazy-loading
 * Optimized for 60fps performance
 */

import products from './products-data.js';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    PRODUCTS_PER_PAGE: 20,
    LAZY_LOAD_THRESHOLD: '200px', // Load images before they enter viewport
    PLACEHOLDER_COLOR: '#e0e0e0'
};

// ============================================
// STATE MANAGEMENT
// ============================================
let allProducts = [];
let filteredProducts = [];
let currentProduct = null;
let selectedLeague = '';
let selectedTeam = '';
let currentPage = 1;
let totalPages = 1;
let imageObserver = null;

// Patch and extra prices mapping
const patchPrices = {
    none: 0,
    liga: 1,
    champions: 2,
    europa: 1,
    premier: 1,
    seriea: 1,
    mundial: 1,
    copamundo: 1,
    conmemorativo: 1
};

// Size configurations
const SIZE_CONFIGS = {
    kids: ['16', '18', '20', '22', '24', '26', '28'],
    retro: ['S', 'M', 'L', 'XL', '2XL'],
    normal: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    nba: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
};

const extraPrices = {
    embolso: 2,
    envio: 5,
    caja: 8,
    manga: 4,
    oficial: 10
};

// ============================================
// LAZY LOADING SYSTEM
// ============================================
function initLazyLoading() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
        return;
    }

    // Create observer for lazy loading
    imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: CONFIG.LAZY_LOAD_THRESHOLD,
        threshold: 0.01
    });

    // Observe all lazy images
    observeLazyImages();
}

function observeLazyImages() {
    if (!imageObserver) return;

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

function loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // Create a new image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');
    };

    tempImg.onerror = () => {
        // Fallback to placeholder on error
        img.classList.add('error');
    };

    tempImg.src = src;
}

// ============================================
// PAGINATION SYSTEM
// ============================================
function calculatePagination() {
    totalPages = Math.ceil(filteredProducts.length / CONFIG.PRODUCTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages || 1;
}

function getProductsForCurrentPage() {
    const start = (currentPage - 1) * CONFIG.PRODUCTS_PER_PAGE;
    const end = start + CONFIG.PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, end);
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProducts();

    // Scroll to top of products smoothly
    const grid = document.getElementById('product-grid');
    if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    // Don't show pagination if only 1 page
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';

    // Previous button
    paginationHTML += `
        <button class="pagination-btn pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers with smart truncation
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page + ellipsis
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
        `;
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHTML += '</div>';

    // Product count info
    const start = (currentPage - 1) * CONFIG.PRODUCTS_PER_PAGE + 1;
    const end = Math.min(currentPage * CONFIG.PRODUCTS_PER_PAGE, filteredProducts.length);
    paginationHTML += `
        <div class="pagination-info">
            Mostrando ${start}-${end} de ${filteredProducts.length} productos
        </div>
    `;

    container.innerHTML = paginationHTML;

    // Attach click handlers
    container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            goToPage(page);
        });
    });
}

// ============================================
// PRODUCT RENDERING
// ============================================
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');

    calculatePagination();

    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        renderPagination();
        return;
    }

    noResults.classList.add('hidden');

    const productsToShow = getProductsForCurrentPage();

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    tempDiv.innerHTML = productsToShow.map(product => `
        <article class="product-card" data-id="${product.id}">
            <div class="product-image">
                <span class="badge-sale">OFERTA</span>
                <a href="/pages/producto.html?id=${product.id}">
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E"
                        data-src="${product.image}"
                        alt="${product.name}"
                        class="primary-image lazy-image"
                        width="300"
                        height="300"
                        loading="lazy"
                    >
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E"
                        data-src="${product.image.replace('/1_resultado.webp', '/2_resultado.webp')}"
                        alt="${product.name}"
                        class="secondary-image lazy-image"
                        width="300"
                        height="300"
                        loading="lazy"
                    >
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

    // Clear and append
    grid.innerHTML = '';
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    grid.appendChild(fragment);

    // Initialize lazy loading for new images
    observeLazyImages();

    // Render pagination
    renderPagination();

    // Attach click handlers for customize buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            openCustomizationModal(productId);
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Shuffle products for random order on each load
    allProducts = shuffleArray([...products]);

    // Apply special pricing rules
    applySpecialPricing();

    filteredProducts = allProducts;

    // Initialize lazy loading system
    initLazyLoading();

    populateLeagueFilter();
    renderProducts();
    attachEventListeners();
    setupModal();
    applyURLFilters();
}

// Fisher-Yates shuffle for random product order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Apply special pricing based on category/name
function applySpecialPricing() {
    allProducts.forEach(product => {
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
        product.sale = true;
    });
}

// Populate League Filter
function populateLeagueFilter() {
    const leagues = [...new Set(allProducts.map(p => p.league))].sort();
    const leagueSelect = document.getElementById('filter-league');

    if (leagueSelect) {
        leagueSelect.innerHTML = '<option value="">Todas las Ligas</option>';
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league;
            option.textContent = formatLeagueName(league);
            leagueSelect.appendChild(option);
        });
    }
}

// Populate Team Filter based on selected League
function populateTeamFilter(league) {
    const teamSelect = document.getElementById('filter-team');
    const teamStep = document.getElementById('team-step');

    if (!league) {
        teamStep.classList.add('hidden');
        selectedTeam = '';
        return;
    }

    const leagueProducts = allProducts.filter(p => p.league === league);

    const teams = [...new Set(leagueProducts.map(p => {
        let name = p.name;
        name = name.replace(/\d{2}\/\d{2}/, '');
        name = name.replace(/(Local|Visitante|Tercera|Retro|Icon)/, '');
        name = name.replace('(Kids)', '');
        return name.trim();
    }))].sort();

    if (teamSelect) {
        teamSelect.innerHTML = '<option value="">Todos los Equipos</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamSelect.appendChild(option);
        });
        teamStep.classList.remove('hidden');
    }
}

// Helper to format league names
function formatLeagueName(league) {
    const map = {
        'laliga': 'La Liga',
        'premier': 'Premier League',
        'seriea': 'Serie A',
        'bundesliga': 'Bundesliga',
        'ligue1': 'Ligue 1',
        'retro': 'Retro',
        'selecciones': 'Selecciones',
        'brasileirao': 'Brasileirão',
        'ligaarabe': 'Liga Árabe',
        'saf': 'SAF (Argentina)',
        'nba': 'NBA'
    };
    return map[league] || league;
}

// Apply filters from URL parameters
function applyURLFilters() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    // URL filters support
}

// Attach event listeners
function attachEventListeners() {
    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        applyFilters();
    });

    // League Filter
    document.getElementById('filter-league').addEventListener('change', (e) => {
        selectedLeague = e.target.value;
        selectedTeam = ''; // Reset team when league changes
        populateTeamFilter(selectedLeague);
        applyFilters();
    });

    // Team Filter
    document.getElementById('filter-team').addEventListener('change', (e) => {
        selectedTeam = e.target.value;
        applyFilters();
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', applyFilters);

    // Close filters button
    document.getElementById('close-filters').addEventListener('click', () => {
        const container = document.querySelector('.catalog-container');
        container.classList.add('sidebar-closed');
    });

    // Show filters button
    document.getElementById('show-filters').addEventListener('click', () => {
        const container = document.querySelector('.catalog-container');
        container.classList.remove('sidebar-closed');
    });

    // Clear filters
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-league').value = '';
        selectedLeague = '';
        selectedTeam = '';
        document.getElementById('team-step').classList.add('hidden');

        document.getElementById('search-input').value = '';
        document.getElementById('sort-select').value = 'default';
        applyFilters();
    });
}

// Apply all filters and sorting
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    // Reset to page 1 when filters change
    currentPage = 1;

    // Filter products
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesLeague = selectedLeague === '' || product.league === selectedLeague;

        // Team matching
        let matchesTeam = true;
        if (selectedTeam !== '') {
            matchesTeam = product.name.includes(selectedTeam);
        }

        return matchesSearch && matchesLeague && matchesTeam;
    });

    // Sort products
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts();
}

// Setup customization modal
function setupModal() {
    const modal = document.getElementById('customization-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const form = document.getElementById('customization-form');

    // Close modal handlers
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Update preview on any change
    const inputs = ['modal-size', 'modal-version', 'modal-name', 'modal-number', 'modal-patch'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePreview);
            element.addEventListener('input', updatePreview);
        }
    });
}

// Open customization modal
function openCustomizationModal(productId) {
    currentProduct = allProducts.find(p => p.id === productId);
    if (!currentProduct) return;

    // Reset form
    document.getElementById('customization-form').reset();
    document.getElementById('modal-product-id').value = productId;

    // Populate size options based on product type
    populateSizeOptions();

    // Update modal and preview
    updatePreview();

    // Open modal
    document.getElementById('customization-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Detect product type for sizing
function getProductType(product) {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('kids') || nameLower.includes('niño')) return 'kids';
    if (product.category === 'nba' || product.league === 'nba') return 'nba';
    if (product.name.trim().endsWith('R') || product.league === 'retro') return 'retro';
    return 'normal';
}

// Populate size options based on product type
function populateSizeOptions() {
    if (!currentProduct) return;

    const productType = getProductType(currentProduct);
    const sizes = SIZE_CONFIGS[productType];
    const sizeSelect = document.getElementById('modal-size');

    // Clear existing options except first one ("Seleccionar Talla")
    sizeSelect.innerHTML = '<option value="">Seleccionar Talla</option>';

    // Add new size options
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        const sizeLabel = (size === '3XL' || size === '4XL') ? `${size} (+€2)` : size;
        option.textContent = sizeLabel;
        sizeSelect.appendChild(option);
    });
}

// Close modal
function closeModal() {
    document.getElementById('customization-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Update price preview
function updatePreview() {
    // Validation
    const size = document.getElementById('modal-size').value;
    if (!size) {
        alert('Por favor, selecciona una talla');
        return;
    }

    const name = document.getElementById('modal-name').value.trim();
    if (name && !/^[A-Za-zÀ-ÿ\s]+$/.test(name)) {
        alert('El nombre solo puede contener letras y espacios');
        return;
    }

    const number = document.getElementById('modal-number').value;
    if (number && (number < 0 || number > 99)) {
        alert('El dorsal debe estar entre 0 y 99');
        return;
    }

    // NUEVA VALIDACIÓN: Nombre y dorsal deben ir juntos
    if ((name && !number) || (!name && number)) {
        alert('⚠️ El nombre y el dorsal deben ir juntos.\n\nSi quieres personalizar la camiseta, debes escribir AMBOS campos:\n• Nombre (ej: MESSI)\n• Dorsal (ej: 10)');
        return;
    }

    // Gather all customization data
    const customization = {
        size: size,
        version: document.getElementById('modal-version').value,
        name: name ? name.toUpperCase() : '',
        number: number || '',
        patch: document.getElementById('modal-patch').value,
        extras: []
    };

    // Calculate total price
    let totalPrice = currentProduct.price;
    if (customization.version === 'jugador') totalPrice += 5;
    if (customization.patch && customization.patch !== 'none') {
        totalPrice += patchPrices[customization.patch] || 0;
    }

    // Create cart item
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        image: currentProduct.image,
        basePrice: currentProduct.price,
        price: totalPrice,
        quantity: 1,
        customization: customization
    };

    // Add to cart
    addToCart(cartItem);

    // Close modal
    closeModal();

    // Show confirmation
    alert(`${currentProduct.name} añadido al carrito!\nTotal: €${totalPrice.toFixed(2)}`);
}

// Add item to cart (uses localStorage)
function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Check if same product with same customization exists
    const existingIndex = cart.findIndex(cartItem =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.customization) === JSON.stringify(item.customization)
    );

    if (existingIndex > -1) {
        // Update quantity
        cart[existingIndex].quantity += 1;
    } else {
        // Add new item
        cart.push(item);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Update cart count on load
updateCartCount();
