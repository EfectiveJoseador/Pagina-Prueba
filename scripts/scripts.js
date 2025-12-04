console.log('Página cargada correctamente');

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.futbol-dropdown').forEach(function(card) {
        const btn = card.querySelector('.futbol-dropdown-btn');
        const menu = card.querySelector('.futbol-dropdown-menu');
        if (btn && menu) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close other dropdowns and remove their open class on their cards
                document.querySelectorAll('.futbol-dropdown').forEach(function(otherCard) {
                    // skip the current card; only close other cards
                    if (otherCard === card) return;
                    const otherMenu = otherCard.querySelector('.futbol-dropdown-menu');
                    const otherBtn = otherCard.querySelector('.futbol-dropdown-btn');
                    // rely on class-based state (CSS controls visibility)
                    if (otherCard.classList.contains('dropdown-open')) {
                        otherCard.classList.remove('dropdown-open');
                    }
                    if (otherBtn) {
                        otherBtn.classList.remove('activo');
                        const iconOther = otherBtn.querySelector('i.fas');
                        if (iconOther) iconOther.classList.remove('fa-chevron-up');
                        if (iconOther) iconOther.classList.add('fa-chevron-down');
                        // Reset label text for other buttons
                        const textNodeOther = Array.from(otherBtn.childNodes).find(n => n.nodeType === 3);
                        if (textNodeOther) textNodeOther.nodeValue = 'Ver opciones ';
                    }
                    // remove open class from other cards
                    otherCard.classList.remove('dropdown-open');
                });

                const isOpen = card.classList.contains('dropdown-open');
                if (isOpen) {
                    // close current (CSS shows/hides via .dropdown-open)
                    btn.classList.remove('activo');
                    card.classList.remove('dropdown-open');
                    const icon = btn.querySelector('i.fas');
                    if (icon) icon.classList.remove('fa-chevron-up');
                    if (icon) icon.classList.add('fa-chevron-down');
                    // Cambiar texto a 'Ver opciones'
                    const textNode = Array.from(btn.childNodes).find(n => n.nodeType === 3);
                    if (textNode) textNode.nodeValue = 'Ver opciones ';
                } else {
                    // open current
                    btn.classList.add('activo');
                    card.classList.add('dropdown-open');
                    const icon = btn.querySelector('i.fas');
                    if (icon) icon.classList.remove('fa-chevron-down');
                    if (icon) icon.classList.add('fa-chevron-up');
                    // Cambiar texto a 'Ocultar opciones'
                    const textNode = Array.from(btn.childNodes).find(n => n.nodeType === 3);
                    if (textNode) textNode.nodeValue = 'Ocultar opciones ';
                }
            });
        }
    });

    let carruselActual = 0;
    let carruselExistentes = [];
    let carruselMostrarImagen = function(idx) {};
    function inicializarCarruselClientes() {
        const imagenes = Array.from(document.querySelectorAll('.carrusel-img-bg'));
        const existentes = [];
        let pendientes = imagenes.length;
        if (!imagenes.length) return;
        imagenes.forEach(div => {
            const imgUrl = div.getAttribute('data-img');
            // Crear imagen para probar carga sin ensuciar la consola
            const tester = new Image();
            tester.onload = () => { existentes.push(div); finalize(); };
            tester.onerror = () => { finalize(); };
            // Forzar carga sin usar fetch HEAD para evitar CORS/abort en local
            tester.src = imgUrl;
            function finalize(){
                pendientes--;
                if (pendientes === 0) inicializarCarruselConExistentes(existentes);
            }
        });
        function inicializarCarruselConExistentes(existentes) {
            existentes.forEach(div => {
                const imgUrl = div.getAttribute('data-img');
                div.style.backgroundImage = `url('${imgUrl}')`;
                // Evitar que errores de fondo propaguen mensajes
                div.onerror = null;
            });
            const prevBtn = document.getElementById('carrusel-prev');
            const nextBtn = document.getElementById('carrusel-next');
            if (window.innerWidth <= 600) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            } else {
                if (prevBtn) prevBtn.style.display = '';
                if (nextBtn) nextBtn.style.display = '';
            }
            if (!existentes.length || !prevBtn || !nextBtn) return;
            carruselExistentes = existentes;
            carruselActual = 0;
            carruselMostrarImagen = function(idx) {
                carruselExistentes.forEach((div, i) => {
                    div.classList.toggle('activa', i === idx);
                });
            };
            prevBtn.onclick = function() {
                carruselActual = (carruselActual - 1 + carruselExistentes.length) % carruselExistentes.length;
                carruselMostrarImagen(carruselActual);
            };
            nextBtn.onclick = function() {
                carruselActual = (carruselActual + 1) % carruselExistentes.length;
                carruselMostrarImagen(carruselActual);
            };
            existentes.forEach(div => {
                div.onclick = function() {
                    mostrarModalImagen(div.getAttribute('data-img'), div.getAttribute('aria-label'));
                };
            });
            carruselMostrarImagen(carruselActual);
        }
        return;
        existentes.forEach(div => {
            const imgUrl = div.getAttribute('data-img');
            div.style.backgroundImage = `url('${imgUrl}')`;
        });
        const prevBtn = document.getElementById('carrusel-prev');
        const nextBtn = document.getElementById('carrusel-next');
        if (!existentes.length || !prevBtn || !nextBtn) return;
        let actual = 0;
        function mostrarImagen(idx) {
            existentes.forEach((div, i) => {
                div.classList.toggle('activa', i === idx);
            });
        }
        prevBtn.onclick = function() {
            actual = (actual - 1 + existentes.length) % existentes.length;
            mostrarImagen(actual);
        };
        nextBtn.onclick = function() {
            actual = (actual + 1) % existentes.length;
            mostrarImagen(actual);
        };
        existentes.forEach(div => {
            div.onclick = function() {
                mostrarModalImagen(div.getAttribute('data-img'), div.getAttribute('aria-label'));
            };
        });
        mostrarImagen(actual);
    }
    function mostrarModalImagen(src, alt) {
        let modal = document.getElementById('modal-imagen-clientes');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-imagen-clientes';
            modal.innerHTML = `
                <div class="modal-fondo"></div>
                <div class="modal-contenido" style="position:relative;display:flex;align-items:center;justify-content:center;gap:0;">
                    <button class="modal-arrow modal-arrow-left" aria-label="Anterior" style="width:48px;height:48px;background:var(--azul-acento,#2a5ba8);border:none;border-radius:50%;color:#fff;font-size:2rem;box-shadow:0 2px 8px rgba(42,91,168,0.10);display:flex;align-items:center;justify-content:center;z-index:110;cursor:pointer;transition:background 0.2s;outline:none;">
                        <span style="display:inline-block;transform:translateX(-2px);">&#8592;</span>
                    </button>
                    <div style="position:relative;display:inline-block;">
                        <canvas id="modal-canvas-clientes" width="500" height="500" style="max-width:90vw;max-height:70vh;border-radius:14px;"></canvas>
                        <div id="watermark-text" style="position:absolute;bottom:18px;right:18px;color:#fff;font-size:1.5rem;font-weight:bold;opacity:0.7;text-shadow:1px 1px 4px #000;pointer-events:none;user-select:none;">@camisetazo._</div>
                        <div id="modal-mensaje-desliza" style="display:none;position:absolute;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(42,91,168,0.92);color:#fff;padding:0.4em 1em;border-radius:10px;font-size:1rem;z-index:30;">Desliza para ver más imágenes</div>
                    </div>
                    <button class="modal-arrow modal-arrow-right" aria-label="Siguiente" style="width:48px;height:48px;background:var(--azul-acento,#2a5ba8);border:none;border-radius:50%;color:#fff;font-size:2rem;box-shadow:0 2px 8px rgba(42,91,168,0.10);display:flex;align-items:center;justify-content:center;z-index:110;cursor:pointer;transition:background 0.2s;outline:none;">
                        <span style="display:inline-block;transform:translateX(2px);">&#8594;</span>
                    </button>
                    <button class="modal-cerrar" aria-label="Cerrar">&times;</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
        const imagenes = Array.from(document.querySelectorAll('.carrusel-img-bg'));
        const existentes = imagenes.filter(div => {
            const imgUrl = div.getAttribute('data-img');
            // Genera lista de cliente1.jpg a cliente26.jpg
            const clientesValidos = Array.from({length: 26}, (_, i) => `assets/clientes/cliente${i+1}.jpg`);
            return clientesValidos.includes(imgUrl);
        });
        let actual = existentes.findIndex(div => div.getAttribute('data-img') === src);
        if (actual === -1) actual = 0;
        const canvas = modal.querySelector('#modal-canvas-clientes');
        let zoomActivo = false;
        let imgOriginal = null;
        let zoomHandlers = [];
        function limpiarZoomHandlers() {
            if (!canvas) return;
            zoomHandlers.forEach(({event, handler}) => {
                canvas.removeEventListener(event, handler);
            });
            zoomHandlers = [];
        }
        function dibujarImagen(idx) {
            limpiarZoomHandlers();
            zoomActivo = false;
            if (!canvas) return;
            const div = existentes[idx];
            if (!div) return;
            const imgUrl = div.getAttribute('data-img');
            imgOriginal = new window.Image();
            imgOriginal.onload = function() {
                canvas.width = imgOriginal.width;
                canvas.height = imgOriginal.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(imgOriginal, 0, 0, canvas.width, canvas.height);
                const fontSize = Math.floor(canvas.height/18);
                ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                const y = canvas.height - 2 * fontSize;
                ctx.globalAlpha = 0.48;
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#000';
                ctx.strokeText('@CAMISETAZO._', canvas.width/2, y);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.62;
                ctx.fillText('@CAMISETAZO._', canvas.width/2, y);
                ctx.globalAlpha = 1;
            };
            imgOriginal.src = imgUrl;
            canvas.style.cursor = (!esMovil() && !("ontouchstart" in window && navigator.maxTouchPoints > 0)) ? 'zoom-in' : 'default';
            function esMovil() {
                return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|webOS|BlackBerry/i.test(navigator.userAgent);
            }
            if (!esMovil() && !("ontouchstart" in window && navigator.maxTouchPoints > 0)) {
                const clickHandler = function(e) {
                    zoomActivo = !zoomActivo;
                    if (zoomActivo) {
                        canvas.style.cursor = 'zoom-out';
                        const rect = canvas.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        dibujarZoom(x, y);
                    } else {
                        canvas.style.cursor = 'zoom-in';
                        dibujarImagen(actual);
                    }
                };
                const moveHandler = function(e) {
                    if (!zoomActivo) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    dibujarZoom(x, y);
                };
                canvas.addEventListener('click', clickHandler);
                canvas.addEventListener('mousemove', moveHandler);
                zoomHandlers.push({event:'click', handler:clickHandler});
                zoomHandlers.push({event:'mousemove', handler:moveHandler});
            } else {
                const blockZoom = function(e) { e.stopPropagation(); e.preventDefault(); };
                canvas.addEventListener('click', blockZoom);
                zoomHandlers.push({event:'click', handler:blockZoom});
            }
        }
        function dibujarZoom(x, y) {
            if (!imgOriginal || !imgOriginal.complete) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            const zoomScale = 2;
            ctx.clearRect(0, 0, w, h);
            const zoomW = w / zoomScale;
            const zoomH = h / zoomScale;
            let sx = x * w - zoomW / 2;
            let sy = y * h - zoomH / 2;
            sx = Math.max(0, Math.min(sx, w - zoomW));
            sy = Math.max(0, Math.min(sy, h - zoomH));
            ctx.drawImage(imgOriginal, sx, sy, zoomW, zoomH, 0, 0, w, h);
            const fontSize = Math.floor(h/18);
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const yText = h - 2 * fontSize;
            ctx.globalAlpha = 0.48;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000';
            ctx.strokeText('@CAMISETAZO._', w/2, yText);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.62;
            ctx.fillText('@CAMISETAZO._', w/2, yText);
            ctx.globalAlpha = 1;
        }
        const leftArrow = modal.querySelector('.modal-arrow-left');
        const rightArrow = modal.querySelector('.modal-arrow-right');

        // Posicionar flechas en una ubicación agradable y constante del viewport.
        // Mantendremos las flechas a la mitad vertical del viewport pero ligeramente
        // por encima del centro del canvas para una mejor visibilidad.
        let flechasHandler = null;
        function colocarFlechasFixed() {
            if (!leftArrow || !rightArrow) return;
            if (window.innerWidth <= 600) {
                leftArrow.style.display = 'none';
                rightArrow.style.display = 'none';
                return;
            }
            leftArrow.style.display = '';
            rightArrow.style.display = '';
            // Valores ajustables
            const verticalPct = 0.48; // 48% del viewport height (ligeramente arriba del centro)
            const horizontalGap = 28; // px desde el centro del canvas hacia las flechas
            const arrowSize = 48; // px

            const viewportH = window.innerHeight;
            const top = Math.max(12, Math.round(viewportH * verticalPct) - Math.round(arrowSize/2));

            // Colocar las flechas casi al borde horizontal del viewport (edge gap pequeño)
            const edgeGap = 12; // px desde el borde de la pantalla
            leftArrow.style.position = 'fixed';
            leftArrow.style.top = top + 'px';
            leftArrow.style.left = edgeGap + 'px';
            leftArrow.style.right = 'auto';

            rightArrow.style.position = 'fixed';
            rightArrow.style.top = top + 'px';
            rightArrow.style.right = edgeGap + 'px';
            rightArrow.style.left = 'auto';
            // Asegurar transform neutro
            leftArrow.style.transform = 'none';
            rightArrow.style.transform = 'none';
        }

        // Registrar clicks en flechas
        if (leftArrow) leftArrow.onclick = function(e) {
            e.stopPropagation();
            actual = (actual - 1 + existentes.length) % existentes.length;
            dibujarImagen(actual);
        };
        if (rightArrow) rightArrow.onclick = function(e) {
            e.stopPropagation();
            actual = (actual + 1) % existentes.length;
            dibujarImagen(actual);
        };

        // Handler para recalcular la posición en resize/scroll
        flechasHandler = function() { colocarFlechasFixed(); };
        window.addEventListener('resize', flechasHandler);
        window.addEventListener('scroll', flechasHandler, {passive:true});
        // Posicionar inicialmente
        setTimeout(colocarFlechasFixed, 25);
        const watermarkDiv = modal.querySelector('#watermark-text');
        if (watermarkDiv) watermarkDiv.style.display = 'none';
        if (window.innerWidth <= 600) {
            if (leftArrow) leftArrow.style.display = 'none';
            if (rightArrow) rightArrow.style.display = 'none';
        } else {
            if (leftArrow) leftArrow.style.display = '';
            if (rightArrow) rightArrow.style.display = '';
        }
        function esMovil() {
            return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|webOS|BlackBerry/i.test(navigator.userAgent);
        }
        function cerrarModalSeguro() {
            limpiarZoomHandlers();
            zoomActivo = false;
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => { modal.style.display = 'none'; }, 250);
            }
            // limpiar listeners de posicionamiento de flechas
            try {
                if (flechasHandler) {
                    window.removeEventListener('resize', flechasHandler);
                    window.removeEventListener('scroll', flechasHandler);
                    flechasHandler = null;
                }
            } catch(e) {}
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKeyDownModal);
        }
        modal.querySelector('.modal-fondo').onclick = cerrarModalSeguro;
        modal.querySelector('.modal-cerrar').onclick = cerrarModalSeguro;
        function onKeyDownModal(e) {
            if (e.key === 'Escape') cerrarModalSeguro();
        }
        document.addEventListener('keydown', onKeyDownModal);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.25s';
            setTimeout(() => { modal.style.opacity = '1'; }, 10);
        }
        dibujarImagen(actual);
        if (window.innerWidth <= 600) {
            const mensajeDesliza = modal.querySelector('#modal-mensaje-desliza');
            if (mensajeDesliza) {
                mensajeDesliza.textContent = 'Desliza para ver más imágenes';
                mensajeDesliza.style.display = 'block';
                mensajeDesliza.style.opacity = '1';
                mensajeDesliza.style.transition = 'opacity 0.7s';
                setTimeout(() => {
                    mensajeDesliza.style.opacity = '0';
                }, 1800);
                setTimeout(() => {
                    mensajeDesliza.style.display = 'none';
                }, 2500);
            }
        }
        let modalStartX = null;
        let modalMoved = false;
        if (canvas) {
            canvas.addEventListener('touchstart', function(e) {
                if (e.touches.length === 1) {
                    modalStartX = e.touches[0].clientX;
                    modalMoved = false;
                }
            });
            canvas.addEventListener('touchmove', function(e) {
                if (modalStartX !== null && e.touches.length === 1) {
                    const deltaX = e.touches[0].clientX - modalStartX;
                    if (Math.abs(deltaX) > 30) {
                        modalMoved = true;
                        if (deltaX > 0) {
                            actual = (actual - 1 + existentes.length) % existentes.length;
                            dibujarImagen(actual);
                        } else {
                            actual = (actual + 1) % existentes.length;
                            dibujarImagen(actual);
                        }
                        modalStartX = null;
                    }
                }
            });
            canvas.addEventListener('touchend', function() {
                modalStartX = null;
            });
        }
    }
    let carruselInitDone = false;
    function ensureInitCarrusel(){
        if (carruselInitDone) return;
        carruselInitDone = true;
        inicializarCarruselClientes();
    }
    const carruselRoot = document.querySelector('.carrusel-imagenes') || document.querySelector('#quienes-somos .carrusel-imagenes');
    if (carruselRoot && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            if (entries.some(en => en.isIntersecting)) {
                ensureInitCarrusel();
                obs.disconnect();
            }
        }, { root: null, threshold: 0.1 });
        io.observe(carruselRoot);
    } else {
        // Fallback: inicializar tras un pequeño retraso
        setTimeout(ensureInitCarrusel, 200);
    }
    document.querySelectorAll('.boton-seccion').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.dataset.seccion === 'quienes-somos') {
                setTimeout(() => {
                    const target = document.querySelector('.carrusel-imagenes');
                    if (target) ensureInitCarrusel();
                }, 50);
            }
        });
    });
    document.querySelectorAll('.carrusel-img-bg').forEach(function(div) {
        div.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        div.addEventListener('dragstart', function(e) { e.preventDefault(); });
    });
    const carruselImagenes = document.querySelector('.carrusel-imagenes');
    if (carruselImagenes) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = 10;
        overlay.style.background = 'transparent';
        overlay.style.pointerEvents = 'none';
        carruselImagenes.style.position = 'relative';
        carruselImagenes.appendChild(overlay);
    }
    let startX = null;
    let moved = false;
    const imagenesContainer = document.querySelector('.carrusel-imagenes');
    if (imagenesContainer) {
        imagenesContainer.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                moved = false;
            }
        });
        imagenesContainer.addEventListener('touchmove', function(e) {
            if (startX !== null && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - startX;
                if (Math.abs(deltaX) > 30) {
                    moved = true;
                    if (deltaX > 0) {
                        carruselActual = (carruselActual - 1 + carruselExistentes.length) % carruselExistentes.length;
                        carruselMostrarImagen(carruselActual);
                    } else {
                        carruselActual = (carruselActual + 1) % carruselExistentes.length;
                        carruselMostrarImagen(carruselActual);
                    }
                    startX = null;
                }
            }
        });
        imagenesContainer.addEventListener('touchend', function() {
            startX = null;
        });
    }
    function mostrarIndicadorClickCarrusel() {
        const primeraImg = document.querySelector('.carrusel-img-bg');
        if (!primeraImg) return;
        if (!localStorage.getItem('carruselClickHintShown')) {
            primeraImg.classList.add('clickable-hint');
            setTimeout(() => {
                primeraImg.classList.remove('clickable-hint');
                localStorage.setItem('carruselClickHintShown', '1');
            }, 2400);
        }
        if (!primeraImg.querySelector('.zoom-icon')) {
            const icon = document.createElement('span');
            icon.className = 'zoom-icon';
            icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="#ffd700" stroke-width="2"/><line x1="14.2" y1="14.2" x2="18" y2="18" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>`;
            primeraImg.appendChild(icon);
        }
        primeraImg.setAttribute('data-tooltip', 'Haz clic para ampliar');
    }
    mostrarIndicadorClickCarrusel();
});

