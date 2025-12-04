import products from './products-data.js';

document.addEventListener('DOMContentLoaded', () => {
    initHome();
});

function initHome() {
    // Apply special pricing rules (same as tienda.js)
    applySpecialPricing();

    // Render Best Sellers
    renderBestSellers();
}

function applySpecialPricing() {
    products.forEach(product => {
        const nameLower = product.name.toLowerCase();
        const isKids = nameLower.includes('kids') || nameLower.includes('niño');
        const isRetro = product.name.trim().endsWith('R') || product.league === 'retro';
        const isNBA = product.category === 'nba' || product.league === 'nba';

        // Default to Normal
        let oldPrice = 25.00;
        let newPrice = 19.90;

        if (isNBA) {
            oldPrice = 30.00;
            newPrice = 24.90;
        } else if (isRetro) {
            oldPrice = 30.00;
            newPrice = 24.90;
        } else if (isKids) {
            oldPrice = 27.00;
            newPrice = 21.90;
        }

        // Apply changes
        product.oldPrice = oldPrice;
        product.price = newPrice;
        product.sale = true; // Always on sale
    });
}

function renderBestSellers() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    // IDs of products to show in "Más Vendidos"
    const bestSellerIds = [134, 701, 112, 602];

    const bestSellers = products.filter(p => bestSellerIds.includes(p.id));

    // Sort them to match the order of IDs if needed, or just let them appear
    // To strictly follow the ID order:
    const sortedBestSellers = bestSellerIds.map(id => bestSellers.find(p => p.id === id)).filter(Boolean);

    grid.innerHTML = sortedBestSellers.map(product => `
        <article class="product-card">
            <div class="product-image">
                ${product.sale ? '<span class="badge-sale">OFERTA</span>' : ''}
                <a href="/pages/producto.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </a>
                <button class="btn-quick-view"><i class="fas fa-eye"></i></button>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    <span class="price-old">€${product.oldPrice.toFixed(2)}</span>
                    <span class="price">€${product.price.toFixed(2)}</span>
                </div>
            </div>
        </article>
    `).join('');
}
