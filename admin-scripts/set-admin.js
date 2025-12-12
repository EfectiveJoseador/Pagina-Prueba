

const admin = require('firebase-admin');


const ADMIN_EMAIL = 'camisetazocontacto@gmail.com';




const serviceAccount = require('./camisetazo-puntos-firebase-adminsdk-fbsvc-2639cc9473.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://camisetazo-puntos-default-rtdb.europe-west1.firebasedatabase.app'
});


async function setAdminClaim() {
    try {
        console.log('🔍 Buscando usuario:', ADMIN_EMAIL);


        const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);

        console.log('✅ Usuario encontrado:');
        console.log('   UID:', user.uid);
        console.log('   Email:', user.email);
        console.log('   Nombre:', user.displayName || 'N/A');


        const currentClaims = user.customClaims || {};
        console.log('📋 Claims actuales:', JSON.stringify(currentClaims));


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


setAdminClaim();
