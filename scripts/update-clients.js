/**
 * Script para actualizar automáticamente las imágenes de clientes
 * Escanea la carpeta assets/clientes y genera un archivo JSON con los nombres
 * 
 * Uso: node scripts/update-clients.js
 */

const fs = require('fs');
const path = require('path');

// Rutas
const clientsDir = path.join(__dirname, '..', 'assets', 'clientes');
const outputJson = path.join(clientsDir, 'clientes.json');

// Extensiones de imagen permitidas
const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];

function updateClientImages() {
    console.log('📁 Escaneando carpeta:', clientsDir);

    // Verificar que la carpeta existe
    if (!fs.existsSync(clientsDir)) {
        console.error('❌ Error: La carpeta assets/clientes no existe');
        process.exit(1);
    }

    // Leer archivos de la carpeta
    const files = fs.readdirSync(clientsDir);

    // Filtrar solo imágenes
    const images = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && !file.startsWith('.');
    });

    // Ordenar naturalmente (1, 2, 3... 10, 11... en vez de 1, 10, 11, 2...)
    images.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    console.log(`✅ Encontradas ${images.length} imágenes:`);
    images.forEach((img, i) => console.log(`   ${i + 1}. ${img}`));

    // Crear objeto JSON
    const jsonData = {
        updated: new Date().toISOString(),
        count: images.length,
        images: images
    };

    // Guardar JSON
    fs.writeFileSync(outputJson, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`\n💾 Archivo JSON guardado en: ${outputJson}`);
    console.log('\n🎉 ¡Actualización completada!');
}

// Ejecutar
updateClientImages();
