

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, onValue, update, get, remove, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { convertToAvailable } from './points.js';
let isAdmin = false;
let allOrders = [];
let currentFilters = {
    status: 'all',
    payment: 'all',
    search: ''
};
const authLoading = document.getElementById('auth-loading');
const adminPanel = document.getElementById('admin-panel');
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirectToHome('No has iniciado sesión');
        return;
    }
    try {
        const idTokenResult = await user.getIdTokenResult(true);
        const claims = idTokenResult.claims;

        if (claims.admin !== true) {
            redirectToHome('No tienes permisos de administrador');
            return;
        }
        isAdmin = true;
        showAdminPanel(user);

    } catch (error) {
        console.error('Error verifying admin:', error);
        redirectToHome('Error de verificación');
    }
});

function redirectToHome(reason) {
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
    authLoading.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    document.getElementById('admin-email').textContent = user.email;
    initPanel();
}
function initPanel() {
    setupEventListeners();
    loadAllOrders();
    setupPromoCodeListeners();
    loadPromoCodes();
    setupUsersListeners();
    loadAllUsers();
}

function setupEventListeners() {
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión de administrador?')) {
            await signOut(auth);
            window.location.href = '/index.html';
        }
    });
    document.getElementById('btn-refresh').addEventListener('click', () => {
        loadAllOrders();
    });
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
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('order-modal').addEventListener('click', (e) => {
        if (e.target.id === 'order-modal') closeModal();
    });
}
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
            Object.keys(usersData).forEach(uid => {
                const userOrders = usersData[uid];
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
function renderOrders() {
    const tableBody = document.getElementById('orders-table-body');
    const emptyEl = document.getElementById('empty-state');
    let filtered = allOrders.filter(order => {
        if (currentFilters.status !== 'all' && order.status !== currentFilters.status) {
            return false;
        }
        if (currentFilters.payment !== 'all') {
            const isPaid = order.payment?.paid === true;
            if (currentFilters.payment === 'paid' && !isPaid) return false;
            if (currentFilters.payment === 'unpaid' && isPaid) return false;
        }
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
        const isPaid = order.payment?.paid === true;
        const paymentMethod = order.paymentMethod || 'N/A';
        const needsConfirmation = (paymentMethod === 'bizum' || paymentMethod === 'paypal') && !isPaid;

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
                    ${needsConfirmation ? `
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
window.confirmPayment = async function (path) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }

    if (!confirm('¿Confirmar que el pago ha sido recibido? El estado pasará a "Confirmado".')) {
        return;
    }

    try {
        const orderRef = ref(db, path);
        await update(orderRef, {
            'payment/paid': true,
            'payment/confirmedAt': new Date().toISOString(),
            'payment/confirmedBy': auth.currentUser.email,
            status: 'confirmado',
            lastUpdated: new Date().toISOString(),
            updatedBy: auth.currentUser.email
        });

        showToast('Pago confirmado y estado actualizado a Confirmado');
    } catch (error) {
        console.error('Error confirming payment:', error);
        alert('Error al confirmar pago: ' + error.message);
    }
};
window.deleteOrder = async function (path, orderId) {
    if (!isAdmin) {
        alert('No tienes permisos');
        return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el pedido ${orderId}?`)) {
        return;
    }
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
function showToast(message) {
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
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
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
            allPromoCodes.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        renderPromoCodes();
    }, (error) => {
        console.error('Error loading promo codes:', error);
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
    if (type === 'free_shipping') {
        value = 0;
    }
    if (!code || code.length < 3) {
        alert('El código debe tener al menos 3 caracteres');
        return;
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
        alert('El código solo puede contener letras y números');
        return;
    }
    if (type !== 'free_shipping' && (!value || value <= 0)) {
        alert('El valor debe ser mayor que 0');
        return;
    }

    if (type === 'percentage' && value > 100) {
        alert('El porcentaje no puede ser mayor que 100');
        return;
    }
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
function setupPromoCodeListeners() {
    const createBtn = document.getElementById('btn-create-promo');
    if (createBtn) {
        createBtn.addEventListener('click', createPromoCode);
    }
    const promoCodeInput = document.getElementById('promo-code');
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                createPromoCode();
            }
        });
    }
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
let allUsers = [];
let usersSearchFilter = '';

function loadAllUsers() {
    const loadingEl = document.getElementById('loading-users');
    const emptyEl = document.getElementById('users-empty-state');
    const tableBody = document.getElementById('users-table-body');

    if (!loadingEl || !tableBody) return;

    loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    tableBody.innerHTML = '';

    const usersRef = ref(db, 'users');

    onValue(usersRef, async (snapshot) => {
        allUsers = [];

        if (snapshot.exists()) {
            const usersData = snapshot.val();

            for (const [uid, userData] of Object.entries(usersData)) {
                const ordersSnapshot = await get(ref(db, `ordersByUser/${uid}`));
                let orderCount = 0;
                let emailFromOrder = '';
                let nameFromOrder = '';
                let dateFromOrder = '';

                if (ordersSnapshot.exists()) {
                    const orders = ordersSnapshot.val();
                    orderCount = Object.keys(orders).length;
                    const firstOrder = Object.values(orders)[0];
                    if (firstOrder) {
                        emailFromOrder = firstOrder.customerEmail || firstOrder.userEmail || '';
                        nameFromOrder = firstOrder.customerName || '';
                    }
                    const orderDates = Object.values(orders).map(o => o.date || o.createdAt).filter(d => d);
                    if (orderDates.length > 0) {
                        orderDates.sort((a, b) => new Date(a) - new Date(b));
                        dateFromOrder = orderDates[0];
                    }
                }

                allUsers.push({
                    uid: uid,
                    email: userData.email || emailFromOrder || 'Sin email',
                    username: userData.username || nameFromOrder || '',
                    pendingPoints: userData.pendingPoints || 0,
                    availablePoints: userData.availablePoints || 0,
                    createdAt: userData.createdAt || userData.verifiedAt || dateFromOrder || '',
                    orderCount: orderCount
                });
            }
            allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        loadingEl.classList.add('hidden');
        renderUsers();

    }, (error) => {
        console.error('Error loading users:', error);
        loadingEl.classList.add('hidden');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    <i class="fas fa-lock"></i>
                    Error al cargar usuarios: ${error.message}
                </td>
            </tr>
        `;
    });
}

function renderUsers() {
    const tableBody = document.getElementById('users-table-body');
    const emptyEl = document.getElementById('users-empty-state');

    if (!tableBody) return;
    let filtered = allUsers;
    if (usersSearchFilter) {
        const search = usersSearchFilter.toLowerCase();
        filtered = allUsers.filter(u =>
            (u.email && u.email.toLowerCase().includes(search)) ||
            (u.username && u.username.toLowerCase().includes(search))
        );
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    tableBody.innerHTML = filtered.map(user => {
        const totalPoints = user.availablePoints + user.pendingPoints;
        const dateStr = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('es-ES')
            : 'N/A';

        return `
            <tr>
                <td class="user-email">${user.email}</td>
                <td>${user.username || '<em>Sin nombre</em>'}</td>
                <td class="text-center">${user.orderCount}</td>
                <td class="text-center">
                    <span class="points-badge">
                        ${user.availablePoints} <small>(+${user.pendingPoints} pend.)</small>
                    </span>
                </td>
                <td class="text-center">${dateStr}</td>
                <td class="user-actions">
                    <button class="btn-view-user" onclick="viewUserDetails('${user.uid}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit-points" onclick="openEditPoints('${user.uid}')" title="Modificar puntos">
                        <i class="fas fa-coins"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.viewUserDetails = async function (uid) {
    const user = allUsers.find(u => u.uid === uid);
    if (!user) return;

    const modal = document.getElementById('user-modal');
    const modalBody = document.getElementById('user-modal-body');

    if (!modal || !modalBody) return;
    let ordersHtml = '<p>Cargando pedidos...</p>';
    try {
        const ordersSnapshot = await get(ref(db, `ordersByUser/${uid}`));
        if (ordersSnapshot.exists()) {
            const orders = Object.entries(ordersSnapshot.val()).map(([id, order]) => ({
                id, ...order
            })).sort((a, b) => new Date(b.date) - new Date(a.date));

            ordersHtml = `
                <table class="user-orders-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(o => `
                            <tr>
                                <td>#${o.orderId || o.id}</td>
                                <td>${new Date(o.date).toLocaleDateString('es-ES')}</td>
                                <td>€${(o.total || 0).toFixed(2)}</td>
                                <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            ordersHtml = '<p class="no-orders">Este usuario no tiene pedidos.</p>';
        }
    } catch (err) {
        console.error('Error loading user orders:', err);
        ordersHtml = `<p class="error">Error al cargar pedidos: ${err.message}</p>`;
    }

    modalBody.innerHTML = `
        <div class="user-detail-grid">
            <div class="user-info-section">
                <h3><i class="fas fa-user"></i> Información</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Nombre:</strong> ${user.username || 'Sin nombre'}</p>
                <p><strong>UID:</strong> <code>${user.uid}</code></p>
                <p><strong>Fecha de registro:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleString('es-ES') : 'N/A'}</p>
            </div>
            
            <div class="user-points-section">
                <h3><i class="fas fa-coins"></i> Puntos</h3>
                <div class="points-display">
                    <div class="point-box available">
                        <span class="value">${user.availablePoints}</span>
                        <span class="label">Disponibles</span>
                    </div>
                    <div class="point-box pending">
                        <span class="value">${user.pendingPoints}</span>
                        <span class="label">Pendientes</span>
                    </div>
                </div>
                <button class="btn-modify-points" onclick="openEditPoints('${user.uid}')">
                    <i class="fas fa-edit"></i> Modificar puntos
                </button>
            </div>
        </div>
        
        <div class="user-orders-section">
            <h3><i class="fas fa-shopping-bag"></i> Pedidos (${user.orderCount})</h3>
            ${ordersHtml}
        </div>
    `;

    modal.classList.add('active');
};

window.openEditPoints = function (uid) {
    const user = allUsers.find(u => u.uid === uid);
    if (!user) return;

    const newAvailable = prompt(
        `Modificar puntos DISPONIBLES para ${user.email}\nValor actual: ${user.availablePoints}\n\nIntroduce el nuevo valor:`,
        user.availablePoints
    );

    if (newAvailable === null) return;

    const points = parseInt(newAvailable);
    if (isNaN(points) || points < 0) {
        alert('Por favor, introduce un número válido (>= 0)');
        return;
    }

    modifyUserPoints(uid, points, 'available');
};

async function modifyUserPoints(uid, newValue, type = 'available') {
    try {
        const field = type === 'available' ? 'availablePoints' : 'pendingPoints';
        const userRef = ref(db, `users/${uid}/${field}`);
        await set(userRef, newValue);
        const historyRef = ref(db, `users/${uid}/pointsHistory`);
        await push(historyRef, {
            type: 'admin_modification',
            points: newValue,
            timestamp: new Date().toISOString(),
            description: `Puntos modificados por admin a ${newValue}`,
            modifiedBy: auth.currentUser.email
        });

        showToast('Puntos actualizados correctamente');
        const modal = document.getElementById('user-modal');
        if (modal && modal.classList.contains('active')) {
            viewUserDetails(uid);
        }
    } catch (error) {
        console.error('Error modifying points:', error);
        alert('Error al modificar puntos: ' + error.message);
    }
}

function setupUsersListeners() {
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            usersSearchFilter = e.target.value;
            renderUsers();
        });
    }
    const refreshBtn = document.getElementById('btn-refresh-users');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAllUsers);
    }
    const userModalClose = document.getElementById('user-modal-close');
    const userModal = document.getElementById('user-modal');

    if (userModalClose && userModal) {
        userModalClose.addEventListener('click', () => {
            userModal.classList.remove('active');
        });

        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) {
                userModal.classList.remove('active');
            }
        });
    }
}
