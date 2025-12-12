window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }


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

}


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
    if (customizations.name || customizations.number) {
        gtag('event', 'customize_product', {
            product_id: product.id,
            has_name: !!customizations.name,
            has_number: !!customizations.number,
            has_patch: !!customizations.patch && customizations.patch !== 'none',
            version: customizations.version || 'aficionado'
        });
    }

}


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

}


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

}


function trackAddShippingInfo(address) {
    gtag('event', 'add_shipping_info', {
        currency: 'EUR',
        shipping_tier: 'standard',
        address_city: address?.city || 'Unknown',
        address_province: address?.province || 'Unknown'
    });

}


function trackAddPaymentInfo(paymentMethod) {
    gtag('event', 'add_payment_info', {
        currency: 'EUR',
        payment_type: paymentMethod
    });

}


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

}


function trackSearch(searchTerm, resultsCount) {
    if (!searchTerm || searchTerm.length < 2) return;

    gtag('event', 'search', {
        search_term: searchTerm,
        results_count: resultsCount || 0
    });

}


function trackFilterUse(filterType, filterValue) {
    gtag('event', 'filter_use', {
        filter_type: filterType,
        filter_value: filterValue
    });

}


function trackCategoryClick(categoryName, source) {
    gtag('event', 'select_content', {
        content_type: 'category',
        content_id: categoryName,
        source: source || 'unknown'
    });

}


function trackCTAClick(buttonName, location) {
    gtag('event', 'cta_click', {
        button_name: buttonName,
        page_location: location || window.location.pathname
    });

}


function trackExternalLink(url, linkText) {
    gtag('event', 'click', {
        link_url: url,
        link_text: linkText,
        outbound: true
    });

}

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

                    }
                });

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

let pageLoadTime = Date.now();
let timeIntervals = [30, 60, 120, 300];
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

            }
        });
    }, 5000);
}


function trackFormSubmit(formName, success = true) {
    gtag('event', 'form_submit', {
        form_name: formName,
        success: success
    });

}


function trackLogin(method = 'email') {
    gtag('event', 'login', {
        method: method
    });

}

function trackSignUp(method = 'email') {
    gtag('event', 'sign_up', {
        method: method
    });

}


function trackError(errorType, errorMessage, location) {
    gtag('event', 'exception', {
        description: errorMessage,
        fatal: false,
        error_type: errorType,
        page_location: location || window.location.pathname
    });

}


function trackPackUnlock(packType, itemCount) {
    gtag('event', 'unlock_achievement', {
        achievement_id: packType,
        items_count: itemCount
    });

    gtag('event', 'promotion_view', {
        promotion_name: packType,
        items_count: itemCount
    });

}


function trackCouponUse(couponCode, discountAmount) {
    gtag('event', 'coupon_use', {
        coupon_code: couponCode,
        discount_amount: discountAmount
    });

}

function initAnalytics() {
    initScrollTracking();
    initTimeTracking();
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="http"]');
        if (link && !link.href.includes(window.location.hostname)) {
            trackExternalLink(link.href, link.textContent?.trim() || 'Unknown');
        }
    });

}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
    initAnalytics();
}
window.Analytics = {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,
    trackSearch,
    trackFilterUse,
    trackCategoryClick,
    trackCTAClick,
    trackExternalLink,
    trackFormSubmit,
    trackLogin,
    trackSignUp,
    trackError,
    trackPackUnlock,
    trackCouponUse
};
