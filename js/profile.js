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
    // Use ordersByUser path to match where orders are saved
    const ordersRef = ref(db, `ordersByUser/${currentUser.uid}`);

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

    // Debug: log the raw orders object
    console.log('📦 Raw orders from Firebase:', orders);

    const ordersArray = Object.entries(orders).map(([id, order]) => ({ id, ...order }));

    // Debug: log each order
    ordersArray.forEach((order, i) => {
        console.log(`📋 Order ${i + 1}:`, order);
        console.log('  - Products:', order.products || order.items);
        console.log('  - Shipping Info:', order.shippingInfo || order.shippingAddress);
        console.log('  - Total:', order.total);
        console.log('  - Status:', order.status);
    });

    // Sort by date (most recent first) - try createdAt first, then date
    ordersArray.sort((a, b) => {
        const dateA = a.createdAt || new Date(a.date).getTime();
        const dateB = b.createdAt || new Date(b.date).getTime();
        return dateB - dateA;
    });

    if (ordersArray.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.1rem;">Aún no tienes pedidos realizados.</p>
            </div>
        `;
        return;
    }

    // Check for delivered orders to trigger confetti (once per session)
    const hasNewDelivered = ordersArray.some(order => {
        const normalizedStatus = normalizeStatus(order.status);
        const confettiKey = `confetti_shown_${order.orderId || order.id}`;
        if (normalizedStatus === 'entregado' && !sessionStorage.getItem(confettiKey)) {
            sessionStorage.setItem(confettiKey, 'true');
            return true;
        }
        return false;
    });

    if (hasNewDelivered) {
        triggerConfetti();
    }

    ordersList.innerHTML = ordersArray.map(order => {
        const normalizedStatus = normalizeStatus(order.status);
        const statusInfo = getStatusInfo(normalizedStatus);

        // Get products - try both field names for compatibility
        const products = order.products || order.items || [];

        // Get shipping info - try both field names for compatibility
        const shipping = order.shippingInfo || order.shippingAddress || {};

        // Get date with time - try createdAt timestamp first
        const orderDateTime = order.createdAt
            ? new Date(order.createdAt).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : formatDate(order.date);

        // Status configuration with colors
        const statusConfig = {
            'pendiente': { icon: 'fa-clock', bg: 'rgba(126, 126, 126, 0.15)', color: '#9ca3af' },
            'confirmado': { icon: 'fa-check-circle', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
            'enviado': { icon: 'fa-shipping-fast', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
            'entregado': { icon: 'fa-box-open', bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
        };
        const currentStatusConfig = statusConfig[normalizedStatus] || statusConfig['pendiente'];

        return `
        <div class="order-card" style="
            background: linear-gradient(135deg, var(--bg-card) 0%, rgba(var(--primary-rgb), 0.02) 100%);
            border-radius: 16px;
            padding: 1.75rem;
            margin-bottom: 1.5rem;
            border: 1px solid var(--border);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        ">
            
            <!-- Header: Order ID + Date -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                    <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0 0 0.25rem 0; color: var(--text-main);">
                        Pedido <span style="background: linear-gradient(135deg, var(--primary), #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">#${order.orderId || order.id}</span>
                    </h3>
                    <span style="color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                        <i class="far fa-calendar-alt"></i>${orderDateTime}
                    </span>
                </div>
                
                <!-- Status Badge - Premium Style -->
                <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    background: ${currentStatusConfig.bg};
                    border: 1px solid ${currentStatusConfig.color}30;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: ${currentStatusConfig.color};
                ">
                    <i class="fas ${currentStatusConfig.icon}"></i>
                    ${statusInfo.text}
                </div>
            </div>
            
            <!-- Shipping Address Section -->
            ${shipping && (shipping.address || shipping.street || shipping.name || shipping.fullName) ? `
                <div style="
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: var(--bg-body);
                    border-radius: 12px;
                    border-left: 3px solid var(--primary);
                ">
                    <h4 style="
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: var(--text-muted);
                        margin-bottom: 0.75rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: 600;
                    ">
                        <i class="fas fa-map-marker-alt" style="color: var(--primary);"></i>
                        Dirección de Envío
                    </h4>
                    <div style="font-size: 0.95rem; line-height: 1.7; color: var(--text-main);">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${shipping.name || shipping.fullName || ''}</div>
                        <div style="opacity: 0.9;">${shipping.address || shipping.street || ''}</div>
                        <div style="opacity: 0.9;">${shipping.postalCode || shipping.zip || ''} ${shipping.city || ''}${shipping.province ? ` (${shipping.province})` : ''}</div>
                        ${shipping.phone ? `
                            <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; color: var(--primary);">
                                <i class="fas fa-phone-alt" style="font-size: 0.8rem;"></i>
                                <span>${shipping.phone}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Products Section -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-muted);
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                ">
                    <i class="fas fa-tshirt" style="color: var(--primary);"></i>
                    Productos <span style="background: linear-gradient(135deg, var(--primary), #8b5cf6); color: white; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.7rem; margin-left: 0.25rem; font-weight: 700;">${Array.isArray(products) ? products.length : 0}</span>
                </h4>
                
                ${Array.isArray(products) && products.length > 0 ? products.map(p => `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: var(--bg-body);
                        border-radius: 12px;
                        margin-bottom: 0.75rem;
                        border: 1px solid var(--border);
                        transition: border-color 0.2s ease;
                    ">
                        <!-- Product Image -->
                        <div style="
                            width: 70px;
                            height: 70px;
                            border-radius: 10px;
                            overflow: hidden;
                            flex-shrink: 0;
                            background: linear-gradient(135deg, var(--bg-card), var(--bg-body));
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        ">
                            <img src="${p.image || '/assets/placeholder.webp'}" alt="${p.name || 'Producto'}" 
                                style="width: 100%; height: 100%; object-fit: cover;"
                                onerror="this.src='/assets/placeholder.webp'">
                        </div>
                        
                        <!-- Product Details -->
                        <div style="flex: 1; min-width: 0;">
                            <p style="font-weight: 600; font-size: 0.95rem; margin: 0 0 0.4rem 0; color: var(--text-main);">
                                ${p.name || p.productName || 'Producto'}
                            </p>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8rem;">
                                <span style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 50px;">
                                    Talla: ${p.size || 'M'}
                                </span>
                                <span style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6; padding: 0.2rem 0.6rem; border-radius: 50px;">
                                    ${p.version || p.customization?.version || 'Aficionado'}
                                </span>
                                <span style="background: rgba(var(--text-rgb), 0.08); color: var(--text-muted); padding: 0.2rem 0.6rem; border-radius: 50px;">
                                    ×${p.quantity || p.qty || 1}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Product Price -->
                        <div style="
                            font-weight: 700;
                            font-size: 1.1rem;
                            color: var(--primary);
                            flex-shrink: 0;
                            background: rgba(var(--primary-rgb), 0.1);
                            padding: 0.5rem 0.75rem;
                            border-radius: 8px;
                        ">
                            €${(p.price || 0).toFixed(2)}
                        </div>
                    </div>
                `).join('') : '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem; background: var(--bg-body); border-radius: 12px;"><i class="fas fa-box-open" style="margin-right: 0.5rem;"></i>Sin productos</p>'}
            </div>
            
            <!-- Total -->
            <div style="
                display: flex;
                justify-content: flex-end;
                align-items: center;
                padding-top: 1.25rem;
                border-top: 2px dashed var(--border);
            ">
                <div style="text-align: right;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Total del pedido</span>
                    <span style="
                        font-size: 1.5rem;
                        font-weight: 800;
                        background: linear-gradient(135deg, var(--primary), #8b5cf6);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    ">
                        €${order.total ? Number(order.total).toFixed(2) : '0.00'}
                    </span>
                </div>
            </div>
            
            <!-- Tracking Number (if shipped/delivered) -->
            ${(normalizedStatus === 'enviado' || normalizedStatus === 'entregado') && order.trackingNumber ? `
                <div style="
                    margin-top: 1.25rem;
                    padding: 1rem 1.25rem;
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
                    border-radius: 12px;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="
                            width: 36px;
                            height: 36px;
                            background: linear-gradient(135deg, #22c55e, #16a34a);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fas fa-truck" style="color: white; font-size: 0.9rem;"></i>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Nº de Seguimiento</span>
                            <strong style="color: var(--text-main); font-size: 1.05rem; font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: 0.5px;">${order.trackingNumber}</strong>
                        </div>
                    </div>
                    <button 
                        onclick="navigator.clipboard.writeText('${order.trackingNumber}'); this.querySelector('span').textContent='¡Copiado!'; this.style.background='#22c55e'; this.style.color='white'; setTimeout(() => { this.querySelector('span').textContent='Copiar'; this.style.background='linear-gradient(135deg, #1a1a2e, #8b5cf6)'; this.style.color='white'; }, 2000);"
                        style="
                            background: linear-gradient(135deg, #1a1a2e, #8b5cf6);
                            color: white;
                            border: 1px solid rgba(139, 92, 246, 0.3);
                            padding: 0.6rem 1.25rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 12px rgba(139, 92, 246, 0.25);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(139, 92, 246, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 12px rgba(139, 92, 246, 0.25)'"
                    >
                        <i class="fas fa-copy"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
}

// Legacy status mapping (English -> Spanish)
const LEGACY_STATUS_MAP = {
    'pending': 'pendiente',
    'confirmed': 'confirmado',
    'shipped': 'enviado',
    'delivered': 'entregado',
    'completed': 'entregado',
    'processing': 'pendiente',
    'pendiente_de_confirmacion': 'pendiente'
};

// Normalize status to new 4-state system
function normalizeStatus(status) {
    if (!status) return 'pendiente';
    const lower = status.toLowerCase().trim();

    // Check legacy map first
    if (LEGACY_STATUS_MAP[lower]) {
        return LEGACY_STATUS_MAP[lower];
    }

    // Check if already valid
    const validStatuses = ['pendiente', 'confirmado', 'enviado', 'entregado'];
    if (validStatuses.includes(lower)) {
        return lower;
    }

    return 'pendiente';
}

// Get status display info
function getStatusInfo(status) {
    const statusMap = {
        'pendiente': { text: 'Pendiente', icon: 'fas fa-clock', class: 'estado-pendiente' },
        'confirmado': { text: 'Confirmado', icon: 'fas fa-check-circle', class: 'estado-confirmado' },
        'enviado': { text: 'Enviado', icon: 'fas fa-truck', class: 'estado-enviado' },
        'entregado': { text: 'Entregado', icon: 'fas fa-gift', class: 'estado-entregado' }
    };
    return statusMap[status] || statusMap['pendiente'];
}

// Confetti effect for delivered orders
function triggerConfetti() {
    import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js')
        .then(() => {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 120,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        })
        .catch(err => console.warn('Could not load confetti:', err));
}

// Initialize Firebase config for order status options (creates if not exists)
async function initOrderStatusConfig() {
    try {
        const configRef = ref(db, 'config/order_status_options');
        const snapshot = await get(configRef);

        if (!snapshot.exists()) {
            // Create the config node with valid status options
            await set(configRef, {
                "0": "pendiente",
                "1": "confirmado",
                "2": "enviado",
                "3": "entregado"
            });
            console.log('✅ Order status config initialized in Firebase');
        }
    } catch (error) {
        console.warn('Could not initialize order status config:', error);
    }
}

function getStatusText(status) {
    const normalized = normalizeStatus(status);
    return getStatusInfo(normalized).text;
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

            // Initialize order status config in Firebase (if not exists)
            initOrderStatusConfig();
        } else {
            window.location.href = '/pages/login.html';
        }
    });
});
