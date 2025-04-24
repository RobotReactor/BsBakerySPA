// src/components/OrderModal/OrderModal.jsx
import React from 'react';
import { FaTimes, FaTrashAlt, FaPlus, FaMinus } from 'react-icons/fa';
import '../../styles/OrderModal.css'; // Make sure this path is correct

// The props received from HomePage (which gets cart data from useCart)
const OrderModal = ({
    isOpen,
    onClose,
    orderItems, // Should be cartItems from context, passed by HomePage
    calculateTotal, // Should be calculateTotal from context, passed by HomePage
    onAddLoaf, // Handler from HomePage
    onAddCookies, // Handler from HomePage
    onCustomizeBagels, // Handler from HomePage (starts customization state)
    onRemoveItem, // Handler from HomePage (calls context function)
    onCheckout, // Handler from HomePage
    products, // Static data from HomePage props
    bagelToppings, // Static data from HomePage props
    onUpdateQuantity, // Should be updateItemQuantity from context, passed by HomePage
    onUpdateBagelDistribution // Should be updateBagelDistribution from context, passed by HomePage
}) => {
    if (!isOpen) {
        return null;
    }

    // --- Helper Functions (Mostly Unchanged) ---

    // Calls the handler passed from HomePage to start customization
    const handleCustomizeClick = (product) => {
        if (product && onCustomizeBagels) {
            onCustomizeBagels(product);
        } else {
            console.error("OrderModal: Product or onCustomizeBagels function missing!");
        }
    };

    // Prevents clicks inside modal from closing it
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    // Gets topping name based on ID, using the passed bagelToppings prop
    const getToppingName = (id) => {
        // Ensure bagelToppings is an object before trying Object.values
        if (bagelToppings && typeof bagelToppings === 'object') {
            const toppingsArray = Object.values(bagelToppings);
            const topping = toppingsArray.find(t => t && t.id === id);
            if (topping) {
                return topping.name;
            }
        }
        console.warn(`Topping name not found for ID: ${id}`);
        return id; // Return ID as fallback
    };

    // Groups items for display (logic remains the same, relies on orderItems prop)
    const groupAndPrepareDisplayItems = (items) => {
        const groupedNonBagels = {};
        const individualBagels = [];

        // Use items || [] to safely handle potential undefined prop initially
        (items || []).forEach(item => {
            if (!item || !item.productId) return; // Basic check for valid item

            if (item.productId.startsWith('B')) {
                // Bagels are always treated individually in the modal display
                individualBagels.push({
                    ...item,
                    quantity: Number(item.quantity) || 1,
                    displayKey: item.lineItemId // Use unique lineItemId as key
                });
            } else {
                // Group non-bagels by productId
                const groupKey = item.productId;
                if (!groupedNonBagels[groupKey]) {
                    groupedNonBagels[groupKey] = {
                        ...item, // Copy properties from the first item encountered
                        quantity: 0,
                        originalLineItemIds: [], // Store original IDs if needed for updates
                        displayKey: groupKey
                    };
                }
                groupedNonBagels[groupKey].quantity += (Number(item.quantity) || 1);
                groupedNonBagels[groupKey].originalLineItemIds.push(item.lineItemId);
            }
        });
        // Combine individual bagels and grouped items for rendering
        return [...individualBagels, ...Object.values(groupedNonBagels)];
    };

    // Prepare items for display using the orderItems prop
    const displayItems = groupAndPrepareDisplayItems(orderItems);

    // Handles quantity change for grouped non-bagel items
    const handleGroupedQuantityClick = (groupedItem, change) => {
        // Ensure the update function is passed correctly
        if (!onUpdateQuantity) {
            console.error("OrderModal: onUpdateQuantity prop is missing!");
            return;
        }
        // Use the first original lineItemId to update the quantity in the context
        if (groupedItem.originalLineItemIds && groupedItem.originalLineItemIds.length > 0) {
            const targetLineItemId = groupedItem.originalLineItemIds[0];
            onUpdateQuantity(targetLineItemId, change);
        } else {
            console.error("OrderModal: Cannot update grouped quantity - originalLineItemIds missing!");
        }
    };

    // Handles changing topping counts for individual bagels
    const handleToppingChangeClick = (lineItemId, toppingId, change) => {
        // Find the specific bagel item using lineItemId
        const item = (orderItems || []).find(i => i.lineItemId === lineItemId);
        if (!item || !item.productId?.startsWith('B')) {
            console.error("Cannot update toppings: Item not found or not a bagel.", lineItemId);
            return;
        }

        // --- Validation Logic (Remains the same) ---
        const currentDistribution = item.bagelDistribution || {};
        const currentToppingCount = Number(currentDistribution[toppingId]) || 0;
        const newToppingCount = currentToppingCount + change;

        // Min 3 validation
        if (change < 0 && newToppingCount < 3 && currentToppingCount >= 3) { // Only alert when crossing the threshold
             alert('Minimum of 3 required per selected topping. Remove topping if needed.');
             console.log('Validation failed: Minimum 3 per topping.');
             return;
        }

        // Max total validation
        const expectedTotal = item.productId === 'B001' ? 6 : (item.productId === 'B002' ? 12 : 0);
        if (expectedTotal > 0) {
            const currentTotalSum = Object.values(currentDistribution).reduce((sum, count) => sum + (Number(count) || 0), 0);
            if (change > 0 && currentTotalSum >= expectedTotal) {
                alert(`Cannot exceed ${expectedTotal} total bagels. Decrease another topping first.`);
                console.log(`Validation failed: Total ${expectedTotal} already met.`);
                return;
            }
        }
        // --- End Validation ---

        // Call the update function passed from context via HomePage
        if (onUpdateBagelDistribution) {
            onUpdateBagelDistribution(lineItemId, toppingId, change);
        } else {
            console.error("OrderModal: onUpdateBagelDistribution prop is missing!");
        }
    };

    // Checks if bagel distribution count matches expected total (logic remains same)
    const isBagelDistributionCorrect = (item) => {
        if (!item.productId?.startsWith('B') || !item.bagelDistribution) {
            return true; // Not a bagel or no distribution = correct by default
        }
        const expectedTotal = item.productId === 'B001' ? 6 : (item.productId === 'B002' ? 12 : 0);
        if (expectedTotal === 0) return true; // Unknown bagel type?

        const currentTotal = Object.values(item.bagelDistribution).reduce((sum, count) => sum + (Number(count) || 0), 0);
        return currentTotal === expectedTotal;
    };

    // --- Calculate Subtotal using the function passed from context ---
    // Ensure calculateTotal is a function before calling
    const subtotal = Number(calculateTotal) || 0; 

    // --- Determine if checkout is allowed ---
    const canCheckout = (orderItems || []).length > 0 &&
                        (orderItems || []).every(item => !item.productId?.startsWith('B') || isBagelDistributionCorrect(item));


    // --- Render Logic ---
    return (
        <div className={"modal"} onClick={onClose}>
            <div className={"modal-content"} onClick={handleContentClick}>
                <FaTimes className={"modal-close-icon"} onClick={onClose} />

                {/* Left Side: Add Items (Unchanged) */}
                <div className={"modal-left"}>
                   <h2>Add Items</h2>
                   {/* Loafs */}
                   <div className={"modal-item"}>
                       <h3>Loafs</h3>
                       <ul className={"loaf-option"}>
                           <li onClick={() => onAddLoaf(products?.LOAF_REG)}>Regular (${products?.LOAF_REG?.price?.toFixed(2) || '?.??'})</li>
                           <li onClick={() => onAddLoaf(products?.LOAF_PEP_MOZZ)}>Pepperoni Mozzarella (${products?.LOAF_PEP_MOZZ?.price?.toFixed(2) || '?.??'})</li>
                           <li onClick={() => onAddLoaf(products?.LOAF_CHED_JAL)}>Cheddar Jalapeño (${products?.LOAF_CHED_JAL?.price?.toFixed(2) || '?.??'})</li>
                           <li onClick={() => onAddLoaf(products?.LOAF_CIN_APP)}>Cinnamon Apple (${products?.LOAF_CIN_APP?.price?.toFixed(2) || '?.??'})</li>
                           <li onClick={() => onAddLoaf(products?.LOAF_EVERY)}>Everything (${products?.LOAF_EVERY?.price?.toFixed(2) || '?.??'})</li>
                       </ul>
                   </div>
                   {/* Bagels */}
                   <div className={"modal-item"}>
                       <h3>Bagels</h3>
                       <ul className={"bagel-options"}>
                           <li onClick={() => handleCustomizeClick(products?.BAGEL_HALF)}>
                               Customize {products?.BAGEL_HALF?.name || 'Half Dozen'} (${products?.BAGEL_HALF?.price?.toFixed(2) || '?.??'})
                           </li>
                           <li onClick={() => handleCustomizeClick(products?.BAGEL_FULL)}>
                               Customize {products?.BAGEL_FULL?.name || 'Dozen'} (${products?.BAGEL_FULL?.price?.toFixed(2) || '?.??'})
                           </li>
                       </ul>
                   </div>
                   {/* Cookies */}
                    <div className={"modal-item"}>
                        <h3>Cookies</h3>
                        <ul className={"cookie-options"}>
                            <li onClick={() => onAddCookies(products?.COOKIE_CHOC_CHIP)}>Chocolate Chip (${products?.COOKIE_CHOC_CHIP?.price?.toFixed(2) || '?.??'} / dozen)</li>
                        </ul>
                    </div>
                </div>

                {/* Right Side: Order Summary */}
                <div className={"modal-right"}>
                     <h2>Your Current Basket</h2>
                     {/* Use displayItems derived from orderItems prop */}
                     {displayItems.length === 0 ? (
                         <p>Your basket is empty.</p>
                     ) : (
                         <>
                         <ul className={"order-list"}>
                            {displayItems.map((item) => {
                                // --- Logic for display remains mostly the same ---
                                const isBagel = item.productId?.startsWith('B');
                                const itemHasError = isBagel && !isBagelDistributionCorrect(item);
                                const expectedTotal = item.productId === 'B001' ? 6 : (item.productId === 'B002' ? 12 : 0);
                                const currentTotalSum = isBagel ? Object.values(item.bagelDistribution || {}).reduce((sum, c) => sum + (Number(c) || 0), 0) : 0;

                                const distribution = item.bagelDistribution || {};
                                const numberOfToppings = Object.keys(distribution).length;
                                const isFullDozen = item.productId === products?.BAGEL_FULL?.id;
                                // Show controls for full dozen with 2 or 3 toppings
                                const showToppingControls = isBagel && isFullDozen && (numberOfToppings === 2 || numberOfToppings === 3);

                                // Generate Display Name
                                let displayName = item.name || 'Unnamed Item';
                                if (isBagel && item.bagelDistribution && Object.keys(item.bagelDistribution).length > 0 && !showToppingControls) {
                                    const baseName = item.name.replace(/\s*\(Customized\)/i, '');
                                    const toppingsString = Object.entries(item.bagelDistribution)
                                        .filter(([toppingId, count]) => Number(count) > 0)
                                        .map(([toppingId, count]) => `${getToppingName(toppingId)} x ${count}`)
                                        .join(', ');
                                    displayName = `${baseName} (${toppingsString})`;
                                } else if (isBagel) {
                                    displayName = item.name.replace(/\s*\(Customized\)/i, '');
                                }
                                // --- End Display Name ---

                                return (
                                    <li key={item.displayKey} className={`order-item ${itemHasError ? 'item-error' : ''}`}>
                                        {/* Item Info */}
                                        <div className="item-info">
                                            {displayName} - ${item.price?.toFixed(2) || '?.??'}
                                            {isBagel && item.bagelDistribution && showToppingControls && (
                                                <ul className="bagel-options-summary-modal">
                                                    {Object.entries(item.bagelDistribution)
                                                        .map(([toppingId, count]) => (
                                                            <li key={toppingId} className="topping-line">
                                                                <span className="topping-details">
                                                                    {count} x {getToppingName(toppingId)}
                                                                </span>
                                                                <div className="topping-controls">
                                                                    <button
                                                                        onClick={() => handleToppingChangeClick(item.lineItemId, toppingId, -1)}
                                                                        disabled={count <= 3} // Use count directly
                                                                        aria-label={`Decrease ${getToppingName(toppingId)}`}
                                                                    > <FaMinus /> </button>
                                                                    <button
                                                                        onClick={() => handleToppingChangeClick(item.lineItemId, toppingId, 1)}
                                                                        disabled={expectedTotal > 0 && currentTotalSum >= expectedTotal}
                                                                        aria-label={`Increase ${getToppingName(toppingId)}`}
                                                                    > <FaPlus /> </button>
                                                                </div>
                                                            </li>
                                                    ))}
                                                    <li className={`topping-error ${!itemHasError ? 'hidden-error' : ''}`}>
                                                        {itemHasError ? `Requires ${expectedTotal} total bagels` : ''}
                                                    </li>
                                                </ul>
                                            )}
                                        </div>

                                        <div className="quantity-controls-modal">
                                            {!isBagel ? (
                                                <>
                                                    <button onClick={() => handleGroupedQuantityClick(item, -1)} disabled={item.quantity <= 0} aria-label="Decrease quantity"> <FaMinus /> </button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => handleGroupedQuantityClick(item, 1)} aria-label="Increase quantity"> <FaPlus /> </button>
                                                </>
                                            ) : (
                                                 <span className="bagel-quantity-display">Qty: {item.quantity}</span> // Bagel quantity not directly editable here
                                            )}
                                        </div>

                                        <FaTrashAlt
                                            onClick={() => {
                                                if (!onRemoveItem) {
                                                     console.error("onRemoveItem prop is missing!");
                                                     return;
                                                }
                                                if (isBagel) {
                                                    onRemoveItem({ type: 'lineItem', id: item.lineItemId });
                                                } else {

                                                    onRemoveItem({ type: 'product', id: item.productId });
                                                }
                                            }}
                                            className='remove-item-icon'
                                            aria-label={`Remove ${item.name || 'item'}`}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                             <div className={"modal-footer"}>
                                 <h3>Subtotal: ${subtotal.toFixed(2)}</h3>
                                 <button
                                     className={"checkout-button"}
                                     onClick={onCheckout}
                                     disabled={!canCheckout}
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
