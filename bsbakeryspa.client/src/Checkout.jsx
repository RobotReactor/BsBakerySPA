import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt } from 'react-icons/fa';

const Checkout = ({ orderItems, setOrderItems, calculateTotal, handleBackToMenu }) => {
    const navigate = useNavigate();
    const [groupedOrderItems, setGroupedOrderItems] = useState([]);

    const groupOrderItems = (items) => {
        const groupedItems = [];
    
        items.forEach((item) => {
            if (item.name.includes('Bagels')) {
                groupedItems.push({ ...item });
                return;
            }
    
            const existingItem = groupedItems.find((groupedItem) => groupedItem.name === item.name);
    
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            } else {
                groupedItems.push({ ...item });
            }
        });
    
        return groupedItems;
    };

    // Function to check if the bagel count is correct
    const isBagelCountCorrect = (options, totalBagels) => {
        const currentTotal = Object.values(options || {}).reduce((sum, count) => sum + count, 0);
        return currentTotal === totalBagels;
    };

    // Group items when the component loads or when orderItems changes
    useEffect(() => {
        setGroupedOrderItems(groupOrderItems(orderItems));
    }, [orderItems]);

    const calculateDiscount = () => {
        const loafItems = groupedOrderItems.filter((item) => item.name.includes('Loaf'));
        const loafCount = loafItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const discountPerPair = 4; // $4 discount for every 2 loaves
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const canProceedToPayment = groupedOrderItems.every((item) => {
        if (item.name.includes('Dozen') && !item.name.includes('1/2')) {
            const totalBagels = 12;
            return isBagelCountCorrect(item.options, totalBagels);
        }
        return true;
    });

    const discount = calculateDiscount();
    const totalAfterDiscount = calculateTotal() - discount;

    const handleQuantityChange = (index, change) => {
        setOrderItems((prevOrderItems) => {
            const updatedOrderItems = [...prevOrderItems];
            const item = { ...updatedOrderItems[index] };

            // Update quantity
            item.quantity = (item.quantity || 1) + change;

            // Prevent quantity from going below 1
            if (item.quantity < 1) {
                updatedOrderItems.splice(index, 1);
            } else {
                updatedOrderItems[index] = item;
            }

            return updatedOrderItems;
        });
    };

    const handleRemoveItem = (index) => {
        setOrderItems((prevOrderItems) => prevOrderItems.filter((_, i) => i !== index));
    };

    const handleToppingChange = (itemId, topping, change) => {
        setOrderItems((prevOrderItems) => {
            const updatedOrderItems = prevOrderItems.map((item) => {
                if (item.id === itemId) {
                    const updatedOptions = { ...item.options };
                    const totalBagels = item.name.includes('1/2') ? 6 : 12;
                    const currentTotal = Object.values(updatedOptions).reduce((sum, count) => sum + count, 0);
    
                    const newCount = (updatedOptions[topping] || 0) + change;
    
                    if (newCount < 3) {
                        alert('You must have at least 3 of each topping.');
                        return item;
                    }
    
                    if (currentTotal - (updatedOptions[topping] || 0) + newCount > totalBagels) {
                        alert(`You cannot exceed ${totalBagels} bagels.`);
                        return item;
                    }
    
                    updatedOptions[topping] = newCount;
                    return { ...item, options: updatedOptions };
                }
                return item;
            });
    
            return updatedOrderItems;
        });
    };

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <h1>Checkout</h1>
                <div className="order-summary">
                    <h2>Your Order</h2>
                    <div className="order-list-container">
                        {groupedOrderItems.length > 0 ? (
                            <ul>
                                {groupedOrderItems.map((item, index) => (
                                    <li key={index} className="order-item">
                                        <div className="item-details">
                                            <strong>
                                                {item.name} - ${item.price} x {item.quantity || 1}{' '}
                                                {item.options &&
                                                    item.name.includes('Dozen') &&
                                                    !item.name.includes('1/2') &&
                                                    (Object.keys(item.options).length === 2 || Object.keys(item.options).length === 3) && (
                                                        isBagelCountCorrect(item.options, item.name.includes('1/2') ? 6 : 12) ? (
                                                            <span style={{ color: 'green' }}>✔</span>
                                                        ) : (
                                                            <span style={{ color: 'red' }}>✘</span>
                                                        )
                                                    )}
                                            </strong>
                                            {item.options && item.name.includes('Bagels') ? (
                                                <ul className="bagel-options">
                                                    {Object.entries(item.options).map(([type, count], idx) => (
                                                        <li key={idx}>
                                                            <label>
                                                                {type}:{' '}
                                                                {!item.name.includes('1/2') && (
                                                                    <>
                                                                        <button
                                                                            className="subtract"
                                                                            onClick={() => handleToppingChange(item.id, type, -1)} // Use item.id here
                                                                            disabled={count <= 3}
                                                                        >
                                                                            -1
                                                                        </button>
                                                                        <span>{count}</span>
                                                                        <button
                                                                            className="add"
                                                                            onClick={() => handleToppingChange(item.id, type, 1)} // Use item.id here
                                                                            disabled={
                                                                                Object.values(item.options).reduce((sum, c) => sum + c, 0) >=
                                                                                (item.name.includes('1/2') ? 6 : 12)
                                                                            }
                                                                        >
                                                                            +1
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {item.name.includes('1/2') && <span>{count}</span>}
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="quantity-remove-container">
                                                    <div className="quantity-controls">
                                                        <button
                                                            onClick={() => handleQuantityChange(index, -1)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <span>{item.quantity || 1}</span>
                                                        <button onClick={() => handleQuantityChange(index, 1)}>+</button>
                                                    </div>
                                                    <FaTrashAlt
                                                        className="remove-icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-cart-message">
                                Your cart is empty. Add some delicious items to your cart!
                            </p>
                        )}
                    </div>
                    {groupedOrderItems.length > 0 && discount > 0 && (
                        <h3 className="discount">Discount: -${discount.toFixed(2)}</h3>
                    )}
                    {groupedOrderItems.length > 0 && (
                        <h3>Total: ${totalAfterDiscount.toFixed(2)}</h3>
                    )}
                </div>
                <div className="checkout-actions">
                    <button onClick={handleBackToMenu}>Back to Menu</button>
                    <button
                        onClick={() => navigate('/payment', { state: { orderItems, total: totalAfterDiscount } })}
                        disabled={!canProceedToPayment || groupedOrderItems.length === 0}
                    >
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;