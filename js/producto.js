import products from './products-data.js';

// Price mappings
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

let product = null;
let selectedSize = 'L';

// Carousel state
let carouselProducts = [];
let currentCarouselIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    // Find Product
    product = products.find(p => p.id === productId);

    if (!product) {
        // Redirect to catalog if not found
        window.location.href = '/pages/catalogo.html';
        return;
    }

    // Apply special pricing rules
    applySpecialPricing(product);
    // Also apply to all products for related items
    products.forEach(p => applySpecialPricing(p));

    // Populate Data
    document.title = `${product.name} - Camisetazo`;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `€${product.price.toFixed(2)}`;

    // Inject Offer Badge
    const categoryTag = document.getElementById('product-category');
    const badge = document.createElement('span');
    badge.className = 'badge-sale';
    badge.textContent = 'OFERTA';
    categoryTag.parentNode.insertBefore(badge, categoryTag);

    if (product.oldPrice) {
        const oldPriceEl = document.getElementById('product-old-price');
        oldPriceEl.textContent = `€${product.oldPrice.toFixed(2)}`;
        oldPriceEl.classList.remove('hidden');
    }

    const mainImg = document.getElementById('main-img');
    mainImg.src = product.image;
    mainImg.alt = product.name;

    // Generate thumbnails for all available product images
    const thumbnailsContainer = document.querySelector('.thumbnails');
    const basePath = product.image.replace('/1_resultado.webp', '');

    // Try to load images 1-4
    const imagePromises = [];
    for (let i = 1; i <= 4; i++) {
        const imagePath = `${basePath}/${i}_resultado.webp`;
        imagePromises.push(
            new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ index: i, path: imagePath, exists: true });
                img.onerror = () => resolve({ index: i, path: imagePath, exists: false });
                img.src = imagePath;
            })
        );
    }

    // Wait for all image checks to complete
    let availableImages = [];
    let currentImageIndex = 0;

    Promise.all(imagePromises).then(results => {
        availableImages = results.filter(r => r.exists);

        availableImages.forEach((img, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb ${idx === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${img.path}" alt="View ${img.index}">`;
            thumb.addEventListener('click', () => {
                currentImageIndex = idx;
                updateMainImage();
            });
            thumbnailsContainer.appendChild(thumb);
        });

        // Arrow navigation
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');

        function updateMainImage() {
            mainImg.src = availableImages[currentImageIndex].path;
            document.querySelectorAll('.thumb').forEach((t, i) => {
                t.classList.toggle('active', i === currentImageIndex);
            });
        }

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + availableImages.length) % availableImages.length;
            updateMainImage();
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % availableImages.length;
            updateMainImage();
        });
    });

    // Size selector
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = btn.dataset.size;
            updatePreview();
        });
    });

    // Quantity controls
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });

    document.getElementById('qty-plus').addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value);
        if (currentValue < 10) {
            qtyInput.value = currentValue + 1;
        }
    });

    // Update preview on any change
    document.getElementById('version-select').addEventListener('change', updatePreview);
    document.getElementById('name-input').addEventListener('input', handleNameInput);
    document.getElementById('number-input').addEventListener('input', handleDorsalInput);
    document.getElementById('patch-select').addEventListener('change', updatePreview);

    // Add to cart button
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);

    // Load related products carousel
    loadRelatedProducts();

    // Initial preview update
    updatePreview();
});

// Apply special pricing logic
function applySpecialPricing(p) {
    const nameLower = p.name.toLowerCase();
    const isKids = nameLower.includes('kids') || nameLower.includes('niño');
    const isRetro = p.name.trim().endsWith('R') || p.league === 'retro';
    const isNBA = p.category === 'nba' || p.league === 'nba';

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
    p.oldPrice = oldPrice;
    p.price = newPrice;
    p.sale = true;
}

// Handle name input with real-time validation (only letters and spaces)
function handleNameInput(e) {
    let value = e.target.value;

    // Remove any character that is not a letter or space
    // Allows A-Z, a-z, and accented characters (À-ÿ)
    value = value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');

    e.target.value = value;
    updatePreview();
}

