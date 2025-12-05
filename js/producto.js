import products from './products-data.js';

// Price mappings - must match HTML text
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
    document.getElementById('name-input').addEventListener('input', updatePreview);
    document.getElementById('number-input').addEventListener('input', handleDorsalInput);
    document.getElementById('patch-select').addEventListener('change', updatePreview);

    // Add to cart button
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);

    // Load related products
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
        details.push('Versión Jugador: +€5');
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
    if (customization.version === 'jugador') totalPrice += 15;
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

    // Success feedback - Toast notification
    showToast(`${product.name} añadido al carrito`);
}

// Toast notification system
function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) existingToast.remove();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .cart-toast {
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--bg-card, #1a1a2e);
                color: var(--text-main, #fff);
                padding: 1rem 1.5rem;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 0.95rem;
                font-weight: 500;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: toastSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                border: 1px solid var(--border, rgba(255,255,255,0.1));
            }
            .cart-toast i {
                color: #22c55e;
                font-size: 1.25rem;
            }
            @keyframes toastSlideUp {
                from {
                    transform: translateX(-50%) translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            @keyframes toastSlideDown {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(100px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideDown 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
    }
}

function loadRelatedProducts() {
    // Logic to find related products:
    // 1. Same League (most relevant)
    // 2. Same Category (fallback)
    // Exclude current product

    let related = products.filter(p => p.id !== product.id && p.league === product.league);

    // If not enough products from same league, add from same category
    if (related.length < 4) {
        const moreRelated = products.filter(p =>
            p.id !== product.id &&
            p.category === product.category &&
            !related.includes(p)
        );
        related = [...related, ...moreRelated];
    }

    // Shuffle and pick 4
    const finalRelated = related.sort(() => Math.random() - 0.5).slice(0, 4);

    const grid = document.getElementById('related-grid');

    // Use the exact same card structure as Tienda for consistency
    grid.innerHTML = finalRelated.map(p => `
        <article class="product-card">
            <div class="product-image">
                <span class="badge-sale">OFERTA</span>
                <a href="/pages/producto.html?id=${p.id}">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </a>
                <button class="btn-quick-view"><i class="fas fa-eye"></i></button>
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">
                    <span class="price-old">€${p.oldPrice.toFixed(2)}</span>
                    <span class="price">€${p.price.toFixed(2)}</span>
                </div>
            </div>
        </article>
    `).join('');

    // Re-attach quick view listeners if needed (optional for related section but good for consistency)
    // For now, we just ensure the links work, which they do via the <a> tag.
}

// Update cart count on page load
updateCartCount();

// ============================================
// SIZE GUIDE MODAL
// ============================================
const SIZE_GUIDE_IMAGES = {
    kids: '/assets/images/guia tallas niños_resultado.webp',
    nba: '/assets/images/guias tallas nba_resultado.webp',
    normal: '/assets/images/guia tallas camisetas futbol_resultado.webp'
};

function getProductType() {
    if (!product) return 'normal';
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('kids') || nameLower.includes('niño')) return 'kids';
    if (product.category === 'nba' || product.league === 'nba') return 'nba';
    return 'normal';
}

function openSizeGuide() {
    const productType = getProductType();
    const imageSrc = SIZE_GUIDE_IMAGES[productType] || SIZE_GUIDE_IMAGES.normal;

    const modal = document.getElementById('size-guide-modal');
    const img = document.getElementById('size-guide-image');

    if (img) img.src = imageSrc;
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSizeGuide() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize size guide listeners
document.addEventListener('DOMContentLoaded', () => {
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideClose = document.getElementById('size-guide-close');
    const sizeGuideOverlay = document.querySelector('.size-guide-overlay');

    if (sizeGuideBtn) sizeGuideBtn.addEventListener('click', openSizeGuide);
    if (sizeGuideClose) sizeGuideClose.addEventListener('click', closeSizeGuide);
    if (sizeGuideOverlay) sizeGuideOverlay.addEventListener('click', closeSizeGuide);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSizeGuide();
    });
});

// ============================================
// LIGHTBOX SYSTEM - Amazon Style with Zoom Slider
// ============================================
let lightboxImages = [];
let currentLightboxIndex = 0;
let zoomLevel = 1;
let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;
let lastTouchDistance = 0;

function initLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (!lightbox) return;

    const wrapper = document.getElementById('lightbox-wrapper');
    const mainImageContainer = document.querySelector('.main-image');
    const zoomSlider = document.getElementById('zoom-slider');

    // Open lightbox on main image click
    if (mainImageContainer) {
        mainImageContainer.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-arrow')) return;
            openLightbox();
        });
    }

    // Close handlers
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-overlay')?.addEventListener('click', closeLightbox);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Arrow navigation
    document.getElementById('lightbox-prev')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => navigateLightbox(1));

    // Zoom slider control
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            zoomLevel = parseInt(e.target.value) / 100;
            updateZoomDisplay();
            clampTranslation();
            applyTransform();
        });
    }

    // Zoom buttons
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
        setZoomLevel(Math.min(3, zoomLevel + 0.25));
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
        setZoomLevel(Math.max(1, zoomLevel - 0.25));
    });

    // Mouse wheel zoom
    if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoomLevel(Math.min(3, Math.max(1, zoomLevel + delta)));
        }, { passive: false });

        // Double click to toggle zoom
        wrapper.addEventListener('dblclick', () => {
            setZoomLevel(zoomLevel > 1 ? 1 : 2);
        });

        // Mouse drag for panning - CONTROLLED speed
        wrapper.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            wrapper.classList.add('dragging');
        });

        wrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();

            // Controlled speed - 0.4x for smoother movement
            const deltaX = (e.clientX - startX);
            const deltaY = (e.clientY - startY);

            translateX += deltaX;
            translateY += deltaY;

            startX = e.clientX;
            startY = e.clientY;

            clampTranslation();
            applyTransform();
        });

        wrapper.addEventListener('mouseleave', () => {
            isDragging = false;
            wrapper.classList.remove('dragging');
        });
    }

    document.addEventListener('mouseup', () => {
        isDragging = false;
        const w = document.getElementById('lightbox-wrapper');
        if (w) w.classList.remove('dragging');
    });

    // Touch support
    if (wrapper) {
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.addEventListener('touchend', handleTouchEnd);
    }
}

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        lastTouchDistance = getTouchDistance(e.touches);
    } else if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches);
        const delta = (currentDistance - lastTouchDistance) * 0.01;
        lastTouchDistance = currentDistance;
        setZoomLevel(Math.min(3, Math.max(1, zoomLevel + delta)));
    } else if (e.touches.length === 1 && isDragging) {
        const deltaX = (e.touches[0].clientX - startX);
        const deltaY = (e.touches[0].clientY - startY);
        translateX += deltaX;
        translateY += deltaY;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        clampTranslation();
        applyTransform();
    }
}

