import products from './products-data.js';
const patchPrices = {
    none: 0,
    liga: 1,
    premier: 1,
    seriea: 1,
    bundesliga: 1,
    ligue1: 1,
    champions: 1,
    europa: 1,
    mundial_clubes: 1,
    copamundo: 1,
    eurocopa: 1,
    copa_america: 1
};

const PATCH_DEFINITIONS = {
    liga: "La Liga",
    premier: "Premier League",
    seriea: "Serie A",
    bundesliga: "Bundesliga",
    ligue1: "Ligue 1",
    champions: "Champions League",
    europa: "Europa League",
    mundial_clubes: "Mundial de Clubes",
    copamundo: "Copa del Mundo",
    eurocopa: "Eurocopa",
    copa_america: "Copa América"
};

let product = null;
let selectedSize = 'L';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    product = products.find(p => p.id === productId);

    if (!product) {
        window.location.href = '/pages/catalogo.html';
        return;
    }
    applySpecialPricing(product);
    products.forEach(p => applySpecialPricing(p));
    document.title = `${product.name} - Camisetazo`;
    document.getElementById('breadcrumb-name').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `€${product.price.toFixed(2)}`;


    if (product.oldPrice) {
        const oldPriceEl = document.getElementById('product-old-price');
        oldPriceEl.textContent = `€${product.oldPrice.toFixed(2)}`;
        oldPriceEl.classList.remove('hidden');
    }

    const mainImg = document.getElementById('main-img');
    mainImg.src = product.image;
    mainImg.alt = product.imageAlt || product.name;

    // Add error handling for external images (e.g., Yupoo)
    mainImg.onerror = function () {
        this.onerror = null;
        this.src = '/assets/images/placeholder-jersey.webp';
        console.warn('Failed to load product image:', product.image);
    };

    const thumbnailsContainer = document.querySelector('.thumbnails');
    let availableImages = [];
    let currentImageIndex = 0;

    /**
     * Loads images for the gallery
     * Supports both:
     * - New format: product.images[] array (from Yupoo imports)
     * - Legacy format: probing /1.webp, /2.webp, etc paths
     */
    async function loadProductImages() {
        // Check if product has explicit images array (Yupoo imports)
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Use explicit images array
            const allImages = [product.image, ...product.images];

            // Validate each image
            const imagePromises = allImages.map((imgUrl, index) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ index: index + 1, path: imgUrl, exists: true });
                    img.onerror = () => resolve({ index: index + 1, path: imgUrl, exists: false });
                    img.src = imgUrl;
                    // Timeout for slow external images
                    setTimeout(() => resolve({ index: index + 1, path: imgUrl, exists: false }), 5000);
                });
            });

            const results = await Promise.all(imagePromises);
            availableImages = results.filter(r => r.exists);

        } else {
            // Legacy: probe for local images by path pattern
            const basePath = product.image.replace('/1.webp', '');
            const imagePromises = [];

            for (let i = 1; i <= 4; i++) {
                const imagePath = `${basePath}/${i}.webp`;
                imagePromises.push(
                    new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve({ index: i, path: imagePath, exists: true });
                        img.onerror = () => resolve({ index: i, path: imagePath, exists: false });
                        img.src = imagePath;
                    })
                );
            }

            const results = await Promise.all(imagePromises);
            availableImages = results.filter(r => r.exists);
        }

        // Fallback: ensure at least the main image is shown
        if (availableImages.length === 0 && product.image) {
            availableImages = [{ index: 1, path: product.image, exists: true }];
        }

        // Render thumbnails
        availableImages.forEach((img, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `thumb ${idx === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${img.path}" alt="Vista ${img.index}" onerror="this.style.display='none'">`;
            thumb.addEventListener('click', () => {
                currentImageIndex = idx;
                updateMainImage();
            });
            thumbnailsContainer.appendChild(thumb);
        });

        // Setup navigation
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');

        prevBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + availableImages.length) % availableImages.length;
            updateMainImage();
        });

        nextBtn.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % availableImages.length;
            updateMainImage();
        });
    }

    function updateMainImage() {
        if (availableImages[currentImageIndex]) {
            mainImg.src = availableImages[currentImageIndex].path;
            document.querySelectorAll('.thumb').forEach((t, i) => {
                t.classList.toggle('active', i === currentImageIndex);
            });
        }
    }

    // Load images
    loadProductImages();

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = btn.dataset.size;
            updatePreview();
        });
    });
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
    document.getElementById('version-select').addEventListener('change', updatePreview);
    document.getElementById('name-input').addEventListener('input', handleNameInput);
    document.getElementById('number-input').addEventListener('input', handleDorsalInput);
    document.getElementById('patch-select').addEventListener('change', updatePreview);
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    loadRelatedProducts();
    renderPatchOptions();
    applyProductRestrictions();
    updatePreview();
    if (window.Analytics) {
        window.Analytics.trackProductView({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            team: product.team || product.league
        });
    }
});
function applySpecialPricing(p) {
    const nameLower = p.name.toLowerCase();
    const isKids = nameLower.includes('kids') || nameLower.includes('niño');
    const isRetro = p.name.trim().endsWith('R') || p.league === 'retro';
    const isNBA = p.category === 'nba' || p.league === 'nba';
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
    p.oldPrice = oldPrice;
    p.price = newPrice;
    p.sale = true;
}

