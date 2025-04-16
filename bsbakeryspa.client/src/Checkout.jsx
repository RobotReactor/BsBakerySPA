import React from 'react';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ orderItems, calculateTotal, handleBackToMenu }) => {
    const navigate = useNavigate();

    const calculateDiscount = () => {
        const loafItems = orderItems.filter((item) => item.name.includes('Loaf'));
        const loafCount = loafItems.length;
        const discountPerPair = 4; // $4 discount for every 2 loaves
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const discount = calculateDiscount();
    const totalAfterDiscount = calculateTotal() - discount;

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <h1>Checkout</h1>
                <div className="order-summary">
                    <h2>Your Order</h2>
                    <div className="order-list-container">
                        {orderItems.length > 0 ? (
                            <ul>
                                {orderItems.map((item, index) => (
                                    <li key={index}>
                                        {item.name} - ${item.price}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-cart-message">
                                Your cart is empty. Add some delicious items to your cart!
                            </p>
                        )}
                    </div>
                    {orderItems.length > 0 && discount > 0 && (
                        <h3 className="discount">Discount: -${discount.toFixed(2)}</h3>
                    )}
                    {orderItems.length > 0 && (
                        <h3>Total: ${totalAfterDiscount.toFixed(2)}</h3>
                    )}
                </div>
                <div className="checkout-actions">
                    <button
                        onClick={() => navigate('/payment', { state: { orderItems, total: totalAfterDiscount } })}
                        disabled={orderItems.length === 0} 
                    >
                        Proceed to Payment
                    </button>
                    <button onClick={handleBackToMenu}>Back to Menu</button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;