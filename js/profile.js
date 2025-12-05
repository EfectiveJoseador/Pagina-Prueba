import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let currentAddressId = null;

// ============================================
// HELPER FUNCTIONS
// ============================================

function showMessage(elementId, message, isSuccess = true) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.padding = '0.75rem';
        el.style.borderRadius = '8px';
        el.style.marginTop = '1rem';
        el.style.backgroundColor = isSuccess ? '#dcfce7' : '#fef2f2';
        el.style.color = isSuccess ? '#166534' : '#ef4444';
        el.style.border = `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`;

        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// NAVIGATION BETWEEN SECTIONS
// ============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// ============================================
// ORDERS SECTION
// ============================================

function loadOrders() {
    if (!currentUser) return;

    const ordersList = document.getElementById('orders-list');
    const ordersRef = ref(db, `orders/${currentUser.uid}`);

    // Usar onValue para actualización en tiempo real
    onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
            const orders = snapshot.val();
            renderOrders(orders);
        } else {
            ordersList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="font-size: 1.1rem;">Aún no tienes pedidos realizados.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">¡Explora nuestra tienda y haz tu primer pedido!</p>
                    <a href="/pages/catalogo.html" class="btn-shop-now" style="display: inline-flex; margin-top: 1rem;">
                        <i class="fas fa-shopping-bag"></i> Ir a la Tienda
                    </a>
                </div>
            `;
        }
    }, (error) => {
        console.error('Error loading orders:', error);
        // Mostrar mensaje amigable
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.1rem;">No se encontraron pedidos.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">Puede que aún no hayas realizado ningún pedido.</p>
                <a href="/pages/catalogo.html" class="btn-shop-now" style="display: inline-flex; margin-top: 1rem;">
                    <i class="fas fa-shopping-bag"></i> Ir a la Tienda
                </a>
            </div>
        `;
    });
}

