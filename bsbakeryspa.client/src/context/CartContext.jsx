// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Make sure uuid is installed (npm install uuid)

// Create the context
const CartContext = createContext();

// Create the provider component
export const CartProvider = ({ children }) => {
    // State for cart items. Load from localStorage if available.
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('bsBakeryCart');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error reading cart from localStorage:", error);
            return [];
        }
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('bsBakeryCart', JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    }, [cartItems]);

    // --- Cart Management Functions ---

    const addItemToCart = (product, type) => {
        if (!product || !product.id) {
            console.error(`Invalid product passed to addItemToCart (${type}):`, product);
            return;
        }

        // Handle simple items (Loafs, Cookies) - Check if already exists
        if (type === 'loaf' || type === 'cookie') {
            const existingItemIndex = cartItems.findIndex(item => item.productId === product.id && !item.bagelDistribution);
            if (existingItemIndex > -1) {
                updateItemQuantity(cartItems[existingItemIndex].lineItemId, 1);
            } else {
                const newItem = {
                    lineItemId: uuidv4(),
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                };
                setCartItems((prev) => [...prev, newItem]);
            }
        } else if (type === 'bagel') {
             // This adds the BASE bagel item, customization happens separately
             const bagelItem = {
                 lineItemId: uuidv4(),
                 productId: product.id,
                 name: product.name,
                 price: product.price,
                 quantity: 1,
                 bagelDistribution: {}, // Initialize empty distribution
             };
             setCartItems((prev) => [...prev, bagelItem]);
             // Consider returning the lineItemId if the caller needs it immediately
             // return bagelItem.lineItemId;
        } else {
            console.warn("Unknown item type in addItemToCart:", type);
        }
    };

    const addPrebuiltItemToCart = (itemToAdd) => {
        const newItem = {
            ...itemToAdd,
            lineItemId: uuidv4(),
            quantity: Number(itemToAdd.quantity) || 1
        };
        setCartItems(prevItems => [...prevItems, newItem]); 
    };

    const removeItemFromCart = (removalInfo) => { // Expects { type, id } or just lineItemId string
        let idToRemove = '';
        let removalType = 'lineItem'; // Default to removing specific item

        if (typeof removalInfo === 'object' && removalInfo.id) {
            idToRemove = removalInfo.id;
            removalType = removalInfo.type || 'lineItem';
        } else if (typeof removalInfo === 'string') {
            idToRemove = removalInfo; // Assume it's a lineItemId
        } else {
            console.error("Invalid argument for removeItemFromCart:", removalInfo);
            return;
        }

        console.log(`CartContext: Removing item by ${removalType}`, idToRemove);
        setCartItems(prevItems => {
            if (removalType === 'lineItem') {
                return prevItems.filter(item => item.lineItemId !== idToRemove);
            } else if (removalType === 'product') {
                // Remove all items matching a product ID (e.g., all Regular Loafs)
                return prevItems.filter(item => item.productId !== idToRemove);
            }
            return prevItems; // No change if type is unknown
        });
    };


    // Update quantity by lineItemId
    const updateItemQuantity = (lineItemId, change) => {
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.lineItemId === lineItemId) {
                    // Prevent quantity update for bagels managed by distribution
                    if (item.productId?.startsWith('B')) {
                         console.warn("Bagel quantity should be managed via distribution/type (half/full).");
                         return item;
                    }
                    const newQuantity = (Number(item.quantity) || 0) + change;
                    return { ...item, quantity: Math.max(0, newQuantity) }; // Allow quantity 0 for filtering
                }
                return item;
            });
            // Filter out items with quantity 0
            return updatedItems.filter(item => item.quantity > 0);
        });
    };

    // Update bagel distribution by lineItemId
    const updateBagelDistribution = (lineItemId, toppingId, change) => {
         setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.lineItemId === lineItemId && item.productId?.startsWith('B')) {
                    const updatedDistribution = { ...(item.bagelDistribution || {}) };
                    const currentCount = Number(updatedDistribution[toppingId]) || 0;
                    const newCount = currentCount + change;

                    if (newCount <= 0) {
                        // Remove topping if count is zero or less
                        delete updatedDistribution[toppingId];
                    } else {
                        updatedDistribution[toppingId] = newCount;
                    }
                    // Return updated item
                    return { ...item, bagelDistribution: updatedDistribution };
                }
                // Return unchanged item
                return item;
            })
        );
    };

    // Clear the entire cart
    const clearCart = () => {
        setCartItems([]);
    };

    const calculateTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
        }, 0);
    }, [cartItems]);


    // Value provided to consuming components
    const value = {
        cartItems,
        addItemToCart,
        addPrebuiltItemToCart, // <-- Export the new function
        removeItemFromCart,
        updateItemQuantity,
        updateBagelDistribution,
        clearCart,
        calculateTotal
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Export the context itself if needed elsewhere, though useCart is preferred
export default CartContext;
