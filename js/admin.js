/**
 * Admin Panel JavaScript
 * Secure admin panel with Firebase Auth custom claims verification
 */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, update, get, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { convertToAvailable } from './points.js';

// ============================================
// SECURITY: Admin verification
// ============================================
let isAdmin = false;
let allOrders = [];
let currentFilters = {
    status: 'all',
    payment: 'all',
    search: ''
};

// DOM Elements
const authLoading = document.getElementById('auth-loading');
const adminPanel = document.getElementById('admin-panel');

// ============================================
// AUTHENTICATION & AUTHORIZATION
// ============================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in - redirect to login
        console.log('❌ No user - redirecting to login');
        redirectToHome('No has iniciado sesión');
        return;
    }

    // CRITICAL: Get ID token with claims
    try {
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        const claims = idTokenResult.claims;

        console.log('🔍 Checking admin claim:', claims.admin);

        if (claims.admin !== true) {
            // NOT an admin - redirect immediately
            console.log('❌ User is not admin - redirecting');
            redirectToHome('No tienes permisos de administrador');
            return;
        }

        // ✅ User IS admin - show panel
        isAdmin = true;
        showAdminPanel(user);

    } catch (error) {
        console.error('Error verifying admin:', error);
        redirectToHome('Error de verificación');
    }
});

function redirectToHome(reason) {
    console.log('Redirecting to home:', reason);
    // Small delay to show message
    authLoading.innerHTML = `
        <div style="text-align: center;">
            <i class="fas fa-shield-alt" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <p style="color: #ef4444; font-weight: 600;">${reason}</p>
            <p style="color: #666; font-size: 0.85rem;">Redirigiendo...</p>
        </div>
    `;
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 2000);
}

function showAdminPanel(user) {
    // Hide loading, show panel
    authLoading.classList.add('hidden');
    adminPanel.classList.remove('hidden');

    // Update header with admin info
    document.getElementById('admin-email').textContent = user.email;

    // Initialize panel
    initPanel();
}

// ============================================
// PANEL INITIALIZATION
// ============================================
function initPanel() {
    // Set up event listeners
    setupEventListeners();

    // Load all orders
    loadAllOrders();

    // Load promo codes
    setupPromoCodeListeners();
    loadPromoCodes();
}

function setupEventListeners() {
    // Logout button
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión de administrador?')) {
            await signOut(auth);
            window.location.href = '/index.html';
        }
    });

    // Refresh button
    document.getElementById('btn-refresh').addEventListener('click', () => {
        loadAllOrders();
    });

    // Filters
    document.getElementById('filter-status').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        renderOrders();
    });

    document.getElementById('filter-payment').addEventListener('change', (e) => {
        currentFilters.payment = e.target.value;
        renderOrders();
    });

    document.getElementById('search-orders').addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        renderOrders();
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('order-modal').addEventListener('click', (e) => {
        if (e.target.id === 'order-modal') closeModal();
    });
}