function isRestrictedCategory() {
    if (!product) return { isRestricted: false, isNBA: false };
    const nameLower = product.name.toLowerCase();
    const isKids = nameLower.includes('kids') || nameLower.includes('niño');
    const isRetro = product.name.trim().endsWith('R') || product.league === 'retro';
    const isNBA = product.category === 'nba' || product.league === 'nba';

    return {
        isRestricted: isKids || isNBA || isRetro,
        isNBA: isNBA,
        isKids: isKids,
        isRetro: isRetro
    };
}

function getAllowedPatches(product) {
    if (!product) return [];

    const allowed = [];
    const league = product.league;

    if (league === 'selecciones' || product.category === 'selecciones') {
        allowed.push('copamundo');
        allowed.push('eurocopa');
        allowed.push('copa_america');
        return allowed;
    }

    allowed.push('champions');
    allowed.push('europa');
    allowed.push('mundial_clubes');

    switch (league) {
        case 'laliga':
            allowed.push('liga');
            break;
        case 'premier':
            allowed.push('premier');
            break;
        case 'seriea':
            allowed.push('seriea');
            break;
        case 'bundesliga':
            allowed.push('bundesliga');
            break;
        case 'ligue1':
            allowed.push('ligue1');
            break;
    }

    return allowed;
}

function renderPatchOptions() {
    const patchSelect = document.getElementById('patch-select');
    if (!patchSelect || !product) return;

    patchSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = 'none';
    defaultOption.textContent = 'Sin parches';
    patchSelect.appendChild(defaultOption);

    const allowedPatches = getAllowedPatches(product);

    allowedPatches.forEach(patchKey => {
        if (PATCH_DEFINITIONS[patchKey]) {
            const option = document.createElement('option');
            option.value = patchKey;
            option.textContent = PATCH_DEFINITIONS[patchKey];
            patchSelect.appendChild(option);
        }
    });
}

function applyProductRestrictions() {
    const { isRestricted, isNBA } = isRestrictedCategory();

    const versionSelect = document.getElementById('version-select');
    const versionGroup = versionSelect?.closest('.option-group');
    const patchSelect = document.getElementById('patch-select');
    const patchGroup = patchSelect?.closest('.option-group');
    const numberInput = document.getElementById('number-input');
    const numberLabel = numberInput?.previousElementSibling;
    const nameInput = document.getElementById('name-input');
    const nameLabel = nameInput?.previousElementSibling;
    if (isRestricted && versionGroup) {
        versionGroup.style.display = 'none';
        if (versionSelect) {
            versionSelect.value = 'aficionado';
        }
    }
    if (isNBA) {
        if (patchGroup) {
            patchGroup.style.display = 'none';
        }
        if (patchSelect) {
            patchSelect.value = 'none';
        }
    }
}
function handleNameInput(e) {
    let value = e.target.value;
    value = value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
    if (value.length > 15) {
        value = value.slice(0, 15);
    }

    e.target.value = value;
    updatePreview();
}
function handleDorsalInput(e) {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.slice(0, 2);
    }
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
    const version = document.getElementById('version-select').value;
    if (version === 'jugador') {
        totalPrice += 5;
        details.push('Versión Jugador: +€5');
    }
    const patch = document.getElementById('patch-select').value;
    if (patch && patch !== 'none') {
        const patchCost = patchPrices[patch] || 0;
        totalPrice += patchCost;
        const patchName = document.getElementById('patch-select').selectedOptions[0].text;
        details.push(patchName);
    }
    const name = document.getElementById('name-input').value.trim();
    const number = document.getElementById('number-input').value;
    if (name && number) {
        totalPrice += 2;
        details.push(`Nombre: ${name.toUpperCase()}`);
        details.push(`Dorsal: ${number}`);
        details.push('Personalización: +€2');
    } else if (name) {
        details.push(`Nombre: ${name.toUpperCase()}`);
    } else if (number) {
        details.push(`Dorsal: ${number}`);
    }
    if (selectedSize) {
        details.push(`Talla: ${selectedSize}`);
    }
    document.getElementById('preview-base').textContent = `€${basePrice.toFixed(2)}`;
    document.getElementById('preview-list').innerHTML = details.length > 0
        ? details.map(d => `<span>• ${d}</span>`).join('')
        : '<span style="color: var(--text-muted); font-style: italic;">Sin personalizaciones</span>';
    document.getElementById('preview-total').textContent = `€${totalPrice.toFixed(2)}`;
}

