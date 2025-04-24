import { useState, useEffect, useCallback } from "react"; // Added useCallback
import app from "../components/FireBase/firebaseConfig";

import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    getIdToken
} from "firebase/auth";

export const useAuth = () => {
    const [user, setUser] = useState(null); // Firebase Auth user object
    const [userProfile, setUserProfile] = useState(null); // Your backend profile data
    const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for profile
    const auth = getAuth(app);

    // Function to fetch profile data from your backend
    const fetchUserProfile = useCallback(async (firebaseUser) => {
        if (!firebaseUser) {
            setUserProfile(null);
            setLoadingProfile(false);
            return;
        }

        setLoadingProfile(true);
        try {
            const token = await getIdToken(firebaseUser);
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const profileData = await response.json();
                console.log("Fetched user profile:", profileData);
                setUserProfile(profileData);
            } else if (response.status === 404) {
                // Profile doesn't exist yet (e.g., just signed up)
                console.log("User profile not found in backend.");
                setUserProfile(null); // Explicitly set to null if not found
            } else {
                // Handle other errors
                console.error("Failed to fetch user profile:", response.status);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    }, []); // Empty dependency array as it doesn't depend on component state

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user');
            setUser(currentUser);
            // Fetch profile data when auth state changes
            fetchUserProfile(currentUser);
        });
        // Cleanup subscription on unmount
        return () => {
            console.log("Unsubscribing auth listener");
            unsubscribe();
        }
        // fetchUserProfile is stable due to useCallback
    }, [auth, fetchUserProfile]);

    // --- Login, SignUp, GuestSignIn, Logout remain the same ---
    // Login with email and password
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // fetchUserProfile will be called by onAuthStateChanged
            return userCredential;
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error;
        }
    };

    // Sign up with email and password
    const signUp = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // fetchUserProfile will be called by onAuthStateChanged,
            // but profile won't exist yet until created via POST /api/user
            return userCredential;
        } catch (error) {
            console.error("Sign-up failed:", error.message);
            throw error;
        }
    };

    // Guest sign-in (anonymous authentication)
    const guestSignIn = async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            // fetchUserProfile will be called by onAuthStateChanged
            // Anonymous users likely won't have a profile in your backend
            return userCredential;
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
            throw error;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            // fetchUserProfile will be called by onAuthStateChanged with null user
        } catch (error) {
            console.error("Logout failed:", error.message);
            throw error;
        }
    };
    // --- End unchanged functions ---


    // Return the state and methods, including userProfile
    return { user, userProfile, loadingProfile, login, signUp, guestSignIn, logout };
};
