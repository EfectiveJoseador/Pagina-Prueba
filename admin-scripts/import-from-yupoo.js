#!/usr/bin/env node

/**
 * Yupoo Product Import CLI
 * 
 * Script de línea de comandos para importar productos desde Yupoo
 * y añadirlos al catálogo de productos de la tienda.
 * 
 * Uso:
 *   node import-from-yupoo.js <url> [opciones]
 * 
 * Opciones:
 *   --dry-run        Previsualizar sin guardar cambios
 *   --write          Guardar producto en products-data.js
 *   --json           Salida en formato JSON
 *   --strict-images  Fallar si no hay imágenes 1000x1000
 *   --update         Actualizar producto existente si ya existe
 *   --help           Mostrar ayuda
 * 
 * Ejemplos:
 *   node import-from-yupoo.js "https://pandasportjersey.x.yupoo.com/albums/203698766?uid=1" --dry-run
 *   node import-from-yupoo.js "https://pandasportjersey.x.yupoo.com/albums/203698766?uid=1" --write
 * 
 * @author Camisetazo Admin Scripts
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { importFromYupoo, generateStableId, extractAlbumId, downloadProductImages, fetchYupooAlbum, toHighResUrl } = require('./yupoo-importer.js');

const PRODUCTS_FILE = path.join(__dirname, '..', 'js', 'products-data.js');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * Imprime texto con color
 */
function print(color, text) {
    console.log(`${COLORS[color]}${text}${COLORS.reset}`);
}

/**
 * Imprime mensaje de éxito
 */
function success(text) {
    print('green', `✓ ${text}`);
}

/**
 * Imprime mensaje de error
 */
function error(text) {
    print('red', `✗ ${text}`);
}

/**
 * Imprime mensaje de advertencia
 */
function warn(text) {
    print('yellow', `⚠ ${text}`);
}

/**
 * Imprime mensaje informativo
 */
function info(text) {
    print('cyan', `ℹ ${text}`);
}

/**
 * Imprime línea separadora
 */
function separator() {
    console.log(`${COLORS.dim}${'─'.repeat(60)}${COLORS.reset}`);
}

/**
 * Muestra mensaje de ayuda
 */
function showHelp() {
    console.log(`
${COLORS.bright}Yupoo Product Import CLI${COLORS.reset}

${COLORS.cyan}Uso:${COLORS.reset}
  node import-from-yupoo.js <url> [opciones]

${COLORS.cyan}Argumentos:${COLORS.reset}
  url               URL del álbum de Yupoo

${COLORS.cyan}Opciones:${COLORS.reset}
  --dry-run         Previsualizar sin guardar cambios (por defecto)
  --write           Guardar producto en products-data.js
  --json            Salida en formato JSON (para integración)
  --strict-images   Fallar si no hay imágenes de alta resolución (1000x1000)
  --update          Actualizar producto existente si el ID ya existe
  --images N,M      Seleccionar imágenes por índice (ej: --images 8,9)
  --list-images     Listar todas las imágenes disponibles con sus índices
  --help, -h        Mostrar esta ayuda

${COLORS.cyan}Ejemplos:${COLORS.reset}
  ${COLORS.dim}# Previsualizar producto (sin guardar)${COLORS.reset}
  node import-from-yupoo.js "https://pandasportjersey.x.yupoo.com/albums/203698766?uid=1"

  ${COLORS.dim}# Listar imágenes disponibles${COLORS.reset}
  node import-from-yupoo.js "URL" --list-images

  ${COLORS.dim}# Importar con imágenes específicas (0=principal, 1=secundaria)${COLORS.reset}
  node import-from-yupoo.js "URL" --images 8,9 --write

  ${COLORS.dim}# Actualizar producto existente${COLORS.reset}
  node import-from-yupoo.js "https://pandasportjersey.x.yupoo.com/albums/203698766?uid=1" --write --update

  ${COLORS.dim}# Exportar como JSON${COLORS.reset}
  node import-from-yupoo.js "https://pandasportjersey.x.yupoo.com/albums/203698766?uid=1" --json
`);
}

/**
 * Parsea argumentos de línea de comandos
 */