function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    const ordersArray = Object.entries(orders).map(([id, order]) => ({ id, ...order }));

    // Sort by date (most recent first)
    ordersArray.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (ordersArray.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.1rem;">Aún no tienes pedidos realizados.</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = ordersArray.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.orderId || order.id}</span>
                <span class="order-status ${order.status || 'pendiente_de_confirmacion'}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-date">${formatDate(order.date)}</div>
            <div class="order-items">
                ${order.items ? order.items.map(item => `
                    <div class="order-item-row">
                        <span class="order-item-qty">${item.quantity || 1}x</span>
                        <span class="order-item-name">${item.name}</span>
                        ${item.size ? `<span class="order-item-size">${item.size}</span>` : ''}
                    </div>
                `).join('') : '<p>Sin items</p>'}
            </div>
            <div class="order-total">Total: €${order.total ? order.total.toFixed(2) : '0.00'}</div>
            ${order.status === 'enviado' && order.trackingNumber ? `
                <div class="order-tracking">
                    <i class="fas fa-truck"></i>
                    <span>Nº Seguimiento:</span>
                    <strong class="tracking-number">${order.trackingNumber}</strong>
                    <button class="copy-tracking-btn" onclick="navigator.clipboard.writeText('${order.trackingNumber}'); this.innerHTML='<i class=\\'fas fa-check\\'></i>'; setTimeout(() => this.innerHTML='<i class=\\'fas fa-copy\\'></i>', 2000);" title="Copiar">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pendiente_de_confirmacion': 'Pendiente de Confirmación',
        'confirmado': 'Confirmado',
        'enviado': 'Enviado',
        'completed': 'Entregado',
        'processing': 'En Proceso',
        'pending': 'Pendiente',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || 'Pendiente de Confirmación';
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ============================================
// ADDRESS SECTION
// ============================================

async function loadAddresses() {
    if (!currentUser) return;

    const addressList = document.getElementById('address-list');

    try {
        const addressesRef = ref(db, `users/${currentUser.uid}/addresses`);
        const snapshot = await get(addressesRef);

        if (snapshot.exists()) {
            const addresses = snapshot.val();
            renderAddresses(addresses);
        } else {
            addressList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="font-size: 1.1rem;">No tienes direcciones guardadas.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Añade una dirección para facilitar tus compras.</p>
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

function renderAddresses(addresses) {
    const addressList = document.getElementById('address-list');
    const addressesArray = Object.entries(addresses).map(([id, addr]) => ({ id, ...addr }));

    if (addressesArray.length === 0) {
        addressList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.1rem;">No tienes direcciones guardadas.</p>
            </div>
        `;
        return;
    }

    addressList.innerHTML = addressesArray.map(addr => `
        <div class="address-card" data-id="${addr.id}">
            <h3>${addr.name}</h3>
            <p>${addr.street}</p>
            <p>${addr.zip}, ${addr.city}${addr.province ? ' (' + addr.province + ')' : ''}</p>
            <p><i class="fas fa-phone"></i> ${addr.phone}</p>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn-text edit-address" data-id="${addr.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-text delete-address" data-id="${addr.id}" style="color: #ef4444;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.edit-address').forEach(btn => {
        btn.addEventListener('click', () => editAddress(btn.dataset.id));
    });

    document.querySelectorAll('.delete-address').forEach(btn => {
        btn.addEventListener('click', () => deleteAddress(btn.dataset.id));
    });
}

function openAddressModal(addressId = null) {
    const modal = document.getElementById('address-modal');
    const title = document.getElementById('address-modal-title');
    const form = document.getElementById('address-form');

    currentAddressId = addressId;

    if (addressId) {
        title.textContent = 'Editar Dirección';
        loadAddressData(addressId);
    } else {
        title.textContent = 'Añadir Dirección';
        form.reset();
    }

    modal.style.display = 'block';
}

function closeAddressModal() {
    const modal = document.getElementById('address-modal');
    modal.style.display = 'none';
    currentAddressId = null;
    document.getElementById('address-form').reset();
}

async function loadAddressData(addressId) {
    if (!currentUser) return;

    try {
        const addressRef = ref(db, `users/${currentUser.uid}/addresses/${addressId}`);
        const snapshot = await get(addressRef);

        if (snapshot.exists()) {
            const addr = snapshot.val();
            document.getElementById('address-id').value = addressId;
            document.getElementById('address-name').value = addr.name || '';
            document.getElementById('address-street').value = addr.street || '';
            document.getElementById('address-city').value = addr.city || '';
            document.getElementById('address-zip').value = addr.zip || '';
            document.getElementById('address-province').value = addr.province || '';
            document.getElementById('address-phone').value = addr.phone || '';
        }
    } catch (error) {
        console.error('Error loading address data:', error);
        alert('Error al cargar la dirección');
    }
}

async function saveAddress(e) {
    e.preventDefault();
    if (!currentUser) return;

    const addressData = {
        name: document.getElementById('address-name').value.trim(),
        street: document.getElementById('address-street').value.trim(),
        city: document.getElementById('address-city').value.trim(),
        zip: document.getElementById('address-zip').value.trim(),
        province: document.getElementById('address-province').value,
        phone: document.getElementById('address-phone').value.trim()
    };

    try {
        if (currentAddressId) {
            // Update existing address
            const addressRef = ref(db, `users/${currentUser.uid}/addresses/${currentAddressId}`);
            await update(addressRef, addressData);
        } else {
            // Create new address
            const addressesRef = ref(db, `users/${currentUser.uid}/addresses`);
            await push(addressesRef, addressData);
        }

        closeAddressModal();
        await loadAddresses();
    } catch (error) {
        console.error('Error saving address:', error);
        alert('Error al guardar la dirección. Inténtalo de nuevo.');
    }
}

function editAddress(addressId) {
    openAddressModal(addressId);
}

async function deleteAddress(addressId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
        return;
    }

    if (!currentUser) return;

    try {
        const addressRef = ref(db, `users/${currentUser.uid}/addresses/${addressId}`);
        await remove(addressRef);
        await loadAddresses();
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('Error al eliminar la dirección. Inténtalo de nuevo.');
    }
}

// ============================================
// SETTINGS SECTION
// ============================================

async function changePassword() {
    if (!currentUser) return;

    if (confirm('Se enviará un correo de recuperación a tu email. ¿Deseas continuar?')) {
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            alert('✓ Correo enviado. Revisa tu bandeja de entrada y la carpeta de spam.');
        } catch (error) {
            console.error('Error sending password reset:', error);
            alert('Error al enviar el correo. Inténtalo de nuevo.');
        }
    }
}

async function loadPreferences() {
    if (!currentUser) return;

    try {
        const prefsRef = ref(db, `users/${currentUser.uid}/preferences`);
        const snapshot = await get(prefsRef);

        if (snapshot.exists()) {
            const prefs = snapshot.val();
            document.getElementById('newsletter-pref').checked = prefs.newsletter || false;
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

async function savePreferences(e) {
    e.preventDefault();
    if (!currentUser) return;

    const preferences = {
        newsletter: document.getElementById('newsletter-pref').checked
    };

    try {
        const prefsRef = ref(db, `users/${currentUser.uid}/preferences`);
        await set(prefsRef, preferences);
        showMessage('preferences-message', '✓ Preferencias guardadas correctamente', true);
    } catch (error) {
        console.error('Error saving preferences:', error);
        showMessage('preferences-message', '✗ Error al guardar las preferencias', false);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    initNavigation();

    // Address modal controls
    const addAddressBtn = document.getElementById('add-address-btn');
    const closeModalBtn = document.getElementById('close-address-modal');
    const cancelAddressBtn = document.getElementById('cancel-address-btn');
    const addressForm = document.getElementById('address-form');
    const modal = document.getElementById('address-modal');

    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', () => openAddressModal());
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAddressModal);
    }

    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', closeAddressModal);
    }

    if (addressForm) {
        addressForm.addEventListener('submit', saveAddress);
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAddressModal();
        }
    });

    // Settings controls
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }

    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', savePreferences);
    }

    // Check auth state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;

            // Update user info in sidebar
            const usernameEl = document.querySelector('.user-info h3');
            const emailEl = document.querySelector('.user-info p');
            const avatarEl = document.querySelector('.avatar');

            if (usernameEl) usernameEl.textContent = user.displayName || 'Usuario';
            if (emailEl) emailEl.textContent = user.email;
            if (avatarEl) avatarEl.textContent = (user.displayName || user.email || 'U')[0].toUpperCase();

            // Load data
            await loadOrders();
            await loadAddresses();
            await loadPreferences();
        } else {
            window.location.href = '/pages/login.html';
        }
    });
});