// ---- Custom dropdown replacement for selects with class 'custom-select' ----
(function(){
    // Mantener referencia al dropdown actualmente abierto
    let currentOpenDropdown = null;
    
    function buildCustomDropdown(select){
        if (!select || select.__customized) return;
        select.__customized = true;
        // Hide native select but keep it in DOM for form value
        select.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-dropdown';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'custom-dropdown-button';
        button.setAttribute('aria-haspopup','listbox');
        button.setAttribute('aria-expanded','false');
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        // initial label uses selected option text
        const initialOption = select.options[select.selectedIndex];
        labelSpan.textContent = initialOption ? initialOption.text : '';
        const caret = document.createElement('span');
        caret.className = 'caret';
        caret.innerHTML = '<i class="fas fa-chevron-down"></i>';
        button.appendChild(labelSpan);
        button.appendChild(caret);

        const menu = document.createElement('div');
        menu.className = 'custom-dropdown-menu';
        menu.setAttribute('role','listbox');
        menu.tabIndex = -1;

        function clearMenu(){
            while (menu.firstChild) menu.removeChild(menu.firstChild);
        }
        function populateMenuFromSelect(){
            clearMenu();
            Array.from(select.options).forEach(function(opt, idx){
                const item = document.createElement('div');
                item.className = 'custom-dropdown-item';
                item.setAttribute('role','option');
                item.dataset.value = opt.value;
                item.dataset.index = idx;
                item.textContent = opt.text;
                if (opt.disabled) item.setAttribute('aria-disabled','true');
                if (opt.selected) item.setAttribute('aria-selected','true');
                item.addEventListener('click', function(e){
                    if (opt.disabled) return;
                    // mark selected in native select
                    select.selectedIndex = idx;
                    select.dispatchEvent(new Event('change', {bubbles:true}));
                    // update UI
                    menu.querySelectorAll('[aria-selected="true"]').forEach(n => n.removeAttribute('aria-selected'));
                    item.setAttribute('aria-selected','true');
                    labelSpan.textContent = item.textContent;
                    closeMenu();
                });
                menu.appendChild(item);
            });
        }
        populateMenuFromSelect();

        function openMenu(){
            // Cerrar el dropdown actualmente abierto si existe y es diferente al actual
            if (currentOpenDropdown && currentOpenDropdown !== wrapper) {
                currentOpenDropdown.classList.remove('open');
                const currentButton = currentOpenDropdown.querySelector('.custom-dropdown-button');
                if (currentButton) {
                    currentButton.setAttribute('aria-expanded', 'false');
                    const currentCaret = currentButton.querySelector('.caret');
                    if (currentCaret) currentCaret.innerHTML = '<i class="fas fa-chevron-down"></i>';
                }
            }
            
            // Establecer este dropdown como el actualmente abierto
            currentOpenDropdown = wrapper;
            
            wrapper.classList.add('open');
            button.setAttribute('aria-expanded','true');
            caret.innerHTML = '<i class="fas fa-chevron-up"></i>';
            // position and size based on space
            const rect = wrapper.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const desiredMax = 300; // px, default CSS
            if (spaceBelow < 220 && spaceAbove > spaceBelow) {
                // open upward
                menu.style.bottom = (rect.height + 10) + 'px';
                menu.style.top = 'auto';
                const mh = Math.max(120, Math.min(desiredMax, spaceAbove - 16));
                menu.style.maxHeight = mh + 'px';
            } else {
                // open downward
                menu.style.top = '100%';
                menu.style.bottom = 'auto';
                const mh = Math.max(120, Math.min(desiredMax, spaceBelow - 16));
                menu.style.maxHeight = mh + 'px';
            }
            document.addEventListener('click', onDocClick);
            document.addEventListener('keydown', onKeyDown);
            window.addEventListener('scroll', onScrollClose, { passive: true });
        }
        function closeMenu(){
            if (currentOpenDropdown === wrapper) {
                currentOpenDropdown = null;
            }
            wrapper.classList.remove('open');
            button.setAttribute('aria-expanded','false');
            caret.innerHTML = '<i class="fas fa-chevron-down"></i>';
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scroll', onScrollClose);
        }
        function onDocClick(e){ if (!wrapper.contains(e.target)) closeMenu(); }
        function onKeyDown(e){
            if (e.key === 'Escape') closeMenu();
        }
        function onScrollClose(){ closeMenu(); }

        button.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            const isOpen = button.getAttribute('aria-expanded') === 'true';
            if (isOpen) closeMenu(); else openMenu();
        });

        // sync native select changes to custom UI (in case code sets value programmatically)
        select.addEventListener('change', function(){
            const opt = select.options[select.selectedIndex];
            if (opt) labelSpan.textContent = opt.text;
            // update menu selection
            menu.querySelectorAll('[aria-selected="true"]').forEach(n => n.removeAttribute('aria-selected'));
            const chosen = menu.querySelector(`[data-index="${select.selectedIndex}"]`);
            if (chosen) chosen.setAttribute('aria-selected','true');
        });

        // Observe option list changes and repopulate
        const optionsObserver = new MutationObserver((muts)=>{
            let needsRepopulate = false;
            muts.forEach(m=>{ if (m.type === 'childList') needsRepopulate = true; });
            if (needsRepopulate) {
                populateMenuFromSelect();
                // ensure label reflects current selection
                const opt = select.options[select.selectedIndex];
                labelSpan.textContent = opt ? opt.text : '';
            }
        });
        optionsObserver.observe(select, { childList: true, subtree: true });

        // insert wrapper after select
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        wrapper.appendChild(button);
        wrapper.appendChild(menu);
    }

    // initialize existing selects
    function initAll(){
        document.querySelectorAll('select.custom-select').forEach(buildCustomDropdown);
    }

    // observe for dynamically added selects (modals)
    const obs = new MutationObserver(function(muts){
        muts.forEach(m => {
            m.addedNodes && m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches('select.custom-select')) buildCustomDropdown(node);
                node.querySelectorAll && node.querySelectorAll('select.custom-select').forEach(buildCustomDropdown);
            });
        });
    });
    obs.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // run once DOM ready
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
})();

