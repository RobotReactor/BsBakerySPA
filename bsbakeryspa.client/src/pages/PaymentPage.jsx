// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { getIdToken } from 'firebase/auth';

import "../styles/PaymentPage.css"; 

// --- Placeholder for Payment Integration ---
// Example: import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

    // --- Placeholder Hooks ---
    // const stripe = useStripe();
    // const elements = useElements();

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

        // --- Placeholder Check ---
        // if (!stripe || !elements) {
        //     setPaymentError("Payment gateway is not ready.");
        //     return;
        // }

        setIsLoading(true);
        setError('');
        setPaymentError('');
        setOrderSuccess(false);

        try {
            // --- Placeholder Payment Logic ---
            const paymentSuccessful = true;
            const paymentTransactionId = `mock_txn_${Date.now()}`;
            // --- End Placeholder ---

            // --- Actual Payment Provider Logic would go here ---
            // const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(...)
            // if (stripeError) { throw new Error(stripeError.message); }
            // --- End Actual Payment Logic ---

            if (paymentSuccessful) {
                console.log("Payment successful, creating order...");
                const token = await getIdToken(user);
                const orderData = {
                    items: orderItems.map(item => ({
                        productId: item.productId, // Use productId from context item
                        quantity: item.quantity,
                        selectedToppingIds: item.selectedToppingIds,
                        bagelDistribution: item.bagelDistribution
                    })),
                    // paymentTransactionId: paymentIntent.id // Example
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
                    } catch (e) { /* Ignore parsing error */ }
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
            // Differentiate between payment error and general error if possible
            setPaymentError(err.message || "Payment failed. Please check details.");
            // setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // --- Main Page Container ---
        <div className="payment-page">
            {/* --- Content Container --- */}
            <div className="payment-container">
                <h1>Payment</h1>

                {/* --- Order Review Section --- */}
                <div className="order-review-section">
                    <h2>Order Review</h2>
                    {/* Reuse Checkout summary structure if desired, or simplify */}
                    <p>Items: {orderItems.length}</p>
                    <p>Subtotal: ${subtotal.toFixed(2)}</p>
                    {discount > 0 && <p className="discount-display">Discount: -${discount.toFixed(2)}</p>}
                    <h3>Total Due: ${total.toFixed(2)}</h3>
                </div>

                <hr className="section-divider" />

                {/* --- Payment Form Section --- */}
                {/* Only show payment form if order isn't successful yet */}
                {!orderSuccess && (
                    <form className="payment-form" onSubmit={handlePaymentAndPlaceOrder}>
                        <h2>Payment Details</h2>
                        {/* --- Payment Element Placeholder --- */}
                        <div className="payment-element-placeholder">
                            {/* Replace with actual payment element */}
                            {/* <CardElement /> */}
                            <p>(Payment Form Placeholder)</p>
                        </div>
                        {/* --- End Placeholder --- */}

                        {/* --- Messages Area --- */}
                        <div className="message-area">
                            {isLoading && <p className="loading-message">Processing payment...</p>}
                            {paymentError && <p className="error-message payment-error">{paymentError}</p>}
                            {error && <p className="error-message general-error">{error}</p>}
                        </div>

                        {/* --- Submit Button --- */}
                        <div className="payment-actions">
                            <button
                                type="button" // Prevent form submission
                                className="back-button" // Style this button
                                onClick={() => navigate('/checkout')}
                                disabled={isLoading} // Disable while processing
                            >
                                Back to Checkout
                            </button>
                            <button
                                type="submit"
                                className="pay-button"
                                disabled={isLoading || orderSuccess || !orderItems || orderItems.length === 0 /* || !stripe */}
                            >
                                {isLoading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                            </button>
                        </div>
                    </form>
                )}

                {/* --- Success Message Section --- */}
                {orderSuccess && (
                    <div className="order-success-section">
                        <h2 style={{ color: 'green' }}>Payment Successful!</h2>
                        <p>Your order has been placed.</p>
                        {/* Add link to order history or back home */}
                        <button onClick={() => navigate('/')} className="back-home-button">
                            Back to Home
                        </button>
                        {/* Optionally add link to view order */}
                        {/* <button onClick={() => navigate('/user/orders')}>View Orders</button> */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
