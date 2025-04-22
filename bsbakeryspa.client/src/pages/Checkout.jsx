import React from 'react'; 
import { useNavigate } from 'react-router-dom';


import '../styles/Checkout.css';

import { getToppingById } from '../data/products';

const Checkout = ({
    orderItems,
    calculateTotal, 
}) => {
    const navigate = useNavigate();

    const handleBackToMenu = () => {
        navigate('/');
        setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    const groupOrderItems = (items) => {
        return items.reduce((acc, item) => {
            let optionsKey = '';
            if (item.productId?.startsWith('B')) {
                if (item.bagelDistribution) {
                     optionsKey = Object.keys(item.bagelDistribution).sort().join('-');
                } else if (item.selectedToppingIds) {
                     optionsKey = item.selectedToppingIds.slice().sort().join('-');
                }
            }
            const groupKey = `${item.productId}-${optionsKey}`;

            if (!acc[groupKey]) {
                acc[groupKey] = { ...item, quantity: 0 };
            }
            acc[groupKey].quantity += (Number(item.quantity) || 0);

            return acc;
        }, {});
    };

    const groupedOrderItems = Object.values(groupOrderItems(orderItems || [])); 

    const getToppingName = (id) => {
        const topping = getToppingById(id);
        return topping ? topping.name : 'Unknown Topping';
    };

    const isBagelCountCorrect = (item) => {
        if (!item.productId?.startsWith('B') || !item.bagelDistribution) {
            return true; 
        }
        const expectedTotal = item.productId === 'B001' ? 6 : (item.productId === 'B002' ? 12 : 0);
         if (expectedTotal === 0) return true; 

        const currentTotal = Object.values(item.bagelDistribution).reduce((sum, count) => sum + (Number(count) || 0), 0);
        const isCorrect = currentTotal === expectedTotal;
        return isCorrect;
    };

    const canProceedToPayment = orderItems.every((item) => {
        if (item.productId?.startsWith('B')) {
            return isBagelCountCorrect(item);
        }
        return true;
    });

    const calculateDiscount = (items) => { 
        const loafItems = items.filter((item) => item.productId?.startsWith('L'));
        const loafCount = loafItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const discountPerPair = 4;
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const discount = calculateDiscount(orderItems);
    const totalAfterDiscount = subtotal - discount;


    const handleContinueShopping = () => {
        handleBackToMenu();
    };

 return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="order-summary">
                    <h2>Order Summary</h2>
                    {groupedOrderItems.length === 0 ? (
                        <p className="empty-cart-message">Your cart is empty.</p>
                    ) : (
                        <div className="order-list-container">
                            <ul>
                                {/* Map over grouped items for display */}
                                {groupedOrderItems.map(item => {
                                    const isBagel = item.productId?.startsWith('B');
                                    const itemHasError = isBagel && !isBagelCountCorrect(item);
                                    // Regenerate group key for React key prop
                                    let optionsKey = '';
                                    if (isBagel) {
                                        if (item.bagelDistribution) {
                                            optionsKey = Object.keys(item.bagelDistribution).sort().join('-');
                                        } else if (item.selectedToppingIds) {
                                            optionsKey = item.selectedToppingIds.slice().sort().join('-');
                                        }
                                    }
                                    const groupDisplayKey = `${item.productId}-${optionsKey}`;

                                    // --- Determine Display Name ---
                                    let displayName = item.name || 'Unnamed Item';
                                    if (isBagel) {
                                        // Remove "(Customized)" specifically for bagels
                                        displayName = displayName.replace(/\s*\(Customized\)/i, '');
                                    }
                                    // --- End Display Name Determination ---

                                    return (
                                        <li key={groupDisplayKey} className={`checkout-item ${itemHasError ? 'item-error' : ''}`}>
                                            <div className="item-details">
                                                {/* Use the modified displayName */}
                                                <span>{displayName} - ${(Number(item.price) || 0).toFixed(2)}</span>
                                                {/* Display bagel distribution */}
                                                {isBagel && item.bagelDistribution && (
                                                    <ul className="bagel-options-summary">
                                                        {Object.entries(item.bagelDistribution).map(([toppingId, count]) => (
                                                            <li key={toppingId}>
                                                                {count} x {getToppingName(toppingId)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                 {itemHasError && <span className="error-text"> (Incorrect topping count)</span>}
                                            </div>

                                            {/* Display Quantity Only */}
                                            <div className="quantity-display">
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                     <div className="totals-section">
                        <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
                        {discount > 0 && (
                            <h3 className="discount">Discount: -${discount.toFixed(2)}</h3>
                        )}
                        <h3>Total: ${totalAfterDiscount.toFixed(2)}</h3>
                    </div>
                </div>
                 <div className="checkout-actions">
                    <button onClick={handleContinueShopping}>Continue Shopping</button>
                    <button
                        onClick={() => navigate('/payment', { state: { orderItems: orderItems, total: totalAfterDiscount, discount: discount } })}
                        disabled={orderItems.length === 0 || !canProceedToPayment}
                    >
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;