// src/pages/UserPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
// Removed Firestore imports
import '../styles/UserPage.css'; // Assuming you have styles

const API_BASE_URL = 'http://localhost:5285';

const UserPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [idToken, setIdToken] = useState('');
    const [loadingToken, setLoadingToken] = useState(true);
    const [tokenError, setTokenError] = useState('');

    useEffect(() => {
        const fetchToken = async () => {
            if (!user) {
                setLoadingToken(false);
                return; // No user, nothing to do
            }

            setLoadingToken(true);
            setTokenError('');
            try {
                // Get the Firebase ID token for the current user
                const token = await user.getIdToken();
                setIdToken(token);
            } catch (err) {
                console.error("Error fetching Firebase ID token:", err);
                setTokenError("Could not retrieve authentication token. Please try logging out and back in.");
                setIdToken(''); // Clear any previous token
            } finally {
                setLoadingToken(false);
            }
        };

        fetchToken();
    }, [user]); // Re-run when the user object changes

    const handleLogout = async () => {
        // ... (logout logic remains the same)
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleTokenClick = (event) => {
        event.target.select();
        try {
            document.execCommand('copy');
            // Optional: Add feedback like "Copied!"
        } catch (err) {
            console.error('Failed to copy token automatically');
        }
    }


    // --- JSX remains largely the same ---
    return (
        <div className="user-page">
            <h1>User Info</h1>

            {!user ? (
                <p>Please log in.</p>
            ) : (
                <>
                    <div className="user-info-section">
                        <h2>Email</h2>
                        <p>{user.email || "N/A"}</p>
                    </div>

                    <div className="user-info-section">
                        <h2>Firebase ID Token</h2>
                        {loadingToken ? (
                            <p>Loading token...</p>
                        ) : tokenError ? (
                            <p className="error-message">{tokenError}</p>
                        ) : (
                            <textarea
                                readOnly
                                value={idToken}
                                onClick={handleTokenClick} // Select all on click for easy copying
                                style={{ width: '100%', minHeight: '100px', wordBreak: 'break-all', fontFamily: 'monospace' }}
                                aria-label="Firebase ID Token"
                            />
                        )}
                    </div>
                </>
            )}

            <div className="user-page-actions">
                {user && <button onClick={handleLogout}>Logout</button>}
                <button onClick={() => navigate('/')}>Back to Home</button>
            </div>
        </div>
    );
};

export default UserPage;