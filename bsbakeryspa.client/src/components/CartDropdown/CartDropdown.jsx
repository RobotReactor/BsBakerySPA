import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../styles/CartDropdown.css'; 

const CartDropdown = ({
    isOpen,
    orderItems, 
    bagelToppings, 
    onClose,
    onGoToCheckout,
    isScrolled 
}) => {
    if (!isOpen) {
        return null;
    }

    const getToppingName = (id) => {
        if (bagelToppings && typeof bagelToppings === 'object') {
            const toppingsArray = Object.values(bagelToppings);
            const topping = toppingsArray.find(t => t && t.id === id);
            if (topping) return topping.name;
        }
        return id; 
    };

    const currentOrderItems = orderItems || [];

    const handleDropdownContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className={`cart-dropdown-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div
                className={`cart-dropdown ${isScrolled ? 'scrolled' : ''}`}
                onClick={handleDropdownContentClick}
            >
                <div className="cart-dropdown-header">
                    <h3>Your Cart</h3>
                    <FaTimes className="close-icon" onClick={onClose} />
                </div>

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

                {currentOrderItems.length > 0 && (
                    <div className="cart-dropdown-footer">
                        <button onClick={onGoToCheckout} className="go-to-checkout-button">
                            Go to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDropdown;
