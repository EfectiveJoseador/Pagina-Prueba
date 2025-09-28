// Función para manejar la redirección después del pago exitoso
function handlePaymentSuccess(orderData) {
    // Guardar los datos del pedido en localStorage
    localStorage.setItem('lastOrder', JSON.stringify({
        items: orderData.items,
        subtotal: orderData.subtotal,
        envio: orderData.envio,
        descuento: orderData.descuento,
        total: orderData.total,
        puntosGanados: Math.floor(orderData.total * 10),
        fechaPedido: new Date().toISOString()
    }));

    // Guardar los datos de envío en localStorage
    localStorage.setItem('shippingData', JSON.stringify(orderData.shippingData));

    // Limpiar el carrito
    localStorage.removeItem('cart');
    if (typeof window.CART !== 'undefined') {
        window.CART = [];
    }

    // Actualizar la interfaz si es necesario
    if (typeof window.updateCartTabBadge === 'function') {
        window.updateCartTabBadge(0);
    }

    // Redirigir a la página de confirmación con una animación suave
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        window.location.href = 'compraExitosa.html';
    }, 500);
}

// Exportar la función para su uso en otros scripts
window.PaymentSuccess = {
    handleSuccess: handlePaymentSuccess
};