import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getIdToken } from 'firebase/auth';
import { getToppingById, getProductById } from '../data/products';

import '../styles/UserPage.css'; 

const ORDER_STATUSES = ["Placed", "Preparing", "Ready for Pickup", "Completed", "Cancelled"];

const UserPage = () => {
    const { user, userProfile, loadingAuth, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [myOrders, setMyOrders] = useState([]);
    const [isLoadingMyOrders, setIsLoadingMyOrders] = useState(true);
    const [myOrdersError, setMyOrdersError] = useState('');

    const [allOrders, setAllOrders] = useState([]); 
    const [isLoadingAllOrders, setIsLoadingAllOrders] = useState(false);
    const [allOrdersError, setAllOrdersError] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); 
    const [updatingStatusOrderId, setUpdatingStatusOrderId] = useState(null); 
    const [pendingStatusChanges, setPendingStatusChanges] = useState({});

    const [isBakingMode, setIsBakingMode] = useState(false);
    const BAKING_RELEVANT_STATUSES = ["Placed", "Preparing"]; 

    // --- Helper functions ---
    const getToppingName = (id) => {
        const topping = getToppingById(id); // Use imported helper
        return topping ? topping.name : 'Unknown Topping';
    };

    const getProductName = (id) => {
        const product = getProductById(id); // Use imported helper
        // Handle potential variations in product names (e.g., removing "(Dozen)")
        return product ? product.name.replace(/\s*\(Dozen\)/i, '') : 'Unknown Product';
    };

    // --- Fetch User's Orders ---
    useEffect(() => {
        // Redirect if not logged in after auth check
        if (!loadingAuth && !user) {
            navigate('/login');
            return; // Stop execution if redirecting
        }

        // Fetch user's orders only if logged in AND not an admin
        if (user && !isAdmin) {
            const fetchMyOrders = async () => {
                setIsLoadingMyOrders(true);
                setMyOrdersError('');
                try {
                    const token = await getIdToken(user);
                    const response = await fetch('/api/order/my', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch your orders (${response.status})`);
                    }
                    const data = await response.json();

                    // Handle potential $values from ReferenceHandler.Preserve
                    let ordersArray = data?.$values || (Array.isArray(data) ? data : []);

                    // Process orders: parse JSON strings
                    const processed = ordersArray.map(order => ({
                        ...order,
                        orderItems: (order.orderItems?.$values || order.orderItems || []).map(item => ({
                            ...item,
                            selectedToppingIds: item.selectedToppingIdsJson ? JSON.parse(item.selectedToppingIdsJson) : null,
                            bagelDistribution: item.bagelDistributionJson ? JSON.parse(item.bagelDistributionJson) : null
                        }))
                    }));
                    setMyOrders(processed);
                } catch (err) {
                    console.error("Error fetching user orders:", err);
                    setMyOrdersError(err.message || "Could not load your order history.");
                } finally {
                    setIsLoadingMyOrders(false);
                }
            };
            fetchMyOrders();
        } else {
            // Clear user orders if admin or logged out
            setMyOrders([]);
            setIsLoadingMyOrders(false);
        }
    }, [user, loadingAuth, navigate, isAdmin]); // Add isAdmin dependency

    // --- Fetch All Orders (Admin Only) ---
    useEffect(() => {
        // Fetch all orders only if logged in AND is an admin
        if (user && isAdmin) {
            const fetchAllOrders = async () => {
                setIsLoadingAllOrders(true);
                setAllOrdersError('');
                try {
                    const token = await getIdToken(user);
                    const response = await fetch('/api/order/all', { // Call the admin endpoint
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        if (response.status === 403) throw new Error("Access Denied: You do not have permission to view all orders.");
                        throw new Error(`Failed to fetch all orders (${response.status})`);
                    }
                    const data = await response.json();

                    // Handle potential $values from ReferenceHandler.Preserve
                    let ordersArray = data?.$values || (Array.isArray(data) ? data : []);

                    // Process orders: parse JSON strings and potentially include user info
                    const processed = ordersArray.map(order => ({
                        ...order,
                        // Include user details if backend sent them (check backend controller includes)
                        userFirstName: order.user?.firstName,
                        userLastName: order.user?.lastName,
                        userEmail: order.user?.email,
                        orderItems: (order.orderItems?.$values || order.orderItems || []).map(item => ({
                            ...item,
                            selectedToppingIds: item.selectedToppingIdsJson ? JSON.parse(item.selectedToppingIdsJson) : null,
                            bagelDistribution: item.bagelDistributionJson ? JSON.parse(item.bagelDistributionJson) : null
                        }))
                    }));
                    setAllOrders(processed);
                } catch (err) {
                    console.error("Error fetching all orders:", err);
                    setAllOrdersError(err.message || "Could not load all orders.");
                } finally {
                    setIsLoadingAllOrders(false);
                }
            };
            fetchAllOrders();
        } else {
            // Clear all orders if not admin
            setAllOrders([]);
        }
    }, [user, isAdmin]); // Rerun if user logs in/out or admin status changes

    // --- Filtered and Sorted Orders for Admin Display ---
    const displayOrders = useMemo(() => {
        if (!isAdmin) return []; // Only calculate for admin
        return allOrders
            .filter(order => filterStatus === 'All' || order.status === filterStatus)
            // Backend sorts by timestamp ascending (earliest first), keep that order
            // .sort((a, b) => new Date(a.orderTimestamp) - new Date(b.orderTimestamp));
    }, [allOrders, filterStatus, isAdmin]);

    const orderForBaking = useMemo(() => {
        if (!isAdmin || !isBakingMode) return null;
        // Find the first order (oldest due to backend sort) that needs baking
        return allOrders.find(order => BAKING_RELEVANT_STATUSES.includes(order.status));
    }, [allOrders, isAdmin, isBakingMode]);

    const bakingOrderSummary = useMemo(() => {
        if (!orderForBaking) return null;

        const summary = {}; // { productId: { name: '...', quantity: 0, isBagel: false, distribution: {} } }

        orderForBaking.orderItems.forEach(item => {
            const productId = item.productId;
            const isBagel = productId?.startsWith('B');
            const productName = getProductName(productId);

            if (!summary[productId]) {
                summary[productId] = {
                    name: productName,
                    quantity: 0,
                    isBagel: isBagel,
                    // Store distributions separately if multiple custom bagels of same type exist (unlikely for now)
                    distribution: isBagel ? { ...(item.bagelDistribution || {}) } : null
                };
            }

            summary[productId].quantity += item.quantity;

            // If it's a bagel and we encounter another distribution, merge counts (simple merge for now)
            if (isBagel && item.bagelDistribution) {
                 Object.entries(item.bagelDistribution).forEach(([toppingId, count]) => {
                     summary[productId].distribution[toppingId] = (summary[productId].distribution[toppingId] || 0) + count;
                 });
            }
        });
        return Object.values(summary); // Return as an array
    }, [orderForBaking]);

    const handlePendingStatusSelect = (orderId, selectedStatus) => {
        setPendingStatusChanges(prev => ({
            ...prev,
            [orderId]: selectedStatus
        }));
    };

    // --- Handler for Status Update Submission (Admin) ---
    const handleStatusUpdateSubmit = async (orderId, newStatus) => {
        // Basic checks
        if (!isAdmin || !user || !newStatus) {
            console.warn("Status update cancelled:", { isAdmin, user, newStatus });
            return;
        }

        setUpdatingStatusOrderId(orderId); // Indicate loading for this specific order
        try {
            const token = await getIdToken(user);
            const response = await fetch(`/api/order/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Use the passed newStatus argument
                body: JSON.stringify({ NewStatus: newStatus })
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error("Access denied.");
                if (response.status === 404) throw new Error("Order not found.");
                const errorText = await response.text();
                throw new Error(errorText || `Failed to update status (${response.status})`);
            }

            // Update the status locally in the allOrders state
            setAllOrders(prevOrders =>
                prevOrders.map(order =>
                    order.orderId === orderId ? { ...order, status: newStatus } : order
                )
            );
            setPendingStatusChanges(prev => {
                const newState = { ...prev };
                if (newState[orderId]) { 
                    delete newState[orderId];
                }
                return newState;
            });
            console.log(`Status updated for order ${orderId} to ${newStatus}`);

        } catch (err) {
            console.error(`Error updating status for order ${orderId}:`, err);
            alert(`Error updating status: ${err.message}`);
        } finally {
            setUpdatingStatusOrderId(null); // Reset loading indicator
        }
    };


    // --- Render Logic ---

    // Show main loading indicator while checking auth state
    if (loadingAuth) {
        return <div className="user-page-loading">Loading user information...</div>;
    }

    // Should have been redirected by useEffect if user is null, but check again
    if (!user) {
        return null; // Or a message indicating redirection
    }

    // --- Main Page Render ---
    return (
        <div className="user-page">
            <div className="user-container">
                <h1>{isAdmin ? "Admin Dashboard" : "Your Account"}</h1>

                {/* --- Admin View --- */}
                {isAdmin && (
                    <>
                        <hr className="section-divider" />
                            <div className="order-history-section admin-orders">
                                {/* --- Combined Filter and Mode Toggle Area --- */}
                                <div className="admin-controls-header">
                                    {/* Filter Controls */}
                                    <div className="admin-order-filters">
                                        <label htmlFor="statusFilter">Filter by Status: </label>
                                        <select
                                            id="statusFilter"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            disabled={isBakingMode} // Disable filter in baking mode
                                        >
                                            <option value="All">All</option>
                                            {ORDER_STATUSES.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Baking Mode Toggle */}
                                    <div className="baking-mode-toggle">
                                        <label htmlFor="bakingModeSwitch">Baking Mode:</label>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                id="bakingModeSwitch"
                                                checked={isBakingMode}
                                                onChange={(e) => setIsBakingMode(e.target.checked)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>
                                {isBakingMode ? (
                                <div className="baking-mode-view">
                                    <h2>Next Order to Bake</h2>
                                    {isLoadingAllOrders && <p>Loading orders...</p>}
                                    {allOrdersError && <p className="error-message">{allOrdersError}</p>}
                                    {!isLoadingAllOrders && !orderForBaking && (
                                        <p>No orders currently need baking ({BAKING_RELEVANT_STATUSES.join('/')}).</p>
                                    )}
                                    {orderForBaking && bakingOrderSummary && (
                                        <div className="baking-order-details">
                                            <div className="baking-order-info">
                                                <span>Order ID: #{orderForBaking.orderId}</span>
                                                <span>Status: {orderForBaking.status}</span>
                                                {/* Add customer info if available */}
                                                <span>Customer: {orderForBaking.userFirstName || orderForBaking.userEmail || 'N/A'}</span>
                                            </div>
                                            <h3>Items Needed:</h3>
                                            <ul className="baking-items-list">
                                                {bakingOrderSummary.map(item => (
                                                    <li key={item.name} className="baking-item">
                                                        <span className="baking-item-name">{item.name}:</span>
                                                        <span className="baking-item-quantity">{item.quantity}</span>
                                                        {item.isBagel && item.distribution && (
                                                            <ul className="baking-bagel-distribution">
                                                                {Object.entries(item.distribution)
                                                                    .sort(([, countA], [, countB]) => countB - countA)
                                                                    .map(([toppingId, count]) => (
                                                                        <li key={toppingId}>{getToppingName(toppingId)} x {count}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="baking-actions">
                                                {orderForBaking.status === 'Placed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdateSubmit(orderForBaking.orderId, 'Preparing')}
                                                        disabled={updatingStatusOrderId === orderForBaking.orderId}
                                                        className="baking-action-button preparing"
                                                    >
                                                        Mark as Preparing
                                                    </button>
                                                )}
                                                 {orderForBaking.status === 'Preparing' && (
                                                    <button
                                                        onClick={() => handleStatusUpdateSubmit(orderForBaking.orderId, 'Ready for Pickup')}
                                                        disabled={updatingStatusOrderId === orderForBaking.orderId}
                                                        className="baking-action-button ready"
                                                    >
                                                        Mark as Ready
                                                    </button>
                                                )}
                                                {/* Add other actions as needed */}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // --- Standard Admin Order List View ---
                                <>
                                    <h2>All Customer Orders</h2>
                                    {isLoadingAllOrders && <p>Loading all orders...</p>}
                                    {allOrdersError && <p className="error-message">{allOrdersError}</p>}
                                    {!isLoadingAllOrders && !allOrdersError && displayOrders.length === 0 && (
                                        <p>No orders found{filterStatus !== 'All' ? ` with status "${filterStatus}"` : ''}.</p>
                                    )}
                                    {!isLoadingAllOrders && !allOrdersError && displayOrders.length > 0 && (
                                        <div className="orders-list admin-orders-list">
                                            {displayOrders.map(order => {
                                                // Determine if the selected status is different from the current one
                                                const pendingStatus = pendingStatusChanges[order.orderId];
                                                const statusChanged = pendingStatus && pendingStatus !== order.status;

                                                return (
                                                    <div key={order.orderId} className="order-card admin-order-card">
                                                        {/* Admin Order Card Header */}
                                                        <div className="order-card-header">
                                                            <span>Order ID: #{order.orderId}</span>
                                                            <span>Date: {new Date(order.orderTimestamp).toLocaleDateString()}</span>
                                                            {/* Display User Info */}
                                                            <span>User: {order.userFirstName || order.userEmail || order.userFirebaseUid}</span>
                                                        </div>
                                                        {/* Admin Order Items List */}
                                                        <ul className="order-items-summary-list">
                                                            {order.orderItems.map(item => (
                                                                <li key={item.orderItemId} className="order-item-summary">
                                                                    <div className="item-details-line">
                                                                        <span className="item-name">{getProductName(item.productId)}</span>
                                                                        <span className="item-quantity">Qty: {item.quantity}</span>
                                                                        <span className="item-price-each">@ ${(Number(item.pricePerItem) || 0).toFixed(2)}</span>
                                                                    </div>
                                                                    {item.productId?.startsWith('B') && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && (
                                                                        <div className="item-toppings-summary-user">
                                                                            ({Object.entries(item.bagelDistribution)
                                                                                .map(([id, count]) => `${getToppingName(id)} x${count}`)
                                                                                .join(', ')})
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {/* Admin Order Card Footer with Status Control */}
                                                        <div className="order-card-footer admin-footer">
                                                            <div className="order-totals">
                                                                {order.discountApplied > 0 && (
                                                                    <span className="discount-display">Discount: -${order.discountApplied.toFixed(2)}</span>
                                                                )}
                                                                <span className="total-amount">Total: ${order.totalAmount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="order-status-control">
                                                                <label htmlFor={`status-${order.orderId}`}>Status: </label>
                                                                <select
                                                                    id={`status-${order.orderId}`}
                                                                    // Use pending status for value if it exists, otherwise current status
                                                                    value={pendingStatus ?? order.status}
                                                                    // Update pending state on change
                                                                    onChange={(e) => handlePendingStatusSelect(order.orderId, e.target.value)}
                                                                    disabled={updatingStatusOrderId === order.orderId}
                                                                >
                                                                    {ORDER_STATUSES.map(status => (
                                                                        <option key={status} value={status}>{status}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    className="update-status-button"
                                                                    onClick={() => {
                                                                        const statusToSubmit = pendingStatusChanges[order.orderId];
                                                                        if (statusToSubmit) {
                                                                            handleStatusUpdateSubmit(order.orderId, statusToSubmit);
                                                                        } else {
                                                                            console.warn("Update clicked, but no pending status found for order:", order.orderId);
                                                                        }
                                                                    }}
                                                                    disabled={!statusChanged || updatingStatusOrderId === order.orderId}
                                                                >
                                                                    Update
                                                                </button>
                                                                {updatingStatusOrderId === order.orderId && <span className="status-updating-spinner"> Updating...</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                            {/* --- End Conditional Content --- */}
                        </div>
                    </>
                )}

                {/* --- Regular User View --- */}
                {!isAdmin && (
                    <>
                        {/* Profile Section */}
                        <div className="profile-section">
                            <h2>Profile Details</h2>
                            {userProfile ? (
                                <>
                                    <p><strong>Name:</strong> {userProfile.firstName} {userProfile.lastName}</p>
                                    <p><strong>Email:</strong> {userProfile.email}</p>
                                </>
                            ) : ( <p>Loading profile...</p> )}
                        </div>
                        <hr className="section-divider" />
                        {/* Order History Section */}
                        <div className="order-history-section">
                            <h2>Your Order History</h2>
                            {isLoadingMyOrders && <p>Loading orders...</p>}
                            {myOrdersError && <p className="error-message">{myOrdersError}</p>}
                            {!isLoadingMyOrders && !myOrdersError && myOrders.length === 0 && (
                                <p>You haven't placed any orders yet.</p>
                            )}
                            {!isLoadingMyOrders && !myOrdersError && myOrders.length > 0 && (
                                <div className="orders-list">
                                    {myOrders.map(order => (
                                        <div key={order.orderId} className="order-card">
                                            {/* User Order Card Header */}
                                            <div className="order-card-header">
                                                <span>Order ID: #{order.orderId}</span>
                                                <span>Date: {new Date(order.orderTimestamp).toLocaleDateString()}</span>
                                                <span>Status: {order.status}</span>
                                            </div>
                                            {/* User Order Items List */}
                                            <ul className="order-items-summary-list">
                                                {order.orderItems.map(item => (
                                                    <li key={item.orderItemId} className="order-item-summary">
                                                        <div className="item-details-line">
                                                            <span className="item-name">{getProductName(item.productId)}</span>
                                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                                            <span className="item-price-each">@ ${(Number(item.pricePerItem) || 0).toFixed(2)}</span>
                                                        </div>
                                                        {item.productId?.startsWith('B') && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && (
                                                            <div className="item-toppings-summary-user">
                                                                ({Object.entries(item.bagelDistribution)
                                                                    .map(([id, count]) => `${getToppingName(id)} x${count}`)
                                                                    .join(', ')})
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                            {/* User Order Card Footer */}
                                            <div className="order-card-footer">
                                                <div className="order-totals">
                                                    {order.discountApplied > 0 && (
                                                        <span className="discount-display">Discount: -${order.discountApplied.toFixed(2)}</span>
                                                    )}
                                                    <span className="total-amount">Total: ${order.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="user-page-actions">
                    <button onClick={() => navigate('/')} className="back-button">
                        Back to Home
                    </button>
                    {logout && <button onClick={logout} className="logout-button">Logout</button>}
                </div>
            </div>
        </div>
    );
}

export default UserPage;