// ============================================
// LOAD ALL ORDERS FROM ALL USERS
// ============================================
function loadAllOrders() {
    const loadingEl = document.getElementById('loading-orders');
    const emptyEl = document.getElementById('empty-state');
    const tableBody = document.getElementById('orders-table-body');

    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    tableBody.innerHTML = '';

    const ordersRef = ref(db, 'ordersByUser');

    onValue(ordersRef, (snapshot) => {
        allOrders = [];

        if (snapshot.exists()) {
            const usersData = snapshot.val();

            // Iterate through all users
            Object.keys(usersData).forEach(uid => {
                const userOrders = usersData[uid];

                // Iterate through all orders of this user
                Object.keys(userOrders).forEach(orderId => {
                    const order = userOrders[orderId];
                    allOrders.push({
                        ...order,
                        uid: uid,
                        orderId: orderId,
                        path: `ordersByUser/${uid}/${orderId}`
                    });
                });
            });

            // Sort by date (newest first)
            allOrders.sort((a, b) => {
                const dateA = a.createdAt || new Date(a.date).getTime();
                const dateB = b.createdAt || new Date(b.date).getTime();
                return dateB - dateA;
            });
        }

        loadingEl.classList.add('hidden');
        updateStats();
        renderOrders();

    }, (error) => {
        console.error('Error loading orders:', error);
        loadingEl.classList.add('hidden');

        if (error.code === 'PERMISSION_DENIED') {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="error-message">
                        <i class="fas fa-lock"></i>
                        Acceso denegado. Verifica que tienes permisos de administrador.
                    </td>
                </tr>
            `;
        }
    });
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pendiente' || o.status === 'confirmado').length;
    const shipped = allOrders.filter(o => o.status === 'enviado').length;
    const delivered = allOrders.filter(o => o.status === 'entregado').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-shipped').textContent = shipped;
    document.getElementById('stat-delivered').textContent = delivered;
}

// ============================================
// RENDER ORDERS TABLE
// ============================================
function renderOrders() {
    const tableBody = document.getElementById('orders-table-body');
    const emptyEl = document.getElementById('empty-state');

    // Apply filters
    let filtered = allOrders.filter(order => {
        // Status filter
        if (currentFilters.status !== 'all' && order.status !== currentFilters.status) {
            return false;
        }

        // Payment filter
        if (currentFilters.payment !== 'all') {
            const isPaid = order.payment?.paid === true;
            if (currentFilters.payment === 'paid' && !isPaid) return false;
            if (currentFilters.payment === 'unpaid' && isPaid) return false;
        }

        // Search filter
        if (currentFilters.search) {
            const searchStr = currentFilters.search;
            const matchId = order.orderId?.toLowerCase().includes(searchStr);
            const matchEmail = order.userEmail?.toLowerCase().includes(searchStr);
            const matchName = order.customerName?.toLowerCase().includes(searchStr);
            if (!matchId && !matchEmail && !matchName) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    tableBody.innerHTML = filtered.map(order => {
        const date = order.dateFormatted || new Date(order.date).toLocaleString('es-ES');
        const products = order.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || '-';
        const truncatedProducts = products.length > 50 ? products.substring(0, 50) + '...' : products;
        const isPaid = order.payment?.paid === true || order.paymentMethod === 'paypal'; // PayPal siempre está pagado
        const paymentMethod = order.paymentMethod || 'N/A';

        return `
            <tr data-order-path="${order.path}">
                <td class="order-id">${order.orderId || '-'}</td>
                <td class="order-date">${date}</td>
                <td class="order-customer">
                    <div class="customer-info">
                        <span class="customer-name">${order.customerName || 'N/A'}</span>
                        <span class="customer-email">${order.userEmail || '-'}</span>
                    </div>
                </td>
                <td class="order-products" title="${products}">${truncatedProducts}</td>
                <td class="order-total">€${order.total?.toFixed(2) || '0.00'}</td>
                <td class="order-payment">
                    <span class="payment-method ${paymentMethod.toLowerCase()}">${paymentMethod}</span>
                    <span class="payment-status ${isPaid ? 'paid' : 'unpaid'}">
                        ${isPaid ? '<i class="fas fa-check"></i> Pagado' : '<i class="fas fa-clock"></i> Pendiente'}
                    </span>
                    ${paymentMethod === 'bizum' && !isPaid ? `
                        <button class="btn-confirm-payment" onclick="confirmPayment('${order.path}')">
                            <i class="fas fa-check-circle"></i> Confirmar
                        </button>
                    ` : ''}
                </td>
                <td class="order-status">
                    <select class="status-select status-${order.status}" onchange="updateOrderStatus('${order.path}', this.value, '${order.uid}', '${order.orderId}')">
                        <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="imagenes_cliente" ${order.status === 'imagenes_cliente' ? 'selected' : ''}>📷 Imágenes Cliente</option>
                        <option value="enviado" ${order.status === 'enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="order-tracking">
                    <div class="tracking-input">
                        <input type="text" 
                               value="${order.trackingNumber || ''}" 
                               placeholder="Añadir tracking..."
                               onchange="updateTracking('${order.path}', this.value)">
                    </div>
                </td>
                <td class="order-actions">
                    <button class="btn-view" onclick="viewOrderDetails('${order.path}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteOrder('${order.path}', '${order.orderId}')" title="Eliminar pedido">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// ORDER OPERATIONS
// ============================================

// Update order status
window.updateOrderStatus = async function (path, newStatus, uid, orderId) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    const validStatuses = ['pendiente', 'confirmado', 'imagenes_cliente', 'enviado', 'entregado', 'cancelado'];
    if (!validStatuses.includes(newStatus)) {
        alert('Estado inválido');
        return;
    }

    try {
        const orderRef = ref(db, path);
        await update(orderRef, {
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            updatedBy: auth.currentUser.email
        });

        // If status is 'imagenes_cliente', convert pending points to available
        if (newStatus === 'imagenes_cliente' && uid && orderId) {
            const converted = await convertToAvailable(uid, orderId);
            if (converted) {
                showToast(`Estado actualizado y puntos convertidos a disponibles`);
            } else {
                showToast(`Estado actualizado a: ${newStatus}`);
            }
        } else {
            showToast(`Estado actualizado a: ${newStatus}`);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error al actualizar estado: ' + error.message);
    }
};

// Update tracking number
window.updateTracking = async function (path, trackingNumber) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    try {
        const orderRef = ref(db, path);
        await update(orderRef, {
            trackingNumber: trackingNumber || null,
            lastUpdated: new Date().toISOString(),
            updatedBy: auth.currentUser.email
        });

        showToast('Tracking actualizado');
    } catch (error) {
        console.error('Error updating tracking:', error);
        alert('Error al actualizar tracking: ' + error.message);
    }
};

// Confirm payment (for Bizum)
window.confirmPayment = async function (path) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    if (!confirm('¿Confirmar que el pago ha sido recibido?')) {
        return;
    }

    try {
        const orderRef = ref(db, path);
        await update(orderRef, {
            'payment/paid': true,
            'payment/confirmedAt': new Date().toISOString(),
            'payment/confirmedBy': auth.currentUser.email,
            lastUpdated: new Date().toISOString(),
            updatedBy: auth.currentUser.email
        });

        showToast('Pago confirmado');
    } catch (error) {
        console.error('Error confirming payment:', error);
        alert('Error al confirmar pago: ' + error.message);
    }
};

// Delete order (with double confirmation)
window.deleteOrder = async function (path, orderId) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    // Primera confirmación
    if (!confirm(`¿Estás seguro de que quieres eliminar el pedido ${orderId}?`)) {
        return;
    }

    // Segunda confirmación (más explícita)
    const confirmText = prompt(`Para confirmar la eliminación, escribe "ELIMINAR":`);
    if (confirmText !== 'ELIMINAR') {
        alert('Eliminación cancelada. Debes escribir exactamente "ELIMINAR" para confirmar.');
        return;
    }

    try {
        const orderRef = ref(db, path);
        await remove(orderRef);

        showToast(`Pedido ${orderId} eliminado`);
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error al eliminar pedido: ' + error.message);
    }
};

// View order details
window.viewOrderDetails = async function (path) {
    const order = allOrders.find(o => o.path === path);
    if (!order) return;

    const modal = document.getElementById('order-modal');
    const modalBody = document.getElementById('modal-body');
    const modalOrderId = document.getElementById('modal-order-id');

    modalOrderId.textContent = '#' + (order.orderId || '');

    const address = order.shippingAddress || {};
    const items = order.items || [];

    modalBody.innerHTML = `
        <div class="order-detail-grid">
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Cliente</h3>
                <p><strong>Nombre:</strong> ${order.customerName || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.userEmail || 'N/A'}</p>
                <p><strong>UID:</strong> <code>${order.uid}</code></p>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Dirección de Envío</h3>
                <p>${address.street || 'N/A'}</p>
                <p>${address.city || ''}, ${address.postalCode || ''}</p>
                <p>${address.province || ''}, ${address.country || ''}</p>
                <p><strong>Tel:</strong> ${address.phone || 'N/A'}</p>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-credit-card"></i> Pago</h3>
                <p><strong>Método:</strong> ${order.paymentMethod || 'N/A'}</p>
                ${order.paymentMethod === 'bizum' ? `
                    <p><strong><i class="fab fa-instagram" style="color: #E1306C;"></i> Instagram:</strong> ${order.bizumInstagram || 'N/A'}</p>
                ` : ''}
                ${order.payment?.confirmedBy ? `<p><strong>Confirmado por:</strong> ${order.payment.confirmedBy}</p>` : ''}
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Estado</h3>
                <p><strong>Estado actual:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                <p><strong>Tracking:</strong> ${order.trackingNumber || 'Sin asignar'}</p>
                <p><strong>Fecha:</strong> ${order.dateFormatted || new Date(order.date).toLocaleString('es-ES')}</p>
                ${order.updatedBy ? `<p><strong>Última edición:</strong> ${order.updatedBy}</p>` : ''}
            </div>
        </div>

        <div class="detail-section full-width">
            <h3><i class="fas fa-shopping-cart"></i> Productos</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Versión</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>
                                <div class="item-info">
                                    <img src="${item.image || '/assets/placeholder.webp'}" alt="${item.name}">
                                    <span>${item.name}</span>
                                </div>
                            </td>
                            <td>${item.size || '-'}</td>
                            <td>${item.version || '-'}</td>
                            <td>${item.quantity}</td>
                            <td>€${(item.price || 0).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="order-total-box">
                <p><strong>Subtotal:</strong> €${(order.subtotal || 0).toFixed(2)}</p>
                <p><strong>Envío:</strong> €${(order.shipping || 0).toFixed(2)}</p>
                <p class="total"><strong>TOTAL:</strong> €${(order.total || 0).toFixed(2)}</p>
            </div>
        </div>
    `;

    modal.classList.add('active');
};

function closeModal() {
    document.getElementById('order-modal').classList.remove('active');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ============================================
// PROMO CODES MANAGEMENT
// ============================================
let allPromoCodes = [];

function loadPromoCodes() {
    const promoCodesRef = ref(db, 'promoCodes');

    onValue(promoCodesRef, (snapshot) => {
        allPromoCodes = [];

        if (snapshot.exists()) {
            const codesData = snapshot.val();
            Object.keys(codesData).forEach(codeId => {
                allPromoCodes.push({
                    ...codesData[codeId],
                    id: codeId
                });
            });

            // Sort by creation date (newest first)
            allPromoCodes.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        renderPromoCodes();
    }, (error) => {
        console.error('Error loading promo codes:', error);
        if (error.code === 'PERMISSION_DENIED') {
            console.log('Permission denied for promo codes');
        }
    });
}

function renderPromoCodes() {
    const tableBody = document.getElementById('promo-codes-body');
    const emptyState = document.getElementById('promo-empty-state');

    if (!tableBody) return;

    if (allPromoCodes.length === 0) {
        tableBody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tableBody.innerHTML = allPromoCodes.map(code => {
        let typeLabel, typeText;
        if (code.type === 'percentage') {
            typeLabel = `${code.value}%`;
            typeText = 'Porcentaje';
        } else if (code.type === 'free_shipping') {
            typeLabel = '🚚';
            typeText = 'Envío gratis';
        } else {
            typeLabel = `€${code.value}`;
            typeText = 'Fijo';
        }
        const usageText = code.maxUses ? `${code.usageCount || 0}/${code.maxUses}` : `${code.usageCount || 0}/∞`;
        const statusClass = code.active ? 'active' : 'inactive';
        const statusText = code.active ? 'Activo' : 'Inactivo';

        return `
            <tr>
                <td class="promo-code-cell"><code>${code.code}</code></td>
                <td>${typeText}</td>
                <td class="promo-value-cell">${typeLabel}</td>
                <td>${usageText}</td>
                <td>
                    <span class="promo-status ${statusClass}">${statusText}</span>
                </td>
                <td class="promo-actions">
                    <button class="btn-toggle-promo ${code.active ? 'deactivate' : 'activate'}" 
                            onclick="togglePromoCode('${code.id}', ${!code.active})"
                            title="${code.active ? 'Desactivar' : 'Activar'}">
                        <i class="fas ${code.active ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-delete-promo" onclick="deletePromoCode('${code.id}', '${code.code}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.createPromoCode = async function () {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    const codeInput = document.getElementById('promo-code');
    const typeSelect = document.getElementById('promo-type');
    const valueInput = document.getElementById('promo-value');
    const maxUsesInput = document.getElementById('promo-max-uses');

    const code = codeInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    let value = parseFloat(valueInput.value) || 0;
    const maxUses = maxUsesInput.value ? parseInt(maxUsesInput.value) : null;

    // For free_shipping, set value to 0 automatically
    if (type === 'free_shipping') {
        value = 0;
    }

    // Validation
    if (!code || code.length < 3) {
        alert('El código debe tener al menos 3 caracteres');
        return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
        alert('El código solo puede contener letras y números');
        return;
    }

    // Only validate value for non-free_shipping types
    if (type !== 'free_shipping' && (!value || value <= 0)) {
        alert('El valor debe ser mayor que 0');
        return;
    }

    if (type === 'percentage' && value > 100) {
        alert('El porcentaje no puede ser mayor que 100');
        return;
    }

    // Check if code already exists
    const existingCode = allPromoCodes.find(c => c.code === code);
    if (existingCode) {
        alert('Este código ya existe');
        return;
    }

    try {
        const newCodeRef = ref(db, `promoCodes/${code}`);
        await update(newCodeRef, {
            code: code,
            type: type,
            value: value,
            active: true,
            usageCount: 0,
            maxUses: maxUses,
            createdAt: new Date().toISOString(),
            createdBy: auth.currentUser.email
        });

        // Clear form
        codeInput.value = '';
        valueInput.value = '';
        maxUsesInput.value = '';

        showToast(`Código "${code}" creado correctamente`);
    } catch (error) {
        console.error('Error creating promo code:', error);
        alert('Error al crear código: ' + error.message);
    }
};

window.togglePromoCode = async function (codeId, newStatus) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    try {
        const codeRef = ref(db, `promoCodes/${codeId}`);
        await update(codeRef, {
            active: newStatus
        });

        showToast(`Código ${newStatus ? 'activado' : 'desactivado'}`);
    } catch (error) {
        console.error('Error toggling promo code:', error);
        alert('Error al cambiar estado: ' + error.message);
    }
};

window.deletePromoCode = async function (codeId, codeName) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    if (!confirm(`¿Eliminar el código "${codeName}"?`)) {
        return;
    }

    try {
        const codeRef = ref(db, `promoCodes/${codeId}`);
        await remove(codeRef);

        showToast(`Código "${codeName}" eliminado`);
    } catch (error) {
        console.error('Error deleting promo code:', error);
        alert('Error al eliminar código: ' + error.message);
    }
};

// Add promo codes event listeners
function setupPromoCodeListeners() {
    const createBtn = document.getElementById('btn-create-promo');
    if (createBtn) {
        createBtn.addEventListener('click', createPromoCode);
    }

    // Allow Enter key in form
    const promoCodeInput = document.getElementById('promo-code');
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createPromoCode();
            }
        });
    }

    // Disable value field when free_shipping is selected
    const typeSelect = document.getElementById('promo-type');
    const valueInput = document.getElementById('promo-value');

    if (typeSelect && valueInput) {
        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'free_shipping') {
                valueInput.value = '';
                valueInput.disabled = true;
                valueInput.placeholder = 'No aplica';
            } else {
                valueInput.disabled = false;
                valueInput.placeholder = 'Ej: 10';
            }
        });
    }
}
