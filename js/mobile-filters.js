/**
 * Mobile Filters Injection and Logic
 * Adds mobile-only filter panel to tienda.html
 */

(function () {
    'use strict';

    // Only proceed if we're on the tienda page
    if (!window.location.pathname.includes('tienda.html')) {
        return;
    }

    // Inject Mobile Filter HTML
    function injectMobileFilters() {
        const mobileFilterHTML = `
            <!-- Mobile Filter Button (Only visible on mobile) -->
            <button id="mobile-filter-btn" class="mobile-filter-btn">
                <i class="fas fa-filter"></i>
                <span>Filtros</span>
            </button>

            <!-- Mobile Filter Panel (Only visible on mobile) -->
            <div id="mobile-filter-panel" class="mobile-filter-panel">
                <!-- Overlay -->
                <div class="mobile-filter-overlay"></div>
                
                <!-- Panel Content -->
                <div class="mobile-filter-content">
                    <!-- Header -->
                    <div class="mobile-filter-header">
                        <h3>Filtros</h3>
                        <button class="mobile-filter-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="mobile-filter-body">
                        <!-- Liga Selector -->
                        <div class="mobile-filter-step">
                            <label>1. Selecciona Liga</label>
                            <select id="mobile-filter-league">
                                <option value="">Todas las Ligas</option>
                                <!-- Populated by JS -->
                            </select>
                        </div>
                        
                        <!-- Team Selector (hidden initially) -->
                        <div class="mobile-filter-step hidden" id="mobile-team-step">
                            <label>2. Selecciona Equipo</label>
                            <select id="mobile-filter-team">
                                <option value="">Todos los Equipos</option>
                                <!-- Populated by JS -->
                            </select>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="mobile-filter-footer">
                        <button id="mobile-clear-filters" class="btn-secondary">
                            Limpiar filtros
                        </button>
                        <button id="mobile-apply-filters" class="btn-primary">
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Inject at the end of body
        document.body.insertAdjacentHTML('beforeend', mobileFilterHTML);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Inject the mobile filters
        injectMobileFilters();

        // Wait a bit for tienda.js to initialize
        setTimeout(setupMobileFilters, 100);
    }

    function setupMobileFilters() {
        const panel = document.getElementById('mobile-filter-panel');
        const btn = document.getElementById('mobile-filter-btn');
        const overlay = document.querySelector('.mobile-filter-overlay');
        const closeBtn = document.querySelector('.mobile-filter-close');
        const applyBtn = document.getElementById('mobile-apply-filters');
        const clearBtn = document.getElementById('mobile-clear-filters');

        const mobileLeagueSelect = document.getElementById('mobile-filter-league');
        const mobileTeamSelect = document.getElementById('mobile-filter-team');
        const mobileTeamStep = document.getElementById('mobile-team-step');

        // Desktop elements (from tienda.js)
        const desktopLeagueSelect = document.getElementById('filter-league');
        const desktopTeamSelect = document.getElementById('filter-team');

        if (!panel || !btn) {
            console.warn('Mobile filter elements not found');
            return;
        }

        // Open panel
        function openPanel() {
            panel.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Sync mobile filters with desktop filters
            syncToMobile();
        }

        // Close panel
        function closePanel() {
            panel.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Sync desktop filters TO mobile
        function syncToMobile() {
            // Populate mobile league filter
            if (desktopLeagueSelect && mobileLeagueSelect) {
                mobileLeagueSelect.innerHTML = desktopLeagueSelect.innerHTML;
                mobileLeagueSelect.value = desktopLeagueSelect.value || '';
            }

            // If desktop team step is visible, show mobile team step and sync
            const desktopTeamStep = document.getElementById('team-step');
            if (desktopTeamStep && !desktopTeamStep.classList.contains('hidden')) {
                mobileTeamStep.classList.remove('hidden');
                if (desktopTeamSelect && mobileTeamSelect) {
                    mobileTeamSelect.innerHTML = desktopTeamSelect.innerHTML;
                    mobileTeamSelect.value = desktopTeamSelect.value || '';
                }
            } else {
                mobileTeamStep.classList.add('hidden');
            }
        }

        // Apply mobile filters (sync to desktop and trigger filter)
        function applyFilters() {
            const selectedLeague = mobileLeagueSelect.value;
            const selectedTeam = mobileTeamSelect.value;

            //  Set desktop values
            if (desktopLeagueSelect) {
                desktopLeagueSelect.value = selectedLeague;
                // Trigger change event to update desktop logic
                desktopLeagueSelect.dispatchEvent(new Event('change'));
            }

            // Small delay to ensure team select is populated
            setTimeout(() => {
                if (selectedTeam && desktopTeamSelect) {
                    desktopTeamSelect.value = selectedTeam;
                    desktopTeamSelect.dispatchEvent(new Event('change'));
                }
                closePanel();
            }, 50);
        }

        // Clear mobile filters
        function clearFilters() {
            mobileLeagueSelect.value = '';
            mobileTeamSelect.value = '';
            mobileTeamStep.classList.add('hidden');

            // Clear desktop filters
            if (desktopLeagueSelect) {
                desktopLeagueSelect.value = '';
                desktopLeagueSelect.dispatchEvent(new Event('change'));
            }

            closePanel();
        }

        // Handle mobile league change (show team options)
        function handleMobileLeagueChange() {
            const selectedLeague = mobileLeagueSelect.value;

            if (!selectedLeague) {
                mobileTeamStep.classList.add('hidden');
                mobileTeamSelect.value = '';
                return;
            }

            // Populate mobile team options based on league
            // Trigger desktop league change to populate its team select,
            // then copy to mobile
            if (desktopLeagueSelect) {
                desktopLeagueSelect.value = selectedLeague;
                desktopLeagueSelect.dispatchEvent(new Event('change'));

                // Wait for desktop to populate
                setTimeout(() => {
                    const desktopTeamStep = document.getElementById('team-step');
                    if (desktopTeamStep && !desktopTeamStep.classList.contains('hidden')) {
                        mobileTeamSelect.innerHTML = desktopTeamSelect.innerHTML;
                        mobileTeamStep.classList.remove('hidden');
                    }
                }, 50);
            }
        }

        // Event Listeners
        btn.addEventListener('click', openPanel);
        overlay.addEventListener('click', closePanel);
        closeBtn.addEventListener('click', closePanel);
        applyBtn.addEventListener('click', applyFilters);
        clearBtn.addEventListener('click', clearFilters);
        mobileLeagueSelect.addEventListener('change', handleMobileLeagueChange);

        console.log('Mobile filters initialized successfully');
    }
})();
