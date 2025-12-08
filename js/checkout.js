import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import Cart from './carrito.js';
import products from './products-data.js';
import { getUserCoupons, useCoupon, addPendingPoints } from './points.js';

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let selectedAddressId = null;
let addresses = [];
let selectedCoupon = null;
let appliedDiscount = 0;
let userCoupons = [];
// Promo code state
let appliedPromoCode = null;
let promoDiscount = 0;

// ============================================
// CONFIGURATION
// ============================================
const WEB3FORMS_KEY = "8e920ab3-b0f7-4768-a83a-ed3ef8cd58a8"; // Web3Forms API Key
const PAYPAL_USERNAME = "camisetazo"; // Usuario de PayPal

// ============================================
// ADDRESS MANAGEMENT
// ============================================

async function loadUserAddresses() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    const addressList = document.getElementById('saved-addresses-list');

    try {
        const addressesRef = ref(db, `users/${currentUser.uid}/addresses`);
        const snapshot = await get(addressesRef);

        if (snapshot.exists()) {
            addresses = Object.entries(snapshot.val()).map(([id, addr]) => ({ id, ...addr }));
            renderAddresses(addresses);
        } else {
            addressList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p>No tienes direcciones guardadas.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Haz clic en "Añadir Nueva" para crear una.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        addressList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <p>Error al cargar las direcciones. Inténtalo de nuevo.</p>
            </div>
        `;
    }
}

function renderAddresses(addressArray) {
    const addressList = document.getElementById('saved-addresses-list');

    if (addressArray.length === 0) {
        addressList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                <p>No tienes direcciones guardadas.</p>
            </div>
        `;
        return;
    }

    addressList.innerHTML = addressArray.map(addr => `
        <label class="address-option ${selectedAddressId === addr.id ? 'selected' : ''}" data-id="${addr.id}">
            <input type="radio" name="shipping-address" value="${addr.id}" ${selectedAddressId === addr.id ? 'checked' : ''}>
            <div class="address-content">
                <div class="address-header">
                    <strong>${addr.name}</strong>
                    ${selectedAddressId === addr.id ? '<span class="selected-badge"><i class="fas fa-check-circle"></i> Seleccionada</span>' : ''}
                </div>
                <p>${addr.street}</p>
                <p>${addr.zip}, ${addr.city}${addr.province ? ' (' + addr.province + ')' : ''}</p>
                <p><i class="fas fa-phone" style="font-size: 0.85em;"></i> ${addr.phone}</p>
            </div>
        </label>
    `).join('');

    document.querySelectorAll('input[name="shipping-address"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectAddress(e.target.value);
        });
    });
}

function selectAddress(addressId) {
    selectedAddressId = addressId;

    document.querySelectorAll('.address-option').forEach(option => {
        if (option.dataset.id === addressId) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });

    const warning = document.getElementById('address-warning');
    if (warning) {
        warning.style.display = 'none';
    }

    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
        paymentSection.style.display = 'block';
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    initPaymentMethods();

    // Track begin checkout when address is selected
    const calculations = Cart.calculateTotal();
    if (window.Analytics && Cart.items.length > 0) {
        window.Analytics.trackBeginCheckout(Cart.items, calculations.total);

        // Also track shipping info
        const selectedAddr = addresses.find(a => a.id === addressId);
        if (selectedAddr) {
            window.Analytics.trackAddShippingInfo(selectedAddr);
        }
    }
}

// ============================================
// NEW ADDRESS FORM
// ============================================

