// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Import Pages
import HomePage from './pages/HomePage';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';

// Import Hooks (if needed globally, otherwise manage in HomePage/Context)
// import { useAuth } from "./hooks/useAuth";

const App = () => {
    const [orderItems, setOrderItems] = useState([]);
    // const { user } = useAuth(); // Auth context likely better handled via Provider

    // Calculate total function (can be passed down or recalculated in components)
    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 1;
            return sum + price * quantity;
        }, 0);
    };

    const clearOrder = () => {
        setOrderItems([]);
    };

    const handleBackToMenu = () => {
        if (isModalOpen) toggleModal();
        navigate('/');
        setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    const handleBackToHome = () => {
        if (isModalOpen) toggleModal();
        navigate('/');
        setTimeout(() => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }), 0);
    };

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <HomePage
                        orderItems={orderItems}
                        setOrderItems={setOrderItems}
                        calculateTotal={calculateTotal}
                    />
                }
            />
            <Route
                path="/checkout"
                element={
                    <Checkout
                        orderItems={orderItems}
                        setOrderItems={setOrderItems}
                        calculateTotal={calculateTotal}
                        handleBackToMenu={handleBackToMenu}
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
                        handleBackToHome={handleBackToHome}

                    />
                }
            />
            <Route path="/user" element={<UserPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
    )
}

export default App;
