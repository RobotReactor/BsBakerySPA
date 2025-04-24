import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import '../styles/CheckoutPage.css';
import { getToppingById } from '../data/products';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, calculateTotal } = useCart();

    const handleBackToMenu = () => {
        navigate('/');
        setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    const groupOrderItems = (items) => {
        return (items || []).reduce((acc, item) => {
            if (!item || !item.productId) return acc;
            let optionsKey = '';
            if (item.productId?.startsWith('B')) {
                if (item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0) {
                     optionsKey = Object.keys(item.bagelDistribution).sort().join('-');
                } else if (item.selectedToppingIds && item.selectedToppingIds.length > 0) {
                     optionsKey = item.selectedToppingIds.slice().sort().join('-');
                }
            }
            const groupKey = `${item.productId}-${optionsKey}`;
            if (!acc[groupKey]) {
                acc[groupKey] = { ...item, quantity: 0, displayKey: groupKey + '-' + (item.lineItemId || Math.random()) };
            }
            acc[groupKey].quantity += (Number(item.quantity) || 0);
            return acc;
        }, {});
    };
    const groupedOrderItems = Object.values(groupOrderItems(cartItems));

    const getToppingName = (id) => {
        const topping = getToppingById(id);
        return topping ? topping.name : 'Unknown Topping';
    };

    const isBagelCountCorrect = (item) => {
        if (!item.productId?.startsWith('B') || !item.bagelDistribution) return true;
        const expectedTotal = item.productId === 'B001' ? 6 : (item.productId === 'B002' ? 12 : 0);
        if (expectedTotal === 0) return true;
        const currentTotal = Object.values(item.bagelDistribution).reduce((sum, count) => sum + (Number(count) || 0), 0);
        return currentTotal === expectedTotal;
    };

    const currentCartItems = cartItems || [];
    const canProceedToPayment = currentCartItems.length > 0 && currentCartItems.every((item) => {
        if (item.productId?.startsWith('B')) return isBagelCountCorrect(item);
        return true;
    });

    const calculateDiscount = (items) => {
        const currentItems = items || [];
        const loafItems = currentItems.filter((item) => item.productId?.startsWith('L'));
        const loafCount = loafItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const discountPerPair = 4;
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const subtotal = Number(calculateTotal) || 0;
    const discount = calculateDiscount(cartItems);
    const totalAfterDiscount = subtotal - discount;

    const handleContinueShopping = () => {
        handleBackToMenu();
    };


    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <h2>Order Summary</h2>
                <div className="order-list-container">
                    {groupedOrderItems.length === 0 ? (
                        <p className="empty-cart-message">Your cart is empty.</p>
                    ) : (
                        <ul>
                            {groupedOrderItems.map(item => {
                                const isBagel = item.productId?.startsWith('B');
                                const itemHasError = isBagel && !isBagelCountCorrect(item);
                                let displayName = item.name || 'Unnamed Item';
                                if (isBagel) {
                                    displayName = displayName.replace(/\s*\(Customized\)/i, '');
                                }
                                return (
                                    <li key={item.displayKey} className={`checkout-item ${itemHasError ? 'item-error' : ''}`}>
                                        <div className="item-details">
                                            <span>{displayName} - ${(Number(item.price) || 0).toFixed(2)}</span>
                                            {isBagel && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && (
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
                                        <div className="quantity-display">
                                            <span>Qty: {item.quantity}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="totals-section">
                    <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
                    {discount > 0 && (
                        <h3 className="discount">Discount: -${discount.toFixed(2)}</h3>
                    )}
                    <h3>Total: ${totalAfterDiscount.toFixed(2)}</h3>
                </div>

                <div className="checkout-actions">
                    <button onClick={handleContinueShopping}>Continue Shopping</button>
                    <button
                        onClick={() => navigate('/payment', { state: { orderItems: cartItems, total: totalAfterDiscount, discount: discount } })}
                        disabled={currentCartItems.length === 0 || !canProceedToPayment}
                    >
                        Proceed to Payment
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
