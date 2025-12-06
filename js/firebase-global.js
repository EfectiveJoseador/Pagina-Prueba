// Global Firebase Auth State Handler
// This script ensures Firebase is initialized on all pages to maintain session

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Listen for auth state changes and update UI accordingly
onAuthStateChanged(auth, (user) => {
    const userIcon = document.querySelector('.header-actions a[href="/pages/login.html"]');

    if (user) {
        // User is signed in - store auth state regardless of email verification
        window.isUserAuthenticated = true;
        window.currentUser = user;

        // Only change icon if email is verified (for profile access)
        if (user.emailVerified && userIcon) {
            userIcon.href = '/pages/perfil.html';
            userIcon.title = 'Mi Perfil';
        }

        console.log('🔐 User authenticated:', user.uid, 'Email verified:', user.emailVerified);
    } else {
        // User is not signed in
        if (userIcon) {
            userIcon.href = '/pages/login.html';
            userIcon.title = 'Iniciar Sesión';
        }
        window.isUserAuthenticated = false;
        window.currentUser = null;
    }

    // Dispatch event for other scripts to react
    window.dispatchEvent(new CustomEvent('auth:stateChanged', {
        detail: { user, isAuthenticated: !!user && user.emailVerified }
    }));
});

// Export for use in other modules
export { auth };
