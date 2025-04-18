import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAcV6FI-O3Ja4gUiYMfJbM9UuGAjAulULM",
    authDomain: "bs-bakery-e7ef2.firebaseapp.com",
    projectId: "bs-bakery-e7ef2",
    storageBucket: "bs-bakery-e7ef2.firebasestorage.app",
    messagingSenderId: "90779603495",
    appId: "1:90779603495:web:72c9d71d39f141982af402",
    measurementId: "G-HQ9JT1HVBC"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;