import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { PRODUCTS, getAvailableToppings } from './data/products';
import { v4 as uuidv4 } from 'uuid';
import './styles/App.css';

// Import Pages
import HomePage from './pages/HomePage';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';

const App = () => {
    const [orderItems, setOrderItems] = useState([]);

    const handleRemoveItem = (lineItemIdToRemove) => {
        console.log("App: Removing item", lineItemIdToRemove); // Add log for debugging
        setOrderItems(prevItems => prevItems.filter(item => item.lineItemId !== lineItemIdToRemove));
    };

    const calculateTotal = () => {
         return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const addCookiesToOrder = (product) => {
        if (!product || !product.id) {
           console.error("Invalid product passed to addCookiesToOrder:", product);
           return;
       }
       const existingItemIndex = orderItems.findIndex(item => item.productId === product.id && !item.toppings);

       if (existingItemIndex > -1) {
           setOrderItems(prevItems => prevItems.map((item, index) =>
               index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
           ));
       } else {
           const cookieItem = {
               lineItemId: uuidv4(),
               productId: product.id,
               name: product.name,
               price: product.price,
               quantity: 1
           };
           setOrderItems((prev) => [...prev, cookieItem]);
       }
   };

     const addLoafToOrder = (product) => {
         if (!product || !product.id) {
            console.error("Invalid product passed to addLoafToOrder:", product);
            return;
        }
         const existingItemIndex = orderItems.findIndex(item => item.productId === product.id && !item.toppings);
         if (existingItemIndex > -1) {
             setOrderItems(prevItems => prevItems.map((item, index) =>
                 index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
             ));
         } else {
             const loafItem = {
                 lineItemId: uuidv4(),
                 productId: product.id,
                 name: product.name,
                 price: product.price,
                 quantity: 1
             };
             setOrderItems((prev) => [...prev, loafItem]);
         }
     };
    
     
    const handleUpdateQuantity = (lineItemId, change) => {
        setOrderItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.lineItemId === lineItemId) {
                    const newQuantity = (Number(item.quantity) || 0) + change;

                    return { ...item, quantity: Math.max(0, newQuantity) };
                }
                return item; 
            });

            return updatedItems.filter(item => item.quantity > 0);
        });
    };

    const handleUpdateBagelDistribution = (lineItemId, toppingId, change) => {
        setOrderItems(prevItems => {
            return prevItems.map(item => {
                if (item.lineItemId === lineItemId && item.productId?.startsWith('B')) {
                    const updatedDistribution = { ...(item.bagelDistribution || {}) };
                    const currentCount = Number(updatedDistribution[toppingId]) || 0;
                    const newCount = currentCount + change;

                    if (newCount < 0) return item;

                    updatedDistribution[toppingId] = newCount;
                    return { ...item, bagelDistribution: updatedDistribution };
                }
                return item;
            });
        });
    };

    const clearOrder = () => {
        setOrderItems([]);
    };

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <HomePage
                            orderItems={orderItems}
                            calculateTotal={calculateTotal}
                            onRemoveItem={handleRemoveItem}
                            addCookiesToOrder={addCookiesToOrder}
                            addLoafToOrder={addLoafToOrder}
                            products={PRODUCTS}
                            availableToppings={getAvailableToppings()}
                            setOrderItems={setOrderItems}
                            onUpdateQuantity={handleUpdateQuantity}
                            onUpdateBagelDistribution={handleUpdateBagelDistribution}
                        />
                }
            />
            <Route
                path="/checkout"
                element={
                    <Checkout
                        orderItems={orderItems}
                        onRemoveItem={handleRemoveItem}
                        calculateTotal={calculateTotal}
                        setOrderItems={setOrderItems}
                    />
                }
            />
            <Route
                path="/payment"
                element={
                    <Payment
                        orderItems={orderItems} 
                        total={calculateTotal()}
                        clearOrder={clearOrder}
                    />
                }
            />
            <Route path="/user" element={<UserPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
    );
}

export default App;