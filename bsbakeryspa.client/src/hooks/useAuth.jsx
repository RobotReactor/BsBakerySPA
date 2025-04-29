// src/hooks/useAuth.jsx
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
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

// REMOVE THIS HARDCODED LIST - IT'S NO LONGER NEEDED!
// const ADMIN_USER_IDS = [
//     "XKE46g6IuBNZSYDyfbPLDMILfwq1",
//     "lujtPx1DerXyqicnWXwOiJI3JSK2"
// ];

// 1. Create the Auth Context
const AuthContext = createContext();

// 2. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Firebase Auth user object
    const [userProfile, setUserProfile] = useState(null); // Your backend profile data (now includes isAdmin)
    const [loadingAuth, setLoadingAuth] = useState(true); // Initial auth check loading
    const [loadingProfile, setLoadingProfile] = useState(false); // Specific loading for profile fetch
    const [isAdmin, setIsAdmin] = useState(false); // Admin state, now derived from profile
    const auth = getAuth(app);

    const fetchUserProfile = useCallback(async (firebaseUser) => {
        if (!firebaseUser) {
            setUserProfile(null);
            setIsAdmin(false); // Ensure isAdmin is false if no user
            return null; // Return null to indicate no profile fetched
        }

        setLoadingProfile(true);
        let fetchedProfileData = null; // Variable to hold fetched data
        try {
            const token = await getIdToken(firebaseUser);
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchedProfileData = await response.json();
                console.log("Fetched user profile:", fetchedProfileData);
                setUserProfile(fetchedProfileData);
                // --- Set isAdmin based on fetched profile ---
                // Read the isAdmin property from the backend response
                setIsAdmin(fetchedProfileData?.isAdmin || false);
                if(fetchedProfileData?.isAdmin) {
                    console.log("Admin status confirmed from backend profile.");
                }
                // ---
            } else if (response.status === 404) {
                console.log("User profile not found in backend.");
                setUserProfile(null);
                setIsAdmin(false); // No profile means not admin
            } else {
                console.error("Failed to fetch user profile:", response.status, response.statusText);
                setUserProfile(null);
                setIsAdmin(false); // Fetch failure means not admin
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setIsAdmin(false); // Error means not admin
        } finally {
            setLoadingProfile(false);
        }
        return fetchedProfileData; // Return the fetched profile (or null)
    }, []); // Empty dependency array

    // Effect to handle auth state changes and initial loading
    useEffect(() => {
        setLoadingAuth(true); // Start initial auth loading
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user');
            setUser(currentUser);

            // --- Remove the old isAdmin check here ---
            // The isAdmin state will now be set by fetchUserProfile
            // if (currentUser && ADMIN_USER_IDS.includes(currentUser.uid)) {
            //     setIsAdmin(true);
            //     console.log("Admin user detected.");
            // } else {
            //     setIsAdmin(false);
            // }
            // --- Instead, reset isAdmin initially and let fetchUserProfile set it ---
            setIsAdmin(false); // Reset admin status initially on auth change
            // ---

            // Fetch profile only if there's a user
            if (currentUser) {
                // fetchUserProfile now handles setting isAdmin internally based on backend response
                await fetchUserProfile(currentUser);
            } else {
                // Clear profile and ensure isAdmin is false on logout
                setUserProfile(null);
                setIsAdmin(false);
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

    // --- Auth Functions (No changes needed here) ---
    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // State updates handled by onAuthStateChanged listener
            return userCredential;
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error; // Re-throw error to be caught by caller
        }
    };

    const signUp = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // State updates handled by onAuthStateChanged listener
            // Profile creation happens separately after sign-up success
            return userCredential;
        } catch (error) {
            console.error("Sign-up failed:", error.message);
            throw error; // Re-throw error
        }
    };

    const guestSignIn = async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            // State updates handled by onAuthStateChanged listener
            return userCredential;
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
            throw error; // Re-throw error
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error.message);
            throw error; // Re-throw error
        }
    };
    // --- End Auth Functions ---

    // Value provided by the context
    const value = {
        user,
        userProfile,
        loadingAuth, // Use this for initial app load/auth check
        loadingProfile, // Use this specifically for profile refresh/load
        isAdmin, // Provide the admin flag derived from backend
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
