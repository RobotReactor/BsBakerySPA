import React from 'react';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ orderItems, setOrderItems, calculateTotal, handleBackToMenu }) => {
    const navigate = useNavigate();

    const calculateDiscount = () => {
        const loafItems = orderItems.filter((item) => item.name.includes('Loaf'));
        const loafCount = loafItems.length;
        const discountPerPair = 4; // $4 discount for every 2 loaves
        return Math.floor(loafCount / 2) * discountPerPair;
    };

    const handleToppingChange = (itemIndex, topping, change) => {
        setOrderItems((prevOrderItems) => {
            const updatedOrderItems = [...prevOrderItems];
            const item = { ...updatedOrderItems[itemIndex], options: { ...updatedOrderItems[itemIndex].options } };

            const totalBagels = item.name.includes('Half-Dozen') ? 6 : 12;
            const currentTotal = Object.values(item.options || {}).reduce((sum, count) => sum + count, 0);

            const newCount = (item.options[topping] || 0) + change;

            if (newCount < 3) {
                alert('You must have at least 3 of each topping.');
                return prevOrderItems;
            }

            if (currentTotal - (item.options[topping] || 0) + newCount > totalBagels) {
                alert(`You cannot exceed ${totalBagels} bagels.`);
                return prevOrderItems;
            }

            item.options[topping] = newCount;
            updatedOrderItems[itemIndex] = item;

            return updatedOrderItems;
        });
    };

    const isBagelCountCorrect = (options, totalBagels) => {
        const currentTotal = Object.values(options || {}).reduce((sum, count) => sum + count, 0);
        return currentTotal === totalBagels;
    };

    const canProceedToPayment = orderItems.every((item) => {
        if (item.name.includes('Dozen') && !item.name.includes('Half-Dozen')) {
            const totalBagels = 12;
            return isBagelCountCorrect(item.options, totalBagels);
        }
        return true; // Non-bagel items don't affect validation
    });

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
                                {orderItems.map((item, index) => {
                                    const totalBagels = item.name.includes('Half-Dozen') ? 6 : 12;
                                    const isCorrect = item.options
                                        ? isBagelCountCorrect(item.options, totalBagels)
                                        : true;
                                    const toppingCount = item.options ? Object.keys(item.options).length : 0;

                                    return (
                                        <li key={index}>
                                            <div>
                                                <strong>
                                                    {item.name} - ${item.price}{' '}
                                                    {item.options &&
                                                        item.name.includes('Dozen') &&
                                                        !item.name.includes('Half-Dozen') &&
                                                        (toppingCount === 2 || toppingCount === 3) && (
                                                            isCorrect ? (
                                                                <span style={{ color: 'green' }}>✔</span>
                                                            ) : (
                                                                <span style={{ color: 'red' }}>✘</span>
                                                            )
                                                        )}
                                                </strong>
                                                {item.options && item.name.includes('Dozen') && !item.name.includes('Half-Dozen') && (
                                                    <ul className="bagel-options">
                                                        {Object.entries(item.options).map(([type, count], idx) => (
                                                            <li key={idx}>
                                                                <label>
                                                                    {type}:{' '}
                                                                    {toppingCount === 2 || toppingCount === 3 ? (
                                                                        <>
                                                                            <button
                                                                                className="subtract"
                                                                                onClick={() => handleToppingChange(index, type, -1)}
                                                                                disabled={count <= 3}
                                                                            >
                                                                                -1
                                                                            </button>
                                                                            <span>{count}</span>
                                                                            <button
                                                                                className="add"
                                                                                onClick={() => handleToppingChange(index, type, 1)}
                                                                                disabled={
                                                                                    Object.values(item.options).reduce(
                                                                                        (sum, c) => sum + c,
                                                                                        0
                                                                                    ) >= totalBagels
                                                                                }
                                                                            >
                                                                                +1
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span>{count}</span>
                                                                    )}
                                                                </label>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
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
                    <button onClick={handleBackToMenu}>Back to Menu</button>
                    <button
                        onClick={() => navigate('/payment', { state: { orderItems, total: totalAfterDiscount } })}
                        disabled={!canProceedToPayment || orderItems.length === 0}
                    >
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;