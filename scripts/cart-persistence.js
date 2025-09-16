(function() {
    const CART_STORAGE_KEY = 'camisetazo_cart';
    
    const ENCRYPTION_KEY = 'camisetazo_secure_2024';
    
    
    function simpleEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return btoa(result);
    }
    
    
    function simpleDecrypt(encryptedText, key) {
        try {
            const decoded = atob(encryptedText);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(
                    decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch (e) {
            console.error('Error al desencriptar:', e);
            return null;
        }
    }
    
    
    function saveCart() {
        if (Array.isArray(window.CART)) {
            try {
                const cartData = JSON.stringify({
                    cart: window.CART,
                    timestamp: Date.now(),
                    checksum: window.CART.length
                });
                const encryptedData = simpleEncrypt(cartData, ENCRYPTION_KEY);
                localStorage.setItem(CART_STORAGE_KEY, encryptedData);
                console.log('Carrito guardado de forma segura');
            } catch (e) {
                console.error('Error al guardar el carrito:', e);
            }
        }
    }
    
    
    function loadCart() {
        try {
            const encryptedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (encryptedCart) {
                const decryptedData = simpleDecrypt(encryptedCart, ENCRYPTION_KEY);
                if (decryptedData) {
                    const cartData = JSON.parse(decryptedData);
                    
                    
                    if (cartData.cart && 
                        Array.isArray(cartData.cart) && 
                        cartData.checksum === cartData.cart.length) {
                        
                        const maxAge = 7 * 24 * 60 * 60 * 1000;
                        if (Date.now() - cartData.timestamp < maxAge) {
                            window.CART = cartData.cart;
                            console.log('Carrito cargado de forma segura');
                            
                            
                            if (typeof window.renderCart === 'function') {
                                window.renderCart();
                            }
                        } else {
                            console.log('Carrito expirado, limpiando...');
                            localStorage.removeItem(CART_STORAGE_KEY);
                        }
                    } else {
                        console.warn('Datos del carrito corruptos, limpiando...');
                        localStorage.removeItem(CART_STORAGE_KEY);
                    }
                }
            }
        } catch (e) {
            console.error('Error al cargar el carrito:', e);
            
            localStorage.removeItem(CART_STORAGE_KEY);
        }
    }
    
    
    const originalClearCart = window.clearCart;
    window.clearCart = function() {
        if (typeof originalClearCart === 'function') {
            originalClearCart();
        } else {
            window.CART = [];
            if (typeof window.renderCart === 'function') {
                window.renderCart();
            }
        }
        saveCart();
    };
    
    
    const originalAddToCart = window.addToCart;
    window.addToCart = function(item) {
        if (typeof originalAddToCart === 'function') {
            originalAddToCart(item);
        }
        saveCart();
    };
    
    
    function setupCartObserver() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        
        const observer = new MutationObserver(function() {
            saveCart();
        });
        
        
        observer.observe(cartItems, { 
            childList: true, 
            subtree: true,
            attributes: true,
            characterData: true
        });
        
        
        cartItems.addEventListener('change', function(e) {
            if (e.target && e.target.classList.contains('cart-qty-input')) {
                setTimeout(saveCart, 100);
            }
        });
        
        
        cartItems.addEventListener('click', function(e) {
            if (e.target && (e.target.classList.contains('remove') || e.target.closest('.remove'))) {
                setTimeout(saveCart, 100);
            }
        });
    }
    
    
    document.addEventListener('DOMContentLoaded', function() {
        
        loadCart();
        
        
        setupCartObserver();
        
        
        const clearCartBtn = document.getElementById('clearCartGallery');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', saveCart);
        }
        
        
        window.addEventListener('beforeunload', saveCart);
    });
})();