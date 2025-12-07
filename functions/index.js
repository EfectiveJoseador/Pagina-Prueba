/**
 * Firebase Cloud Functions - Admin Claims Management
 * 
 * INSTRUCCIONES DE DESPLIEGUE:
 * 
 * 1. Instalar Firebase CLI (si no lo tienes):
 *    npm install -g firebase-tools
 * 
 * 2. Iniciar sesión en Firebase:
 *    firebase login
 * 
 * 3. Inicializar funciones en tu proyecto (desde la raíz del proyecto):
 *    firebase init functions
 *    - Selecciona tu proyecto: camisetazo-puntos
 *    - Elige JavaScript
 *    - Instala dependencias: Sí
 * 
 * 4. Copiar este archivo a functions/index.js (reemplazando el contenido)
 * 
 * 5. Desplegar las funciones:
 *    firebase deploy --only functions
 * 
 * 6. Para asignar admin a tu cuenta, ejecuta desde línea de comandos:
 *    firebase functions:shell
 *    > setAdminByEmail({email: "camisetazocontacto@gmail.com"})
 * 
 *    O usa la consola de Firebase → Functions → Logs para ver resultados
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Admin SDK
admin.initializeApp();

// ============================================
// CONFIGURACIÓN - Tu email de admin principal
// ============================================
const SUPER_ADMIN_EMAIL = 'camisetazocontacto@gmail.com';

// ============================================
// FUNCIÓN: Asignar admin por Email
// ============================================
exports.setAdminByEmail = functions.https.onCall(async (data, context) => {
    // Verificar que quien llama es el super admin o ya es admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
    }

    // Permitir al super admin o admins existentes
    const callerEmail = context.auth.token.email;
    const isCallerAdmin = context.auth.token.admin === true;
    const isSuperAdmin = callerEmail === SUPER_ADMIN_EMAIL;

    if (!isCallerAdmin && !isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de administrador');
    }

    const email = data.email;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email requerido');
    }

    try {
        // Buscar usuario por email
        const user = await admin.auth().getUserByEmail(email);

        // Asignar custom claim
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log(`✅ Admin claim asignado a: ${email} (UID: ${user.uid})`);

        return {
            success: true,
            message: `Usuario ${email} ahora es administrador`,
            uid: user.uid
        };
    } catch (error) {
        console.error('Error asignando admin:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================
// FUNCIÓN: Asignar admin por UID
// ============================================
exports.setAdminByUID = functions.https.onCall(async (data, context) => {
    // Verificar permisos
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
    }

    const callerEmail = context.auth.token.email;
    const isCallerAdmin = context.auth.token.admin === true;
    const isSuperAdmin = callerEmail === SUPER_ADMIN_EMAIL;

    if (!isCallerAdmin && !isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'No tienes permisos de administrador');
    }

    const uid = data.uid;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'UID requerido');
    }

    try {
        // Verificar que el usuario existe
        const user = await admin.auth().getUser(uid);

        // Asignar custom claim
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        console.log(`✅ Admin claim asignado a UID: ${uid} (${user.email})`);

        return {
            success: true,
            message: `Usuario ${user.email || uid} ahora es administrador`,
            uid: uid
        };
    } catch (error) {
        console.error('Error asignando admin por UID:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================
// FUNCIÓN: Quitar admin
// ============================================
exports.removeAdmin = functions.https.onCall(async (data, context) => {
    // Verificar permisos
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes estar autenticado');
    }

    const callerEmail = context.auth.token.email;
    const isSuperAdmin = callerEmail === SUPER_ADMIN_EMAIL;

    // Solo el super admin puede quitar admins
    if (!isSuperAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo el super admin puede quitar administradores');
    }

    const email = data.email;
    const uid = data.uid;

    if (!email && !uid) {
        throw new functions.https.HttpsError('invalid-argument', 'Email o UID requerido');
    }

    try {
        let targetUser;

        if (email) {
            targetUser = await admin.auth().getUserByEmail(email);
        } else {
            targetUser = await admin.auth().getUser(uid);
        }

        // No permitir quitarse admin a sí mismo
        if (targetUser.email === SUPER_ADMIN_EMAIL) {
            throw new functions.https.HttpsError('failed-precondition', 'No puedes quitarte los permisos de super admin');
        }

        // Quitar custom claim (establecer a null o vacío)
        await admin.auth().setCustomUserClaims(targetUser.uid, { admin: false });

        console.log(`❌ Admin claim removido de: ${targetUser.email} (UID: ${targetUser.uid})`);

        return {
            success: true,
            message: `Permisos de admin removidos de ${targetUser.email}`,
            uid: targetUser.uid
        };
    } catch (error) {
        console.error('Error removiendo admin:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================
// FUNCIÓN: Verificar si un usuario es admin
// ============================================
exports.checkAdmin = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        return { isAdmin: false };
    }

    return {
        isAdmin: context.auth.token.admin === true,
        email: context.auth.token.email,
        uid: context.auth.uid
    };
});

// ============================================
// TRIGGER: Configurar primer admin automáticamente
// (Ejecutar una vez al desplegar)
// ============================================
exports.initSuperAdmin = functions.https.onRequest(async (req, res) => {
    // Esta función solo debe ejecutarse una vez
    // Protégela con una clave secreta
    const secretKey = req.query.key;

    if (secretKey !== 'CAMISETAZO_INIT_2024') {
        res.status(403).send('Acceso denegado');
        return;
    }

    try {
        const user = await admin.auth().getUserByEmail(SUPER_ADMIN_EMAIL);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        res.status(200).send(`✅ Super admin configurado: ${SUPER_ADMIN_EMAIL}`);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});
