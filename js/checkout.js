import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import Cart from './carrito.js';

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let selectedAddressId = null;
let addresses = [];

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
                <p>${addr.zip}, ${addr.city}</p>
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
    const addressData = {
        name: document.getElementById('new-address-name').value.trim(),
        street: document.getElementById('new-address-street').value.trim(),
        city: document.getElementById('new-address-city').value.trim(),
        zip: document.getElementById('new-address-zip').value.trim(),
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
        });
    });
}

// ============================================
// ORDER CONFIRMATION & WEB3FORMS
// ============================================

function confirmOrder() {
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

    const orderData = {
        orderId: orderId,
        date: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString('es-ES'),
        status: 'processing',
        items: Cart.items.map(item => {
            return {
                id: item.id,
                name: item.name || `Producto ${item.id}`,
                quantity: item.quantity || item.qty || 1,
                size: item.size || 'M',
                version: item.version || 'aficionado',
                price: item.price || 0,
                customization: item.customization || {}
            };
        }),
        total: calculations.total,
        subtotal: calculations.subtotal,
        shipping: calculations.shipping,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        userEmail: currentUser ? currentUser.email : 'No autenticado'
    };

    if (paymentMethod === 'bizum') {
        orderData.bizumPhone = document.getElementById('bizum-phone').value.trim();
        orderData.bizumName = document.getElementById('bizum-name').value.trim();
    } else if (paymentMethod === 'paypal') {
        orderData.paypalLink = `https://www.paypal.com/paypalme/${PAYPAL_USERNAME}/${orderData.total.toFixed(2)}`;
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

                // Guardar pedido y enviar email via Web3Forms
                (async () => {
                    await saveOrder(orderData);
                    await sendOrderViaWeb3Forms(orderData);

                    // Limpiar carrito
                    localStorage.removeItem('cart');
                    localStorage.removeItem('appliedPacks');

                    // Redirigir a página de éxito
                    window.location.href = '/pages/orden-exitosa.html?order=' + orderData.orderId;
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

        // Guardar pedido y enviar email via Web3Forms
        (async () => {
            await saveOrder(orderData);
            await sendOrderViaWeb3Forms(orderData);

            // Limpiar carrito
            localStorage.removeItem('cart');
            localStorage.removeItem('appliedPacks');

            // Redirigir a página de éxito
            window.location.href = '/pages/orden-exitosa.html?order=' + orderData.orderId;
        })();
    }
}

async function sendOrderViaWeb3Forms(orderData) {
    // === CAMPO 1: Customer Info (Plantilla) ===
    const sa = orderData.shippingAddress || {};
    const customerInfo = `Contact Name: ${sa.name || ''}
Address Line: ${sa.street || ''}
City: ${sa.city || ''}
State: ${sa.city || ''}
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

    // === CAMPO 3: Total Paid ===
    const totalPaid = '€' + orderData.total.toFixed(2);

    // Preparar FormData para Web3Forms
    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("subject", "Nuevo pedido con pago confirmado - " + orderData.orderId);
    formData.append("cliente", customerInfo);
    formData.append("productos", productsText.trim());
    formData.append("total", totalPaid);

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
    if (!currentUser) return;

    try {
        const orderRef = ref(db, `orders/${currentUser.uid}/${orderData.orderId}`);
        await set(orderRef, orderData);
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        // No lanzamos error: el pedido ya se ha enviado por email
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
    const addressList = document.getElementById('saved-addresses-list');
    addressList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fas fa-user-lock" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
            <p>Debes iniciar sesión para continuar.</p>
            <a href="/pages/login.html" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">
                Iniciar Sesión
            </a>
        </div>
    `;
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
});
