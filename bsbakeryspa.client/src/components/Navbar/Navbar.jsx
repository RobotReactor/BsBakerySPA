import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaSignInAlt } from 'react-icons/fa';
import logo from '../../assets/logo.jpg';
import { useAuth } from "../../hooks/useAuth";

import '../../styles/Navbar.css';

const Navbar = ({ cartItemCount, className, isScrolled, onCartIconClick }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const navbarClass = `navbar ${isScrolled ? 'navbar-scrolled' : ''} ${className || ''}`;
    const logoClass = `logo ${isScrolled ? 'logo-scrolled' : ''}`;
    const navMenuClass = `nav-menu ${isScrolled ? 'nav-menu-scrolled' : ''}`;

    return (
        <nav className={navbarClass.trim()}>
            <div className="navbar-left">
                <img src={logo} alt="B's Bakery Logo" className={logoClass} />
                <ul className={navMenuClass}>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#menu">Menu</a></li>
                    {/* Add other menu items if they exist */}
                </ul>
            </div>
            <div className="navbar-right">
                {user ? (
                    <>
                        <span className="welcome-message">Welcome!</span>
                        <FaUser className="icon" id="userIcon" onClick={() => navigate('/user')} />
                    </>
                ) : (
                    <FaSignInAlt className="icon" id="faSignInIcon" onClick={() => navigate('/login')} />
                )}
                {/* Cart Icon and Badge */}
                <div className="cart-icon-container" onClick={onCartIconClick}>
                    <FaShoppingCart className="icon" />
                    {cartItemCount > 0 && (
                        <span className="cart-badge">{cartItemCount}</span>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
