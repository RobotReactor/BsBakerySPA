import React from 'react';
import { useAuth } from './hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UserPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="user-page">
            <h1>User Profile</h1>
            {user ? (
                <>
                    <p>Welcome, {user.displayName || "Guest"}!</p>
                    <p>Email: {user.email || "N/A"}</p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <p>Please log in to view your profile.</p>
            )}
            <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
    );
};

export default UserPage;