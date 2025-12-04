// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBYPvmvzzNxtTFOVpPXKRvUhoHBjBTCVBE",
    authDomain: "camisetazo-puntos.firebaseapp.com",
    databaseURL: "https://camisetazo-puntos-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "camisetazo-puntos",
    storageBucket: "camisetazo-puntos.firebasestorage.app",
    messagingSenderId: "652477026185",
    appId: "1:652477026185:web:4a05e015da74d4541d1b58",
    measurementId: "G-GS53GWE2Z0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth persistence error:", error);
});

export { auth, db, googleProvider };
