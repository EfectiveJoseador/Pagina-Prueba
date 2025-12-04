// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7rdqxu0OpdDReiT7hQE8-zTTID2hR0K0",
    authDomain: "camisetazousers.firebaseapp.com",
    databaseURL: "https://camisetazousers-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "camisetazousers",
    storageBucket: "camisetazousers.firebasestorage.app",
    messagingSenderId: "964741829009",
    appId: "1:964741829009:web:2d6c8e7dcb850b94beca30",
    measurementId: "G-7XZL0L37ES"
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