function showNewAddressForm() {
    const formContainer = document.getElementById('new-address-form-container');
    const addButton = document.getElementById('add-new-address-btn');

    if (formContainer) {
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    if (addButton) {
        addButton.style.display = 'none';
    }
}

function hideNewAddressForm() {
    const formContainer = document.getElementById('new-address-form-container');
    const addButton = document.getElementById('add-new-address-btn');
    const form = document.getElementById('new-address-form');

    if (formContainer) {
        formContainer.style.display = 'none';
    }

    if (addButton) {
        addButton.style.display = 'inline-flex';
    }

    if (form) {
        form.reset();
    }
}

async function saveNewAddress(e) {
    e.preventDefault();
    if (!currentUser) return;

    const instagramInput = document.getElementById('new-address-instagram');
    const provinceInput = document.getElementById('new-address-province');
    const addressData = {
        name: document.getElementById('new-address-name').value.trim(),
        street: document.getElementById('new-address-street').value.trim(),
        city: document.getElementById('new-address-city').value.trim(),
        zip: document.getElementById('new-address-zip').value.trim(),
        province: provinceInput ? provinceInput.value : '',
        phone: document.getElementById('new-address-phone').value.trim(),
        instagram: instagramInput ? instagramInput.value.trim() : ''
    };

    try {
        const addressesRef = ref(db, `users/${currentUser.uid}/addresses`);
        const newAddressRef = await push(addressesRef, addressData);

        await loadUserAddresses();

        const newAddressId = newAddressRef.key;
        selectAddress(newAddressId);

        hideNewAddressForm();
    } catch (error) {
        console.error('Error saving address:', error);
        alert('Error al guardar la dirección. Inténtalo de nuevo.');
    }
}

// ============================================
// PAYMENT METHODS
// ============================================

function initPaymentMethods() {
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const bizumForm = document.getElementById('bizum-form');

    if (!paymentRadios || paymentRadios.length === 0) return;

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'bizum') {
                if (bizumForm) bizumForm.style.display = 'block';
            } else {
                if (bizumForm) bizumForm.style.display = 'none';
            }

            // Track payment method selection
            if (window.Analytics) {
                window.Analytics.trackAddPaymentInfo(e.target.value);
            }
        });
    });
}

// ============================================
// ORDER CONFIRMATION & WEB3FORMS
// ============================================

