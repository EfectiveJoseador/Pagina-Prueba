import products from './products-data.js';
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
applySpecialPricing();
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

    add(id, qty = 1, size = 'M', version = 'aficionado', customizations = {}) {
        const existing = this.items.find(i => i.id === id && i.size === size && i.version === version);
        if (existing) {
            existing.qty += qty;
        } else {
            this.items.push({ id, qty, size, version });
        }
        this.save();
        this.render();
        const product = products.find(p => p.id === id);
        if (product && window.Toast) {
            window.Toast.success(`${product.name} añadido al carrito`);
        }
        if (window.CartBadge) {
            window.CartBadge.animate();
        }
        if (product && window.Analytics) {
            window.Analytics.trackAddToCart(product, qty, { size, version, ...customizations });
        }
    },

    remove(index) {
        const item = this.items[index];
        const product = item ? products.find(p => p.id === item.id) : null;

        if (item && window.Analytics && product) {
            window.Analytics.trackRemoveFromCart(product, item.qty || 1);
        }

        this.items.splice(index, 1);
        this.save();
        this.render();
        if (window.Toast) {
            window.Toast.info('Producto eliminado del carrito');
        }
    },

    updateQty(index, newQty) {
        if (newQty < 1) return;
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
        this.items.forEach(item => {
            const qty = item.quantity || item.qty || 1;
            totalQty += qty;
            const itemPrice = item.price || item.basePrice || 0;
            const surcharge = Math.max(0, itemPrice - 19.90);
            surcharges += surcharge * qty;
        });

        if (totalQty === 0) return { subtotal: 0, shipping: 0, total: 0 };
        const fullCycles = Math.floor(totalQty / 5);
        const remainder = totalQty % 5;

        let packBasePrice = fullCycles * 85.90;
        if (remainder === 1) {
            packBasePrice += 19.90;
        } else if (remainder === 2) {
            packBasePrice += 19.90 * 2;
        } else if (remainder === 3) {
            packBasePrice += 56.90;
        } else if (remainder === 4) {
            packBasePrice += 56.90 + 19.90;
        }
        const subtotal = packBasePrice + surcharges;
        let shipping = 0;
        if (totalQty === 1) {
            shipping = 1.90;
        }
        const total = subtotal + shipping;
        const shippingEl = document.getElementById('shipping-price');
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`;
        }
        this.renderPackIndicators(totalQty);

        return { subtotal, shipping, total };
    },

    renderPackIndicators(totalQty) {
        const isCheckoutPage = window.location.pathname.includes('checkout');
        if (isCheckoutPage) {
            return;
        }
        const summaryCard = document.querySelector('.cart-summary');
        if (!summaryCard) return;
        const isMobile = window.innerWidth <= 900;
        let container = document.getElementById('pack-indicator-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pack-indicator-container';
            container.className = 'pack-indicator-container';
            if (isMobile) {
                summaryCard.parentNode.insertBefore(container, summaryCard);
            } else {
                summaryCard.appendChild(container);
            }
        }
        if (isMobile && container.parentNode === summaryCard) {
            summaryCard.parentNode.insertBefore(container, summaryCard);
        } else if (!isMobile && container.parentNode !== summaryCard) {
            summaryCard.appendChild(container);
        }

        container.innerHTML = '';
        const isMult3 = totalQty % 3 === 0 && totalQty > 0;
        const isMult5 = totalQty % 5 === 0 && totalQty > 0;
        let packType = null;
        let multiplier = 0;

        if (isMult5) {
            packType = 'mega';
            multiplier = totalQty / 5;
        } else if (isMult3) {
            packType = 'popular';
            multiplier = totalQty / 3;
        }
        if (!packType) {
            container.classList.remove('visible');
            return;
        }
        const badge = document.createElement('div');
        const glowLevel = Math.min(multiplier, 4);

        if (packType === 'popular') {
            badge.className = `pack-badge pack-popular glow-x${glowLevel}`;
            badge.innerHTML = multiplier === 1 ? 'PACK POPULAR' : `PACK POPULAR ×${multiplier}`;
        } else {
            badge.className = `pack-badge pack-mega glow-x${glowLevel}`;
            badge.innerHTML = multiplier === 1 ? 'MEGAPACK' : `MEGAPACK ×${multiplier}`;
        }

        container.appendChild(badge);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                container.classList.add('visible');
            });
        });
    },

    render() {
        const cartList = document.getElementById('cart-items-list');
        if (cartList) {
            this.renderCartPage(cartList);
        }
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
            const displayPrice = product.price;
            const custom = item.customization || {};
            const size = custom.size || item.size || 'N/A';
            const version = custom.version || item.version || 'aficionado';
            const name = custom.name || '';
            const number = custom.number || '';
            const patch = custom.patch || 'none';
            let customDetails = `Talla: ${size}`;
            if (version === 'jugador') {
                customDetails += ' | Versión: Jugador';
            } else {
                customDetails += ' | Versión: Aficionado';
            }
            if (name) {
                customDetails += ` | Nombre: ${name}`;
            }
            if (number) {
                customDetails += ` | Dorsal: ${number}`;
            }
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
                <a href="/pages/producto.html?id=${product.id}" class="cart-item-link">
                    <img src="${product.image}" alt="${product.name}" class="cart-item-img">
                </a>
                <div class="cart-item-info">
                    <a href="/pages/producto.html?id=${product.id}" class="cart-item-title-link">
                        <h3 class="cart-item-title">${product.name}</h3>
                    </a>
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
        const calculations = this.calculateTotal();
        document.getElementById('subtotal-price').textContent = `€${calculations.subtotal.toFixed(2)}`;
        document.getElementById('total-price').textContent = `€${calculations.total.toFixed(2)}`;
    },

    renderCheckoutPage(container) {
        container.innerHTML = '';
        this.items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) return;
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
    window.addEventListener('components:ready', () => {
        Cart.updateHeaderCount();
    });
});

export default Cart;

