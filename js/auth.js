import { auth, db, googleProvider } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
        });
    });

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const btn = loginForm.querySelector('button');

            try {
                btn.textContent = 'Entrando...';
                btn.disabled = true;
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = '/pages/perfil.html';
            } catch (error) {
                console.error(error);
                alert('Error al iniciar sesión: ' + error.message);
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
            const name = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const btn = registerForm.querySelector('button');

            try {
                btn.textContent = 'Creando cuenta...';
                btn.disabled = true;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user data to Realtime Database
                await set(ref(db, 'users/' + user.uid), {
                    username: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });

                window.location.href = '/pages/perfil.html';
            } catch (error) {
                console.error(error);
                alert('Error al registrarse: ' + error.message);
                btn.textContent = 'Crear Cuenta';
                btn.disabled = false;
            }
        });
    }

    // Profile Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('¿Seguro que quieres cerrar sesión?')) {
                await signOut(auth);
                window.location.href = '/index.html';
            }
        });
    }

    // Check Auth State on Profile Page
    if (window.location.pathname.includes('perfil.html')) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Load user data
                const userRef = ref(db, 'users/' + user.uid);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    document.querySelector('.user-info h3').textContent = data.username || 'Usuario';
                    document.querySelector('.user-info p').textContent = user.email;
                    document.querySelector('.avatar').textContent = (data.username || 'U')[0].toUpperCase();
                }
            } else {
                window.location.href = '/pages/login.html';
            }
        });
    }
});