function confirmOrder() {
    // Check if user is authenticated
    if (!currentUser) {
        alert('Debes iniciar sesión para realizar un pedido.');
        window.location.href = '/pages/login.html';
        return;
    }

    if (!selectedAddressId) {
        showAddressWarning();
        return;
    }

    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
        alert('Por favor, selecciona un método de pago');
        return;
    }

    const paymentMethod = selectedPayment.value;

    if (paymentMethod === 'bizum') {
        const bizumPhone = document.getElementById('bizum-phone').value.trim();
        const bizumName = document.getElementById('bizum-name').value.trim();

        if (!bizumPhone || !bizumName) {
            alert('Por favor, completa los datos de Bizum');
            return;
        }

        if (!/^[0-9]{9}$/.test(bizumPhone)) {
            alert('El teléfono debe tener 9 dígitos');
            return;
        }
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    const calculations = Cart.calculateTotal();
    const orderId = 'ORD-' + Date.now();

    if (!calculations || isNaN(calculations.total)) {
        alert('Error al calcular el total del pedido. Actualiza la página e inténtalo de nuevo.');
        return;
    }

    // Calculate final total with all discounts (coupon + promo code)
    const totalDiscounts = appliedDiscount + promoDiscount;
    const finalTotal = Math.max(0, calculations.total - totalDiscounts);

    // Calculate total shirt quantity for points
    const totalShirtQuantity = Cart.items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);

    const orderData = {
        orderId: orderId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        customerName: currentUser.displayName || 'Usuario',
        customerEmail: currentUser.email,
        date: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString('es-ES'),
        createdAt: Date.now(),
        status: 'pendiente',
        trackingNumber: null,
        items: Cart.items.map(item => {
            // Find the product to get its image
            const product = products.find(p => p.id === item.id);
            return {
                id: item.id,
                name: item.name || product?.name || `Producto ${item.id}`,
                image: item.image || product?.image || '/assets/placeholder.webp',
                quantity: item.quantity || item.qty || 1,
                size: item.size || 'M',
                version: item.version || 'aficionado',
                price: item.price || product?.price || 0,
                customization: item.customization || {}
            };
        }),
        total: finalTotal,
        subtotal: calculations.subtotal,
        shipping: calculations.shipping,
        discount: totalDiscounts,
        couponUsed: selectedCoupon ? selectedCoupon.id : null,
        couponDiscount: appliedDiscount,
        promoCodeUsed: appliedPromoCode ? appliedPromoCode.id : null,
        promoCodeDiscount: promoDiscount,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        pointsToEarn: totalShirtQuantity * 10
    };

    if (paymentMethod === 'bizum') {
        orderData.bizumInstagram = document.getElementById('bizum-instagram').value.trim();
    } else if (paymentMethod === 'paypal') {
        orderData.paypalLink = `https://www.paypal.com/paypalme/${PAYPAL_USERNAME}/${finalTotal.toFixed(2)}`;
    }

    const confirmBtn = document.getElementById('confirm-order-btn');
    if (!confirmBtn) return;

    // PAYPAL FLOW
    if (paymentMethod === 'paypal') {
        const paypalUrl = orderData.paypalLink;

        let paypalWindow = window.open(paypalUrl, '_blank');

        if (!paypalWindow) {
            alert('Por favor, permite ventanas emergentes para completar el pago.');
            return;
        }

        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Pago en proceso...';
        confirmBtn.disabled = true;

        let elapsed = 0;
        const intervalMs = 500;
        const timeoutMs = 120000; // 2 minutos de seguridad

        const checkClosed = setInterval(() => {
            elapsed += intervalMs;

            // Si el navegador ha destruido la referencia o la ventana se ha cerrado
            if (!paypalWindow || paypalWindow.closed) {
                clearInterval(checkClosed);

                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';

                // Guardar pedido PRIMERO y luego enviar email via Web3Forms
                (async () => {
                    try {
                        await saveOrder(orderData);
                        await sendOrderViaWeb3Forms(orderData);

                        // Add pending points
                        if (orderData.pointsToEarn > 0) {
                            await addPendingPoints(currentUser.uid, orderData.orderId, totalShirtQuantity);
                        }

                        // Mark coupon as used
                        if (selectedCoupon) {
                            await useCoupon(currentUser.uid, selectedCoupon.id, orderData.orderId);
                        }

                        // Limpiar carrito
                        localStorage.removeItem('cart');
                        localStorage.removeItem('appliedPacks');

                        // Redirigir a página de éxito
                        window.location.href = '/pages/orden-exitosa.html?order=' + orderData.orderId;
                    } catch (error) {
                        console.error('Error procesando pedido:', error);
                        alert('Error al procesar el pedido. Por favor, inténtalo de nuevo.');
                        confirmBtn.innerHTML = originalText;
                        confirmBtn.disabled = false;
                    }
                })();

                return;
            }

            // Failsafe: si pasa demasiado tiempo, damos por terminado
            if (elapsed >= timeoutMs) {
                clearInterval(checkClosed);
                alert('No se ha podido detectar el cierre de PayPal. Si has completado el pago, revisa tu correo.');
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            }
        }, intervalMs);

    } else {
        // BIZUM FLOW (sin popup)
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;

        // Guardar pedido PRIMERO y luego enviar email via Web3Forms
        (async () => {
            try {
                await saveOrder(orderData);
                await sendOrderViaWeb3Forms(orderData);

                // Add pending points
                if (orderData.pointsToEarn > 0) {
                    await addPendingPoints(currentUser.uid, orderData.orderId, totalShirtQuantity);
                }

                // Mark coupon as used
                if (selectedCoupon) {
                    await useCoupon(currentUser.uid, selectedCoupon.id, orderData.orderId);
                }

                // Limpiar carrito
                localStorage.removeItem('cart');
                localStorage.removeItem('appliedPacks');

                // Redirigir a página de éxito
                window.location.href = '/pages/orden-exitosa.html?order=' + orderData.orderId;
            } catch (error) {
                console.error('Error procesando pedido:', error);
                alert('Error al procesar el pedido. Por favor, inténtalo de nuevo.');
                confirmBtn.innerHTML = originalText;
                confirmBtn.disabled = false;
            }
        })();
    }
}

