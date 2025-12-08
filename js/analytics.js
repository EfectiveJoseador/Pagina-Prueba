/**
 * Google Analytics Enhanced Tracking
 * Custom events for e-commerce tracking
 * 
 * Events tracked:
 * - Page views (automatic)
 * - Product views
 * - Add to cart
 * - Remove from cart
 * - Begin checkout
 * - Purchase complete
 * - Search usage
 * - Filter usage
 * - Category clicks
 * - CTA button clicks
 * - Scroll depth
 * - Time on page
 * - External link clicks
 * - Form submissions
 */

// Ensure gtag is available
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

// ============================================
// ECOMMERCE TRACKING
// ============================================

/**
 * Track when a product is viewed
 */
function trackProductView(product) {
    if (!product) return;

    gtag('event', 'view_item', {
        currency: 'EUR',
        value: product.price || 0,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category || 'General',
            item_brand: product.team || 'Camisetazo',
            price: product.price || 0
        }]
    });

    console.log('📊 Analytics: Product viewed -', product.name);
}

/**
 * Track when item is added to cart
 */
function trackAddToCart(product, quantity = 1, customizations = {}) {
    if (!product) return;

    const totalValue = (product.price || 0) * quantity;

    gtag('event', 'add_to_cart', {
        currency: 'EUR',
        value: totalValue,
        items: [{
            item_id: product.id,
            item_name: product.name,
            item_category: product.category || 'General',
            item_brand: product.team || 'Camisetazo',
            item_variant: customizations.size || '',
            price: product.price || 0,
            quantity: quantity
        }]
    });

    // Track customizations separately
    if (customizations.name || customizations.number) {
        gtag('event', 'customize_product', {
            product_id: product.id,
            has_name: !!customizations.name,
            has_number: !!customizations.number,
            has_patch: !!customizations.patch && customizations.patch !== 'none',
            version: customizations.version || 'aficionado'
        });
    }

    console.log('📊 Analytics: Added to cart -', product.name, 'x', quantity);
}

/**
 * Track when item is removed from cart
 */
function trackRemoveFromCart(product, quantity = 1) {
    if (!product) return;

    gtag('event', 'remove_from_cart', {
        currency: 'EUR',
        value: (product.price || 0) * quantity,
        items: [{
            item_id: product.id,
            item_name: product.name,
            price: product.price || 0,
            quantity: quantity
        }]
    });

    console.log('📊 Analytics: Removed from cart -', product.name);
}

/**
 * Track when checkout begins
 */
function trackBeginCheckout(cartItems, totalValue) {
    if (!cartItems || !cartItems.length) return;

    const items = cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || 'General',
        price: item.price || 0,
        quantity: item.quantity || 1
    }));

    gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: totalValue,
        items: items
    });

    console.log('📊 Analytics: Checkout started - Total:', totalValue);
}

/**
 * Track shipping info added
 */
function trackAddShippingInfo(address) {
    gtag('event', 'add_shipping_info', {
        currency: 'EUR',
        shipping_tier: 'standard',
        address_city: address?.city || 'Unknown',
        address_province: address?.province || 'Unknown'
    });

    console.log('📊 Analytics: Shipping info added');
}

/**
 * Track payment method selected
 */
function trackAddPaymentInfo(paymentMethod) {
    gtag('event', 'add_payment_info', {
        currency: 'EUR',
        payment_type: paymentMethod // 'paypal' or 'bizum'
    });

    console.log('📊 Analytics: Payment method selected -', paymentMethod);
}

/**
 * Track successful purchase
 */
function trackPurchase(orderId, cartItems, totalValue, paymentMethod) {
    if (!orderId || !cartItems) return;

    const items = cartItems.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || 'General',
        price: item.price || 0,
        quantity: item.quantity || 1
    }));

    gtag('event', 'purchase', {
        transaction_id: orderId,
        value: totalValue,
        currency: 'EUR',
        shipping: 0,
        tax: 0,
        payment_type: paymentMethod,
        items: items
    });

    console.log('📊 Analytics: Purchase completed - Order:', orderId, 'Total:', totalValue);
}

// ============================================
// SEARCH & FILTER TRACKING
// ============================================

/**
 * Track search usage
 */
function trackSearch(searchTerm, resultsCount) {
    if (!searchTerm || searchTerm.length < 2) return;

    gtag('event', 'search', {
        search_term: searchTerm,
        results_count: resultsCount || 0
    });

    console.log('📊 Analytics: Search -', searchTerm, '(' + resultsCount + ' results)');
}

/**
 * Track filter usage
 */
function trackFilterUse(filterType, filterValue) {
    gtag('event', 'filter_use', {
        filter_type: filterType, // 'league', 'team', 'kids', 'sort'
        filter_value: filterValue
    });

    console.log('📊 Analytics: Filter used -', filterType, ':', filterValue);
}

// ============================================
// NAVIGATION & ENGAGEMENT TRACKING
// ============================================

/**
 * Track category/collection clicks
 */