function handleTouchEnd() {
    isDragging = false;
    lastTouchDistance = 0;
}

function getTouchDistance(touches) {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
}

function setZoomLevel(level) {
    zoomLevel = level;
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = Math.round(zoomLevel * 100);
    updateZoomDisplay();

    if (zoomLevel === 1) {
        translateX = 0;
        translateY = 0;
    }

    clampTranslation();
    const wrapper = document.getElementById('lightbox-wrapper');
    if (wrapper) wrapper.classList.toggle('zoomed', zoomLevel > 1);
    applyTransform();
}

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level-display');
    if (display) display.textContent = Math.round(zoomLevel * 100) + '%';
}

function clampTranslation() {
    const image = document.getElementById('lightbox-image');
    if (!image || zoomLevel <= 1) {
        translateX = 0;
        translateY = 0;
        return;
    }

    // Calculate boundaries
    const rect = image.getBoundingClientRect();
    const maxX = (rect.width * (zoomLevel - 1)) / (2 * zoomLevel);
    const maxY = (rect.height * (zoomLevel - 1)) / (2 * zoomLevel);

    translateX = Math.max(-maxX, Math.min(maxX, translateX));
    translateY = Math.max(-maxY, Math.min(maxY, translateY));
}

function resetZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = 100;
    updateZoomDisplay();
    const wrapper = document.getElementById('lightbox-wrapper');
    if (wrapper) wrapper.classList.remove('zoomed');
    applyTransform();
}

function applyTransform() {
    const image = document.getElementById('lightbox-image');
    if (image) {
        // Middle ground: divide by partial zoomLevel for balanced movement
        const factor = 1 + (zoomLevel - 1) * 0.5; // At zoom 2x, factor = 1.5
        const tx = translateX / factor;
        const ty = translateY / factor;
        image.style.transform = `scale(${zoomLevel}) translate(${tx}px, ${ty}px)`;
    }
}

function openLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const thumbsContainer = document.getElementById('lightbox-thumbnails');
    if (!lightbox || !lightboxImage) return;

    const thumbs = document.querySelectorAll('.thumbnails .thumb img');
    lightboxImages = Array.from(thumbs).map(img => img.src);

    if (lightboxImages.length === 0) {
        const mainImg = document.getElementById('main-img');
        if (mainImg) lightboxImages = [mainImg.src];
    }

    const currentMainSrc = document.getElementById('main-img')?.src;
    currentLightboxIndex = lightboxImages.findIndex(src => src === currentMainSrc);
    if (currentLightboxIndex === -1) currentLightboxIndex = 0;

    if (thumbsContainer) {
        thumbsContainer.innerHTML = lightboxImages.map((src, i) => `
            <div class="lightbox-thumb ${i === currentLightboxIndex ? 'active' : ''}" data-index="${i}">
                <img src="${src}" alt="Miniatura ${i + 1}">
            </div>
        `).join('');

        thumbsContainer.querySelectorAll('.lightbox-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                currentLightboxIndex = parseInt(thumb.dataset.index);
                updateLightboxImage();
            });
        });
    }

    resetZoom();
    lightboxImage.src = lightboxImages[currentLightboxIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        resetZoom();
    }
}

function navigateLightbox(direction) {
    currentLightboxIndex = (currentLightboxIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
    resetZoom();
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
        lightboxImage.src = lightboxImages[currentLightboxIndex];
    }
    document.querySelectorAll('.lightbox-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === currentLightboxIndex);
    });
    // Reset zoom when changing image
    resetZoom();
}

// Initialize lightbox when DOM is ready
document.addEventListener('DOMContentLoaded', initLightbox);
