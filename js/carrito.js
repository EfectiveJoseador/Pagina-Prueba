import products from './products-data.js';

// Apply special pricing to match tienda.js
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
        product.sale = true;
    });
}

// Apply pricing immediately on import
applySpecialPricing();

// Cart Manager
const Cart = {
    items: [],

    init() {
        this.load();
        this.render();
        this.updateHeaderCount();
    },

    load() {
        const stored = localStorage.getItem('cart');
        if (stored) {
            this.items = JSON.parse(stored);
        } else {
            this.items = [];
        }
    },

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateHeaderCount();
    },

    add(id, qty = 1, size = 'M', version = 'aficionado') {
        const existing = this.items.find(i => i.id === id && i.size === size && i.version === version);
        if (existing) {
            existing.qty += qty;
        } else {
            this.items.push({ id, qty, size, version });
        }
        this.save();
        this.render();
    },

    remove(index) {
        this.items.splice(index, 1);
        this.save();
        this.render();
    },

    updateQty(index, newQty) {
        if (newQty < 1) return;
        // Handle both quantity and qty properties
        this.items[index].quantity = newQty;
        this.items[index].qty = newQty;
        this.save();
        this.render();
    },

    updateHeaderCount() {
        const count = this.items.reduce((acc, item) => acc + (item.quantity || item.qty || 1), 0);
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = count;
    },

    calculateTotal() {
        let totalQty = 0;
        let surcharges = 0;

        // 1. Calculate total quantity and surcharges
        this.items.forEach(item => {
            const qty = item.quantity || item.qty || 1;
            totalQty += qty;

            // Calculate surcharge: (Item Price - 19.90) * Qty
            const itemPrice = item.price || item.basePrice || 0;
            const surcharge = Math.max(0, itemPrice - 19.90);
            surcharges += surcharge * qty;
        });

        if (totalQty === 0) return { subtotal: 0, shipping: 0, total: 0 };

        // 2. Calculate Pack Base Price (Cyclic every 5 units)
        const fullCycles = Math.floor(totalQty / 5);
        const remainder = totalQty % 5;

        let packBasePrice = fullCycles * 85.90; // Megapack price

        // Remainder logic
        if (remainder === 1) {
            packBasePrice += 19.90;
        } else if (remainder === 2) {
            packBasePrice += 19.90 * 2;
        } else if (remainder === 3) {
            packBasePrice += 56.90; // Pack Popular
        } else if (remainder === 4) {
            packBasePrice += 56.90 + 19.90;
        }

        // 3. Subtotal (products only, no shipping)
        const subtotal = packBasePrice + surcharges;

        // 4. Calculate Shipping
        let shipping = 0;
        if (totalQty === 1) {
            shipping = 1.90;
        }

        // 5. Final Total (subtotal + shipping)
        const total = subtotal + shipping;

        // Update Shipping Display
        const shippingEl = document.getElementById('shipping-price');
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`;
        }

        // Render Pack Indicators
        this.renderPackIndicators(totalQty);

        return { subtotal, shipping, total };
    },

    renderPackIndicators(totalQty) {
        // Target the summary card
        const summaryCard = document.querySelector('.cart-summary');
        if (!summaryCard) return;

        // Create or get container INSIDE summary card
        let container = document.getElementById('pack-indicator-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pack-indicator-container';
            container.className = 'pack-indicator-container';
            summaryCard.appendChild(container);
        }

        container.innerHTML = '';

        // NEW LOGIC: Only multiples of 3 or 5
        const isMult3 = totalQty % 3 === 0 && totalQty > 0;
        const isMult5 = totalQty % 5 === 0 && totalQty > 0;

        // If both, prefer MEGAPACK (superior pack)
        let packType = null;
        let multiplier = 0;

        if (isMult5) {
            packType = 'mega';
            multiplier = totalQty / 5;
        } else if (isMult3) {
            packType = 'popular';
            multiplier = totalQty / 3;
        }

        // No pack activated
        if (!packType) {
            container.classList.remove('visible');
            return;
        }

        // Create single badge
        const badge = document.createElement('div');
        const glowLevel = Math.min(multiplier, 4); // Cap at x4 for glow

        if (packType === 'popular') {
            badge.className = `pack-badge pack-popular glow-x${glowLevel}`;
            // Never show x1
            badge.innerHTML = multiplier === 1 ? 'PACK POPULAR' : `PACK POPULAR ×${multiplier}`;
        } else { // mega
            badge.className = `pack-badge pack-mega glow-x${glowLevel}`;
            // Never show x1
            badge.innerHTML = multiplier === 1 ? 'MEGAPACK' : `MEGAPACK ×${multiplier}`;
        }

        container.appendChild(badge);

        // Show container with animation
        // Use requestAnimationFrame to ensure transition works
        requestAnimationFrame(() => {
            container.classList.add('visible');
        });
    },

    render() {
        // Check if we are on cart page
        const cartList = document.getElementById('cart-items-list');
        if (cartList) {
            this.renderCartPage(cartList);
        }

        // Check if we are on checkout page
        const checkoutList = document.getElementById('checkout-items');
        if (checkoutList) {
            this.renderCheckoutPage(checkoutList);
        }
    },

    renderCartPage(container) {
        container.innerHTML = '';
        const emptyMsg = document.querySelector('.empty-cart-msg');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (this.items.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            if (checkoutBtn) checkoutBtn.classList.add('hidden');
            document.getElementById('subtotal-price').textContent = '€0.00';
            document.getElementById('total-price').textContent = '€0.00';
            document.getElementById('shipping-price').textContent = 'Gratis';
            this.renderPackIndicators(0);
            return;
        }

        if (emptyMsg) emptyMsg.classList.add('hidden');
        if (checkoutBtn) checkoutBtn.classList.remove('hidden');

        this.items.forEach((item, index) => {
            const product = products.find(p => p.id === item.id);
            if (!product) return;

            // ALWAYS use the base product price from the shop
            // This matches what the user sees in tienda.html
            const displayPrice = product.price;

            // Get customization data
            const custom = item.customization || {};
            const size = custom.size || item.size || 'N/A';
            const version = custom.version || item.version || 'aficionado';
            const name = custom.name || '';
            const number = custom.number || '';
            const patch = custom.patch || 'none';

            // Build customization details
            let customDetails = `Talla: ${size}`;

            // Add version
            if (version === 'jugador') {
                customDetails += ' | Versión: Jugador';
            } else {
                customDetails += ' | Versión: Aficionado';
            }

            // Add name if exists
            if (name) {
                customDetails += ` | Nombre: ${name}`;
            }

            // Add number if exists
            if (number) {
                customDetails += ` | Dorsal: ${number}`;
            }

            // Add patch if not none
            if (patch && patch !== 'none') {
                const patchNames = {
                    liga: 'Parche Liga',
                    champions: 'Parche Champions',
                    europa: 'Parche Europa League',
                    premier: 'Parche Premier',
                    seriea: 'Parche Serie A',
                    mundial: 'Parche Mundial de Clubes',
                    copamundo: 'Parche Copa del Mundo',
                    conmemorativo: 'Parche Conmemorativo'
                };
                customDetails += ` | ${patchNames[patch] || patch}`;
            }

            const qty = item.quantity || item.qty || 1;

            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${product.name}</h3>
                    <div class="cart-item-meta">
                        ${customDetails}
                    </div>
                    <div class="cart-item-price">€${displayPrice.toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="qty-btn-minus" data-index="${index}">-</button>
                        <input type="number" value="${qty}" readonly>
                        <button class="qty-btn-plus" data-index="${index}">+</button>
                    </div>
                    <button class="btn-remove" data-index="${index}">Eliminar</button>
                </div>
            `;
            container.appendChild(el);
        });

        // Add Event Listeners
        container.querySelectorAll('.qty-btn-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                const currentQty = this.items[index].quantity || this.items[index].qty || 1;
                this.updateQty(index, currentQty - 1);
            });
        });
        container.querySelectorAll('.qty-btn-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                const currentQty = this.items[index].quantity || this.items[index].qty || 1;
                this.updateQty(index, currentQty + 1);
            });
        });
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => this.remove(btn.dataset.index));
        });

        // Update Totals
        const calculations = this.calculateTotal();
        document.getElementById('subtotal-price').textContent = `€${calculations.subtotal.toFixed(2)}`;
        document.getElementById('total-price').textContent = `€${calculations.total.toFixed(2)}`;
    },

    renderCheckoutPage(container) {
        container.innerHTML = '';
        this.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) return;
            // Use base product price from shop
            const basePrice = product.price;
            const qty = item.quantity || item.qty || 1;
            const custom = item.customization || {};
            const size = custom.size || item.size || 'N/A';
            const version = custom.version || item.version || 'aficionado';

            const el = document.createElement('div');
            el.className = 'checkout-item-mini';
            el.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <h4>${product.name} x${qty}</h4>
                    <p>${size} / ${version === 'jugador' ? 'Jugador' : 'Aficionado'}</p>
                </div>
                <span>€${(basePrice * qty).toFixed(2)}</span>
            `;
            container.appendChild(el);
        });

        const calculations = this.calculateTotal();
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        if (subtotalEl) subtotalEl.textContent = `€${calculations.subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `€${calculations.total.toFixed(2)}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Cart.init();

    // Listen for components injection (header)
    window.addEventListener('components:ready', () => {
        Cart.updateHeaderCount();
    });
});

export default Cart;