function trackCategoryClick(categoryName, source) {
    gtag('event', 'select_content', {
        content_type: 'category',
        content_id: categoryName,
        source: source || 'unknown' // 'home_carousel', 'catalog_page', 'menu'
    });

    console.log('📊 Analytics: Category clicked -', categoryName);
}

/**
 * Track CTA button clicks
 */
function trackCTAClick(buttonName, location) {
    gtag('event', 'cta_click', {
        button_name: buttonName,
        page_location: location || window.location.pathname
    });

    console.log('📊 Analytics: CTA clicked -', buttonName);
}

/**
 * Track external link clicks
 */
function trackExternalLink(url, linkText) {
    gtag('event', 'click', {
        link_url: url,
        link_text: linkText,
        outbound: true
    });

    console.log('📊 Analytics: External link -', url);
}

// ============================================
// SCROLL DEPTH TRACKING
// ============================================

let scrollMilestones = [25, 50, 75, 100];
let scrollMilestonesReached = new Set();

function initScrollTracking() {
    if (typeof window === 'undefined') return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = Math.round((scrollTop / docHeight) * 100);

                scrollMilestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !scrollMilestonesReached.has(milestone)) {
                        scrollMilestonesReached.add(milestone);

                        gtag('event', 'scroll_depth', {
                            percent_scrolled: milestone,
                            page_path: window.location.pathname
                        });

                        console.log('📊 Analytics: Scroll depth -', milestone + '%');
                    }
                });

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ============================================
// TIME ON PAGE TRACKING
// ============================================

let pageLoadTime = Date.now();
let timeIntervals = [30, 60, 120, 300]; // seconds: 30s, 1m, 2m, 5m
let timeIntervalsReached = new Set();

function initTimeTracking() {
    if (typeof window === 'undefined') return;

    setInterval(() => {
        const timeSpent = Math.floor((Date.now() - pageLoadTime) / 1000);

        timeIntervals.forEach(interval => {
            if (timeSpent >= interval && !timeIntervalsReached.has(interval)) {
                timeIntervalsReached.add(interval);

                gtag('event', 'time_on_page', {
                    seconds: interval,
                    page_path: window.location.pathname
                });

                console.log('📊 Analytics: Time on page -', interval + 's');
            }
        });
    }, 5000); // Check every 5 seconds
}

// ============================================
// FORM TRACKING
// ============================================

/**
 * Track form submissions
 */
function trackFormSubmit(formName, success = true) {
    gtag('event', 'form_submit', {
        form_name: formName,
        success: success
    });

    console.log('📊 Analytics: Form submitted -', formName);
}

/**
 * Track login/signup
 */
function trackLogin(method = 'email') {
    gtag('event', 'login', {
        method: method // 'email', 'google'
    });

    console.log('📊 Analytics: Login -', method);
}

function trackSignUp(method = 'email') {
    gtag('event', 'sign_up', {
        method: method
    });

    console.log('📊 Analytics: Sign up -', method);
}

// ============================================
// ERRORS TRACKING
// ============================================

/**
 * Track errors
 */
function trackError(errorType, errorMessage, location) {
    gtag('event', 'exception', {
        description: errorMessage,
        fatal: false,
        error_type: errorType,
        page_location: location || window.location.pathname
    });

    console.log('📊 Analytics: Error -', errorType, errorMessage);
}

// ============================================
// PACK/PROMOTION TRACKING
// ============================================

/**
 * Track pack unlock (promotional)
 */
function trackPackUnlock(packType, itemCount) {
    gtag('event', 'unlock_achievement', {
        achievement_id: packType,
        items_count: itemCount
    });

    gtag('event', 'promotion_view', {
        promotion_name: packType,
        items_count: itemCount
    });

    console.log('📊 Analytics: Pack unlocked -', packType, 'with', itemCount, 'items');
}

/**
 * Track coupon usage
 */
function trackCouponUse(couponCode, discountAmount) {
    gtag('event', 'coupon_use', {
        coupon_code: couponCode,
        discount_amount: discountAmount
    });

    console.log('📊 Analytics: Coupon used -', couponCode);
}

// ============================================
// INITIALIZATION
// ============================================

function initAnalytics() {
    // Start scroll tracking
    initScrollTracking();

    // Start time tracking
    initTimeTracking();

    // Track external links automatically
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="http"]');
        if (link && !link.href.includes(window.location.hostname)) {
            trackExternalLink(link.href, link.textContent?.trim() || 'Unknown');
        }
    });

    console.log('📊 Analytics: Enhanced tracking initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
    initAnalytics();
}

// Export functions for use in other modules
window.Analytics = {
    // Ecommerce
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,

    // Search & Filters
    trackSearch,
    trackFilterUse,

    // Navigation
    trackCategoryClick,
    trackCTAClick,
    trackExternalLink,

    // Forms
    trackFormSubmit,
    trackLogin,
    trackSignUp,

    // Errors
    trackError,

    // Promotions
    trackPackUnlock,
    trackCouponUse
};
