(function() {
    function sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>"'&]/g, function(match) {
                const entityMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return entityMap[match];
            })
            .trim();
    }
    
    
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    
    function validatePhone(phone) {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,15}$/;
        return phoneRegex.test(phone);
    }
    
    
    function validateName(name) {
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,50}$/;
        return nameRegex.test(name);
    }
    
    
    function validateAddress(address) {
        return address.length >= 5 && address.length <= 200;
    }
    
    
    function showError(input, message) {
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            const newErrorDiv = document.createElement('div');
            newErrorDiv.className = 'error-message';
            newErrorDiv.textContent = message;
            newErrorDiv.style.color = '#ff4444';
            newErrorDiv.style.fontSize = '0.9rem';
            newErrorDiv.style.marginTop = '5px';
            input.parentNode.appendChild(newErrorDiv);
        }
        input.style.borderColor = '#ff4444';
    }
    
    
    function clearError(input) {
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        input.style.borderColor = '';
    }
    
    
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const value = sanitizeInput(input.value);
            input.value = value;
            
            clearError(input);
            
            
            if (input.required && !value) {
                showError(input, 'Este campo es obligatorio');
                isValid = false;
                return;
            }
            
            if (input.type === 'email' && value && !validateEmail(value)) {
                showError(input, 'Por favor, introduce un email válido');
                isValid = false;
            }
            
            if (input.type === 'tel' && value && !validatePhone(value)) {
                showError(input, 'Por favor, introduce un teléfono válido');
                isValid = false;
            }
            
            if (input.name === 'nombre' && value && !validateName(value)) {
                showError(input, 'El nombre solo puede contener letras y espacios (2-50 caracteres)');
                isValid = false;
            }
            
            if (input.name === 'direccion' && value && !validateAddress(value)) {
                showError(input, 'La dirección debe tener entre 5 y 200 caracteres');
                isValid = false;
            }
            
            
            if (value.length > 500) {
                showError(input, 'El texto es demasiado largo');
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    
    const submitAttempts = new Map();
    
    function checkRateLimit(formId) {
        const now = Date.now();
        const attempts = submitAttempts.get(formId) || [];
        
        
        const recentAttempts = attempts.filter(time => now - time < 60000);
        
        if (recentAttempts.length >= 5) {
            return false;
        }
        
        recentAttempts.push(now);
        submitAttempts.set(formId, recentAttempts);
        return true;
    }
    
    
    document.addEventListener('DOMContentLoaded', function() {
        
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formId = form.id || 'default';
                
                
                if (!checkRateLimit(formId)) {
                    alert('Demasiados intentos. Por favor, espera un minuto antes de intentar de nuevo.');
                    return;
                }
                
                if (validateForm(form)) {
                    console.log('Formulario válido, procesando...');
                } else {
                    console.log('Formulario inválido, corrige los errores');
                }
            });
            
            
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    if (this.value) {
                        validateForm(form);
                    }
                });
            });
        });
    });
})();