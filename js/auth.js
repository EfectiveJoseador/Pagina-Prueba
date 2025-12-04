import { auth, db, googleProvider } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    sendPasswordResetEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Helper: Map Firebase Error Codes to Spanish
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
        default: return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
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
                    await signOut(auth); // Log out immediately
                    showError('login-error', 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada (y spam).');
                    btn.textContent = 'Entrar';
                    btn.disabled = false;
                    return;
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

            try {
                btn.textContent = 'Creando cuenta...';
                btn.disabled = true;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Send Verification Email
                await sendEmailVerification(user);

                // Save user data to Realtime Database
                await set(ref(db, 'users/' + user.uid), {
                    username: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });

                // Sign out immediately so they can't access protected areas
                await signOut(auth);

                showError('register-error', '¡Cuenta creada! Hemos enviado un enlace de verificación a tu correo. Por favor verifícalo para iniciar sesión.', true);
                registerForm.reset();

                btn.textContent = 'Crear Cuenta';
                btn.disabled = false;

            } catch (error) {
                console.error(error);
                showError('register-error', mapAuthError(error.code));
                btn.textContent = 'Crear Cuenta';
                btn.disabled = false;
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
                showError('reset-error', '¡Correo de recuperación enviado! Revisa tu bandeja de entrada.', true);
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
            const resetTab = document.querySelector('.auth-tab[data-target="reset-form"]');
            if (resetTab) {
                resetTab.click();
            }
        });
    }

    // Profile Logic
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

    // Check Auth State on Profile Page
    if (window.location.pathname.includes('perfil.html')) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (!user.emailVerified) {
                    // Double check verification (in case they just verified in another tab)
                    await user.reload();
                    if (!user.emailVerified) {
                        alert('Debes verificar tu correo para acceder a esta sección.');
                        await signOut(auth);
                        window.location.href = '/pages/login.html';
                        return;
                    }
                }

                // Load user data
                const userRef = ref(db, 'users/' + user.uid);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const usernameEl = document.querySelector('.user-info h3');
                    const emailEl = document.querySelector('.user-info p');
                    const avatarEl = document.querySelector('.avatar');

                    if (usernameEl) usernameEl.textContent = data.username || 'Usuario';
                    if (emailEl) emailEl.textContent = user.email;
                    if (avatarEl) avatarEl.textContent = (data.username || 'U')[0].toUpperCase();
                }
            } else {
                window.location.href = '/pages/login.html';
            }
        });
    }
});