// Handle dorsal input with real-time validation (max 2 digits)
function handleDorsalInput(e) {
    let value = e.target.value;

    // Remove any non-digit characters
    value = value.replace(/\D/g, '');

    // Limit to 2 digits
    if (value.length > 2) {
        value = value.slice(0, 2);
    }

    // Ensure value is between 0-99
    if (value !== '') {
        const numValue = parseInt(value);
        if (numValue > 99) {
            value = '99';
        }
    }

    e.target.value = value;
    updatePreview();
}

function updatePreview() {
    if (!product) return;

    const basePrice = product.price;
    let totalPrice = basePrice;
    const details = [];

    // Version
    const version = document.getElementById('version-select').value;
    if (version === 'jugador') {
        totalPrice += 5;
        details.push('Versión Jugador: +€15');
    }

    // Patch
    const patch = document.getElementById('patch-select').value;
    if (patch && patch !== 'none') {
        const patchCost = patchPrices[patch] || 0;
        totalPrice += patchCost;
        const patchName = document.getElementById('patch-select').selectedOptions[0].text;
        details.push(patchName);
    }

    // Name and number
    const name = document.getElementById('name-input').value.trim();
    const number = document.getElementById('number-input').value;
    if (name) {
        details.push(`Nombre: ${name.toUpperCase()}`);
    }
    if (number) {
        details.push(`Dorsal: ${number}`);
    }
    if (selectedSize) {
        details.push(`Talla: ${selectedSize}`);
    }

    // Update preview display
    document.getElementById('preview-base').textContent = `€${basePrice.toFixed(2)}`;
    document.getElementById('preview-list').innerHTML = details.length > 0
        ? details.map(d => `<span>• ${d}</span>`).join('')
        : '<span style="color: var(--text-muted); font-style: italic;">Sin personalizaciones</span>';
    document.getElementById('preview-total').textContent = `€${totalPrice.toFixed(2)}`;
}

