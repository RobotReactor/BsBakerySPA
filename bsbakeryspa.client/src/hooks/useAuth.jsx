// src/hooks/useAuth.jsx
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import app from "../components/FireBase/firebaseConfig"; // Adjust path if needed

import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    getIdToken
} from "firebase/auth";


// --- Define Admin UIDs (Replace with actual UIDs) ---
const ADMIN_USER_IDS = [
    "XKE46g6IuBNZSYDyfbPLDMILfwq1",
    "lujtPx1DerXyqicnWXwOiJI3JSK2"
];
// ---

// 1. Create the Auth Context
const AuthContext = createContext();

// 2. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Firebase Auth user object
    const [userProfile, setUserProfile] = useState(null); // Your backend profile data
    const [loadingAuth, setLoadingAuth] = useState(true); // Combined loading state
    const [loadingProfile, setLoadingProfile] = useState(false); // Specific loading for profile fetch
    const [isAdmin, setIsAdmin] = useState(false); // <-- Add isAdmin state
    const auth = getAuth(app);

    // Function to fetch profile data from your backend
    const fetchUserProfile = useCallback(async (firebaseUser) => {
        if (!firebaseUser) {
            setUserProfile(null);
            // Don't set loadingProfile to false here, let onAuthStateChanged handle overall loading
            return;
        }

        setLoadingProfile(true); // Start profile loading
        try {
            const token = await getIdToken(firebaseUser);
            const response = await fetch('/api/user/profile', { // Use relative path for proxy
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const profileData = await response.json();
                console.log("Fetched user profile:", profileData);
                setUserProfile(profileData);
            } else if (response.status === 404) {
                console.log("User profile not found in backend.");
                setUserProfile(null);
            } else {
                // Handle other non-OK statuses
                console.error("Failed to fetch user profile:", response.status, response.statusText);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
        } finally {
            setLoadingProfile(false); // Finish profile loading
        }
    }, []); // Empty dependency array as it doesn't depend on component state/props

    // Effect to handle auth state changes and initial loading
    useEffect(() => {
        setLoadingAuth(true); // Start initial auth loading
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user');
            setUser(currentUser);

            // --- Set isAdmin flag ---
            if (currentUser && ADMIN_USER_IDS.includes(currentUser.uid)) {
                setIsAdmin(true);
                console.log("Admin user detected.");
            } else {
                setIsAdmin(false);
            }
            // ---

            // Fetch profile only if there's a user
            if (currentUser) {
                await fetchUserProfile(currentUser);
            } else {
                setUserProfile(null); // Clear profile on logout
            }

            setLoadingAuth(false); // Finish initial auth loading AFTER user and profile are checked/fetched
        });
        // Cleanup subscription on unmount
        return () => {
            console.log("Unsubscribing auth listener");
            unsubscribe();
        }
        // fetchUserProfile is stable due to useCallback
    }, [auth, fetchUserProfile]); // Dependencies

    // --- Auth Functions ---
    const login = async (email, password) => {
        // setLoadingAuth(true); // Optional: set loading during login
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // State updates handled by onAuthStateChanged listener
            return userCredential;
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error; // Re-throw error to be caught by caller
        } finally {
            // setLoadingAuth(false);
        }
    };

    const signUp = async (email, password) => {
        // setLoadingAuth(true); // Optional: set loading during sign up
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // State updates handled by onAuthStateChanged listener
            // Profile creation happens separately after sign-up success
            return userCredential;
        } catch (error) {
            console.error("Sign-up failed:", error.message);
            throw error; // Re-throw error
        } finally {
            // setLoadingAuth(false);
        }
    };

    const guestSignIn = async () => {
        // setLoadingAuth(true); // Optional: set loading during guest sign in
        try {
            const userCredential = await signInAnonymously(auth);
            // State updates handled by onAuthStateChanged listener
            return userCredential;
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
            throw error; // Re-throw error
        } finally {
            // setLoadingAuth(false);
        }
    };

    const logout = async () => {
        // setLoadingAuth(true); // Optional: set loading during logout
        try {
            await signOut(auth);
            // State updates (user=null, isAdmin=false, userProfile=null) handled by onAuthStateChanged listener
        } catch (error) {
            console.error("Logout failed:", error.message);
            throw error; // Re-throw error
        } finally {
            // setLoadingAuth(false);
        }
    };
    // --- End Auth Functions ---

    // Value provided by the context
    const value = {
        user,
        userProfile,
        loadingAuth, // Use this for initial app load/auth check
        loadingProfile, // Use this specifically for profile refresh/load
        isAdmin, // Provide the admin flag
        login,
        signUp,
        guestSignIn,
        logout,
        fetchUserProfile // Expose if manual refresh is needed
    };

    // Provide the value to children components
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create and export the useAuth hook to consume the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
