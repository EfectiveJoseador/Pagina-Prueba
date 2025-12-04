/**
 * Tienda.js - Store page with cascading filters
 */

import products from './products-data.js';

// Global variables
let allProducts = [];
let filteredProducts = [];
let currentProduct = null;
let selectedLeague = '';
let selectedTeam = '';

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

const extraPrices = {
    embolso: 2,
    envio: 5,
    caja: 8,
    manga: 4,
    oficial: 10
};

// Initialize store
function init() {
    allProducts = products;

    // Apply special pricing rules requested
    applySpecialPricing();

    filteredProducts = allProducts;

    populateLeagueFilter();
    renderProducts();
    attachEventListeners();
    setupModal();
    applyURLFilters();
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
        product.sale = true; // Always on sale
    });
}

// Populate League Filter
function populateLeagueFilter() {
    const leagues = [...new Set(allProducts.map(p => p.league))].sort();
    const leagueSelect = document.getElementById('filter-league');

    if (leagueSelect) {
        // Keep first option (Todas las Ligas)
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
        // Hide team step if no league selected
        teamStep.classList.add('hidden');
        selectedTeam = '';
        return;
    }

    // Filter products by league to get teams
    const leagueProducts = allProducts.filter(p => p.league === league);

    // Extract unique teams
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

        // Show team step
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

// Render products to grid
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');

    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    grid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-id="${product.id}">
            <div class="product-image">
                <span class="badge-sale">OFERTA</span>
                <a href="/pages/producto.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="primary-image" loading="lazy">
                    <img src="${product.image.replace('/1_resultado.webp', '/2_resultado.webp')}" alt="${product.name}" class="secondary-image" loading="lazy">
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

    // Attach click handlers for customize buttons
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            openCustomizationModal(productId);
        });
    });
}

// Apply filters from URL parameters
function applyURLFilters() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    // Note: URL filters might need update for new structure, but keeping basic category support
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

    // Update modal and preview
    updatePreview();

    // Open modal
    document.getElementById('customization-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('customization-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Update price preview
function updatePreview() {
    if (!currentProduct) return;

    const basePrice = currentProduct.price;
    let totalPrice = basePrice;
    const details = [];

    // Version
    const version = document.getElementById('modal-version').value;
    if (version === 'jugador') {
        totalPrice += 5;
        details.push('Versión Jugador: +€15');
    }

    // Patch
    const patch = document.getElementById('modal-patch').value;
    if (patch && patch !== 'none') {
        const patchCost = patchPrices[patch] || 0;
        totalPrice += patchCost;
        const patchName = document.getElementById('modal-patch').selectedOptions[0].text;
        details.push(`${patchName}`);
    }

    // Name and number
    const name = document.getElementById('modal-name').value.trim();
    const number = document.getElementById('modal-number').value;
    if (name) {
        details.push(`Nombre: ${name.toUpperCase()}`);
    }
    if (number) {
        details.push(`Dorsal: ${number}`);
    }

    // Update preview
    document.getElementById('preview-base-price').textContent = `€${basePrice.toFixed(2)}`;
    document.getElementById('preview-details').innerHTML = details.length > 0
        ? details.map(d => `<span style="display:block;">• ${d}</span>`).join('')
        : '<span style="color: var(--text-muted); font-style: italic;">No se han seleccionado extras</span>';
    document.getElementById('preview-total-price').textContent = `€${totalPrice.toFixed(2)}`;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

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