function parseArgs(args) {
    const options = {
        url: null,
        dryRun: true, // Por defecto es dry-run
        write: false,
        json: false,
        strictImages: false,
        update: false,
        help: false,
        imageIndices: null,  // Array de índices [8, 9]
        listImages: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
            options.write = false;
        } else if (arg === '--write') {
            options.write = true;
            options.dryRun = false;
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg === '--strict-images') {
            options.strictImages = true;
        } else if (arg === '--update') {
            options.update = true;
        } else if (arg === '--list-images') {
            options.listImages = true;
        } else if (arg === '--images' && args[i + 1]) {
            // Parsear índices: --images 8,9
            const indicesStr = args[i + 1];
            options.imageIndices = indicesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            i++; // Saltar el siguiente argumento
        } else if (!arg.startsWith('-') && arg.includes('yupoo.com')) {
            options.url = arg;
        }
    }

    return options;
}

/**
 * Lee el archivo de productos y extrae el array
 */
function readProductsFile() {
    if (!fs.existsSync(PRODUCTS_FILE)) {
        throw new Error(`Archivo de productos no encontrado: ${PRODUCTS_FILE}`);
    }

    const content = fs.readFileSync(PRODUCTS_FILE, 'utf-8');

    // Extraer el array de productos del archivo JS
    // El archivo tiene formato: const products = [...]; export default products;
    const match = content.match(/const\s+products\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) {
        throw new Error('No se pudo parsear el archivo de productos');
    }

    // Evaluar el array (cuidado: solo usar con archivos confiables)
    const productsArray = eval(match[1]);

    return {
        products: productsArray,
        originalContent: content
    };
}

/**
 * Escribe el archivo de productos actualizado
 */
function writeProductsFile(products) {
    // Formatear el array de productos
    const productsJson = JSON.stringify(products, null, 4)
        // Convertir comillas dobles a simples para strings simples (estilo original)
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/: "([^"]+)"/g, ': "$1"');

    const content = `
const products = ${productsJson};

export default products;
`;

    fs.writeFileSync(PRODUCTS_FILE, content.trim() + '\n', 'utf-8');
}

/**
 * Busca un producto por ID
 */
function findProductById(products, id) {
    const index = products.findIndex(p => p.id === id);
    return { product: products[index] || null, index };
}

/**
 * Busca un producto por URL de origen
 */
function findProductBySourceUrl(products, url) {
    const index = products.findIndex(p =>
        p.source && p.source.url === url
    );
    return { product: products[index] || null, index };
}

/**
 * Muestra preview del producto en formato legible
 */
function displayProductPreview(product) {
    separator();
    console.log(`${COLORS.bright}${COLORS.magenta}PRODUCTO IMPORTADO${COLORS.reset}`);
    separator();

    console.log(`${COLORS.cyan}ID:${COLORS.reset}          ${product.id}`);
    console.log(`${COLORS.cyan}Nombre:${COLORS.reset}      ${product.name}`);
    console.log(`${COLORS.cyan}Slug:${COLORS.reset}        ${product.slug}`);
    console.log(`${COLORS.cyan}Categoría:${COLORS.reset}   ${product.category}`);
    console.log(`${COLORS.cyan}Liga:${COLORS.reset}        ${product.league}`);

    if (product.temporada) {
        console.log(`${COLORS.cyan}Temporada:${COLORS.reset}   ${product.temporada}`);
    }
    if (product.tipo) {
        console.log(`${COLORS.cyan}Tipo:${COLORS.reset}        ${product.tipo}`);
    }
    if (product.tallas) {
        console.log(`${COLORS.cyan}Tallas:${COLORS.reset}      ${product.tallas}`);
    }

    separator();
    console.log(`${COLORS.cyan}Imagen principal:${COLORS.reset}`);
    console.log(`  ${COLORS.dim}${product.image}${COLORS.reset}`);

    if (product.images && product.images.length > 0) {
        console.log(`${COLORS.cyan}Imágenes adicionales (${product.images.length}):${COLORS.reset}`);
        product.images.forEach((img, i) => {
            console.log(`  ${COLORS.dim}${i + 1}. ${img}${COLORS.reset}`);
        });
    }

    separator();
    console.log(`${COLORS.cyan}Origen:${COLORS.reset}`);
    console.log(`  Provider: ${product.source.provider}`);
    console.log(`  Album ID: ${product.source.albumId}`);
    console.log(`  URL: ${COLORS.dim}${product.source.url}${COLORS.reset}`);

    separator();

    // Mostrar flags activos
    const flags = [];
    if (product.new) flags.push('🆕 Nuevo');
    if (product.kids) flags.push('👶 Niño');
    if (product.retro) flags.push('🏛️ Retro');
    if (product.sale) flags.push('💰 Oferta');

    if (flags.length > 0) {
        console.log(`${COLORS.cyan}Tags:${COLORS.reset}        ${flags.join(' | ')}`);
    }

    separator();
}

