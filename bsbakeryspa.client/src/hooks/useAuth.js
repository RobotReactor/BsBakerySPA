import { useState, useEffect } from "react";
import { onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const useAuth = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login failed:", error.message);
        }
    };

    const guestSignIn = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    };

    return { user, login, guestSignIn, logout };
};