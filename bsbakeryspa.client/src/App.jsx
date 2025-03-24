import { useEffect, useState, React } from 'react';
import './App.css';
import { FaUser, FaShoppingCart } from 'react-icons/fa';
import logo from '../src/assets/logo.jpg';
import baked_goods from '../src/assets/baked_goods.jpg';


const App = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div>
            <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
                <div className="navbar-left">
                    <img src={logo} alt="B's Bakery Logo" className={`logo ${isScrolled ? 'logo-scrolled' : ''}`} />
                    <ul className={`nav-menu ${isScrolled ? 'nav-menu-scrolled' : ''}` }>
                        <li><a href="#home">Home</a></li>
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
            <section className="home" id="home">
                <div className="homeSpacer"></div>
                    <div className="heroTitle">
                        <h1 className="heroText">Welcome to B's Bakery!</h1>
                        <h2 className="heroText">Fresh from the oven - Homemade Sourdough</h2>
                    </div>
                <img className="bakedGoods" alt="Baked Goods Image" src={baked_goods} />
                <div className="heroText"><p>Explore my menu and order to experience the taste of Sourdough goodness!</p></div>
            </section>
            <div className="content">
                {/* Your content here */}
            </div>
        </div>
    );
};

export default App;