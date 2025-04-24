import React from 'react'; // Removed useState
import { Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Import Pages
import HomePage from './pages/HomePage';
import Checkout from './pages/CheckoutPage.jsx';
import Payment from './pages/PaymentPage';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage';

import { AuthProvider } from './hooks/useAuth.jsx';
import { CartProvider } from './context/CartContext.jsx'

import { PRODUCTS, getAvailableToppings } from './data/products';

const App = () => {

    return (
        <AuthProvider>
            <CartProvider>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <HomePage
                                products={PRODUCTS} 
                                availableToppings={getAvailableToppings()} 
                            />
                        }
                    />
                    <Route
                        path="/checkout"
                        element={
                            <Checkout />
                        }
                    />
                    <Route
                        path="/payment"
                        element={
                            <Payment />
                        }
                    />
                    <Route path="/user" element={<UserPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;