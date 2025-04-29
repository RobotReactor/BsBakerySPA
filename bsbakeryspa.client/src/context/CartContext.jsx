import React, { createContext, useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const localData = localStorage.getItem('bsBakeryCart');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error reading cart from localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('bsBakeryCart', JSON.stringify(cartItems));
        } catch (error) {
            console.error("Error saving cart to localStorage:", error);
        }
    }, [cartItems]);


    const addItemToCart = (product, type) => {
        if (!product || !product.id) {
            console.error(`Invalid product passed to addItemToCart (${type}):`, product);
            return;
        }

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

             const bagelItem = {
                 lineItemId: uuidv4(),
                 productId: product.id,
                 name: product.name,
                 price: product.price,
                 quantity: 1,
                 bagelDistribution: {}, 
             };
             setCartItems((prev) => [...prev, bagelItem]);

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

    const removeItemFromCart = (removalInfo) => { 
        let idToRemove = '';
        let removalType = 'lineItem'; 

        if (typeof removalInfo === 'object' && removalInfo.id) {
            idToRemove = removalInfo.id;
            removalType = removalInfo.type || 'lineItem';
        } else if (typeof removalInfo === 'string') {
            idToRemove = removalInfo; 
        } else {
            console.error("Invalid argument for removeItemFromCart:", removalInfo);
            return;
        }

        console.log(`CartContext: Removing item by ${removalType}`, idToRemove);
        setCartItems(prevItems => {
            if (removalType === 'lineItem') {
                return prevItems.filter(item => item.lineItemId !== idToRemove);
            } else if (removalType === 'product') {
                return prevItems.filter(item => item.productId !== idToRemove);
            }
            return prevItems; n
        });
    };

    const updateItemQuantity = (lineItemId, change) => {
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.lineItemId === lineItemId) {
                    if (item.productId?.startsWith('B')) {
                         console.warn("Bagel quantity should be managed via distribution/type (half/full).");
                         return item;
                    }
                    const newQuantity = (Number(item.quantity) || 0) + change;
                    return { ...item, quantity: Math.max(0, newQuantity) }; 
                }
                return item;
            });
            return updatedItems.filter(item => item.quantity > 0);
        });
    };

    const updateBagelDistribution = (lineItemId, toppingId, change) => {
         setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.lineItemId === lineItemId && item.productId?.startsWith('B')) {
                    const updatedDistribution = { ...(item.bagelDistribution || {}) };
                    const currentCount = Number(updatedDistribution[toppingId]) || 0;
                    const newCount = currentCount + change;

                    if (newCount <= 0) {
                        delete updatedDistribution[toppingId];
                    } else {
                        updatedDistribution[toppingId] = newCount;
                    }
                    return { ...item, bagelDistribution: updatedDistribution };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const calculateTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
        }, 0);
    }, [cartItems]);

    const value = {
        cartItems,
        addItemToCart,
        addPrebuiltItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        updateBagelDistribution,
        clearCart,
        calculateTotal
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
