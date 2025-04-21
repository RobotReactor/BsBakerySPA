import React from 'react';
import { FaTimes, FaTrashAlt } from 'react-icons/fa';
import '../../styles/OrderModal.css';

const OrderModal = ({
    isOpen,
    onClose,
    orderItems,
    calculateTotal,
    onAddLoaf,
    onAddCookies,
    onCustomizeBagels, // Renamed for clarity
    onRemoveItem,
    onCheckout
}) => {
    if (!isOpen) {
        return null; // Don't render anything if the modal is closed
    }

    // Stop propagation for clicks inside the modal content
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Use the styles object for class names
        <div className={"modal"} onClick={onClose}> {/* Close on overlay click */}
            <div className={"modalContent"} onClick={handleContentClick}>
                <FaTimes className={"modalCloseIcon"} onClick={onClose} />

                {/* Left Side: Add Items */}
                <div className={"modalLeft"}>
                    <h2>Add Items</h2>
                    {/* Loafs */}
                    <div className={"modalItem"}>
                        <h3>Loafs</h3>
                        <ul className={"loafOptions"}>
                            {/* Call the passed-in handler functions */}
                            <li onClick={() => onAddLoaf('Regular', 12)}>Regular ($12)</li>
                            <li onClick={() => onAddLoaf('Pepperoni Mozzarella', 14)}>Pepperoni Mozzarella ($14)</li>
                            <li onClick={() => onAddLoaf('Cheddar Jalapeño', 14)}>Cheddar Jalapeño ($14)</li>
                            <li onClick={() => onAddLoaf('Cinnamon Apple', 14)}>Cinnamon Apple ($14)</li>
                            <li onClick={() => onAddLoaf('Everything', 14)}>Everything ($14)</li>
                        </ul>
                    </div>
                    {/* Bagels */}
                    <div className={"modalItem"}>
                        <h3>Bagels</h3>
                        {/* Call the passed-in handler function */}
                        <button onClick={() => onCustomizeBagels({ name: 'Bagels (Half-Dozen)', price: 12, options: ['Plain', 'Cheddar', 'Asiago', 'Sesame', 'Everything', 'Cheddar Jalapeño'] })}>
                            Customize Half-Dozen ($12)
                        </button>
                        <button onClick={() => onCustomizeBagels({ name: 'Bagels (Dozen)', price: 22, options: ['Plain', 'Cheddar', 'Asiago', 'Sesame', 'Everything', 'Cheddar Jalapeño'] })}>
                            Customize Dozen ($22)
                        </button>
                    </div>
                    {/* Cookies */}
                     <div className={"modalItem"}>
                         <h3>Cookies</h3>
                         <ul className={"cookieOptions"}>
                             {/* Call the passed-in handler function */}
                             <li onClick={() => onAddCookies('Chocolate Chip', 20)}>Chocolate Chip ($20 / dozen)</li>
                         </ul>
                     </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className={"modalRight"}>
                     <h2>Your Current Basket</h2>
                     {orderItems.length === 0 ? (
                         <p>Your basket is empty.</p>
                     ) : (
                         <>
                             <ul className={"orderList"}>
                                 {orderItems.map((item) => (
                                     <li key={item.id} className={"orderItem"}>
                                         <span>
                                             {item.name}
                                             {item.options && typeof item.options === 'object' && (
                                                ` (${Object.entries(item.options).map(([opt, count]) => `${count} ${opt}`).join(', ')})`
                                             )}
                                             - ${item.price.toFixed(2)}
                                         </span>
                                         <FaTrashAlt
                                             className={"removeIcon"}
                                             onClick={() => onRemoveItem(item.id)}
                                         />
                                     </li>
                                 ))}
                             </ul>
                             <div className={"modalFooter"}>
                                 <h3>Subtotal: ${calculateTotal().toFixed(2)}</h3>
                                 <button
                                     className={"modalCheckoutButton"}
                                     onClick={onCheckout}
                                 >
                                     Go to Checkout
                                 </button>
                             </div>
                         </>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default OrderModal;