async function sendOrderViaWeb3Forms(orderData) {
    // === CAMPO 1: Customer Info (Plantilla) ===
    const sa = orderData.shippingAddress || {};
    const customerInfo = `Contact Name: ${sa.name || ''}
Address Line: ${sa.street || ''}
City: ${sa.city || ''}
Province: ${sa.province || ''}
Country: España
Postal Code: ${sa.zip || ''}
Phone Number: ${sa.phone || ''}
Instagram: @${(sa.instagram || '').replace('@', '')}`;

    // === CAMPO 2: Purchased Products ===
    let productsText = '';
    orderData.items.forEach((item) => {
        const qty = item.quantity || 1;
        const size = item.size || 'M';
        const version = item.version || 'fan';
        const price = (item.price * qty).toFixed(2);
        productsText += qty + 'x ' + item.name + ' · ' + size + ' · ' + version + ' — €' + price + '\n';
    });

    // === CAMPO 3: Total Info ===
    let totalInfo = `Subtotal: €${orderData.subtotal.toFixed(2)}\n`;

    if (orderData.promoCodeUsed) {
        totalInfo += `Código promo (${orderData.promoCodeUsed}): -€${orderData.promoCodeDiscount.toFixed(2)}\n`;
    }
    if (orderData.couponUsed) {
        totalInfo += `Cupón usado (${orderData.couponUsed}): -€${orderData.couponDiscount.toFixed(2)}\n`;
    }
    if (orderData.discount > 0) {
        totalInfo += `Descuento total: -€${orderData.discount.toFixed(2)}\n`;
    }
    totalInfo += `TOTAL A PAGAR: €${orderData.total.toFixed(2)}`;

    // Preparar FormData para Web3Forms
    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("subject", "Nuevo pedido con pago confirmado - " + orderData.orderId);
    formData.append("cliente", customerInfo);
    formData.append("productos", productsText.trim());
    formData.append("total", totalInfo);

    try {
        console.log('Enviando a Web3Forms...');
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Web3Forms: Email enviado correctamente');
            return true;
        } else {
            console.error('Web3Forms error:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error al enviar Web3Forms:', error);
        return false;
    }
}

