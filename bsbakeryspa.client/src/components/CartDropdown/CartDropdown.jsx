// src/components/CartDropdown/CartDropdown.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../styles/CartDropdown.css'; // Make sure this path is correct

// Assuming getToppingById is available or imported if needed
// import { getToppingById } from '../../data/products';

const CartDropdown = ({
    isOpen,
    orderItems, // Should be cartItems from context
    bagelToppings, // Static data or from context/props
    onClose, // Function to close the dropdown
    onGoToCheckout,
    isScrolled // Keep this prop if needed for positioning adjustments
}) => {
    if (!isOpen) {
        return null; // Don't render anything if not open
    }

    // Helper to get topping name
    const getToppingName = (id) => {
        if (bagelToppings && typeof bagelToppings === 'object') {
            const toppingsArray = Object.values(bagelToppings);
            const topping = toppingsArray.find(t => t && t.id === id);
            if (topping) return topping.name;
        }
        return id; // Fallback
    };

    // Use orderItems || [] for safety
    const currentOrderItems = orderItems || [];

    // Function to stop clicks inside the dropdown from closing it
    const handleDropdownContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // --- Overlay Container ---
        // onClick on the overlay calls onClose
        <div className={`cart-dropdown-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            {/* --- Dropdown Content --- */}
            {/* Add onClick to stop propagation */}
            <div
                className={`cart-dropdown ${isScrolled ? 'scrolled' : ''}`}
                onClick={handleDropdownContentClick}
            >
                <div className="cart-dropdown-header">
                    <h3>Your Cart</h3>
                    {/* Close icon still works */}
                    <FaTimes className="close-icon" onClick={onClose} />
                </div>

                {/* Scrollable Item List Container */}
                <div className="cart-dropdown-items-list">
                    {currentOrderItems.length === 0 ? (
                        <p className="empty-cart-message">Your cart is empty.</p>
                    ) : (
                        <ul>
                            {currentOrderItems.map((item) => {
                                const isBagel = item.productId?.startsWith('B');
                                let displayName = item.name || 'Unnamed Item';
                                if (isBagel) {
                                    displayName = displayName.replace(/\s*\(Customized\)/i, '');
                                }

                                return (
                                    <li key={item.lineItemId} className="cart-dropdown-item">
                                        <div className="item-details-line">
                                            <span className="item-name">{displayName}</span>
                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                            <span className="item-price">${(Number(item.price) || 0).toFixed(2)}</span>
                                        </div>
                                        {isBagel && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && (
                                            <div className="item-toppings-summary">
                                                ({Object.entries(item.bagelDistribution)
                                                    .map(([id, count]) => `${getToppingName(id)} x${count}`)
                                                    .join(', ')})
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Fixed Footer/Button Area */}
                {currentOrderItems.length > 0 && (
                    <div className="cart-dropdown-footer">
                        <button onClick={onGoToCheckout} className="go-to-checkout-button">
                            Go to Checkout
                        </button>
                    </div>
                )}
            </div>
            {/* --- End Dropdown Content --- */}
        </div>
        // --- End Overlay Container ---
    );
};

export default CartDropdown;
