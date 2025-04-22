import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/CartDropdown.css'; 

const getToppingName = (id, bagelToppings) => {
    if (bagelToppings && typeof bagelToppings === 'object') {
        const toppingsArray = Object.values(bagelToppings);
        const topping = toppingsArray.find(t => t && t.id === id);
        if (topping) {
            return topping.name;
        }
    }
    console.warn(`(Dropdown) Topping name not found for ID: ${id}`);
    return id;
};

const groupOrderItemsForDropdown = (items) => {
    const groupedNonBagels = {};
    const individualBagels = [];

    (items || []).forEach(item => {
        if (!item) return;

        if (item.productId?.startsWith('B')) {
            individualBagels.push({
                ...item,
                quantity: Number(item.quantity) || 1,
                displayKey: item.lineItemId
            });
        } else {
            const groupKey = item.productId;
            if (!groupedNonBagels[groupKey]) {
                groupedNonBagels[groupKey] = {
                    ...item,
                    quantity: 0,
                    displayKey: groupKey
                };
            }
            groupedNonBagels[groupKey].quantity += (Number(item.quantity) || 1);
        }
    });
    return [...individualBagels, ...Object.values(groupedNonBagels)];
};


const CartDropdown = ({ isOpen, orderItems, bagelToppings, onClose, onGoToCheckout, isScrolled }) => {

    if (!isOpen) {
        return null;
    }

    const displayItems = groupOrderItemsForDropdown(orderItems);

    // Prevent clicks inside the dropdown from closing it immediately
    const handleDropdownClick = (e) => {
        e.stopPropagation();
    };

    const dropdownClass = `cart-dropdown ${!isScrolled ? 'not-scrolled' : ''}`;

    return (
        <div className="cart-dropdown-overlay" onClick={onClose}> {/* Overlay for closing */}
            <div className={dropdownClass.trim()} onClick={handleDropdownClick}>
            {displayItems.length === 0 ? (
                    <p className="cart-dropdown-empty">Your cart is empty.</p>
                ) : (
                    <ul className="cart-dropdown-list">
                        {displayItems.map((item) => {
                            const isBagel = item.productId?.startsWith('B');

                            // Generate display name (simplified for dropdown)
                            let displayName = item.name || 'Unnamed Item';
                            if (isBagel) {
                                displayName = displayName.replace(/\s*\(Customized\)/i, '');
                            }

                            return (
                                <li key={item.displayKey} className="cart-dropdown-item">
                                    <span className="item-name">{displayName}</span>
                                    <span className="item-quantity">x {item.quantity}</span>
                                    {/* Optionally show price */}
                                    {/* <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span> */}

                                    {/* Optional: Show simple topping list for bagels */}
                                    {isBagel && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && (
                                        <div className="item-toppings-summary">
                                            ({Object.entries(item.bagelDistribution)
                                                .filter(([, count]) => Number(count) > 0)
                                                .map(([toppingId]) => getToppingName(toppingId, bagelToppings))
                                                .join(', ')})
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <button
                    className="cart-dropdown-checkout-btn"
                    onClick={onGoToCheckout}
                    disabled={displayItems.length === 0}
                >
                    Go to Checkout
                </button>
            </div>
        </div>
    );
};

export default CartDropdown;
