import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { getIdToken } from 'firebase/auth';

import "../styles/PaymentPage.css"; 

const PaymentPage = () => {
    const { user } = useAuth();
    const { clearCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const { orderItems = [], total = 0, discount = 0 } = location.state || {};
    const subtotal = total + discount;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        if (!orderItems || orderItems.length === 0) {
            console.warn("Payment page accessed without order items. Redirecting.");
            navigate('/checkout');
        }
    }, [orderItems, navigate]);

    const handlePaymentAndPlaceOrder = async (event) => {
        if (event) event.preventDefault();
        if (!user) {
            setError(
                <>
                    You must be <Link to="/login">logged in</Link> to place an order.
                </>
            );
            return;
        }

        setIsLoading(true);
        setError('');
        setPaymentError('');
        setOrderSuccess(false);

        try {
            const paymentSuccessful = true;
            const paymentTransactionId = `mock_txn_${Date.now()}`;

            // Payment logic placeholder
            // Will update soon!

            if (paymentSuccessful) {
                console.log("Payment successful, creating order...");
                const token = await getIdToken(user);
                const orderData = {
                    items: orderItems.map(item => ({
                        productId: item.productId, 
                        quantity: item.quantity,
                        selectedToppingIds: item.selectedToppingIds,
                        bagelDistribution: item.bagelDistribution
                    })),
                };

                const response = await fetch('/api/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    let errorMessage = `Order saving failed (${response.status})`;
                    try {
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            const errorData = await response.json();
                            errorMessage = errorData.message || errorData.title || errorMessage;
                        } else {
                            const errorText = await response.text();
                            if (errorText) errorMessage = errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '');
                        }
                    } catch (e) { }
                    console.error("CRITICAL: Payment OK but order save failed!", errorMessage);
                    setError("Payment successful, but order save failed. Contact support.");
                    setIsLoading(false);
                    return;
                }

                const createdOrder = await response.json();
                console.log("Order placed and saved:", createdOrder);
                setOrderSuccess(true);
                clearCart();
            } else {
                setPaymentError("Payment was not successful. Please try again.");
            }

        } catch (err) {
            console.error("Payment/Order Error:", err);
            setPaymentError(err.message || "Payment failed. Please check details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="payment-page">
            <div className="payment-container">
                <h1>Payment</h1>

                <div className="order-review-section">
                    <h2>Order Review</h2>
                    <p>Items: {orderItems.length}</p>
                    <p>Subtotal: ${subtotal.toFixed(2)}</p>
                    {discount > 0 && <p className="discount-display">Discount: -${discount.toFixed(2)}</p>}
                    <h3>Total Due: ${total.toFixed(2)}</h3>
                </div>
                <hr className="section-divider" />
                {!orderSuccess && (
                    <form className="payment-form" onSubmit={handlePaymentAndPlaceOrder}>
                        <h2>Payment Details</h2>
                        <div className="payment-element-placeholder">
                            {/* Replace with actual payment element */}
                            {/* <CardElement /> */}
                            <p>(Demo Payment Element Placeholder)</p>
                        </div>

                        <div className="message-area">
                            {isLoading && <p className="loading-message">Processing payment...</p>}
                            {paymentError && <p className="error-message payment-error">{paymentError}</p>}
                            {error && <p className="error-message general-error">{error}</p>}
                        </div>

                        <div className="payment-actions">
                            <button
                                type="button" 
                                className="back-button" 
                                onClick={() => navigate('/checkout')}
                                disabled={isLoading}
                            >
                                Back to Checkout
                            </button>
                            <button
                                type="submit"
                                className="pay-button"
                                disabled={isLoading || orderSuccess || !orderItems || orderItems.length === 0}
                            >
                                {isLoading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                            </button>
                        </div>
                    </form>
                )}

                {orderSuccess && (
                    <div className="order-success-section">
                        <h2 style={{ color: 'green' }}>Payment Successful!</h2>
                        <p>Your order has been placed.</p>
                        <button onClick={() => navigate('/')} className="back-home-button">
                            Back to Home
                        </button>
                        <button className='view-orders-button' onClick={() => navigate('/user')}>View Orders</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
