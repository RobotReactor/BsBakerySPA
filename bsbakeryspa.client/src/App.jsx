import { useEffect, useState, React } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom'; // Import Routes and Route
import { FaUser, FaShoppingCart, FaArrowDown, FaTrashAlt, FaTimes, FaSignInAlt } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library
import './App.css';
import { useAuth } from "./hooks/useAuth";
import Checkout from './Checkout';
import Payment from './Payment';
import LoginPage from './LoginPage';
import UserPage from './userPage';
import logo from '../src/assets/logo.jpg';
import bagels from '../src/assets/Bagels.jpg';
import loafs from '../src/assets/Loafs.jpg';
import cookies from '../src/assets/Cookies.jpg';
import baked_goods from '../src/assets/baked_goods.jpg';

const App = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [customizingItem, setCustomizingItem] = useState(null);
    const [customOptions, setCustomOptions] = useState([]); 
    const { user, guestSignIn, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                toggleModal();
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        document.body.style.overflow = isModalOpen ? 'auto' : 'hidden';
    };

    const handleBackToMenu = () => {
        if (isModalOpen) {
            setIsModalOpen(false);
            document.body.style.overflow = 'auto';
        }

        navigate('/');
        setTimeout(() => {
            const menuSection = document.getElementById('menu');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 0);
    };

    const handleBackToHome = () => {
        if (isModalOpen) {
            setIsModalOpen(false);
            document.body.style.overflow = 'auto';
        }

        navigate('/');
        setTimeout(() => {
            const menuSection = document.getElementById('home');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 0);
    };

    const addCookiesToOrder = (cookieType, price) => {
        const cookieItem = {
            id: uuidv4(), // Generate a unique ID
            name: `Cookies (${cookieType})`,
            price: price,
        };
    
        setOrderItems((prevOrderItems) => [...prevOrderItems, cookieItem]);
    };
    
    const addLoafToOrder = (loafType, price) => {
        const loafItem = {
            id: uuidv4(), // Generate a unique ID
            name: `Loaf (${loafType})`,
            price: price,
        };
    
        setOrderItems((prevOrderItems) => [...prevOrderItems, loafItem]);
    };

    const addBagelsToOrder = (name, price, options) => {
        const newItem = {
            id: uuidv4(), // Generate a unique ID
            name,
            price,
            options,
        };
    
        setOrderItems((prevOrderItems) => [...prevOrderItems, newItem]);
    };

    const handleOptionChange = (e, option) => {
        const maxToppings = customizingItem.name.includes('Half-Dozen') ? 2 : 4;
    
        if (e.target.checked) {
            if (customOptions.length < maxToppings) {
                setCustomOptions([...customOptions, option]);
            } else {
                alert(`You can only select up to ${maxToppings} toppings for ${customizingItem.name}.`);
                e.target.checked = false;
            }
        } else {
            setCustomOptions(customOptions.filter((opt) => opt !== option)); 
        }
    };
    
    const confirmCustomization = () => {
        if (customOptions.length === 0) {
            alert('Please select at least one topping.');
            return;
        }
    
        const basePrice = customizingItem.price; // Base price of the item
        const additionalToppingCost = customOptions.filter((opt) => opt !== 'Plain').length * 2; // $2 per non-plain topping
        const totalPrice = basePrice + additionalToppingCost;
    
        const bagelDistribution = customOptions.reduce((distribution, option, index) => {
            const count = customizingItem.name.includes('Half-Dozen') ? 6 : 12;
            const perOptionCount = Math.floor(count / customOptions.length);
            distribution[option] = perOptionCount;
            return distribution;
        }, {});
    
        const customizedItem = {
            id: uuidv4(), // Generate a unique ID
            name: customizingItem.name.includes('Half-Dozen') ? '1/2 Dozen Bagels' : 'Dozen Bagels',
            price: totalPrice,
            options: bagelDistribution,
        };
    
        setOrderItems((prevOrderItems) => {
            const updatedOrderItems = [...prevOrderItems];
    
            if (customizingItem.isEditing) {
                updatedOrderItems[customizingItem.index] = customizedItem; // Update the item
            } else {
                updatedOrderItems.push(customizedItem); // Add a new item
            }
    
            return updatedOrderItems;
        });
    
        // Reset states
        setCustomizingItem(null);
        setCustomOptions([]);
    };

    const groupOrderItems = (items) => {
        const groupedItems = [];

        items.forEach((item) => {
            if (item.name.includes('Bagels')) {
                groupedItems.push({ ...item });
                return;
            }

            const existingItem = groupedItems.find((groupedItem) => groupedItem.name === item.name);

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            } else {
                groupedItems.push({ ...item });
            }
        });

        return groupedItems;
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    };

    return (
        <Routes>
            {/* Main Page Route */}
            <Route
                path="/"
                element={
                    <div>
                        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
                            <div className="navbar-left">
                                <img src={logo} alt="B's Bakery Logo" className={`logo ${isScrolled ? 'logo-scrolled' : ''}`} />
                                <ul className={`nav-menu ${isScrolled ? 'nav-menu-scrolled' : ''}`}>
                                    <li><a href="#home">Home</a></li>
                                    <li><a href="#menu">Menu</a></li>
                                    <li><a href="#about">About Me</a></li>
                                    <li><a href="#contact">Contact</a></li>
                                </ul>
                            </div>
                            <div className="navbar-right">
                            { user ? (
                                <>
                                    <span className="welcome-message">Welcome, {user.name}!</span>
                                    <FaUser
                                            className="icon"
                                            id="userIcon"
                                            onClick={() => navigate('/user')}
                                    />
                                </>
                            ) : (
                                <FaSignInAlt
                                    className="icon"
                                    id="faSignInIcon"
                                    onClick={() => navigate('/login')} // Navigate to the User Page
                                />
                            )}
                                <FaShoppingCart className="icon" id="cartIcon" onClick={() => navigate('/checkout')} />
                            </div>
                        </nav>
                        <section className="home" id="home">
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
                                <button className="order-button" onClick={toggleModal}>Order</button>
                            </div>
                            <div className="menu-item">
                                <img src={bagels} alt="Bagels" className="menu-image" />
                                <div className="menu-text">
                                    <h2>BAGELS</h2>
                                    <p>Plain: $12 / half-dozen | $22 / dozen</p>
                                    <p>Toppings (+$2 each, 3 per topping):</p>
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
                        {isModalOpen && (
                            <div
                                className="modal"
                                onClick={(e) => {
                                    if (e.target.classList.contains('modal')) {
                                        toggleModal();
                                    }
                                }}
                            >
                                <div className="modal-content">
                                    <FaTimes
                                        className="modal-close-icon"
                                        onClick={toggleModal}
                                    />
                                    <div className="modal-left">
                                        <h2>Fill Your Basket</h2>
                                        <div className="modal-item">
                                            <h3>Loafs</h3>
                                            <p>Click on a loaf type to add it to your order:</p>
                                            <ul className="loaf-options">
                                                <li onClick={() => addLoafToOrder('Regular', 12)}>Regular ($12)</li>
                                                <li onClick={() => addLoafToOrder('Pepperoni Mozzarella', 14)}>Pepperoni Mozzarella ($14)</li>
                                                <li onClick={() => addLoafToOrder('Cheddar Jalapeño', 14)}>Cheddar Jalapeño ($14)</li>
                                                <li onClick={() => addLoafToOrder('Cinnamon Apple', 14)}>Cinnamon Apple ($14)</li>
                                                <li onClick={() => addLoafToOrder('Everything', 14)}>Everything ($14)</li>
                                            </ul>
                                        </div>
                                        <div className="modal-item">
                                            <h3>Bagels</h3>
                                            <button
                                                onClick={() =>
                                                    setCustomizingItem({
                                                        name: 'Bagels (Half-Dozen)',
                                                        price: 12,
                                                        options: ['Plain', 'Cheddar', 'Asiago', 'Sesame', 'Everything', 'Cheddar Jalapeño'],
                                                    })
                                                }
                                            >
                                                Add Half-Dozen ($12)
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setCustomizingItem({
                                                        name: 'Bagels (Dozen)',
                                                        price: 22,
                                                        options: ['Plain', 'Cheddar', 'Asiago', 'Sesame', 'Everything', 'Cheddar Jalapeño'],
                                                    })
                                                }
                                            >
                                                Add Dozen ($22)
                                            </button>
                                        </div>
                                        <div className="modal-item">
                                            <h3>Cookies</h3>
                                            <p>Click on a cookie type to add it to your order:</p>
                                            <ul className="cookie-options">
                                                <li onClick={() => addCookiesToOrder('Chocolate Chip', 20)}>Chocolate Chip ($20 / dozen)</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="modal-right">
                                        <h2>Your Order</h2>
                                        <ul className="order-list">
                                            {orderItems.flatMap((order, index) =>
                                                Array.from({ length: order.quantity || 1 }).map((_, i) => (
                                                    <li key={`${index}-${i}`} className="order-item">
                                                        <span>
                                                            {order.name} - ${order.price}
                                                        </span>
                                                        <FaTrashAlt
                                                            className="remove-icon"
                                                            onClick={() => {
                                                                // Remove one instance of the item
                                                                setOrderItems((prevOrderItems) => {
                                                                    const updatedOrderItems = [...prevOrderItems];
                                                                    if (order.quantity > 1) {
                                                                        updatedOrderItems[index].quantity -= 1;
                                                                    } else {
                                                                        updatedOrderItems.splice(index, 1);
                                                                    }
                                                                    return updatedOrderItems;
                                                                });
                                                            }}
                                                        />
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                        <div className="modal-footer">
                                            <h3>Total: ${calculateTotal()}</h3>
                                            <button
                                                className={`checkout-button ${orderItems.length === 0 ? 'disabled' : ''}`}
                                                onClick={() => navigate('/checkout')}
                                                disabled={orderItems.length === 0}
                                            >
                                                Checkout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {customizingItem && (
                            <div className="customization-modal">
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
                                                        checked={customOptions.includes(option)}
                                                    />
                                                    {option}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => {
                                            setCustomizingItem(null);
                                            setCustomOptions([]);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button onClick={confirmCustomization}>Add to Order</button>
                                </div>
                            </div>
                        )}
                    </div>
                }
            />
            {/* Checkout Route */}
            <Route
                path="/checkout"
                element={
                    <Checkout
                        orderItems={groupOrderItems(orderItems)} // Pass grouped items
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
                        total={orderItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)}
                        handleBackToHome={handleBackToHome}
                        clearOrder={() => setOrderItems([])} 
                    />
                }
            />
            <Route path="/user" element={<UserPage />} />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    );
};

export default App;