async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    // Mostrar ayuda si se solicita
    if (options.help || args.length === 0) {
        showHelp();
        process.exit(0);
    }

    // Validar URL
    if (!options.url) {
        error('No se proporcionó una URL de Yupoo válida');
        console.log(`\nUso: node import-from-yupoo.js <url> [opciones]`);
        console.log(`Para más ayuda: node import-from-yupoo.js --help`);
        process.exit(1);
    }

    // Modo silencioso para JSON
    const silent = options.json;

    if (!silent) {
        console.log('');
        info(`Importando desde: ${options.url}`);
        console.log('');
    }

    try {
        // Manejar --list-images: mostrar solo imágenes big.jpg y pedir selección
        if (options.listImages) {
            const albumData = await fetchYupooAlbum(options.url);
            separator();
            console.log(`${COLORS.bright}IMÁGENES DISPONIBLES EN EL ÁLBUM${COLORS.reset}`);
            separator();
            console.log(`${COLORS.cyan}Título:${COLORS.reset} ${albumData.title}`);
            console.log('');

            // Filtrar SOLO big.jpg (excluir square, small, medium, hashes aleatorios)
            const bigImages = albumData.images.filter(img => {
                if (!img.url || !img.url.includes('photo.yupoo.com')) return false;
                const urlLower = img.url.toLowerCase();
                if (urlLower.includes('whatsapp') || urlLower.includes('wechat') || urlLower.includes('qr')) return false;
                // SOLO big.jpg
                return urlLower.includes('/big.');
            });

            console.log(`${COLORS.cyan}Imágenes big.jpg:${COLORS.reset} ${bigImages.length}`);
            console.log('');

            bigImages.forEach((img, i) => {
                const urlShort = img.url.substring(0, 70);
                console.log(`  ${COLORS.green}[${i}]${COLORS.reset} ${urlShort}...`);
            });

            separator();
            console.log(`${COLORS.bright}Elige las imágenes separadas por comas.${COLORS.reset}`);
            console.log(`${COLORS.dim}La primera será la principal, la segunda la secundaria.${COLORS.reset}`);
            console.log(`${COLORS.dim}Usa "all" para incluir todas las demás imágenes.${COLORS.reset}`);
            console.log(`${COLORS.dim}Ejemplos: 7,8  ó  4,5,all${COLORS.reset}`);
            console.log('');

            // Usar readline para input interactivo
            // Si hay exactamente 2 imágenes, seleccionarlas automáticamente (1=Main, 0=Sec)
            let userInput;
            if (bigImages.length === 2) {
                console.log(`${COLORS.green}✓ Detectadas exactamente 2 imágenes.${COLORS.reset}`);
                console.log(`${COLORS.cyan}Auto-seleccionando: 1 (Principal), 0 (Secundaria)${COLORS.reset}`);
                userInput = "1,0";
            } else {
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                userInput = await new Promise(resolve => {
                    rl.question(`${COLORS.cyan}Índices (ej: 7,8) [Enter para 1,0]: ${COLORS.reset}`, answer => {
                        rl.close();
                        resolve(answer.trim());
                    });
                });
            }

            let finalInput = userInput;

            if (!finalInput) {
                console.log(`${COLORS.yellow}⚠ Input vacío. Usando defecto: 1,0 (Imagen 1 Principal, Imagen 0 Secundaria)${COLORS.reset}`);
                finalInput = "1,0";
            }

            // Parsear índices del input - soporta "all" para todas las demás
            const inputParts = finalInput.split(',').map(s => s.trim().toLowerCase());
            const hasAll = inputParts.includes('all');
            const selectedIndices = inputParts
                .filter(s => s !== 'all')
                .map(s => parseInt(s, 10))
                .filter(n => !isNaN(n) && n >= 0 && n < bigImages.length);

            if (selectedIndices.length === 0) {
                error('Índices no válidos');
                process.exit(1);
            }

            // Si hay "all", añadir todos los demás índices después de los seleccionados
            if (hasAll) {
                const alreadySelected = new Set(selectedIndices);
                for (let i = 0; i < bigImages.length; i++) {
                    if (!alreadySelected.has(i)) {
                        selectedIndices.push(i);
                    }
                }
            }

            // Sobrescribir options para continuar con la importación
            options.imageIndices = selectedIndices;
            options.includeAll = hasAll;
            options.write = true;
            options.dryRun = false;
            options.update = true;  // Actualizar automáticamente si ya existe

            // Guardar las bigImages para uso posterior
            options._bigImages = bigImages;

            console.log('');
            if (hasAll) {
                success(`Seleccionadas: ${selectedIndices.slice(0, 2).join(', ')} + ${selectedIndices.length - 2} adicionales`);
            } else {
                success(`Seleccionadas: ${selectedIndices.join(', ')}`);
            }
            console.log('');
        }

        // Importar producto desde Yupoo
        let product = await importFromYupoo(options.url, {
            strictImages: options.strictImages
        });

        // Manejar --images: sobrescribir imágenes con índices específicos
        if (options.imageIndices && options.imageIndices.length > 0) {
            // Usar bigImages cacheadas de --list-images, o fetch nuevas
            let validImages = options._bigImages;

            if (!validImages) {
                const albumData = await fetchYupooAlbum(options.url);
                validImages = albumData.images.filter(img => {
                    if (!img.url || !img.url.includes('photo.yupoo.com')) return false;
                    const urlLower = img.url.toLowerCase();
                    if (urlLower.includes('whatsapp') || urlLower.includes('wechat') || urlLower.includes('qr')) return false;
                    // SOLO big.jpg
                    return urlLower.includes('/big.');
                });
            }

            const selectedImages = options.imageIndices
                .filter(idx => idx >= 0 && idx < validImages.length)
                .map(idx => toHighResUrl(validImages[idx].url));

            if (selectedImages.length > 0) {
                product.image = selectedImages[0];
                product.images = selectedImages.slice(1);
                const extraCount = selectedImages.length > 2 ? ` (+${selectedImages.length - 2} más)` : '';
                info(`Usando imágenes manuales: ${selectedImages.length} imágenes${extraCount}`);
            } else {
                warn('Índices de imagen no válidos, usando selección automática');
            }
        }

        // Salida JSON
        if (options.json) {
            console.log(JSON.stringify(product, null, 2));
            process.exit(0);
        }

        // Mostrar preview
        displayProductPreview(product);

        // Verificar si ya existe
        const { products } = readProductsFile();
        const existingById = findProductById(products, product.id);
        const existingByUrl = findProductBySourceUrl(products, options.url);

        if (existingById.product || existingByUrl.product) {
            const existing = existingById.product || existingByUrl.product;
            warn(`Producto ya existe con ID ${existing.id}: "${existing.name}"`);

            if (!options.update) {
                info('Usa --update para actualizar el producto existente');
            }
        }

        // Modo dry-run
        if (!options.write) {
            separator();
            warn('Modo DRY-RUN: No se guardaron cambios');
            info('Usa --write para guardar el producto');
            separator();
            process.exit(0);
        }

        // Guardar producto
        separator();

        // Descargar imágenes localmente
        info('Descargando imágenes...');
        let productWithLocalImages;
        try {
            productWithLocalImages = await downloadProductImages(product, ASSETS_DIR);
            success(`Imágenes descargadas: ${[productWithLocalImages.image, ...productWithLocalImages.images].length}`);
        } catch (downloadErr) {
            error(`Error descargando imágenes: ${downloadErr.message}`);
            info('Las imágenes de Yupoo requieren descarga local para mostrarse.');
            process.exit(1);
        }

        info('Guardando producto...');

        if (existingById.product && options.update) {
            // Actualizar existente
            products[existingById.index] = { ...products[existingById.index], ...productWithLocalImages };
            success(`Producto actualizado: ID ${productWithLocalImages.id}`);
        } else if (existingByUrl.product && options.update) {
            // Actualizar por URL
            products[existingByUrl.index] = { ...products[existingByUrl.index], ...productWithLocalImages };
            success(`Producto actualizado: ID ${productWithLocalImages.id}`);
        } else if (existingById.product || existingByUrl.product) {
            // Existe pero no se solicitó update
            error('Producto ya existe. Usa --update para sobrescribir');
            process.exit(1);
        } else {
            // Añadir nuevo
            products.push(productWithLocalImages);
            success(`Producto añadido: ID ${productWithLocalImages.id}`);
        }

        writeProductsFile(products);
        success(`Archivo actualizado: ${PRODUCTS_FILE}`);
        separator();

        console.log(`\n${COLORS.green}${COLORS.bright}¡Importación completada!${COLORS.reset}\n`);

    } catch (err) {
        if (options.json) {
            console.log(JSON.stringify({ error: err.message }, null, 2));
            process.exit(1);
        }

        separator();
        error(`Error de importación: ${err.message}`);
        separator();

        if (err.message.includes('1000x1000')) {
            info('Consejo: Intenta sin --strict-images para aceptar cualquier imagen');
        }

        process.exit(1);
    }
}

// Ejecutar
main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