function showToast(message) {
    // Remove existing toast if any
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

function addToCart() {
    const name = document.getElementById('name-input').value.trim();
    const number = document.getElementById('number-input').value;

    // Validation
    if (name && !/^[A-Za-zÀ-ÿ\s]+$/.test(name)) {
        alert('El nombre solo puede contener letras y espacios');
        return;
    }

    if (number) {
        const numValue = parseInt(number);
        if (number.length > 2 || numValue < 0 || numValue > 99 || isNaN(numValue)) {
            alert('El dorsal debe ser un número entre 0 y 99 (máximo 2 dígitos)');
            return;
        }
    }

    // NUEVA VALIDACIÓN: Nombre y dorsal deben ir juntos
    if ((name && !number) || (!name && number)) {
        alert('⚠️ El nombre y el dorsal deben ir juntos.\n\nSi quieres personalizar la camiseta, debes escribir AMBOS campos:\n• Nombre (ej: MESSI)\n• Dorsal (ej: 10)');
        return;
    }

    // Gather customization data
    const customization = {
        size: selectedSize,
        version: document.getElementById('version-select').value,
        name: name ? name.toUpperCase() : '',
        number: number || '',
        patch: document.getElementById('patch-select').value
    };

    // Calculate total price
    let totalPrice = product.price;
    if (customization.version === 'jugador') totalPrice += 5;
    if (customization.patch && customization.patch !== 'none') {
        totalPrice += patchPrices[customization.patch] || 0;
    }

    // Get quantity
    const quantity = parseInt(document.getElementById('qty-input').value) || 1;

    // Create cart item
    const cartItem = {
        id: product.id,
        name: product.name,
        image: product.image,
        basePrice: product.price,
        price: totalPrice,
        quantity: quantity,
        customization: customization
    };

    // Add to cart (localStorage)
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existingIndex = cart.findIndex(item =>
        item.id === cartItem.id &&
        JSON.stringify(item.customization) === JSON.stringify(cartItem.customization)
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Success feedback (Toast)
    showToast(`${product.name} añadido al carrito`);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

// Extract team name from product name
function extractTeamName(productName) {
    // Remove year patterns, keywords like Local/Visitante/Tercera/Retro/Icon, and (Kids)
    let team = productName.replace(/\d{2}\/\d{2}/, '');
    team = team.replace(/(Local|Visitante|Tercera|Retro|Icon|Kids|\(Kids\))/gi, '');
    return team.trim();
}

// Load related products carousel
function loadRelatedProducts() {
    if (!products || products.length === 0) return;

    // Logic to find related products:
    // 1. Same Team (highest priority)
    // 2. Same League
    // 3. Same Category
    // 4. Random (fallback to fill carousel)

    const currentTeam = extractTeamName(product.name);

    // 1. Same Team
    let related = products.filter(p => {
        if (p.id === product.id) return false;
        const pTeam = extractTeamName(p.name);
        return pTeam === currentTeam && p.league === product.league;
    });

    // Helper to get IDs of current related products
    const getRelatedIds = () => new Set(related.map(r => r.id));

    // 2. Same League
    if (related.length < 12) {
        let currentIds = getRelatedIds();
        const leagueRelated = products.filter(p =>
            p.id !== product.id &&
            p.league === product.league &&
            !currentIds.has(p.id)
        );
        related = [...related, ...leagueRelated];
    }

    // 3. Same Category
    if (related.length < 12) {
        let currentIds = getRelatedIds();
        const categoryRelated = products.filter(p =>
            p.id !== product.id &&
            p.category === product.category &&
            !currentIds.has(p.id)
        );
        related = [...related, ...categoryRelated];
    }

    // 4. Random fallback to ensure we have enough items for a nice carousel
    if (related.length < 12) {
        let currentIds = getRelatedIds();
        const randomFill = products.filter(p =>
            p.id !== product.id &&
            !currentIds.has(p.id)
        );
        // Shuffle random fill
        randomFill.sort(() => Math.random() - 0.5);
        related = [...related, ...randomFill];
    }

    // Slice to max 12 items
    carouselProducts = related.slice(0, 12);
    currentCarouselIndex = 0;

    renderCarousel();
    attachCarouselListeners();

    // Recalculate on resize
    window.addEventListener('resize', () => {
        updateCarouselButtons();
        updateCarouselPosition();
    });
}

function renderCarousel() {
    const container = document.getElementById('related-grid');

    // Create carousel HTML
    container.innerHTML = `
        <button class="carousel-arrow carousel-arrow-left" id="carousel-prev">
            <i class="fas fa-chevron-left"></i>
        </button>
        <div class="carousel-container">
            <div class="carousel-track" id="carousel-track">
                ${carouselProducts.map(p => `
                    <article class="product-card">
                        <div class="product-image">
                            <span class="badge-sale">OFERTA</span>
                            <a href="/pages/producto.html?id=${p.id}">
                                <img src="${p.image}" alt="${p.name}" loading="lazy">
                            </a>
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${p.name}</h3>
                            <div class="product-price">
                                <span class="price-old">€${p.oldPrice.toFixed(2)}</span>
                                <span class="price">€${p.price.toFixed(2)}</span>
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
        <button class="carousel-arrow carousel-arrow-right" id="carousel-next">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    updateCarouselButtons();
}

function getVisibleCards() {
    const container = document.querySelector('.carousel-container');
    if (!container) return 4; // Default
    const cardWidth = 220;
    const gap = 24;
    return Math.floor(container.offsetWidth / (cardWidth + gap));
}

function attachCarouselListeners() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentCarouselIndex > 0) {
                currentCarouselIndex--;
                updateCarouselPosition();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const visibleCards = getVisibleCards();
            const maxIndex = Math.max(0, carouselProducts.length - visibleCards);
            if (currentCarouselIndex < maxIndex) {
                currentCarouselIndex++;
                updateCarouselPosition();
            }
        });
    }
}

function updateCarouselPosition() {
    const track = document.getElementById('carousel-track');
    if (track) {
        const cardWidth = 220; // Min width of card (matches CSS)
        const gap = 24; // 1.5rem gap (matches CSS)
        const offset = currentCarouselIndex * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
        updateCarouselButtons();
    }
}

function updateCarouselButtons() {
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, carouselProducts.length - visibleCards);

    if (prevBtn) {
        prevBtn.classList.toggle('disabled', currentCarouselIndex === 0);
    }

    if (nextBtn) {
        nextBtn.classList.toggle('disabled', currentCarouselIndex >= maxIndex);
    }
}
