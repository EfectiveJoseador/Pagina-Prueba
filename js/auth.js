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
import { sanitizeInput, isValidEmail, checkRateLimit, getRemainingAttempts } from './security.js';
const LOGIN_RATE_LIMIT_KEY = 'login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 300000;
function mapAuthError(code) {
    switch (code) {
        case 'auth/email-already-in-use': return 'Este email ya está registrado.';
        case 'auth/invalid-email': return 'El email no es válido.';
        case 'auth/operation-not-allowed': return 'Operación no permitida. Contacta soporte.';
        case 'auth/weak-password': return 'La contraseña es muy débil (mínimo 6 caracteres).';
        case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Email o contraseña incorrectos.';
        case 'auth/too-many-requests': return 'Demasiados intentos. Inténtalo en unos minutos.';
        case 'auth/network-request-failed': return 'Error de conexión. Verifica tu internet.';
        default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
}
function showError(elementId, message, isSuccess = false) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = isSuccess ? '#22c55e' : '#ef4444';
    } else {
        alert(message);
    }
}
function clearError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = '';
        el.style.display = 'none';
    }
}
onAuthStateChanged(auth, async (user) => {
    if (!window.location.pathname.includes('login.html')) return;

    if (user && user.emailVerified) {
        try {
            const idTokenResult = await user.getIdTokenResult(true);
            if (idTokenResult.claims.admin === true) {
                window.location.href = '/pages/admin.html';
            } else {
                window.location.href = '/pages/perfil.html';
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            window.location.href = '/pages/perfil.html';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    let recaptchaVerifier;
    const recaptchaContainer = document.getElementById('recaptcha-container');

    if (recaptchaContainer) {
        try {
            recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                },
                'expired-callback': () => {
                }
            });
            recaptchaVerifier.render();
        } catch (e) {
            console.error("Recaptcha init error:", e);
        }
    }
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.target);
            if (target) target.classList.add('active');
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    });
    if (window.location.hash === '#register') {
        const registerTab = document.querySelector('.auth-tab[data-target="register-form"]');
        if (registerTab) {
            registerTab.click();
        }
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('login-error');

            const email = sanitizeInput(loginForm.querySelector('input[type="email"]').value, 255);
            const password = loginForm.querySelector('input[type="password"]').value;
            const btn = loginForm.querySelector('button');
            if (!isValidEmail(email)) {
                showError('login-error', 'Por favor, introduce un email válido.');
                return;
            }
            if (!checkRateLimit(LOGIN_RATE_LIMIT_KEY, MAX_LOGIN_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
                const remaining = getRemainingAttempts(LOGIN_RATE_LIMIT_KEY, MAX_LOGIN_ATTEMPTS);
                showError('login-error', `Demasiados intentos. Espera 5 minutos antes de volver a intentarlo.`);
                return;
            }

            try {
                btn.textContent = 'Entrando...';
                btn.disabled = true;

                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                if (!user.emailVerified) {
                    const creationTime = new Date(user.metadata.creationTime).getTime();
                    const now = new Date().getTime();
                    const diffInMinutes = (now - creationTime) / 1000 / 60;

                    if (diffInMinutes > 1) {
                        await user.delete();
                        showError('login-error', 'El tiempo de verificación (1 min) ha expirado. Tu cuenta ha sido eliminada. Por favor, regístrate de nuevo.');
                    } else {
                        await signOut(auth);
                        showError('login-error', 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada (y spam).');
                    }

                    btn.textContent = 'Entrar';
                    btn.disabled = false;
                    return;
                }
                const userRef = ref(db, 'users/' + user.uid);
                const snapshot = await get(userRef);

                if (!snapshot.exists()) {
                    await set(userRef, {
                        username: user.displayName || 'Usuario',
                        email: user.email,
                        createdAt: new Date().toISOString(),
                        verifiedAt: new Date().toISOString()
                    });
                }
                const idTokenResult = await user.getIdTokenResult(true);
                if (idTokenResult.claims.admin === true) {
                    console.log('✅ Usuario es admin - redirigiendo a panel de administración');
                    window.location.href = '/pages/admin.html';
                } else {
                    window.location.href = '/pages/perfil.html';
                }
            } catch (error) {
                console.error(error);
                showError('login-error', mapAuthError(error.code));
                btn.textContent = 'Entrar';
                btn.disabled = false;
            }
        });
    }
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('register-error');

            const name = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const btn = registerForm.querySelector('button');
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
                await updateProfile(user, {
                    displayName: name
                });
                await sendEmailVerification(user);
                await signOut(auth);
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
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            const resetForm = document.getElementById('reset-form');
            if (resetForm) {
                resetForm.classList.add('active');
            }
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    }
    const backToLoginBtn = document.getElementById('back-to-login');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            forms.forEach(f => f.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            const loginTab = document.querySelector('.auth-tab[data-target="login-form"]');
            if (loginTab) {
                loginTab.classList.add('active');
            }

            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.classList.add('active');
            }
            clearError('login-error');
            clearError('register-error');
            clearError('reset-error');
        });
    }
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
