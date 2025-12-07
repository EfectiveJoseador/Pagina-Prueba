/**
 * Script para asignar custom claim admin: true
 * Ejecutar UNA SOLA VEZ localmente
 * 
 * INSTRUCCIONES:
 * 
 * 1. Descarga la clave privada de Firebase:
 *    - Ve a: https://console.firebase.google.com/project/camisetazo-puntos/settings/serviceaccounts/adminsdk
 *    - Click en "Generar nueva clave privada"
 *    - Guarda el archivo JSON en esta carpeta como "serviceAccountKey.json"
 * 
 * 2. Instala la dependencia:
 *    cd admin-scripts
 *    npm install firebase-admin
 * 
 * 3. Ejecuta el script:
 *    node set-admin.js
 * 
 * 4. Cierra sesión en la web y vuelve a iniciar sesión
 *    (para que el token se refresque con el nuevo claim)
 */

const admin = require('firebase-admin');

// ============================================
// CONFIGURACIÓN - Cambia estos valores
// ============================================
const ADMIN_EMAIL = 'camisetazocontacto@gmail.com';
// O usa el UID directamente:
// const ADMIN_UID = '0pcTin0px9Yfutyl8rEnLZcl70P2';

// ============================================
// INICIALIZAR FIREBASE ADMIN
// ============================================
const serviceAccount = require('./camisetazo-puntos-firebase-adminsdk-fbsvc-2639cc9473.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://camisetazo-puntos-default-rtdb.europe-west1.firebasedatabase.app'
});

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function setAdminClaim() {
    try {
        console.log('🔍 Buscando usuario:', ADMIN_EMAIL);

        // Buscar usuario por email
        const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);

        console.log('✅ Usuario encontrado:');
        console.log('   UID:', user.uid);
        console.log('   Email:', user.email);
        console.log('   Nombre:', user.displayName || 'N/A');

        // Verificar claims actuales
        const currentClaims = user.customClaims || {};
        console.log('📋 Claims actuales:', JSON.stringify(currentClaims));

        // Asignar claim admin
        await admin.auth().setCustomUserClaims(user.uid, {
            ...currentClaims,
            admin: true
        });

        console.log('');
        console.log('🎉 ¡CLAIM ADMIN ASIGNADO EXITOSAMENTE!');
        console.log('');
        console.log('📌 Próximos pasos:');
        console.log('   1. Cierra sesión en la web');
        console.log('   2. Vuelve a iniciar sesión');
        console.log('   3. Accede a /pages/admin.html');
        console.log('');

        // Verificar que se aplicó
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log('✅ Verificación - Claims actualizados:', JSON.stringify(updatedUser.customClaims));

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.code === 'auth/user-not-found') {
            console.log('');
            console.log('El usuario no existe. Verifica el email.');
        }

        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('');
            console.log('Falta el archivo serviceAccountKey.json');
            console.log('Descárgalo desde Firebase Console → Project Settings → Service Accounts');
        }
    }

    process.exit(0);
}

// Ejecutar
setAdminClaim();