(function(){
  // Toast de total del carrito: visible pero discreto, eficiente y reutilizable
  let toastEl = null;
  let hideTimer = null; // temporizador para ocultar automáticamente a los 3s

  function ensureToast(){
    if (toastEl && document.body.contains(toastEl)) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id = 'cartTotalToast';
    toastEl.className = 'cart-total-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.innerHTML = '<span class="icon" aria-hidden="true">🛒</span><span class="text">Total: <strong>0.00</strong>€</span>';
    document.body.appendChild(toastEl);
    // La visibilidad se controlará desde showCartTotalToast
    // Al hacer clic, llevar a la pestaña del carrito y ocultar la burbuja
    toastEl.addEventListener('click', function(){
      try {
        // No ocultar permanentemente el botón; solo navegar al carrito
        const btn = document.querySelector('.boton-seccion[data-seccion="carrito"]');
        if (btn && typeof btn.click === 'function') {
          btn.click();
        } else {
          // Fallback si no existen listeners
          document.querySelectorAll('.boton-seccion').forEach(b => b.classList.remove('activo'));
          document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
          const target = document.getElementById('carrito');
          if (target) target.classList.add('activa');
          const tabBtn = document.querySelector('[data-seccion="carrito"]');
          if (tabBtn) tabBtn.classList.add('activo');
        }
      } catch(e) { /* noop */ }
    });
    return toastEl;
  }

  function hideNow(){
    if (!toastEl) return;
    toastEl.classList.remove('show');
  }

  window.showCartTotalToast = function(amount){
    try {
      const el = ensureToast();
      // Actualizar cantidad
      const strong = el.querySelector('strong');
      if (strong) strong.textContent = (Number(amount) || 0).toFixed(2);
      // Quitar supresión persistente al añadir nuevo producto
      el.classList.remove('suppressed');
      // Asegurar que se mantenga visible
      el.classList.add('show');
      // Ocultar automáticamente tras 3s, independientemente de modales
      if (hideTimer) { clearTimeout(hideTimer); }
      hideTimer = setTimeout(hideNow, 3000);
    } catch(e) { /* silencioso para no afectar UX */ }
  };

  // =====================
  // Notificación en pestaña del carrito
  // =====================
  let cartNoticeEl = null;
  let cartNoticeTimer = null;

  function ensureCartNotifier(){
    const panel = document.getElementById('cartPanel');
    if (!panel) return null;
    if (cartNoticeEl && panel.contains(cartNoticeEl)) return cartNoticeEl;
    const header = panel.querySelector('.cart-header');
    const el = document.createElement('div');
    el.id = 'cartTabNotifier';
    el.className = 'cart-tab-notice';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="icon" aria-hidden="true">➕</span><span class="text">Producto añadido al carrito</span>';
    if (header && header.nextSibling) header.parentNode.insertBefore(el, header.nextSibling); else panel.insertAdjacentElement('afterbegin', el);
    // Permitir cerrar manualmente con clic
    el.addEventListener('click', function(){ el.classList.remove('show'); });
    cartNoticeEl = el;
    return el;
  }

  // Deshabilitado: no mostrar notificación dentro de la pestaña del carrito
  // window.notifyCart = function(message){ return; };
  window.notifyCart = function(message){
    try {
      const el = ensureCartNotifier();
      if (!el) return;
      const txt = el.querySelector('.text');
      if (txt && message) txt.textContent = message;
      el.classList.add('show');
      if (cartNoticeTimer) clearTimeout(cartNoticeTimer);
      cartNoticeTimer = setTimeout(() => {
        el.classList.remove('show');
      }, 2500);
    } catch(e) { /* noop */ }
  };
})();

// Ensure there is a small helper to update the Carrito button badge from anywhere
(function(){
  if (typeof window.updateCartTabBadge === 'function') return;
  window.updateCartTabBadge = function(total){
    try {
      const cartBtn = document.querySelector('.boton-seccion[data-seccion="carrito"]');
      if (!cartBtn) return;
      let badge = cartBtn.querySelector('.cart-tab-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-tab-badge';
        cartBtn.appendChild(badge);
      }
      const v = (typeof total === 'number' ? total : (Array.isArray(window.CART) ? window.CART.length : 0));
      if (v > 0) { badge.textContent = String(v); badge.classList.remove('hidden'); }
      else { badge.textContent = '0'; badge.classList.add('hidden'); }
    } catch (e) { /* noop */ }
  };
})();
