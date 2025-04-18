import { useState, useEffect } from "react";
import app from "../firebaseConfig"; // Import the initialized Firebase app
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const auth = getAuth(app); // Use the initialized app

    // Track authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    // Login with email and password
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error;
        }
    };

    // Sign up with email and password
    const signUp = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
        } catch (error) {
            console.error("Sign-up failed:", error.message);
            throw error;
        }
    };

    // Guest sign-in (anonymous authentication)
    const guestSignIn = async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            setUser(userCredential.user);
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error.message);
            throw error;
        }
    };

    return { user, login, signUp, guestSignIn, logout };
};