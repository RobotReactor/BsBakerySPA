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

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [userProfile, setUserProfile] = useState(null); 
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false); 
    const [isAdmin, setIsAdmin] = useState(false); 
    const auth = getAuth(app);

    const fetchUserProfile = useCallback(async (firebaseUser) => {
        if (!firebaseUser) {
            setUserProfile(null);
            setIsAdmin(false);
            return null; 
        }

        setLoadingProfile(true);
        let fetchedProfileData = null; 
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
                setIsAdmin(fetchedProfileData?.isAdmin || false);

                if(fetchedProfileData?.isAdmin) {
                    console.log("Admin status confirmed from backend profile.");
                }
            } else if (response.status === 404) {
                console.log("User profile not found in backend.");
                setUserProfile(null);
                setIsAdmin(false); 
            } else {
                console.error("Failed to fetch user profile:", response.status, response.statusText);
                setUserProfile(null);
                setIsAdmin(false); 
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
            setIsAdmin(false); 
        } finally {
            setLoadingProfile(false);
        }
        return fetchedProfileData; 
    }, []); 

    useEffect(() => {
        setLoadingAuth(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user');
            setUser(currentUser);

            setIsAdmin(false);

            if (currentUser) {
                await fetchUserProfile(currentUser);
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }

            setLoadingAuth(false); 
        });
        return () => {
            console.log("Unsubscribing auth listener");
            unsubscribe();
        }
    }, [auth, fetchUserProfile]); 

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error;
        }
    };

    const signUp = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            console.error("Sign-up failed:", error.message);
            throw error; 
        }
    };

    const guestSignIn = async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            return userCredential;
        } catch (error) {
            console.error("Guest sign-in failed:", error.message);
            throw error; 
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error.message);
            throw error; 
        }
    };

    const value = {
        user,
        userProfile,
        loadingAuth, 
        loadingProfile, 
        isAdmin, 
        login,
        signUp,
        guestSignIn,
        logout,
        fetchUserProfile 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
