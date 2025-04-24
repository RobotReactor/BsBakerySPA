import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaSignInAlt } from 'react-icons/fa';
import logo from '../../assets/logo.jpg';
import { useAuth } from "../../hooks/useAuth";

import '../../styles/Navbar.css';

const Navbar = ({ cartItemCount, className, isScrolled, onCartIconClick }) => {
    const navigate = useNavigate();
    const { user, userProfile, loadingProfile } = useAuth();

    const navbarClass = `navbar ${isScrolled ? 'navbar-scrolled' : ''} ${className || ''}`;
    const logoClass = `logo ${isScrolled ? 'logo-scrolled' : ''}`;
    const navMenuClass = `nav-menu ${isScrolled ? 'nav-menu-scrolled' : ''}`;

    const handleHomeClick = (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth' 
        });

    };

    const renderUserSection = () => {
        if (loadingProfile) {
            // Optionally show a loading indicator while profile fetches
            return <span className="welcome-message">Loading...</span>;
        }
        if (user && userProfile) {
            // User is logged in AND profile data is loaded
            return (
                <>
                    <span className="welcome-message">Welcome, {userProfile.firstName}!</span>
                    <FaUser className="icon" id="userIcon" onClick={() => navigate('/user')} />
                </>
            );
        }
        if (user && !userProfile) {

             return (
                 <>
                    <span className="welcome-message">Welcome!</span>
                    <FaUser className="icon" id="userIcon" onClick={() => navigate('/user')} />
                 </>
             );
        }
        return <FaSignInAlt className="icon" id="faSignInIcon" onClick={() => navigate('/login')} />;
    };

    return (
        <nav className={navbarClass.trim()}>
            <div className="navbar-left">
                <img src={logo} alt="B's Bakery Logo" className={logoClass} />
                <ul className={navMenuClass}>
                    <li><a href="#home" onClick={handleHomeClick}>Home</a></li>
                    <li><a href="#menu">Menu</a></li>
                </ul>
            </div>
            <div className="navbar-right">
                {renderUserSection()}

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
