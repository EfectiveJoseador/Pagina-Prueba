// Archivo de scripts para la página
console.log('Página cargada correctamente');

document.addEventListener('DOMContentLoaded', function() {
    // Soporte para múltiples menús desplegables si se agregan más en el futuro
    document.querySelectorAll('.futbol-dropdown').forEach(function(card) {
        const btn = card.querySelector('.futbol-dropdown-btn');
        const menu = card.querySelector('.futbol-dropdown-menu');
        if (btn && menu) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Cerrar otros menús abiertos
                document.querySelectorAll('.futbol-dropdown-menu').forEach(function(m) {
                    if (m !== menu) m.style.display = 'none';
                });
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
        }
    });
    // Cerrar el menú si se hace clic fuera
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.futbol-dropdown-menu').forEach(function(menu) {
            menu.style.display = 'none';
        });
    });
});
