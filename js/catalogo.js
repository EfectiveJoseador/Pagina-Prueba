import products from './products-data.js';

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const noResults = document.getElementById('no-results');
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    const leagueCheckboxes = document.querySelectorAll('input[name="league"]');
    const clearBtn = document.getElementById('clear-filters');
    const mobileFilterBtn = document.getElementById('mobile-filter-toggle');
    const sidebar = document.querySelector('.filters-sidebar');

    let currentProducts = [...products];
    function renderProducts(items) {
        grid.innerHTML = '';

        if (items.length === 0) {
            noResults.classList.remove('hidden');
            return;
        } else {
            noResults.classList.add('hidden');
        }

        items.forEach(product => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    ${product.new ? '<span class="badge-new">Nuevo</span>' : ''}
                    ${product.sale ? '<span class="badge-sale">Oferta</span>' : ''}
                    <a href="/pages/producto.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                    </a>
                    <button class="btn-quick-view"><i class="fas fa-eye"></i></button>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        ${product.oldPrice ? `<span class="price-old">€${product.oldPrice.toFixed(2)}</span>` : ''}
                        <span class="price">€${product.price.toFixed(2)}</span>
                    </div>
                    <button class="btn-add-cart" data-id="${product.id}">Añadir</button>
                </div>
            `;
            grid.appendChild(card);
        });
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', handleAddToCart);
        });
    }
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const maxPrice = parseFloat(priceRange.value);
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        const selectedLeagues = Array.from(leagueCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        currentProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesPrice = product.price <= maxPrice;
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
            const matchesLeague = selectedLeagues.length === 0 || selectedLeagues.includes(product.league);

            return matchesSearch && matchesPrice && matchesCategory && matchesLeague;
        });

        sortProducts();
    }
    function sortProducts() {
        const sortValue = sortSelect.value;

        if (sortValue === 'price-asc') {
            currentProducts.sort((a, b) => a.price - b.price);
        } else if (sortValue === 'price-desc') {
            currentProducts.sort((a, b) => b.price - a.price);
        } else {
            currentProducts.sort((a, b) => a.id - b.id);
        }

        renderProducts(currentProducts);
    }
    function handleAddToCart(e) {
        const btn = e.target;
        const originalText = btn.textContent;

        btn.textContent = '¡Añadido!';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            let count = parseInt(cartCount.textContent);
            cartCount.textContent = count + 1;
        }

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 1500);
    }
    searchInput.addEventListener('input', filterProducts);
    sortSelect.addEventListener('change', sortProducts);

    priceRange.addEventListener('input', (e) => {
        priceValue.textContent = `€${e.target.value}`;
        filterProducts();
    });

    categoryCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    leagueCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        priceRange.value = 150;
        priceValue.textContent = '€150';
        sortSelect.value = 'default';
        categoryCheckboxes.forEach(cb => cb.checked = false);
        leagueCheckboxes.forEach(cb => cb.checked = false);
        filterProducts();
    });

    if (mobileFilterBtn) {
        mobileFilterBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    renderProducts(products);
});
