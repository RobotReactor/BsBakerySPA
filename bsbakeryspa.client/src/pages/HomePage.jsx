// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowDown } from 'react-icons/fa'; 
import { v4 as uuidv4 } from 'uuid';

import Navbar from '../components/NavBar/NavBar';
import OrderModal from '../components/OrderModal/OrderModal';
import CustomizationModal from '../components/CustomizationModal/CustomizationModal';
import CartDropdown from '../components/CartDropdown/CartDropdown';


import { PRODUCTS, BAGEL_TOPPINGS, getAvailableToppings, getToppingById } from '../data/products';

import bagels from '../assets/Bagels.jpg';
import loafs from '../assets/Loafs.jpg';
import cookies from '../assets/Cookies.jpg';
import baked_goods from '../assets/baked_goods.jpg';

import '../styles/HomePage.css';

const HomePage = ({ orderItems, setOrderItems, calculateTotal, onUpdateQuantity, onUpdateBagelDistribution }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customizingItem, setCustomizingItem] = useState(null); 
    const [selectedToppingIds, setSelectedToppingIds] = useState([]); 
    const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 0;
            setIsScrolled(scrolled);

            if (isCartDropdownOpen) {
                setIsCartDropdownOpen(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (customizingItem) {
                    closeCustomization();
                } else if (isModalOpen) {
                    toggleModal();
                } else if (isCartDropdownOpen) {
                    setIsCartDropdownOpen(false);
                }
            }
        };

        if (isModalOpen && isCartDropdownOpen) {
            setIsCartDropdownOpen(false);
        }

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, customizingItem, isCartDropdownOpen]);

    const [isScrolled, setIsScrolled] = useState(false); 

    const toggleModal = () => {
        const opening = !isModalOpen;
        setIsModalOpen(opening);
        if (opening) {
            setIsCartDropdownOpen(false);
        }
        document.body.style.overflow = opening ? 'hidden' : 'auto';
    };

    const toggleCartDropdown = () => {
        if (!isModalOpen) {
            setIsCartDropdownOpen(prev => {
                return !prev;
            });
        } else {
            // Log if the modal is blocking the dropdown
            console.log('[DEBUG] OrderModal is open, preventing cart dropdown toggle.');
        }
    };

    const closeCartDropdown = () => {
        setIsCartDropdownOpen(false);
    };

    const handleGoToCheckout = () => {
        closeCartDropdown();
        navigate('/checkout');
    };

    const addCookiesToOrder = (product) => {
        if (!product || !product.id) {
            console.error("Invalid product passed to addCookiesToOrder:", product);
            return;
        }
        const cookieItem = {
            lineItemId: uuidv4(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        };
        setOrderItems((prev) => [...prev, cookieItem]);
    };
    
    const addLoafToOrder = (product) => {
        if (!product || !product.id) {
            console.error("Invalid product passed to addLoafToOrder:", product);
            return;
        }
        const loafItem = {
            lineItemId: uuidv4(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        };
        setOrderItems((prev) => [...prev, loafItem]);
    };

    const startBagelCustomization = (baseBagelProduct) => {
        setCustomizingItem(baseBagelProduct);
        setSelectedToppingIds([]);
    };

    const closeCustomization = () => {
        setCustomizingItem(null);
        setSelectedToppingIds([]);
    };

    const handleToppingChange = (e, toppingId) => {
        // Logic remains the same...
        const maxToppings = customizingItem.id === PRODUCTS.BAGEL_HALF.id ? 2 : 4;
        const isChecked = e.target.checked;
        let nextSelectedIds;

        if (isChecked) {
            if (selectedToppingIds.length < maxToppings) {
                nextSelectedIds = [...selectedToppingIds, toppingId];
            } else {
                alert(`You can only select up to ${maxToppings} toppings for ${customizingItem.name}.`);
                e.target.checked = false;
                return;
            }
        } else {
            nextSelectedIds = selectedToppingIds.filter((id) => id !== toppingId);
        }
        setSelectedToppingIds(nextSelectedIds);
    };

    const handleConfirmCustomization = () => {
        if (!customizingItem) return;
    
        const basePrice = customizingItem.price;
        let toppingsCost = 0;
        const currentAvailableToppings = getAvailableToppings();
        const selectedToppings = currentAvailableToppings.filter(t =>
            selectedToppingIds.includes(t.id)
        );
        selectedToppings.forEach(topping => {
            toppingsCost += topping.additionalCost || 0;
        });
        const finalPrice = basePrice + toppingsCost;
    
        const bagelDistribution = {};
        const expectedTotal = customizingItem.id === PRODUCTS.BAGEL_HALF.id ? 6 : 12;
        const numSelectedToppings = selectedToppingIds.length;
    
        if (numSelectedToppings > 0) {
            const baseCount = Math.floor(expectedTotal / numSelectedToppings);
            let remainder = expectedTotal % numSelectedToppings;
    
            selectedToppingIds.forEach((toppingId, index) => {
                let count = baseCount;

                if (remainder > 0) {
                    count += 1;
                    remainder -= 1;
                }

                bagelDistribution[toppingId] = count;
            });

            const finalTotalCheck = Object.values(bagelDistribution).reduce((sum, count) => sum + count, 0);
            if (finalTotalCheck !== expectedTotal) {
                 console.warn("Initial bagel distribution calculation mismatch. Total:", finalTotalCheck, "Expected:", expectedTotal, bagelDistribution);
                 if (selectedToppingIds.length > 0) {
                     const lastToppingId = selectedToppingIds[selectedToppingIds.length - 1];
                     bagelDistribution[lastToppingId] += (expectedTotal - finalTotalCheck);
                     if (bagelDistribution[lastToppingId] < 0) bagelDistribution[lastToppingId] = 0;
                 }
            }
        } 
    
        const newItem = {
            productId: customizingItem.id,
            lineItemId: uuidv4(),
            name: `${customizingItem.name} (Customized)`,
            price: finalPrice,
            quantity: 1,
            bagelDistribution: bagelDistribution,
        };
    
        setOrderItems(prevItems => [...prevItems, newItem]);
    
        closeCustomization();
    };
    
    const handleRemoveItemFromOrder = (removalInfo) => {
        if (!removalInfo || !removalInfo.type || !removalInfo.id) {
            console.error("Invalid removal info received:", removalInfo);
            return;
        }
    
        setOrderItems((prevOrderItems) => {
            if (removalInfo.type === 'lineItem') {
                console.log(`Removing single item with lineItemId: ${removalInfo.id}`);
                return prevOrderItems.filter((item) => item.lineItemId !== removalInfo.id);
            } else if (removalInfo.type === 'product') {
                console.log(`Removing all items with productId: ${removalInfo.id}`);
                return prevOrderItems.filter((item) => item.productId !== removalInfo.id);
            } else {
                console.error("Unknown removal type:", removalInfo.type);
                return prevOrderItems;
            }
        });
    };

    return (
        <div>
            <Navbar
                cartItemCount={orderItems.length}
                className={isModalOpen ? 'navbar-modal-open' : ''}
                isScrolled={isScrolled} 
                onCartIconClick={toggleCartDropdown} 
            />

            <CartDropdown
                isOpen={isCartDropdownOpen}
                orderItems={orderItems}
                bagelToppings={BAGEL_TOPPINGS}
                onClose={closeCartDropdown} 
                onGoToCheckout={handleGoToCheckout}                 
                isScrolled={isScrolled} 
            />

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
                     <a href="#menu" style={{ color: 'inherit', textDecoration: 'none' }}>
                        <FaArrowDown id="arrowDownIcon" />
                     </a>
                 </div>
            </section>

            {/* --- Menu Section --- */}
            <section className="menu" id="menu">
                 <div className="menu-header">
                     <h2>In the Oven:</h2>
                     <button className="order-button" onClick={toggleModal}>Order Now</button>
                 </div>
                 {/* Bagels */}
                 <div className="menu-item">
                     <img src={bagels} alt="Bagels" className="menu-image" />
                     <div className="menu-text">
                         <h2>BAGELS</h2>
                         <p>{PRODUCTS.BAGEL_HALF.name}: ${PRODUCTS.BAGEL_HALF.price}</p>
                         <p>{PRODUCTS.BAGEL_FULL.name}: ${PRODUCTS.BAGEL_FULL.price}</p>
                         <p>Toppings (+${BAGEL_TOPPINGS.CHEDDAR.additionalCost} each, except Plain):</p>
                         <ul>
                            {getAvailableToppings().map(t => <li key={t.id}>{t.name}</li>)}
                         </ul>
                     </div>
                 </div>
                 {/* Loafs */}
                 <div className="menu-item">
                     <img src={loafs} alt="Loafs" className="menu-image" />
                     <div className="menu-text">
                         <h2>LOAFS</h2>
                         <p>{PRODUCTS.LOAF_REG.name}: ${PRODUCTS.LOAF_REG.price} (2 for $20 - discount applied at checkout)</p>
                         <p>Inclusions: ${PRODUCTS.LOAF_PEP_MOZZ.price}</p>
                         <ul>
                             <li>{PRODUCTS.LOAF_PEP_MOZZ.name}</li>
                             <li>{PRODUCTS.LOAF_CHED_JAL.name}</li>
                             <li>{PRODUCTS.LOAF_CIN_APP.name}</li>
                             <li>{PRODUCTS.LOAF_EVERY.name}</li>
                         </ul>
                     </div>
                 </div>
                 {/* Cookies */}
                 <div className="menu-item">
                     <img src={cookies} alt="Cookies" className="menu-image" />
                     <div className="menu-text">
                         <h2>COOKIES</h2>
                         <p>{PRODUCTS.COOKIE_CHOC_CHIP.name}: ${PRODUCTS.COOKIE_CHOC_CHIP.price}</p>
                         {/* Add more cookie types if needed */}
                     </div>
                 </div>
            </section>

            {/* --- Order Modal --- */}
            <OrderModal
                isOpen={isModalOpen}
                onClose={toggleModal}
                orderItems={orderItems}
                calculateTotal={calculateTotal}
                onAddLoaf={addLoafToOrder}
                onAddCookies={addCookiesToOrder}
                onCustomizeBagels={startBagelCustomization}
                onRemoveItem={handleRemoveItemFromOrder}
                onCheckout={() => {
                    toggleModal();
                    navigate('/checkout');
                }}
                products={PRODUCTS}
                bagelToppings={BAGEL_TOPPINGS}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateBagelDistribution={onUpdateBagelDistribution}
            />
            {/* --- Customization Modal --- */}
            <CustomizationModal
                isOpen={!!customizingItem}
                onClose={closeCustomization}
                itemToCustomize={customizingItem}
                selectedToppingIds={selectedToppingIds}
                onToppingChange={handleToppingChange}
                onConfirm={handleConfirmCustomization}
                availableToppings={getAvailableToppings()}
                maxToppings={customizingItem?.id === PRODUCTS.BAGEL_HALF.id ? 2 : 4}
                additionalCostPerTopping={BAGEL_TOPPINGS.CHEDDAR.additionalCost} 
            />
        </div>
    );
};

export default HomePage;

