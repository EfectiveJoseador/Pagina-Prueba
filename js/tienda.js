

import products from './products-data.js';
const CONFIG = {
    PRODUCTS_PER_PAGE: 20,
    LAZY_LOAD_THRESHOLD: '200px',
    PLACEHOLDER_COLOR: '#e0e0e0'
};
let allProducts = [];
let filteredProducts = [];
let currentProduct = null;
let selectedLeague = '';
let selectedTeam = '';
let selectedKids = '';
let currentPage = 1;
let totalPages = 1;
let imageObserver = null;
const patchPrices = {
    none: 0,
    liga: 1,
    champions: 1,
    europa: 1,
    premier: 1,
    seriea: 1,
    mundial: 1,
    copamundo: 1,
    conmemorativo: 1
};
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
import * as imageLoader from './imageLoader.js';
function initLazyLoading() {
    imageLoader.init();
}

function observeLazyImages() {
    imageLoader.observeNewImages();
}
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination">';
    paginationHTML += `
        <button class="pagination-btn pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
        `;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    paginationHTML += `
        <button class="pagination-btn pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHTML += '</div>';
    const start = (currentPage - 1) * CONFIG.PRODUCTS_PER_PAGE + 1;
    const end = Math.min(currentPage * CONFIG.PRODUCTS_PER_PAGE, filteredProducts.length);
    paginationHTML += `
        <div class="pagination-info">
            Mostrando ${start}-${end} de ${filteredProducts.length} productos
        </div>
    `;

    container.innerHTML = paginationHTML;
    container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            goToPage(page);
        });
    });
}
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
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    tempDiv.innerHTML = productsToShow.map(product => `
        <article class="product-card" data-id="${product.id}">
            <div class="product-image">
                <span class="badge-sale">OFERTA</span>
                <a href="/pages/producto.html?id=${product.id}">
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E"
                        data-src="${product.image.replace('/1.webp', '/1_mini.webp')}"
                        alt="${product.name}"
                        class="primary-image lazy-image"
                        width="300"
                        height="300"
                        loading="lazy"
                    >
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23e5e7eb' width='1' height='1'/%3E%3C/svg%3E"
                        data-src="${product.image.replace('/1.webp', '/2_mini.webp')}"
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
    grid.innerHTML = '';
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    grid.appendChild(fragment);
    observeLazyImages();
    renderPagination();
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            openCustomizationModal(productId);
        });
    });
}
function init() {
    allProducts = shuffleArray([...products]);
    applySpecialPricing();

    filteredProducts = allProducts;
    initLazyLoading();

    populateLeagueFilter();
    attachEventListeners();
    setupModal();

    applyURLFilters();
    applyFilters(false);
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function applySpecialPricing() {
    allProducts.forEach(product => {
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
function applyURLFilters() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const league = params.get('league');
    const team = params.get('team');
    const kids = params.get('kids');
    const sort = params.get('sort');

    if (search) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = decodeURIComponent(search);
        }
    }

    if (league) {
        selectedLeague = league;
        const leagueSelect = document.getElementById('filter-league');
        if (leagueSelect) {
            leagueSelect.value = league;
            populateTeamFilter(league);
        }
    }

    if (team) {
        const decodedTeam = decodeURIComponent(team.replace(/\+/g, ' '));
        selectedTeam = decodedTeam;

        const teamSelect = document.getElementById('filter-team');
        if (teamSelect) {
            teamSelect.value = decodedTeam;
        }
    }

    if (kids) {
        selectedKids = kids;
        const kidsSelect = document.getElementById('filter-kids');
        if (kidsSelect) {
            kidsSelect.value = kids;
        }
    }

    if (sort) {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = sort;
        }
    }
}

