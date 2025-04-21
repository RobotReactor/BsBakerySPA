// src/pages/UserPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
// Removed Firestore imports
import '../styles/UserPage.css'; // Assuming you have styles

const UserPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // Keep profile state if you fetch profile from backend too
    const [profile, setProfile] = useState({ firstName: '', lastName: '' });
    const [orders, setOrders] = useState([]); // State for past orders
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return; // Exit if no user
            }

            setLoading(true);
            setError('');
            try {
                // Get Firebase ID token
                const token = await user.getIdToken();

                // --- Fetch Profile (Example) ---
                const profileResponse = await fetch('/api/users/profile', { // Your backend endpoint
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!profileResponse.ok) throw new Error('Failed to fetch profile');
                const profileData = await profileResponse.json();
                setProfile(profileData);

                // --- Fetch Past Orders ---
                const ordersResponse = await fetch('/api/orders/my', { // Your backend endpoint
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
                const ordersData = await ordersResponse.json();
                setOrders(ordersData);

            } catch (err) {
                console.error("Error fetching user data:", err);
                setError(err.message || "Failed to load user data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]); // Re-run when user object changes

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Helper to format date (optional)
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            return dateString; // Fallback
        }
    }

    return (
        <div className="user-page">
            <h1>User Profile</h1>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                 <p className="error-message">{error}</p>
            ) : user ? (
                <>
                    {/* Display profile info */}
                    <p>Welcome, {profile?.firstName || user.displayName || "User"}!</p>
                    <p>Email: {user.email || "N/A"}</p>
                    {profile?.lastName && <p>Last Name: {profile.lastName}</p>}

                    {/* Display Past Orders */}
                    <div className="past-orders">
                        <h2>Your Past Orders</h2>
                        {orders.length > 0 ? (
                            <ul>
                                {orders.map((order) => (
                                    <li key={order.orderId}> {/* Use your order ID key */}
                                        <span>Order Date: {formatDate(order.orderTimestamp)}</span>
                                        <span>Status: {order.status}</span>
                                        <span>Total: ${order.totalAmount?.toFixed(2)}</span>
                                        {/* Add link/button to view order details if needed */}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You have no past orders.</p>
                        )}
                    </div>

                    <button onClick={handleLogout}>Logout</button>
                </>
            ) : (
                <p>Please log in to view your profile.</p>
            )}
            <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
    );
};

export default UserPage;
