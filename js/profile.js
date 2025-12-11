import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { loadUserPoints, loadPointsHistory, redeemCoupon, getUserCoupons, REWARDS } from './points.js';
let currentUser = null;
let currentAddressId = null;

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

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

function loadOrders() {
    if (!currentUser) return;

    const ordersList = document.getElementById('orders-list');
    const ordersRef = ref(db, `ordersByUser/${currentUser.uid}`);
    let ordersLoaded = false;
    const loadTimeout = setTimeout(() => {
        if (!ordersLoaded) {
            const currentContent = ordersList.innerHTML;
            if (currentContent.includes('Cargando pedidos')) {
                ordersList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 1rem; color: #f59e0b;"></i>
                        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Los pedidos están tardando en cargar</p>
                        <p style="font-size: 0.9rem; margin-bottom: 1rem; opacity: 0.8;">
                            Esto puede deberse a extensiones del navegador que interfieren con la conexión.
                        </p>
                        <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                            <p style="font-size: 0.9rem; margin: 0;">
                                <i class="fas fa-lightbulb" style="color: #6366f1;"></i>
                                <strong>Solución:</strong> Prueba abrir esta página en <strong>modo incógnito</strong> 
                                (Ctrl+Shift+N en Chrome/Edge) o desactiva temporalmente las extensiones.
                            </p>
                        </div>
                        <button onclick="location.reload()" style="
                            background: linear-gradient(135deg, var(--primary), #8b5cf6);
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            margin-top: 0.5rem;
                        ">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }, 10000);
    onValue(ordersRef, (snapshot) => {
        ordersLoaded = true;
        clearTimeout(loadTimeout);
        if (snapshot.exists()) {
            const orders = snapshot.val();
            renderOrders(orders);
        } else {
            ordersList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="font-size: 1.1rem;">Aún no tienes pedidos realizados.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">¡Explora nuestra tienda y haz tu primer pedido!</p>
                    <a href="/pages/tienda.html" class="btn-shop-now" style="display: inline-flex; margin-top: 1rem;">
                        <i class="fas fa-shopping-bag"></i> Ir a la Tienda
                    </a>
                </div>
            `;
        }
    }, (error) => {
        ordersLoaded = true;
        clearTimeout(loadTimeout);
        console.error('Error loading orders:', error);
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 2.5rem; margin-bottom: 1rem; color: #ef4444;"></i>
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Error al cargar los pedidos</p>
                <p style="font-size: 0.9rem; margin-bottom: 1rem; opacity: 0.8;">
                    Puede que una extensión del navegador esté bloqueando la conexión.
                </p>
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-lightbulb" style="color: #6366f1;"></i>
                        <strong>Solución:</strong> Prueba en <strong>modo incógnito</strong> (Ctrl+Shift+N) 
                        o desactiva las extensiones de seguimiento de precios.
                    </p>
                </div>
                <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, var(--primary), #8b5cf6);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    });
}

function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    console.log('📦 Raw orders from Firebase:', orders);

    const ordersArray = Object.entries(orders).map(([id, order]) => ({ id, ...order }));
    ordersArray.forEach((order, i) => {
        console.log(`📋 Order ${i + 1}:`, order);
        console.log('  - Products:', order.products || order.items);
        console.log('  - Shipping Info:', order.shippingInfo || order.shippingAddress);
        console.log('  - Total:', order.total);
        console.log('  - Status:', order.status);
    });
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
        const products = order.products || order.items || [];
        const shipping = order.shippingInfo || order.shippingAddress || {};
        const orderDateTime = order.createdAt
            ? new Date(order.createdAt).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : formatDate(order.date);
        const statusConfig = {
            'pendiente': { icon: 'fa-clock', bg: 'rgba(126, 126, 126, 0.15)', color: '#9ca3af' },
            'confirmado': { icon: 'fa-check-circle', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
            'imagenes_cliente': { icon: 'fa-camera', bg: 'rgba(192, 38, 211, 0.15)', color: '#c026d3' },
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
                    Productos <span style="background: linear-gradient(135deg, var(--primary), #8b5cf6); color: white; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.7rem; margin-left: 0.25rem; font-weight: 700;">${Array.isArray(products) ? products.reduce((sum, p) => sum + (p.quantity || p.qty || 1), 0) : 0}</span>
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
            
            <!-- Edit Address Button (only for pending orders that haven't been edited) -->
            ${normalizedStatus === 'pendiente' && !order.addressEditCount ? `
                <div style="
                    margin-top: 1.25rem;
                    padding-top: 1rem;
                    border-top: 1px dashed var(--border);
                ">
                    <button 
                        class="edit-order-address-btn"
                        data-order-id="${order.orderId || order.id}"
                        style="
                            background: linear-gradient(135deg, #6366f1, #8b5cf6);
                            color: white;
                            border: none;
                            padding: 0.6rem 1.25rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            display: inline-flex;
                            align-items: center;
                            gap: 0.5rem;
                            transition: all 0.2s ease;
                            box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(99, 102, 241, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 12px rgba(99, 102, 241, 0.25)'"
                    >
                        <i class="fas fa-edit"></i>
                        <span>Editar Dirección</span>
                    </button>
                </div>
            ` : ''}
            ${normalizedStatus === 'pendiente' && order.addressEditCount ? `
                <div style="
                    margin-top: 1rem;
                    padding: 0.5rem 0.75rem;
                    background: rgba(34, 197, 94, 0.1);
                    border-radius: 8px;
                    color: #22c55e;
                    font-size: 0.8rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                ">
                    <i class="fas fa-check-circle"></i>
                    Dirección ya editada
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
    document.querySelectorAll('.edit-order-address-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.dataset.orderId;
            openEditOrderAddressModal(orderId);
        });
    });
}
const LEGACY_STATUS_MAP = {
    'pending': 'pendiente',
    'confirmed': 'confirmado',
    'shipped': 'enviado',
    'delivered': 'entregado',
    'completed': 'entregado',
    'processing': 'pendiente',
    'pendiente_de_confirmacion': 'pendiente'
};
function normalizeStatus(status) {
    if (!status) return 'pendiente';
    const lower = status.toLowerCase().trim();
    if (LEGACY_STATUS_MAP[lower]) {
        return LEGACY_STATUS_MAP[lower];
    }
    const validStatuses = ['pendiente', 'confirmado', 'imagenes_cliente', 'enviado', 'entregado'];
    if (validStatuses.includes(lower)) {
        return lower;
    }

    return 'pendiente';
}
function getStatusInfo(status) {
    const statusMap = {
        'pendiente': { text: 'Pendiente', icon: 'fas fa-clock', class: 'estado-pendiente' },
        'confirmado': { text: 'Confirmado', icon: 'fas fa-check-circle', class: 'estado-confirmado' },
        'imagenes_cliente': { text: 'Imágenes Cliente', icon: 'fas fa-camera', class: 'estado-imagenes' },
        'enviado': { text: 'Enviado', icon: 'fas fa-truck', class: 'estado-enviado' },
        'entregado': { text: 'Entregado', icon: 'fas fa-gift', class: 'estado-entregado' }
    };
    return statusMap[status] || statusMap['pendiente'];
}
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
async function initOrderStatusConfig() {
    try {
        const configRef = ref(db, 'config/order_status_options');
        const snapshot = await get(configRef);

        if (!snapshot.exists()) {
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
            const addressRef = ref(db, `users/${currentUser.uid}/addresses/${currentAddressId}`);
            await update(addressRef, addressData);
        } else {
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

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
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
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAddressModal();
        }
    });
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }

    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', savePreferences);
    }
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const idTokenResult = await user.getIdTokenResult(true);
                if (idTokenResult.claims.admin === true) {
                    console.log('✅ Usuario es admin - redirigiendo a panel de administración');
                    window.location.href = '/pages/admin.html';
                    return;
                }
            } catch (error) {
                console.error('Error verificando claims de admin:', error);
            }
            currentUser = user;
            const usernameEl = document.querySelector('.user-info h3');
            const emailEl = document.querySelector('.user-info p');
            const avatarEl = document.querySelector('.avatar');

            if (usernameEl) usernameEl.textContent = user.displayName || 'Usuario';
            if (emailEl) emailEl.textContent = user.email;
            if (avatarEl) avatarEl.textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
            await loadOrders();
            await loadAddresses();
            await loadPreferences();
            await loadPoints();
            initOrderStatusConfig();
        } else {
            window.location.href = '/pages/login.html';
        }
    });

    async function loadPoints() {
        if (!currentUser) return;

        const points = await loadUserPoints(currentUser.uid);
        const pendingEl = document.getElementById('pending-points');
        const availableEl = document.getElementById('available-points');
        const modalAvailableEl = document.getElementById('modal-available-points');

        if (pendingEl) pendingEl.textContent = points.pendingPoints;
        if (availableEl) availableEl.textContent = points.availablePoints;
        if (modalAvailableEl) modalAvailableEl.textContent = points.availablePoints;
        const coupons = await getUserCoupons(currentUser.uid);
        renderUserCoupons(coupons);
        const history = await loadPointsHistory(currentUser.uid);
        renderPointsHistory(history);
        updateRedeemButtons(points.availablePoints);
    }

    function renderUserCoupons(coupons) {
        const container = document.getElementById('user-coupons');
        if (!container) return;

        if (coupons.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); width: 100%;">
                    <i class="fas fa-ticket-alt" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                    <p style="margin: 0.5rem 0 0 0;">No tienes cupones disponibles.</p>
                    <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem;">¡Canjea puntos en la Tienda de Puntos!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = coupons.map(coupon => {
            const discountText = coupon.type === 'percentage'
                ? `${coupon.value}%`
                : `€${coupon.value.toFixed(2)}`;
            const date = new Date(coupon.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

            return `
                <div style="
                    background: linear-gradient(135deg, rgba(192, 38, 211, 0.15), rgba(139, 92, 246, 0.1));
                    border: 1px dashed #c026d3;
                    border-radius: 10px;
                    padding: 1rem;
                    min-width: 140px;
                    text-align: center;
                    position: relative;
                ">
                    <div style="font-size: 1.5rem; font-weight: 800; color: #c026d3;">${discountText}</div>
                    <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">DESCUENTO</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem;">
                        <i class="fas fa-clock"></i> Obtenido: ${date}
                    </div>
                    <div style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        background: #22c55e;
                        color: white;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.7rem;
                    ">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPointsHistory(history) {
        const container = document.getElementById('points-history');
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-history" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem;"></i>
                    <p>Aún no tienes transacciones de puntos.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = history.slice(0, 20).map(entry => {
            const isPositive = entry.points > 0;
            const date = new Date(entry.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border);">
                    <div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-main);">${entry.description}</p>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${date}</span>
                    </div>
                    <span style="font-weight: 700; color: ${isPositive ? '#22c55e' : '#ef4444'};">
                        ${isPositive ? '+' : ''}${entry.points}
                    </span>
                </div>
            `;
        }).join('');
    }

    function updateRedeemButtons(availablePoints) {
        document.querySelectorAll('.btn-redeem').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            if (availablePoints < cost) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        });
    }
    const openRewardsBtn = document.getElementById('open-rewards-store');
    const closeRewardsBtn = document.getElementById('close-rewards-modal');
    const rewardsModal = document.getElementById('rewards-modal');

    if (openRewardsBtn) {
        openRewardsBtn.addEventListener('click', () => {
            if (rewardsModal) rewardsModal.style.display = 'block';
        });
    }

    if (closeRewardsBtn) {
        closeRewardsBtn.addEventListener('click', () => {
            if (rewardsModal) rewardsModal.style.display = 'none';
        });
    }
    if (rewardsModal) {
        rewardsModal.addEventListener('click', (e) => {
            if (e.target === rewardsModal) {
                rewardsModal.style.display = 'none';
            }
        });
    }
    document.querySelectorAll('.btn-redeem').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!currentUser) return;

            const rewardCard = btn.closest('.reward-card');
            const rewardId = rewardCard?.dataset.reward;
            const cost = parseInt(btn.dataset.cost);

            if (!rewardId) return;

            const reward = REWARDS.find(r => r.id === rewardId);
            if (!reward) return;

            if (!confirm(`¿Canjear ${cost} puntos por ${reward.name}?`)) return;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const coupon = await redeemCoupon(currentUser.uid, rewardId);

            if (coupon) {
                alert(`✅ ¡Cupón canjeado! Ya puedes usarlo en tu próxima compra.`);
                await loadPoints();
            } else {
                alert('❌ Error al canjear el cupón. Verifica que tienes suficientes puntos.');
            }

            btn.disabled = false;
            btn.innerHTML = `${cost} <i class="fas fa-star" style="font-size: 0.75rem;"></i>`;
        });
    });
    setupOrderAddressModalListeners();
});

