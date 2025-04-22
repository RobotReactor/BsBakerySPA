// src/pages/Payment.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import '../styles/Payment.css';

const Payment = ({ clearOrder }) => {
    const navigate = useNavigate();
    const location = useLocation(); 

    const orderDetails = location.state || { orderItems: [], total: 0, discount: 0 };
    const { orderItems, total, discount } = orderDetails;

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [receiptDetails, setReceiptDetails] = useState(null);

 
    const finalTotal = total; 
    const subtotal = total + discount; 

    const handleBackToHome = () => {
        if (isModalOpen) toggleModal();
        navigate('/');
        setTimeout(() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    const handlePaymentSuccess = () => {
        console.log('Processing payment...');

        const generatedReceipt = {
            id: `BSR-${Date.now()}`,
            date: new Date().toLocaleString(),
            items: orderItems.map(item => ({ 
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                options: item.options ? { ...item.options } : undefined
            })),
            subtotal: subtotal, 
            discountApplied: discount,
            total: finalTotal 
        };
        setReceiptDetails(generatedReceipt);
        setShowConfirmationModal(true);
        clearOrder();
        console.log('Payment successful! Order cleared.');
    };

    const handleSaveReceipt = () => {
        if (!receiptDetails) return;

        let receiptText = `B's Bakery Receipt\n`;
        receiptText += `Order ID: ${receiptDetails.id}\n`;
        receiptText += `Date: ${receiptDetails.date}\n\n`;
        receiptText += `Items:\n`;
        receiptDetails.items.forEach(item => {
            receiptText += `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
            if (item.options) {
                receiptText += `  Options: ${Object.entries(item.options).map(([opt, count]) => `${count} ${opt}`).join(', ')}\n`;
            }
        });
        receiptText += `\nSubtotal: $${receiptDetails.subtotal.toFixed(2)}\n`;
        if (receiptDetails.discountApplied > 0) {
            receiptText += `Discount: -$${receiptDetails.discountApplied.toFixed(2)}\n`; 
        }
        receiptText += `Total: $${receiptDetails.total.toFixed(2)}\n`;
        receiptText += `Thank you for your order!`;


        console.log("Receipt saved.");
    };


    return (
        <div className="payment-page">
            <div className="payment-container">
                <h1>Confirm Payment</h1>
                <p>Review your order and proceed to payment.</p>

                {/* Display Subtotal */}
                <h3>Subtotal: ${subtotal.toFixed(2)}</h3>

                {/* Display Discount if applicable */}
                {discount > 0 && (
                    <p style={{ fontStyle: 'italic', fontSize: '0.9em', color: '#555', margin: '5px 0' }}>
                        Discount: -${discount.toFixed(2)}
                    </p>
                )}

                {/* Display Final Total */}
                <h3>Total Amount: ${finalTotal.toFixed(2)}</h3>

                 <div className="payment-actions">
                    <button onClick={() => navigate('/checkout')}>Back to Cart</button>
                    <button onClick={handlePaymentSuccess} disabled={orderItems.length === 0}>
                        Pay Now
                    </button>
                </div>
            </div>

             {/* Confirmation Modal */}
             {showConfirmationModal && receiptDetails && (
                <div className="payment-modal">
                    <div className="payment-modal-content">
                        <h2>Payment Successful!</h2>
                        <p>Your Order ID: {receiptDetails.id}</p>
                        <p>Total Paid: ${receiptDetails.total.toFixed(2)}</p>
                        <p>Thank you for your order!</p>
                        <button onClick={() => { setShowConfirmationModal(false); setReceiptDetails(null); handleBackToHome(); }}>
                            Back to Home
                        </button>
                        <button id="save-receipt-button" onClick={handleSaveReceipt}>
                            Save Receipt (.txt)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
