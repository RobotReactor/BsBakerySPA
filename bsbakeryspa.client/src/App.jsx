import { useEffect, useState, React } from 'react';
import './App.css';
import { FaUser, FaShoppingCart } from 'react-icons/fa';
import logo from '../src/assets/logo.jpg';


const App = () => {
    return (
        <div>
            <nav className="navbar">
                <div className="navbar-left">
                    <img src={logo} alt="B's Bakery Logo" className="logo" />
                    <ul className="nav-menu">
                        <li><a href="#menu">Menu</a></li>
                        <li><a href="#order">Order</a></li>
                        <li><a href="#contact">Contact</a></li>
                        <li><a href="#about">About Me</a></li>
                    </ul>
                </div>
                <div className="navbar-right">
                    <FaUser className="icon" id="userIcon" />
                    <FaShoppingCart className="icon" id="cartIcon" />
                </div>
            </nav>
        </div>
    );
};

export default App;