function updateURLWithFilters(searchTerm, sortBy) {
    const params = new URLSearchParams();

    if (searchTerm) {
        params.set('search', searchTerm);
    }
    if (selectedLeague) {
        params.set('league', selectedLeague);
    }
    if (selectedTeam) {
        params.set('team', selectedTeam);
    }
    if (selectedKids) {
        params.set('kids', selectedKids);
    }
    if (sortBy && sortBy !== 'default') {
        params.set('sort', sortBy);
    }

    const newURL = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

    history.pushState({}, '', newURL);
}
function attachEventListeners() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        applyFilters();
    });
    document.getElementById('filter-league').addEventListener('change', (e) => {
        selectedLeague = e.target.value;
        selectedTeam = '';
        populateTeamFilter(selectedLeague);
        applyFilters();
    });
    document.getElementById('filter-team').addEventListener('change', (e) => {
        selectedTeam = e.target.value;
        applyFilters();
    });
    document.getElementById('filter-kids').addEventListener('change', (e) => {
        selectedKids = e.target.value;
        applyFilters();
    });
    document.getElementById('sort-select').addEventListener('change', applyFilters);
    document.getElementById('close-filters').addEventListener('click', () => {
        const container = document.querySelector('.catalog-container');
        container.classList.remove('sidebar-open');
        document.body.style.overflow = '';
    });
    document.getElementById('show-filters').addEventListener('click', () => {
        const container = document.querySelector('.catalog-container');
        container.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
    });
    const backdrop = document.querySelector('.filters-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            const container = document.querySelector('.catalog-container');
            container.classList.remove('sidebar-open');
            document.body.style.overflow = '';
        });
    }
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-league').value = '';
        selectedLeague = '';
        selectedTeam = '';
        selectedKids = '';
        document.getElementById('team-step').classList.add('hidden');
        document.getElementById('filter-kids').value = '';

        document.getElementById('search-input').value = '';
        document.getElementById('sort-select').value = 'default';
        applyFilters();
    });
}
function applyFilters(updateURL = true) {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;
    currentPage = 1;
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesLeague = selectedLeague === '' || product.league === selectedLeague;
        let matchesTeam = true;
        if (selectedTeam !== '') {
            matchesTeam = product.name.toLowerCase().includes(selectedTeam.toLowerCase());
        }
        let matchesKids = true;
        const nameLower = product.name.toLowerCase();
        const isKidsProduct = nameLower.includes('kids') || nameLower.includes('niño');

        if (selectedKids === 'kids') {
            matchesKids = isKidsProduct;
        } else if (selectedKids === 'adults') {
            matchesKids = !isKidsProduct;
        }

        return matchesSearch && matchesLeague && matchesTeam && matchesKids;
    });
    function getProductTypeOrder(name) {
        const nameLower = name.toLowerCase();
        const isKids = nameLower.includes('kids') || nameLower.includes('niño');

        if (isKids) return 4;
        if (nameLower.includes('tercera')) return 3;
        if (nameLower.includes('visitante') || name.includes(' F')) return 2;
        if (nameLower.includes('local') || name.includes(' L')) return 1;
        return 5;
    }
    filteredProducts.sort((a, b) => getProductTypeOrder(a.name) - getProductTypeOrder(b.name));
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }
    if (window.Analytics) {
        if (searchTerm && searchTerm.length >= 2) {
            window.Analytics.trackSearch(searchTerm, filteredProducts.length);
        }
        if (selectedLeague) {
            window.Analytics.trackFilterUse('league', selectedLeague);
        }
        if (selectedTeam) {
            window.Analytics.trackFilterUse('team', selectedTeam);
        }
        if (selectedKids) {
            window.Analytics.trackFilterUse('kids', selectedKids);
        }
        if (sortBy !== 'default') {
            window.Analytics.trackFilterUse('sort', sortBy);
        }
    }

    if (updateURL) {
        updateURLWithFilters(searchTerm, sortBy);
    }

    renderProducts();
}
function setupModal() {
    const modal = document.getElementById('customization-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const form = document.getElementById('customization-form');

    if (!modal || !form) return;

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    form.addEventListener('submit', handleFormSubmit);
    const inputs = ['modal-size', 'modal-version', 'modal-name', 'modal-number', 'modal-patch'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updatePreview);
            element.addEventListener('input', updatePreview);
        }
    });
}
function openCustomizationModal(productId) {
    currentProduct = allProducts.find(p => p.id === productId);
    if (!currentProduct) return;
    document.getElementById('customization-form').reset();
    document.getElementById('modal-product-id').value = productId;
    populateSizeOptions();
    updatePreview();
    document.getElementById('customization-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function getProductType(product) {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('kids') || nameLower.includes('niño')) return 'kids';
    if (product.category === 'nba' || product.league === 'nba') return 'nba';
    if (product.name.trim().endsWith('R') || product.league === 'retro') return 'retro';
    return 'normal';
}
function populateSizeOptions() {
    if (!currentProduct) return;

    const productType = getProductType(currentProduct);
    const sizes = SIZE_CONFIGS[productType];
    const sizeSelect = document.getElementById('modal-size');
    sizeSelect.innerHTML = '<option value="">Seleccionar Talla</option>';
    sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        const sizeLabel = (size === '3XL' || size === '4XL') ? `${size} (+€2)` : size;
        option.textContent = sizeLabel;
        sizeSelect.appendChild(option);
    });
}
function closeModal() {
    document.getElementById('customization-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}
function updatePreview() {
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
    if ((name && !number) || (!name && number)) {
        alert('⚠️ El nombre y el dorsal deben ir juntos.\n\nSi quieres personalizar la camiseta, debes escribir AMBOS campos:\n• Nombre (ej: MESSI)\n• Dorsal (ej: 10)');
        return;
    }
    const customization = {
        size: size,
        version: document.getElementById('modal-version').value,
        name: name ? name.toUpperCase() : '',
        number: number || '',
        patch: document.getElementById('modal-patch').value,
        extras: []
    };
    let totalPrice = currentProduct.price;
    if (customization.version === 'jugador') totalPrice += 5;
    if (customization.patch && customization.patch !== 'none') {
        totalPrice += patchPrices[customization.patch] || 0;
    }
    if (customization.name && customization.number) {
        totalPrice += 2;
    }
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        image: currentProduct.image,
        basePrice: currentProduct.price,
        price: totalPrice,
        quantity: 1,
        customization: customization
    };
    addToCart(cartItem);
    closeModal();
    if (window.Toast) {
        window.Toast.success(`${currentProduct.name} añadido al carrito`);
    }
    if (window.CartBadge) {
        window.CartBadge.animate();
    }
}
function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(cartItem =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.customization) === JSON.stringify(item.customization)
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(item);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
updateCartCount();
