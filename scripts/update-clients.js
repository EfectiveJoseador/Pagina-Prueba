

const fs = require('fs');
const path = require('path');


const clientsDir = path.join(__dirname, '..', 'assets', 'clientes');
const outputJson = path.join(clientsDir, 'clientes.json');


const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];

function updateClientImages() {
    console.log('📁 Escaneando carpeta:', clientsDir);


    if (!fs.existsSync(clientsDir)) {
        console.error('❌ Error: La carpeta assets/clientes no existe');
        process.exit(1);
    }


    const files = fs.readdirSync(clientsDir);


    const images = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && !file.startsWith('.');
    });


    images.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    console.log(`✅ Encontradas ${images.length} imágenes:`);
    images.forEach((img, i) => console.log(`   ${i + 1}. ${img}`));


    const jsonData = {
        updated: new Date().toISOString(),
        count: images.length,
        images: images
    };


    fs.writeFileSync(outputJson, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`\n💾 Archivo JSON guardado en: ${outputJson}`);
    console.log('\n🎉 ¡Actualización completada!');
}


updateClientImages();
