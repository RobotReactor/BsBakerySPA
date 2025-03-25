import { useEffect, useState, React } from 'react';
import './App.css';
import { FaUser, FaShoppingCart, FaArrowDown } from 'react-icons/fa';
import logo from '../src/assets/logo.jpg';
import bagels from '../src/assets/Bagels.jpg';
import loafs from '../src/assets/Loafs.jpg';
import cookies from '../src/assets/Cookies.jpg';
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
                <div className="heroContainer">
                    <div className="heroTitle">
                        <h1 className="heroText">Welcome to B's Bakery!</h1>
                        <h2 className="heroText">Fresh from the oven - Homemade Sourdough</h2>
                    </div>
                    <img className="bakedGoods" alt="Baked Goods Image" src={baked_goods} />
                </div>
                <div className="heroText" id="homeBottomText"><p>Explore my menu and order to experience the taste of Sourdough goodness!</p><FaArrowDown id="arrowDownIcon" /></div>
            </section>
            <section className="menu" id="menu">
                <div className="menu-item">
                    <img src={bagels} alt="Bagels" className="menu-image" />
                    <div className="menu-text">
                        <h2>BAGELS</h2>
                        <p>$22 / dozen | $12 / half-dozen (plain)</p>
                        <p>+ $2 per topping (4 ea. topping - max 3 types)</p>
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
                        <p>$12 Regular (2 for $20) | $16 Inclusions</p>
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
        </div>
    );
};

export default App;