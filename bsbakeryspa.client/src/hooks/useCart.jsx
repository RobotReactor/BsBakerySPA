import { useContext } from 'react';
import CartContext from '../context/CartContext'; // Adjust path if needed

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};