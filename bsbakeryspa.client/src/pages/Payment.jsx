// src/pages/Payment.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation

// Remove discount from props if it's always coming from location state
// Or keep it as a fallback: const Payment = ({ clearOrder, discount: propDiscount = 0 }) => {
const Payment = ({ clearOrder }) => {
    const navigate = useNavigate();
    const location = useLocation(); // Get location object

    // Access the state passed from Checkout
    // Provide default values in case state is missing (e.g., direct navigation)
    const orderDetails = location.state || { orderItems: [], total: 0, discount: 0 };
    const { orderItems, total, discount } = orderDetails; // Destructure the values

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [receiptDetails, setReceiptDetails] = useState(null);

    // Now 'total' is the totalAfterDiscount, and 'discount' is the discount amount
    const finalTotal = total; // The 'total' from state already includes the discount calculation
    const subtotal = total + discount; // Recalculate subtotal if needed for display

    const handlePaymentSuccess = () => {
        // --- Simulate Payment Processing ---
        console.log('Processing payment...');

        // --- Generate Receipt Details ---
        const generatedReceipt = {
            id: `BSR-${Date.now()}`,
            date: new Date().toLocaleString(),
            items: orderItems.map(item => ({ // Use orderItems from location state
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                options: item.options ? { ...item.options } : undefined
            })),
            subtotal: subtotal, // Use recalculated subtotal
            discountApplied: discount, // Use discount from location state
            total: finalTotal // Use finalTotal (which is 'total' from location state)
        };
        setReceiptDetails(generatedReceipt);
        setShowConfirmationModal(true);
        clearOrder();
        console.log('Payment successful! Order cleared.');
    };

    // ... (handleCancelPayment, handleCloseConfirmation, handleSaveReceipt remain similar,
    //      just ensure they use the correct variables like 'subtotal', 'discount', 'finalTotal'
    //      when generating the receipt text)

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
        receiptText += `\nSubtotal: $${receiptDetails.subtotal.toFixed(2)}\n`; // Use subtotal from receipt
        if (receiptDetails.discountApplied > 0) {
            receiptText += `Discount: -$${receiptDetails.discountApplied.toFixed(2)}\n`; // Use discount from receipt
        }
        receiptText += `Total: $${receiptDetails.total.toFixed(2)}\n`; // Use total from receipt
        receiptText += `Thank you for your order!`;

        // ... (Blob creation and download logic) ...

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

                {/* ... (Rest of Payment JSX, including actions and modal) ... */}
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
                        <p>Total Paid: ${receiptDetails.total.toFixed(2)}</p> {/* Use total from receipt */}
                        <p>Thank you for your order!</p>
                        <button onClick={() => { setShowConfirmationModal(false); setReceiptDetails(null); navigate('/'); }}>
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
