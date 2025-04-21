import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaSignInAlt } from 'react-icons/fa';
import logo from '../../assets/logo.jpg'; // Adjust path as needed
import { useAuth } from "../../hooks/useAuth";

import '../../styles/Navbar.css';

// Use regular CSS class names or styles.className if using CSS Modules
const Navbar = ({  orderItemsCount }) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const { user } = useAuth();


    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50); // Adjust scroll threshold if needed
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navbarClass = `navbar ${isScrolled ? 'navbar-scrolled' : ''}`;
    const logoClass = `logo ${isScrolled ? 'logo-scrolled' : ''}`;
    const navMenuClass = `nav-menu ${isScrolled ? 'nav-menu-scrolled' : ''}`;

    return (
        <nav className={navbarClass}> {/* Use navbarClass or styles.navbar */}
            <div className="navbar-left"> {/* Use styles.navbarLeft */}
                <img src={logo} alt="B's Bakery Logo" className={logoClass} /> {/* Use logoClass or styles.logo */}
                <ul className={navMenuClass}> {/* Use navMenuClass or styles.navMenu */}
                    <li><a href="#home">Home</a></li>
                    <li><a href="#menu">Menu</a></li>
                    <li><a href="#about">About Me</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>
            <div className="navbar-right"> {/* Use styles.navbarRight */}
                {user ? (
                    <>
                        <span className="welcome-message">Welcome!</span>
                        <FaUser className="icon" id="userIcon" onClick={() => navigate('/user')} />
                    </>
                ) : (
                    <FaSignInAlt className="icon" id="faSignInIcon" onClick={() => navigate('/login')} />
                )}
                <div className="cart-icon-wrapper"> {/* Optional wrapper for positioning badge */}
                    <FaShoppingCart className="icon" id="cartIcon" onClick={() => navigate('/checkout')} /> {/* Use styles.icon */}
                    {orderItemsCount > 0 && <span className="cart-badge">{orderItemsCount}</span>} {/* Use styles.cartBadge */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
