/**
 * Security Utilities
 * XSS protection and input sanitization for the application
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes dangerous HTML characters
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string safe for innerHTML
 */
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

/**
 * Sanitize user input for display
 * Removes potentially dangerous content and trims whitespace
 * @param {string} input - User input to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, maxLength = 1000) {
    if (input === null || input === undefined) return '';
    if (typeof input !== 'string') input = String(input);

    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);

    // Remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number (Spanish format)
 * @param {string} phone - Phone to validate
 * @returns {boolean} - True if valid phone format
 */
export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    // Spanish phone: 9 digits, may start with 6, 7, 8, 9 or have +34 prefix
    const phoneRegex = /^(\+34)?[6789]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate postal code (Spanish format)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} - True if valid Spanish postal code
 */
export function isValidPostalCode(postalCode) {
    if (!postalCode || typeof postalCode !== 'string') return false;
    // Spanish postal code: 5 digits, 01000-52999
    const postalCodeRegex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
    return postalCodeRegex.test(postalCode);
}

/**
 * Create a safe innerHTML assignment
 * Use this instead of direct innerHTML when inserting user data
 * @param {HTMLElement} element - DOM element
 * @param {string} html - HTML string with user data already sanitized
 */
export function safeSetInnerHTML(element, html) {
    if (element && typeof html === 'string') {
        element.innerHTML = html;
    }
}

/**
 * Create text node (safest way to insert user content)
 * @param {string} text - Text content
 * @returns {Text} - Text node
 */
export function createSafeTextNode(text) {
    return document.createTextNode(sanitizeHTML(text));
}

/**
 * Rate limiter for protection against brute force
 * Simple in-memory rate limiting (resets on page reload)
 */
const rateLimitStore = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return true; // Allowed
    }

    // Reset if window has passed
    if (now - record.firstAttempt > windowMs) {
        rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
        return true; // Allowed
    }

    // Check if over limit
    if (record.attempts >= maxAttempts) {
        return false; // Blocked
    }

    // Increment and allow
    record.attempts++;
    rateLimitStore.set(key, record);
    return true; // Allowed
}

/**
 * Get remaining attempts for rate limiter
 * @param {string} key - Rate limit key
 * @param {number} maxAttempts - Maximum attempts allowed
 * @returns {number} - Remaining attempts
 */
export function getRemainingAttempts(key, maxAttempts = 5) {
    const record = rateLimitStore.get(key);
    if (!record) return maxAttempts;
    return Math.max(0, maxAttempts - record.attempts);
}

// Export as default object for non-module usage
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
