// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaArrowDown, FaTrashAlt, FaTimes, FaSignInAlt } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
// Import your components if you extract them (Navbar, OrderModal, etc.)

import Navbar from '../components/NavBar/NavBar';
import OrderModal from '../components/OrderModal/OrderModal';
// import CustomizationModal from '../components/CustomizationModal';
// import MenuSection from '../components/MenuSection';
// import HomeSection from '../components/HomeSection';
import { useAuth } from "../hooks/useAuth";
import logo from '../assets/logo.jpg';
import bagels from '../assets/Bagels.jpg';
import loafs from '../assets/Loafs.jpg';
import cookies from '../assets/Cookies.jpg';
import baked_goods from '../assets/baked_goods.jpg';

import '../styles/HomePage.css';

const HomePage = ({ orderItems, setOrderItems, calculateTotal }) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customizingItem, setCustomizingItem] = useState(null);
    const [customOptions, setCustomOptions] = useState([]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (customizingItem) setCustomizingItem(null);
                else if (isModalOpen) toggleModal();
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, customizingItem]); // Add customizingItem dependency

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        document.body.style.overflow = !isModalOpen ? 'hidden' : 'auto'; // Corrected logic
    };

    // --- Add/Customize Item Functions (addCookiesToOrder, etc.) ---
    const addCookiesToOrder = (cookieType, price) => {
        const cookieItem = { id: uuidv4(), name: `Cookies (${cookieType})`, price, quantity: 1 };
        setOrderItems((prev) => [...prev, cookieItem]);
    };

    const addLoafToOrder = (loafType, price) => {
        const loafItem = { id: uuidv4(), name: `Loaf (${loafType})`, price, quantity: 1 };
        setOrderItems((prev) => [...prev, loafItem]);
    };

    // Removed addBagelsToOrder as customization handles it

    const handleOptionChange = (e, option) => {
        const maxToppings = customizingItem.name.includes('Half-Dozen') ? 2 : 4;
        const isChecked = e.target.checked;
        let nextOptions;

        if (isChecked) {
            if (customOptions.length < maxToppings) {
                nextOptions = [...customOptions, option];
            } else {
                alert(`You can only select up to ${maxToppings} toppings for ${customizingItem.name}.`);
                e.target.checked = false;
                return;
            }
        } else {
            nextOptions = customOptions.filter((opt) => opt !== option);
        }
        setCustomOptions(nextOptions);
    };

    const confirmCustomization = () => {
        if (!customizingItem) return; // Guard clause

        const requiredToppings = customizingItem.name.includes('Half-Dozen') ? 2 : 4;
        if (customOptions.length === 0 || customOptions.length > requiredToppings) {
             alert(`Please select between 1 and ${requiredToppings} toppings.`);
             return;
        }

        const basePrice = customizingItem.price;
        const additionalToppingCost = customOptions.filter(opt => opt !== 'Plain').length * 2;
        const totalPrice = basePrice + additionalToppingCost;

        const totalBagels = customizingItem.name.includes('Half-Dozen') ? 6 : 12;
        const bagelsPerOption = Math.floor(totalBagels / customOptions.length);
        const remainder = totalBagels % customOptions.length;

        const bagelDistribution = customOptions.reduce((dist, option, index) => {
            dist[option] = bagelsPerOption + (index < remainder ? 1 : 0); // Distribute remainder
            return dist;
        }, {});


        const customizedItem = {
            id: uuidv4(),
            name: customizingItem.name.includes('Half-Dozen') ? '1/2 Dozen Bagels' : 'Dozen Bagels',
            price: totalPrice,
            options: bagelDistribution,
            quantity: 1, // Add quantity
        };

        setOrderItems((prev) => [...prev, customizedItem]); // Add new item

        setCustomizingItem(null);
        setCustomOptions([]);
    };

    // --- Remove Item Function (moved from modal for clarity) ---
    const handleRemoveItemFromOrder = (itemIdToRemove) => {
        setOrderItems((prevOrderItems) =>
            prevOrderItems.filter((item) => item.id !== itemIdToRemove)
        );
    };

    return (
        <div>
            <Navbar>
                
            </Navbar>

            <section className="home" id="home">
                {/* ... (Home section JSX) ... */}
                 <div className="homeSpacer"></div>
                 <div className="heroContainer">
                     <div className="heroTitle">
                         <h1 className="heroText">Welcome to B's Bakery!</h1>
                         <h2 className="heroText">Fresh from the oven - Homemade Sourdough</h2>
                     </div>
                     <img className="bakedGoods" alt="Baked Goods Image" src={baked_goods} />
                 </div>
                 <div className="heroText" id="homeBottomText">
                     <p>Explore my menu and order to experience the taste of Sourdough goodness!</p>
                     <FaArrowDown id="arrowDownIcon" />
                 </div>
            </section>

            <section className="menu" id="menu">
                 <div className="menu-header">
                     <h2>In the Oven:</h2>
                     {/* Button now opens the Order Modal */}
                     <button className="order-button" onClick={toggleModal}>Order Now</button>
                 </div>
                 {/* ... (Menu item divs) ... */}
                 <div className="menu-item">
                     <img src={bagels} alt="Bagels" className="menu-image" />
                     <div className="menu-text">
                         <h2>BAGELS</h2>
                         <p>Plain: $12 / half-dozen | $22 / dozen</p>
                         <p>Toppings (+$2 each):</p> {/* Simplified */}
                         <ul>
                             <li>Cheddar</li>
                             <li>Asiago</li>
                             <li>Sesame</li>
                             <li>Everything</li>
                             <li>Cheddar Jalape&ntilde;o</li>
                         </ul>
                     </div>
                 </div>
                 <div className="menu-item">
                     <img src={loafs} alt="Loafs" className="menu-image" />
                     <div className="menu-text">
                         <h2>LOAFS</h2>
                         <p>Regular: $12 (2 for $20)</p>
                         <p>Inclusions: $14 </p>
                         <ul>
                             <li>Pepperoni Mozzarella</li>
                             <li>Cheddar Jalape&ntilde;o</li>
                             <li>Cinnamon Apple</li>
                             <li>Everything</li>
                         </ul>
                     </div>
                 </div>
                 <div className="menu-item">
                     <img src={cookies} alt="Cookies" className="menu-image" />
                     <div className="menu-text">
                         <h2>COOKIES</h2>
                         <p>$20 / dozen</p>
                         <ul>
                             <li>Chocolate Chip</li>
                         </ul>
                     </div>
                 </div>
            </section>

            <OrderModal
                isOpen={isModalOpen}
                onClose={toggleModal} // Pass the function to close
                orderItems={orderItems}
                calculateTotal={calculateTotal}
                onAddLoaf={addLoafToOrder} // Pass the add functions
                onAddCookies={addCookiesToOrder}
                onCustomizeBagels={setCustomizingItem} // Pass the function to open customization
                onRemoveItem={handleRemoveItemFromOrder} // Pass the remove function
                onCheckout={() => { // Combine actions for checkout button
                    toggleModal();
                    navigate('/checkout');
            }}
        />

            {/* === Customization Modal === */}
            {/* Consider extracting CustomizationModal to its own component */}
            {customizingItem && (
                <div className="customization-modal"> {/* Add overlay click to close? */}
                    <div className="customization-content">
                        <h2>Customize Your {customizingItem.name}</h2>
                        <p>
                            Select up to {customizingItem.name.includes('Half-Dozen') ? 2 : 4} toppings.
                            (+$2 for each topping that isn't Plain)
                        </p>
                        <ul className="customization-options">
                            {customizingItem.options.map((option, index) => (
                                <li key={index}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={option}
                                            onChange={(e) => handleOptionChange(e, option)}
                                            checked={customOptions.includes(option)} // Controlled component
                                        />
                                        {option}
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <button
                            className='bagel-cancel-button'
                            onClick={() => {
                                setCustomizingItem(null);
                                setCustomOptions([]); // Reset options on cancel
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className='bagel-add-button'
                            onClick={confirmCustomization}
                            disabled={customOptions.length === 0} // Disable if no options selected
                        >
                            Add to Order
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;