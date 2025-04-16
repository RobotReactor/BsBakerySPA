import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';


const Payment = ({ orderItems, total }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const handlePayment = () => {
        const orderNumber = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit order number
        const currentDate = new Date();
        const fulfillmentDate = new Date();
        fulfillmentDate.setDate(currentDate.getDate() + 3); // Assume 3 days for order fulfillment

        const details = {
            orderNumber,
            date: currentDate.toLocaleString(),
            fulfillmentDate: fulfillmentDate.toLocaleDateString(),
            total: total.toFixed(2),
        };

        setOrderDetails(details);
        setIsModalOpen(true); // Open the modal
    };

    const handleSavePDF = () => {
        const doc = new jsPDF();
        doc.text('Payment Confirmation', 10, 10);
        doc.text(`Order Number: ${orderDetails.orderNumber}`, 10, 20);
        doc.text(`Date: ${orderDetails.date}`, 10, 30);
        doc.text(`Fulfillment Date: ${orderDetails.fulfillmentDate}`, 10, 40);
        doc.text(`Total Paid: $${orderDetails.total}`, 10, 50);
        doc.save('order-confirmation.pdf');
    };

    return (
        <div className="payment-page">
            <div className="payment-container">
                <h1>Payment</h1>
                <div className="order-summary">
                    <h2>Order Summary</h2>
                    <ul>
                        {orderItems.map((item, index) => (
                            <li key={index}>
                                {item.name} - ${item.price}
                            </li>
                        ))}
                    </ul>
                    <h3>Total: ${total.toFixed(2)}</h3>
                </div>
                <div className="payment-actions">
                    <button onClick={handlePayment}>Confirm Payment</button>
                    <button onClick={() => navigate('/checkout')}>Back to Checkout</button>
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
                        <button onClick={handleSavePDF}>Save as PDF</button>
                        <button onClick={() => navigate('/')}>Back to Home</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;