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

    // Add event listeners to radio buttons
    document.querySelectorAll('input[name="shipping-address"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectAddress(e.target.value);
        });
    });
}

function selectAddress(addressId) {
    selectedAddressId = addressId;

    // Update visual selection
    document.querySelectorAll('.address-option').forEach(option => {
        if (option.dataset.id === addressId) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });

    // Hide warning if visible
    const warning = document.getElementById('address-warning');
    if (warning) {
        warning.style.display = 'none';
    }

    // Show payment section
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
        paymentSection.style.display = 'block';
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Initialize payment methods
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

    const addressData = {
        name: document.getElementById('new-address-name').value.trim(),
        street: document.getElementById('new-address-street').value.trim(),
        city: document.getElementById('new-address-city').value.trim(),
        zip: document.getElementById('new-address-zip').value.trim(),
        phone: document.getElementById('new-address-phone').value.trim()
    };

    try {
        const addressesRef = ref(db, `users/${currentUser.uid}/addresses`);
        const newAddressRef = await push(addressesRef, addressData);

        // Reload addresses
        await loadUserAddresses();

        // Select the new address automatically
        const newAddressId = newAddressRef.key;
        selectAddress(newAddressId);

        // Hide form
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
    const paypalContainer = document.getElementById('paypal-button-container');
    const cardButton = document.getElementById('card-payment-btn');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'paypal') {
                paypalContainer.style.display = 'block';
                cardButton.style.display = 'none';
                initPayPal();
            } else if (e.target.value === 'card') {
                paypalContainer.style.display = 'none';
                cardButton.style.display = 'block';
            }
        });
    });

    // Initialize default payment method (PayPal)
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (selectedPayment && selectedPayment.value === 'paypal') {
        paypalContainer.style.display = 'block';
        cardButton.style.display = 'none';
        initPayPal();
    }

    // Card payment button handler
    if (cardButton) {
        cardButton.addEventListener('click', processCardPayment);
    }
}

// ============================================
// PAYPAL INTEGRATION
// ============================================
function initPayPal() {
    const paypalContainer = document.getElementById('paypal-button-container');
    if (!paypalContainer || typeof paypal === 'undefined') return;

    // Check if address is selected
    if (!selectedAddressId) {
        showAddressWarning();
        return;
    }

    // Clear container
    paypalContainer.innerHTML = '';

    // Hide if cart is empty
    if (Cart.items.length === 0) {
        paypalContainer.style.display = 'none';
        return;
    }

    paypalContainer.style.display = 'block';

    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
        },
        createOrder: function (data, actions) {
            if (!selectedAddressId) {
                showAddressWarning();
                return Promise.reject(new Error('No address selected'));
            }

            const calculations = Cart.calculateTotal();
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: calculations.total.toFixed(2),
                        currency_code: 'EUR',
                        breakdown: {
                            item_total: {
                                value: calculations.subtotal.toFixed(2),
                                currency_code: 'EUR'
                            },
                            shipping: {
                                value: calculations.shipping.toFixed(2),
                                currency_code: 'EUR'
                            }
                        }
                    }
                }]
            });
        },
        onApprove: async function (data, actions) {
            return actions.order.capture().then(async function (details) {
                // Save order to Firebase
                await saveOrder(data.orderID, 'paypal', details);

                // Clear cart
                localStorage.removeItem('cart');
                localStorage.removeItem('appliedPacks');

                // Redirect to success page
                window.location.href = `/pages/orden-exitosa.html?order=${data.orderID}`;
            });
        },
        onError: function (err) {
            console.error('PayPal Error:', err);
            alert('Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.');
        }
    }).render('#paypal-button-container');
}

// ============================================
// CARD PAYMENT
// ============================================
async function processCardPayment() {
    if (!selectedAddressId) {
        showAddressWarning();
        return;
    }

    const btn = document.getElementById('card-payment-btn');
    const originalText = btn.textContent;

    btn.textContent = 'Procesando...';
    btn.disabled = true;

    // Simulate payment processing
    setTimeout(async () => {
        const orderId = 'ORD-' + Date.now();

        // Save order to Firebase
        await saveOrder(orderId, 'card', {});

        // Clear cart
        localStorage.removeItem('cart');
        localStorage.removeItem('appliedPacks');

        // Redirect to success page
        window.location.href = `/pages/orden-exitosa.html?order=${orderId}`;
    }, 2000);
}

// ============================================
// ORDER SAVING
// ============================================
async function saveOrder(orderId, paymentMethod, paymentDetails) {
    if (!currentUser || !selectedAddressId) return;

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    const calculations = Cart.calculateTotal();

    const orderData = {
        id: orderId,
        date: new Date().toISOString(),
        status: 'processing',
        items: Cart.items.map(item => {
            const product = Cart.items.find(i => i.id === item.id);
            return {
                id: item.id,
                name: item.name || 'Producto',
                quantity: item.quantity || item.qty || 1,
                size: item.size || 'M',
                price: item.price || 0
            };
        }),
        total: calculations.total,
        subtotal: calculations.subtotal,
        shipping: calculations.shipping,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails
    };

    try {
        const orderRef = ref(db, `orders/${currentUser.uid}/${orderId}`);
        await set(orderRef, orderData);
    } catch (error) {
        console.error('Error saving order:', error);
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
    // New address form controls
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

    // Check auth state and load addresses
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserAddresses();
        } else {
            // User not logged in - still allow checkout but show login prompt
            showLoginPrompt();
        }
    });

    // Update shipping cost in summary
    const calculations = Cart.calculateTotal();
    const shippingEl = document.getElementById('checkout-shipping');
    if (shippingEl) {
        shippingEl.textContent = calculations.shipping === 0 ? 'Gratis' : `€${calculations.shipping.toFixed(2)}`;
    }
});
