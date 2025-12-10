


export function sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
}


export function sanitizeInput(input, maxLength = 1000) {
    if (input === null || input === undefined) return '';
    if (typeof input !== 'string') input = String(input);
    let sanitized = input.trim().substring(0, maxLength);
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
}


export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}


export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^(\+34)?[6789]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}


export function isValidPostalCode(postalCode) {
    if (!postalCode || typeof postalCode !== 'string') return false;
    const postalCodeRegex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
    return postalCodeRegex.test(postalCode);
}


export function safeSetInnerHTML(element, html) {
    if (element && typeof html === 'string') {
        element.innerHTML = html;
    }
}


export function createSafeTextNode(text) {
    return document.createTextNode(sanitizeHTML(text));
}


const rateLimitStore = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return true;
    }
    if (now - record.firstAttempt > windowMs) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return true;
    }
    if (record.attempts >= maxAttempts) {
        return false;
    }
    record.attempts++;
    rateLimitStore.set(key, record);
    return true;
}


export function getRemainingAttempts(key, maxAttempts = 5) {
    const record = rateLimitStore.get(key);
    if (!record) return maxAttempts;
    return Math.max(0, maxAttempts - record.attempts);
}
const Security = {
    sanitizeHTML,
    sanitizeInput,
    isValidEmail,
    isValidPhone,
    isValidPostalCode,
    safeSetInnerHTML,
    createSafeTextNode,
    checkRateLimit,
    getRemainingAttempts
};

export default Security;