const WEB3FORMS_KEY = "8e920ab3-b0f7-4768-a83a-ed3ef8cd58a8";
let currentEditingOrderId = null;
let currentEditingOrder = null;

function setupOrderAddressModalListeners() {
    const modal = document.getElementById('order-address-modal');
    const closeBtn = document.getElementById('close-order-address-modal');
    const cancelBtn = document.getElementById('cancel-order-address-btn');
    const form = document.getElementById('order-address-form');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderAddressModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeOrderAddressModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeOrderAddressModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', handleOrderAddressSubmit);
    }
}

function closeOrderAddressModal() {
    const modal = document.getElementById('order-address-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingOrderId = null;
    currentEditingOrder = null;
    document.getElementById('order-address-form')?.reset();
    const errorEl = document.getElementById('order-address-error');
    if (errorEl) errorEl.style.display = 'none';
}

async function openEditOrderAddressModal(orderId) {
    if (!currentUser) return;

    const modal = document.getElementById('order-address-modal');
    const errorEl = document.getElementById('order-address-error');

    if (errorEl) errorEl.style.display = 'none';
    try {
        const userRef = ref(db, `users/${currentUser.uid}/lastAddressEditDate`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const lastEditDate = new Date(snapshot.val());
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            if (lastEditDate > oneWeekAgo) {
                const nextEditDate = new Date(lastEditDate);
                nextEditDate.setDate(nextEditDate.getDate() + 7);
                alert(`Solo puedes editar direcciones una vez por semana. Podrás volver a editar el ${nextEditDate.toLocaleDateString('es-ES')}.`);
                return;
            }
        }
    } catch (error) {
        console.error('Error checking rate limit:', error);
    }
    try {
        const orderRef = ref(db, `ordersByUser/${currentUser.uid}/${orderId}`);
        const orderSnapshot = await get(orderRef);

        if (!orderSnapshot.exists()) {
            alert('No se pudo cargar el pedido.');
            return;
        }

        const order = orderSnapshot.val();
        currentEditingOrderId = orderId;
        currentEditingOrder = order;
        if (order.addressEditCount && order.addressEditCount >= 1) {
            alert('Este pedido ya ha sido editado anteriormente.');
            return;
        }
        const addr = order.shippingAddress || order.shippingInfo || {};
        document.getElementById('order-address-order-id').value = orderId;
        document.getElementById('order-address-name').value = addr.name || addr.fullName || '';
        document.getElementById('order-address-street').value = addr.street || addr.address || '';
        document.getElementById('order-address-city').value = addr.city || '';
        document.getElementById('order-address-zip').value = addr.zip || addr.postalCode || '';
        document.getElementById('order-address-province').value = addr.province || '';
        document.getElementById('order-address-phone').value = addr.phone || '';
        document.getElementById('order-address-instagram').value = addr.instagram || '';

        if (modal) {
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Error al cargar el pedido. Inténtalo de nuevo.');
    }
}

async function handleOrderAddressSubmit(e) {
    e.preventDefault();

    if (!currentUser || !currentEditingOrderId || !currentEditingOrder) return;

    const submitBtn = document.getElementById('save-order-address-btn');
    const errorEl = document.getElementById('order-address-error');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    const newAddress = {
        name: document.getElementById('order-address-name').value.trim(),
        street: document.getElementById('order-address-street').value.trim(),
        city: document.getElementById('order-address-city').value.trim(),
        zip: document.getElementById('order-address-zip').value.trim(),
        province: document.getElementById('order-address-province').value,
        phone: document.getElementById('order-address-phone').value.trim(),
        instagram: document.getElementById('order-address-instagram').value.trim().replace(/^@/, '')
    };

    try {
        const orderRef = ref(db, `ordersByUser/${currentUser.uid}/${currentEditingOrderId}`);

        await update(orderRef, {
            shippingAddress: newAddress,
            shippingInfo: newAddress,
            addressEditCount: 1,
            addressEditedAt: new Date().toISOString()
        });
        const userEditRef = ref(db, `users/${currentUser.uid}/lastAddressEditDate`);
        await set(userEditRef, new Date().toISOString());
        const emailSent = await sendAddressUpdateEmail({
            ...currentEditingOrder,
            shippingAddress: newAddress,
            orderId: currentEditingOrderId
        });

        if (emailSent) {
            alert('✅ Dirección actualizada y correo de confirmación reenviado.');
        } else {
            alert('✅ Dirección actualizada. El correo no pudo enviarse, pero el pedido está guardado.');
        }

        closeOrderAddressModal();
        await loadOrders();

    } catch (error) {
        console.error('Error updating order address:', error);
        if (errorEl) {
            errorEl.textContent = 'Error al actualizar la dirección. Inténtalo de nuevo.';
            errorEl.style.display = 'block';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

async function sendAddressUpdateEmail(orderData) {
    const sa = orderData.shippingAddress || {};
    const customerInfo = `Contact Name: ${sa.name || ''}
Address Line: ${sa.street || ''}
City: ${sa.city || ''}
Province: ${sa.province || ''}
Country: España
Postal Code: ${sa.zip || ''}
Phone Number: ${sa.phone || ''}
Instagram: @${(sa.instagram || '').replace('@', '')}`;
    let productsText = '';
    const items = orderData.items || orderData.products || [];
    items.forEach((item) => {
        const qty = item.quantity || 1;
        const size = item.size || 'M';
        const version = item.version || 'fan';
        const price = ((item.price || 0) * qty).toFixed(2);
        productsText += qty + 'x ' + (item.name || 'Producto') + ' · ' + size + ' · ' + version + ' — €' + price + '\n';
    });
    let totalInfo = `TOTAL: €${orderData.total ? Number(orderData.total).toFixed(2) : '0.00'}`;

    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("subject", `[DIRECCIÓN ACTUALIZADA] Pedido ${orderData.orderId}`);
    formData.append("cliente", customerInfo);
    formData.append("productos", productsText.trim());
    formData.append("total", totalInfo);
    formData.append("nota", "⚠️ El cliente ha actualizado su dirección de envío.");

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

