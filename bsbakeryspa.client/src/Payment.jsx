import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const Payment = ({ orderItems, total, handleBackToHome, clearOrder }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const calculateDiscount = () => {
        const loafItems = orderItems.filter((item) => item.name.includes('Loaf'));
        const loafCount = loafItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const discountPerPair = 4;
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const discount = calculateDiscount();
    const totalAfterDiscount = total - discount;

    const handlePayment = () => {
        const orderNumber = Math.floor(100000 + Math.random() * 900000); 
        const currentDate = new Date();
        const fulfillmentDate = new Date();
        fulfillmentDate.setDate(currentDate.getDate() + 3); 
    
        const details = {
            orderNumber,
            date: currentDate.toLocaleString(),
            fulfillmentDate: fulfillmentDate.toLocaleDateString(),
            total: totalAfterDiscount.toFixed(2), 
        };

        clearOrder();
    
        setOrderDetails(details);
        setIsModalOpen(true);
    };

    const handleSavePDF = () => {
        const doc = new jsPDF();
        doc.text('- Payment Confirmation -', 10, 10);
        doc.text('Thank you for your order!', 10, 30);
        doc.text('Here are your order details:', 10, 40);
        doc.text('_____________________________', 10, 50);
        doc.text(`Order Number: ${orderDetails.orderNumber}`, 10, 60);
        doc.text(`Date: ${orderDetails.date}`, 10, 70);
        doc.text(`Fulfillment Date: ${orderDetails.fulfillmentDate}`, 10, 80);
        doc.text(`Total Paid: $${orderDetails.total}`, 10, 90);
        doc.text('_____________________________', 10, 100);
        doc.save('order-confirmation.pdf');
    };

    return (
        <div className="payment-page"> 
            <div className="payment-container">
                <h1>Payment</h1>
                <div className="order-summary">
                    <h2>Your Order</h2>
                    <ul>
                        {orderItems.map((item, index) => (
                            <li key={index}>
                                {item.name} - ${item.price.toFixed(2)}
                            </li>
                        ))}

                    </ul>
                    <h3>Total: ${totalAfterDiscount.toFixed(2)}</h3>
                    <p style={{ color: 'grey', fontStyle: 'italic', fontSize: '0.9em' }}>
                        (Discount applied: -${discount.toFixed(2)})
                    </p>
                </div>
                <div className="payment-actions">
                    <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
                    <button onClick={handlePayment}>Confirm Payment</button>
                </div>
            </div>

            {isModalOpen && (
                <div className="payment-modal">
                    <div className="payment-modal-content">
                        <h2>Payment Confirmation</h2>
                        <p><strong>Order Number:</strong> {orderDetails.orderNumber}</p>
                        <p><strong>Date:</strong> {orderDetails.date}</p>
                        <p><strong>Fulfillment Date:</strong> {orderDetails.fulfillmentDate}</p>
                        <p><strong>Total Paid:</strong> ${orderDetails.total}</p>
                        <button onClick={handleBackToHome}>Back to Home</button>
                        <button id='save-receipt-button' onClick={handleSavePDF}>Save as PDF</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;