function addToCart() {
    const name = document.getElementById('name-input').value.trim();
    const number = document.getElementById('number-input').value;
    const hasName = name.length > 0;
    const hasNumber = number.length > 0;

    if (hasName !== hasNumber) {
        alert('Debes completar tanto el nombre como el dorsal, o dejar ambos vacíos');
        return;
    }
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
    const customization = {
        size: selectedSize,
        version: document.getElementById('version-select').value,
        name: name ? name.toUpperCase() : '',
        number: number || '',
        patch: document.getElementById('patch-select').value
    };
    let totalPrice = product.price;
    if (customization.version === 'jugador') totalPrice += 5;
    if (customization.patch && customization.patch !== 'none') {
        totalPrice += patchPrices[customization.patch] || 0;
    }
    if (customization.name && customization.number) {
        totalPrice += 2;
    }
    const quantity = parseInt(document.getElementById('qty-input').value) || 1;
    const cartItem = {
        id: product.id,
        name: product.name,
        image: product.image,
        basePrice: product.price,
        price: totalPrice,
        quantity: quantity,
        customization: customization
    };
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
    if (window.Toast) {
        window.Toast.success(`${product.name} añadido al carrito`);
    } else {
        showToast(`${product.name} añadido al carrito`);
    }
    if (window.CartBadge) {
        window.CartBadge.animate();
    }
    if (window.Analytics) {
        window.Analytics.trackAddToCart(product, quantity, customization);
    }
}
function showToast(message) {
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
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
    const getTeamBase = (name) => {
        return name
            .replace(/\d{2}\/\d{2}/, '')
            .replace(/(Local|Visitante|Tercera|Retro|Icon)/gi, '')
            .replace(/\(Kids\)/gi, '')
            .trim();
    };

    const currentTeam = getTeamBase(product.name);
    const sameTeam = products.filter(p =>
        p.id !== product.id && getTeamBase(p.name) === currentTeam
    );
    const sameLeague = products.filter(p =>
        p.id !== product.id &&
        p.league === product.league &&
        getTeamBase(p.name) !== currentTeam
    );
    const sameCategory = products.filter(p =>
        p.id !== product.id &&
        p.category === product.category &&
        p.league !== product.league &&
        getTeamBase(p.name) !== currentTeam
    );
    const shuffledLeague = sameLeague.sort(() => Math.random() - 0.5);
    const shuffledCategory = sameCategory.sort(() => Math.random() - 0.5);

    const combined = [...sameTeam, ...shuffledLeague, ...shuffledCategory];
    const finalRelated = combined.slice(0, 8);

    const grid = document.getElementById('related-grid');
    const cardsHtml = finalRelated.map(p => `
        <article class="product-card">
            <div class="product-image">
                <span class="badge-sale">OFERTA</span>
                <a href="/pages/producto.html?id=${p.id}">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </a>
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

    grid.innerHTML = `
        <div class="carousel-container">
            <div class="carousel-track">
                ${cardsHtml}
            </div>
        </div>
        <div class="carousel-arrows">
            <button class="carousel-arrow carousel-arrow-left" id="related-prev">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-arrow carousel-arrow-right" id="related-next">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    initRelatedCarousel();
}

function initRelatedCarousel() {
    const grid = document.getElementById('related-grid');
    const track = grid?.querySelector('.carousel-track');
    const prevBtn = document.getElementById('related-prev');
    const nextBtn = document.getElementById('related-next');

    if (!track || !prevBtn || !nextBtn) return;

    const originalCards = Array.from(track.querySelectorAll('.product-card'));
    if (originalCards.length === 0) return;

    const cardWidth = 220 + 24;
    const totalCards = originalCards.length;

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

    const AUTO_PLAY_DELAY = 4000;
    const TRANSITION_DURATION = 600;

    function setPosition(index, animate = true, slow = false) {
        if (animate) {
            const duration = slow ? TRANSITION_DURATION : 150;
            track.style.transition = `transform ${duration}ms ease-out`;
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = `translateX(${-(index * cardWidth)}px)`;
    }

    function handleTransitionEnd() {
        if (isJumping) return;

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

    function autoAdvance() {
        if (isJumping || isPaused) return;
        currentIndex++;
        setPosition(currentIndex, true, true);
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
        setPosition(currentIndex, true, false);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isJumping) return;
        handleUserInteraction();
        currentIndex++;
        setPosition(currentIndex, true, false);
    });

    grid.addEventListener('mouseenter', pauseAutoPlay);
    grid.addEventListener('mouseleave', () => {
        if (resumeTimeout) clearTimeout(resumeTimeout);
        resumeAutoPlay();
    });

    setPosition(currentIndex, false);
    track.offsetHeight;

    startAutoPlay();

    const carouselContainer = grid?.querySelector('.carousel-container');

    const isMobile = window.innerWidth <= 768;
    if (isMobile && carouselContainer) {
        carouselContainer.addEventListener('scroll', () => {
            const scrollLeft = carouselContainer.scrollLeft;
            const scrollWidth = carouselContainer.scrollWidth;
            const clientWidth = carouselContainer.clientWidth;

            if (scrollLeft + clientWidth >= scrollWidth - 400) {
                originalCards.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.classList.add('carousel-clone');
                    track.appendChild(clone);
                });
            }

            if (scrollLeft <= 400) {
                const currentScrollLeft = carouselContainer.scrollLeft;
                const cardsToAdd = [...originalCards].reverse();
                let addedWidth = 0;

                cardsToAdd.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.classList.add('carousel-clone');
                    track.insertBefore(clone, track.firstChild);
                    addedWidth += clone.offsetWidth + 16;
                });

                carouselContainer.scrollLeft = currentScrollLeft + addedWidth;
            }

            carouselContainer.classList.add('scrolled');
        }, { passive: true });
    } else if (carouselContainer) {
        carouselContainer.addEventListener('scroll', () => {
            carouselContainer.classList.add('scrolled');
            handleUserInteraction();
        }, { passive: true });
    }
}
updateCartCount();
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
document.addEventListener('DOMContentLoaded', () => {
    const sizeGuideBtn = document.getElementById('size-guide-btn');
    const sizeGuideClose = document.getElementById('size-guide-close');
    const sizeGuideOverlay = document.querySelector('.size-guide-overlay');

    if (sizeGuideBtn) sizeGuideBtn.addEventListener('click', openSizeGuide);
    if (sizeGuideClose) sizeGuideClose.addEventListener('click', closeSizeGuide);
    if (sizeGuideOverlay) sizeGuideOverlay.addEventListener('click', closeSizeGuide);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSizeGuide();
    });
});
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
    if (mainImageContainer) {
        mainImageContainer.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-arrow')) return;
            openLightbox();
        });
    }
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-overlay')?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
    document.getElementById('lightbox-prev')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => navigateLightbox(1));
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            zoomLevel = parseInt(e.target.value) / 100;
            updateZoomDisplay();
            clampTranslation();
            applyTransform();
        });
    }
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
        setZoomLevel(Math.min(3, zoomLevel + 0.25));
    });

    document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
        setZoomLevel(Math.max(1, zoomLevel - 0.25));
    });
    if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoomLevel(Math.min(3, Math.max(1, zoomLevel + delta)));
        }, { passive: false });
        wrapper.addEventListener('dblclick', () => {
            setZoomLevel(zoomLevel > 1 ? 1 : 2);
        });
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
        const factor = 1 + (zoomLevel - 1) * 0.5;
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
    resetZoom();
}
document.addEventListener('DOMContentLoaded', initLightbox);
