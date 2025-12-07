import { auth, db, googleProvider } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    RecaptchaVerifier
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Helper: Map Firebase Error Codes to Spanishh
function mapAuthError(code) {
    switch (code) {
        case 'auth/email-already-in-use': return 'Este email ya está registrado.';
        case 'auth/invalid-email': return 'El email no es válido.';
        case 'auth/operation-not-allowed': return 'Operación no permitida. Contacta soporte.';
        case 'auth/weak-password': return 'La contraseña es muy débil (mínimo 6 caracteres).';
        case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada.';
        case 'auth/user-not-found': return 'No existe una cuenta con este email.';
        case 'auth/wrong-password': return 'Contraseña incorrecta.';
        case 'auth/too-many-requests': return 'Demasiados intentos. Inténtalo más tarde.';
        case 'auth/network-request-failed': return 'Error de conexión. Verifica tu internet.';
        case 'auth/invalid-credential': return 'Credenciales inválidas.';
        default: return `Ocurrió un error inesperado: ${code}. Inténtalo de nuevo.`;
    }
}

// Helper: Show Error
function showError(elementId, message, isSuccess = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = isSuccess ? '#22c55e' : '#ef4444'; // Green for success, Red for error
    } else {
        alert(message); // Fallback
    }
}

// Helper: Clear Error
function clearError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = '';
        el.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Recaptcha
    let recaptchaVerifier;
    const recaptchaContainer = document.getElementById('recaptcha-container');

    if (recaptchaContainer) {
        try {
            recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signIn.
                },
                'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                }
            });
            recaptchaVerifier.render();
        } catch (e) {
            console.error("Recaptcha init error:", e);
        }
    }

    // Tab Switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.target);
            if (target) target.classList.add('active');

            // Clear errors when switching tabs
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    });

    // Check URL hash for #register to auto-switch to register tab
    if (window.location.hash === '#register') {
        const registerTab = document.querySelector('.auth-tab[data-target="register-form"]');
        if (registerTab) {
            registerTab.click();
        }
    }

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('login-error');

            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const btn = loginForm.querySelector('button');

            try {
                btn.textContent = 'Entrando...';
                btn.disabled = true;

                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Check if email is verified
                if (!user.emailVerified) {
                    // Check expiration (1 minute for testing)
                    const creationTime = new Date(user.metadata.creationTime).getTime();
                    const now = new Date().getTime();
                    const diffInMinutes = (now - creationTime) / 1000 / 60;

                    if (diffInMinutes > 1) {
                        await user.delete();
                        showError('login-error', 'El tiempo de verificación (1 min) ha expirado. Tu cuenta ha sido eliminada. Por favor, regístrate de nuevo.');
                    } else {
                        await signOut(auth); // Log out immediately
                        showError('login-error', 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada (y spam).');
                    }

                    btn.textContent = 'Entrar';
                    btn.disabled = false;
                    return;
                }

                // Check if user exists in DB (Lazy Creation)
                const userRef = ref(db, 'users/' + user.uid);
                const snapshot = await get(userRef);

                if (!snapshot.exists()) {
                    // Create DB entry now that they are verified
                    await set(userRef, {
                        username: user.displayName || 'Usuario',
                        email: user.email,
                        createdAt: new Date().toISOString(),
                        verifiedAt: new Date().toISOString()
                    });
                }

                window.location.href = '/pages/perfil.html';
            } catch (error) {
                console.error(error);
                showError('login-error', mapAuthError(error.code));
                btn.textContent = 'Entrar';
                btn.disabled = false;
            }
        });
    }

    // Register
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('register-error');

            const name = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const btn = registerForm.querySelector('button');

            // Verify Captcha
            if (recaptchaVerifier) {
                const recaptchaResponse = grecaptcha.getResponse(recaptchaVerifier.widgetId);
                if (!recaptchaResponse) {
                    showError('register-error', 'Por favor, completa el captcha.');
                    return;
                }
            }

            try {
                btn.textContent = 'Creando cuenta...';
                btn.disabled = true;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Store display name in Auth Profile
                await updateProfile(user, {
                    displayName: name
                });

                // Send Verification Email
                await sendEmailVerification(user);

                // Sign out immediately
                await signOut(auth);

                // Reset Captcha
                if (recaptchaVerifier) grecaptcha.reset(recaptchaVerifier.widgetId);

                showError('register-error', '¡Cuenta creada! Hemos enviado un enlace de verificación a tu correo. Por favor verifícalo para iniciar sesión.', true);
                registerForm.reset();

                btn.textContent = 'Crear Cuenta';
                btn.disabled = false;

            } catch (error) {
                console.error(error);
                const errorMessage = error.code ? mapAuthError(error.code) : `Error: ${error.message}`;
                showError('register-error', errorMessage);
                btn.textContent = 'Crear Cuenta';
                btn.disabled = false;
                if (recaptchaVerifier) grecaptcha.reset(recaptchaVerifier.widgetId);
            }
        });
    }

    // Password Reset
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('reset-error');

            const email = resetForm.querySelector('input[type="email"]').value;
            const btn = resetForm.querySelector('button');

            try {
                btn.textContent = 'Enviando...';
                btn.disabled = true;
                await sendPasswordResetEmail(auth, email);
                showError('reset-error', '¡Correo de recuperación enviado! Revisa tu bandeja de entrada y la carpeta de spam.', true);
                btn.textContent = 'Enviar Enlace';
                btn.disabled = false;
                resetForm.reset();
            } catch (error) {
                console.error(error);
                showError('reset-error', mapAuthError(error.code));
                btn.textContent = 'Enviar Enlace';
                btn.disabled = false;
            }
        });
    }

    // Forgot Password Link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();

            // Desactivar todas las tabs y forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            // Activar el form de reset directamente
            const resetForm = document.getElementById('reset-form');
            if (resetForm) {
                resetForm.classList.add('active');
            }

            // Limpiar errores
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    }

    // Back to Login Button (from reset form)
    const backToLoginBtn = document.getElementById('back-to-login');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Desactivar todas las forms
            forms.forEach(f => f.classList.remove('active'));

            // Activar el tab y form de login
            tabs.forEach(t => t.classList.remove('active'));
            const loginTab = document.querySelector('.auth-tab[data-target="login-form"]');
            if (loginTab) {
                loginTab.classList.add('active');
            }

            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.classList.add('active');
            }

            // Limpiar errores
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    }

    // Profile Logic - Logout Button Only
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('¿Seguro que quieres cerrar sesión?')) {
                try {
                    await signOut(auth);
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Error al cerrar sesión: ' + error.message);
                }
            }
        });
    }
});