async function saveOrder(orderData) {
    if (!currentUser) {
        console.error('❌ Cannot save order: No user authenticated');
        return false;
    }

    try {
        console.log('📦 Saving order to Firebase...');
        console.log('User UID:', currentUser.uid);
        console.log('Order ID:', orderData.orderId);

        // Use ordersByUser path as per Firebase rules
        const orderRef = ref(db, `ordersByUser/${currentUser.uid}/${orderData.orderId}`);

        // Ensure all required fields are present
        const orderToSave = {
            ...orderData,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            status: orderData.status || 'pendiente',
            createdAt: orderData.createdAt || Date.now(),
            trackingNumber: orderData.trackingNumber || ''
        };

        await set(orderRef, orderToSave);
        console.log('✅ Order saved successfully to Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error saving order to Firebase:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Check for common Firebase errors
        if (error.code === 'PERMISSION_DENIED') {
            console.error('⚠️ Firebase permission denied. Check if email is verified or rules are too restrictive.');
        }

        return false;
    }
}

// ============================================
// HELPERS
// ============================================

function showAddressWarning() {
    const warning = document.getElementById('address-warning');
    if (warning) {
        warning.style.display = 'block';
        warning.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showLoginPrompt() {
    // Ocultar todo el contenido del checkout
    const checkoutLayout = document.querySelector('.checkout-layout');
    if (checkoutLayout) {
        checkoutLayout.innerHTML = `
            <div class="login-required-overlay" style="
                grid-column: 1 / -1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4rem 2rem;
                text-align: center;
                background: var(--bg-card);
                border-radius: 16px;
                border: 1px solid var(--border);
            ">
                <i class="fas fa-user-lock" style="font-size: 4rem; color: var(--primary); margin-bottom: 1.5rem; opacity: 0.8;"></i>
                <h2 style="color: var(--text-main); margin-bottom: 0.5rem; font-size: 1.5rem;">Inicia sesión para continuar</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem; max-width: 400px;">
                    Para realizar un pedido necesitas tener una cuenta. Así podrás guardar tus direcciones y ver el historial de tus pedidos.
                </p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <a href="/pages/login.html" class="btn-modal-primary" style="text-decoration: none;">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </a>
                    <a href="/pages/login.html#register" class="btn-modal-secondary" style="text-decoration: none;">
                        <i class="fas fa-user-plus"></i> Crear Cuenta
                    </a>
                </div>
            </div>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const addNewAddressBtn = document.getElementById('add-new-address-btn');
    const cancelNewAddressBtn = document.getElementById('cancel-new-address-btn');
    const newAddressForm = document.getElementById('new-address-form');

    if (addNewAddressBtn) {
        addNewAddressBtn.addEventListener('click', showNewAddressForm);
    }

    if (cancelNewAddressBtn) {
        cancelNewAddressBtn.addEventListener('click', hideNewAddressForm);
    }

    if (newAddressForm) {
        newAddressForm.addEventListener('submit', saveNewAddress);
    }

    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmOrder);
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserAddresses();
            await loadUserCoupons();
        } else {
            showLoginPrompt();
        }
    });

    const calculations = Cart.calculateTotal();
    const shippingEl = document.getElementById('checkout-shipping');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');

    if (shippingEl) {
        shippingEl.textContent = calculations.shipping === 0 ? 'Gratis' : `€${calculations.shipping.toFixed(2)}`;
    }
    if (subtotalEl) {
        subtotalEl.textContent = `€${calculations.subtotal.toFixed(2)}`;
    }
    if (totalEl) {
        totalEl.textContent = `€${calculations.total.toFixed(2)}`;
    }

    // Coupon selector event listener
    const couponSelect = document.getElementById('apply-coupon');
    if (couponSelect) {
        couponSelect.addEventListener('change', applyCouponDiscount);
    }
});

// ============================================
// COUPON MANAGEMENT
// ============================================

async function loadUserCoupons() {
    if (!currentUser) return;

    console.log('📋 Loading coupons for user:', currentUser.uid);
    userCoupons = await getUserCoupons(currentUser.uid);
    console.log('📋 Coupons loaded:', userCoupons);

    const couponSection = document.getElementById('coupon-section');
    const couponSelect = document.getElementById('apply-coupon');

    if (couponSection) {
        couponSection.style.display = 'block';

        if (userCoupons.length > 0 && couponSelect) {
            // Populate select with coupons
            couponSelect.innerHTML = '<option value="">Sin cupón</option>';
            userCoupons.forEach(coupon => {
                const optionText = coupon.type === 'percentage'
                    ? `${coupon.value}% descuento`
                    : `€${coupon.value.toFixed(2)} descuento`;
                couponSelect.innerHTML += `<option value="${coupon.id}">${optionText}</option>`;
            });
        } else {
            // No coupons available - show message
            couponSection.innerHTML = `
                <div style="text-align: center; padding: 0.75rem; color: var(--text-muted); font-size: 0.85rem;">
                    <i class="fas fa-ticket-alt" style="opacity: 0.5;"></i>
                    No tienes cupones disponibles.
                    <a href="/pages/perfil.html" style="color: var(--primary); text-decoration: none;">Canjea puntos</a>
                </div>
            `;
        }
    }
}

function applyCouponDiscount() {
    const couponSelect = document.getElementById('apply-coupon');
    const couponId = couponSelect?.value;
    const discountApplied = document.getElementById('discount-applied');
    const discountText = document.getElementById('discount-text');
    const totalEl = document.getElementById('checkout-total');

    // Reset coupon (but keep promo code)
    selectedCoupon = null;
    appliedDiscount = 0;

    const calculations = Cart.calculateTotal();
    let finalTotal = calculations.total - promoDiscount; // Apply promo discount first

    if (couponId) {
        const coupon = userCoupons.find(c => c.id === couponId);
        if (coupon) {
            selectedCoupon = coupon;

            if (coupon.type === 'percentage') {
                appliedDiscount = (calculations.subtotal * coupon.value) / 100;
                if (discountText) discountText.textContent = `-${coupon.value}% = -€${appliedDiscount.toFixed(2)}`;
            } else {
                appliedDiscount = Math.min(coupon.value, calculations.subtotal);
                if (discountText) discountText.textContent = `-€${appliedDiscount.toFixed(2)}`;
            }

            finalTotal = Math.max(0, finalTotal - appliedDiscount);

            if (discountApplied) discountApplied.style.display = 'block';
        }
    } else {
        if (discountApplied) discountApplied.style.display = 'none';
    }

    if (totalEl) {
        totalEl.textContent = `€${finalTotal.toFixed(2)}`;
    }
}

// ============================================
// PROMO CODE MANAGEMENT
// ============================================

async function applyPromoCode() {
    const input = document.getElementById('promo-code-input');
    const resultDiv = document.getElementById('promo-result');
    const totalEl = document.getElementById('checkout-total');

    const code = input?.value.trim().toUpperCase();

    if (!code) {
        showPromoResult('Por favor, introduce un código', 'error');
        return;
    }

    // Check if user is logged in
    if (!currentUser) {
        showPromoResult('Debes iniciar sesión para usar códigos', 'error');
        return;
    }

    // Disable button while validating
    const btn = document.getElementById('apply-promo-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Validando...';
    }

    try {
        // Try to get the promo code from Firebase
        const promoRef = ref(db, `promoCodes/${code}`);
        const snapshot = await get(promoRef);

        if (!snapshot.exists()) {
            showPromoResult('Código no válido', 'error');
            resetPromoButton();
            return;
        }

        const promo = snapshot.val();

        // Check if code is active
        if (!promo.active) {
            showPromoResult('Este código ya no está activo', 'error');
            resetPromoButton();
            return;
        }

        // Check max uses
        if (promo.maxUses && promo.usageCount >= promo.maxUses) {
            showPromoResult('Este código ha alcanzado el límite de usos', 'error');
            resetPromoButton();
            return;
        }

        // Apply the discount based on type
        appliedPromoCode = { ...promo, id: code };
        const calculations = Cart.calculateTotal();

        if (promo.type === 'free_shipping') {
            // Check if shipping is already free (more than 1 item)
            if (calculations.shipping === 0) {
                showPromoResult('Ya tienes envío gratis en este pedido', 'error');
                appliedPromoCode = null;
                resetPromoButton();
                return;
            }
            promoDiscount = calculations.shipping;
            showPromoResult('¡Envío gratis aplicado!', 'success');
        } else if (promo.type === 'percentage') {
            promoDiscount = (calculations.subtotal * promo.value) / 100;
            showPromoResult(`¡${promo.value}% de descuento aplicado! (-€${promoDiscount.toFixed(2)})`, 'success');
        } else {
            promoDiscount = Math.min(promo.value, calculations.subtotal);
            showPromoResult(`¡€${promo.value} de descuento aplicado!`, 'success');
        }

        // Update total (considering both promo and coupon discounts)
        let finalTotal = calculations.total - promoDiscount - appliedDiscount;
        finalTotal = Math.max(0, finalTotal);

        if (totalEl) {
            totalEl.textContent = `€${finalTotal.toFixed(2)}`;
        }

        // Increment usage count in Firebase
        try {
            const usageRef = ref(db, `promoCodes/${code}/usageCount`);
            const currentCount = promo.usageCount || 0;
            await set(usageRef, currentCount + 1);
            console.log('📊 Promo code usage incremented:', code, currentCount + 1);
        } catch (err) {
            console.warn('Could not increment usage count:', err);
        }

        // Change button to show it's applied
        if (btn) {
            btn.textContent = '✓ Aplicado';
            btn.style.background = '#10b981';
        }

        // Disable input
        if (input) {
            input.disabled = true;
        }

        console.log('📦 Promo code applied:', code, promoDiscount);

    } catch (error) {
        console.error('Error applying promo code:', error);
        showPromoResult('Error al validar el código', 'error');
        resetPromoButton();
    }
}

function showPromoResult(message, type) {
    const resultDiv = document.getElementById('promo-result');
    if (!resultDiv) return;

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    resultDiv.style.color = type === 'success' ? '#10b981' : '#ef4444';
}

function resetPromoButton() {
    const btn = document.getElementById('apply-promo-btn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Aplicar código';
        btn.style.background = '#6366f1';
    }
}

function setupPromoCodeListeners() {
    const applyBtn = document.getElementById('apply-promo-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyPromoCode);
    }

    // Allow Enter key in promo input
    const promoInput = document.getElementById('promo-code-input');
    if (promoInput) {
        promoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyPromoCode();
            }
        });
    }

    // Promo code accordion toggle
    const promoToggle = document.getElementById('promo-toggle');
    const promoContent = document.getElementById('promo-content');
    const promoChevron = document.getElementById('promo-chevron');

    if (promoToggle && promoContent) {
        promoToggle.addEventListener('click', () => {
            const isOpen = promoContent.style.display !== 'none';
            promoContent.style.display = isOpen ? 'none' : 'block';
            if (promoChevron) {
                promoChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            promoToggle.style.borderRadius = isOpen ? '10px' : '10px 10px 0 0';
        });
    }

    // Coupon accordion toggle
    const couponToggle = document.getElementById('coupon-toggle');
    const couponContent = document.getElementById('coupon-content');
    const couponChevron = document.getElementById('coupon-chevron');

    if (couponToggle && couponContent) {
        couponToggle.addEventListener('click', () => {
            const isOpen = couponContent.style.display !== 'none';
            couponContent.style.display = isOpen ? 'none' : 'block';
            if (couponChevron) {
                couponChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            couponToggle.style.borderRadius = isOpen ? '10px' : '10px 10px 0 0';
        });
    }
}

// Initialize promo code listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPromoCodeListeners);
} else {
    setupPromoCodeListeners();
}
