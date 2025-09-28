// Manejador del proceso de pago y redirección post-pago
let paypalWindow = null;

// Función para iniciar el proceso de pago con PayPal
function initializePayPalPayment(orderData) {
    // Guardar los datos del pedido en localStorage para recuperarlos después
    localStorage.setItem('pendingOrderData', JSON.stringify(orderData));
    
    // Configurar la ventana de PayPal
    const width = 450;
    const height = 650;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // Abrir la ventana de PayPal
    paypalWindow = window.open(
        'https://www.paypal.com/checkoutnow', 
        'PayPal',
        `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // Configurar el manejador para detectar cuando se cierra la ventana
    const checkPayPalWindow = setInterval(() => {
        if (paypalWindow.closed) {
            clearInterval(checkPayPalWindow);
            handlePayPalWindowClosed();
        }
    }, 500);
}

// Función para manejar el cierre de la ventana de PayPal
function handlePayPalWindowClosed() {
    // Recuperar los datos del pedido
    const orderData = JSON.parse(localStorage.getItem('pendingOrderData') || '{}');
    
    // Procesar el pedido
    processOrder(orderData)
        .then(() => {
            // Limpiar datos temporales
            localStorage.removeItem('pendingOrderData');
            
            // Redirigir a la página de confirmación
            window.location.href = 'compraExitosa.html';
        })
        .catch(error => {
            console.error('Error al procesar el pedido:', error);
            alert('Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
        });
}

// Función para procesar el pedido
async function processOrder(orderData) {
    try {
        // Generar ID único para el pedido
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Calcular puntos (10 por camiseta)
        const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
        const points = totalItems * 10;
        
        // Preparar datos del pedido para almacenamiento
        const processedOrder = {
            ...orderData,
            orderId,
            points,
            status: 'processing',
            paymentStatus: 'completed',
            createdAt: new Date().toISOString()
        };
        
        // Guardar datos del pedido
        localStorage.setItem('lastOrderData', JSON.stringify(processedOrder));
        localStorage.setItem('lastOrderNumber', orderId);
        
        // Limpiar el carrito
        localStorage.removeItem('cart');
        
        return processedOrder;
    } catch (error) {
        console.error('Error al procesar el pedido:', error);
        throw error;
    }
}

// Exportar funciones
// Manejador de pagos y redirección
window.PaymentHandler = {
    // Inicializar el pago con PayPal
    initializePayPalPayment: function(orderData) {
        // Aquí iría la lógica de integración con PayPal
        // Por ahora, simularemos un pago exitoso después de un breve retraso
        console.log('Iniciando pago con PayPal...', orderData);
        
        // Simular ventana de PayPal
        const paypalWindow = window.open('', 'paypal', 'width=600,height=400');
        if (paypalWindow) {
            paypalWindow.document.write(`
                <html>
                <head>
                    <title>Procesando Pago</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: #f5f5f5;
                            color: #2c2e2f;
                        }
                        .loader {
                            border: 4px solid #f3f3f3;
                            border-radius: 50%;
                            border-top: 4px solid #009cde;
                            width: 40px;
                            height: 40px;
                            animation: spin 1s linear infinite;
                            margin-bottom: 20px;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <p>Procesando su pago...</p>
                </body>
                </html>
            `);

            // Simular proceso de pago
            setTimeout(() => {
                paypalWindow.close();
                this.handlePaymentCompletion(orderData);
            }, 3000);
        }
    },

    // Manejar la finalización del pago
    handlePaymentCompletion: function(orderData) {
        console.log('Pago completado exitosamente');
        
        // Procesar el pedido
        this.processOrder(orderData);

        // Redirigir a la página de éxito
        if (window.PaymentSuccess && typeof window.PaymentSuccess.handleSuccess === 'function') {
            window.PaymentSuccess.handleSuccess(orderData);
        } else {
            console.warn('PaymentSuccess.handleSuccess no está disponible');
            // Fallback: redirección simple
            window.location.href = 'compraExitosa.html';
        }
    },

    // Procesar el pedido
    processOrder: function(orderData) {
        // Generar ID único para el pedido
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Calcular puntos
        const puntos = Math.floor(orderData.total * 10);
        
        // Preparar datos del pedido
        const processedOrder = {
            ...orderData,
            orderId,
            puntos,
            estado: 'confirmado',
            fechaProcesamiento: new Date().toISOString()
        };

        // Guardar en localStorage para la página de éxito
        localStorage.setItem('lastOrder', JSON.stringify(processedOrder));
        
        // Limpiar el carrito
        localStorage.removeItem('cart');
        if (typeof window.CART !== 'undefined') {
            window.CART = [];
        }

        console.log('Pedido procesado:', processedOrder);
        return processedOrder;
    }
};