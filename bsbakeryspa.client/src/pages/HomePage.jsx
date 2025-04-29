import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowDown } from 'react-icons/fa';
import Navbar from '../components/Navbar/Navbar.jsx';
import OrderModal from '../components/OrderModal/OrderModal.jsx';
import CustomizationModal from '../components/CustomizationModal/CustomizationModal.jsx';
import CartDropdown from '../components/CartDropdown/CartDropdown.jsx';

import { useCart } from '../hooks/useCart';

import { PRODUCTS, BAGEL_TOPPINGS, getAvailableToppings, getToppingById } from '../data/products';

import bagels from '../assets/Bagels.jpg';
import loafs from '../assets/Loafs.jpg';
import cookies from '../assets/Cookies.jpg';
import baked_goods from '../assets/baked_goods.jpg';

import '../styles/HomePage.css';

const HomePage = ({ products, availableToppings }) => {
    const navigate = useNavigate();

    const {
        cartItems,
        addItemToCart,
        addPrebuiltItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        updateBagelDistribution,
        calculateTotal
    } = useCart();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customizingItem, setCustomizingItem] = useState(null);
    const [selectedToppingIds, setSelectedToppingIds] = useState([]);
    const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

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
            setIsCartDropdownOpen(prev => !prev);
        } else {
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
        addItemToCart(product, 'cookie');
    };

    const addLoafToOrder = (product) => {
        addItemToCart(product, 'loaf');
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

            selectedToppingIds.forEach((toppingId) => {
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
                     bagelDistribution[lastToppingId] = (bagelDistribution[lastToppingId] || 0) + (expectedTotal - finalTotalCheck);
                     if (bagelDistribution[lastToppingId] < 0) bagelDistribution[lastToppingId] = 0;
                 }
            }
        }

        const newItem = {
            productId: customizingItem.id,
            name: `${customizingItem.name} (Customized)`,
            price: finalPrice,
            quantity: 1,
            bagelDistribution: bagelDistribution,
            selectedToppingIds: selectedToppingIds 
        };

        if (addPrebuiltItemToCart) {
             addPrebuiltItemToCart(newItem);
        } else {
             console.warn("addPrebuiltItemToCart not found in context, using addItemToCart");
             addItemToCart(newItem, 'bagel'); 
        }


        closeCustomization();
    };

    const handleRemoveItemFromOrder = (removalInfo) => {

        if (typeof removalInfo === 'object' && removalInfo.type && removalInfo.id) {
            removeItemFromCart(removalInfo);
        } else if (typeof removalInfo === 'string') {
            removeItemFromCart({ type: 'lineItem', id: removalInfo }); 
        } else {
             console.error("Invalid argument passed to handleRemoveItemFromOrder:", removalInfo);
        }
    };

    const currentCartItems = cartItems || [];
    const cartItemCount = currentCartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);

    return (
        <div>
            <Navbar
                cartItemCount={cartItemCount}
                className={isModalOpen ? 'navbar-modal-open' : ''}
                isScrolled={isScrolled}
                onCartIconClick={toggleCartDropdown}
            />

            <CartDropdown
                isOpen={isCartDropdownOpen}
                orderItems={currentCartItems}
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

            <section className="menu" id="menu">
                 <div className="menu-header">
                     <h2>In the Oven:</h2>
                     <button className="order-button" onClick={toggleModal}>Order Now</button>
                 </div>
                 <div className="menu-item">
                     <img src={bagels} alt="Bagels" className="menu-image" />
                     <div className="menu-text">
                         <h2>BAGELS</h2>
                         <p>{products?.BAGEL_HALF?.name}: ${products?.BAGEL_HALF?.price}</p>
                         <p>{products?.BAGEL_FULL?.name}: ${products?.BAGEL_FULL?.price}</p>
                         <p>Toppings (+${BAGEL_TOPPINGS?.CHEDDAR?.additionalCost || '?.??'} each, except Plain):</p>
                         <ul>
                            {(availableToppings || []).map(t => <li key={t.id}>{t.name}</li>)}
                         </ul>
                     </div>
                 </div>
                 <div className="menu-item">
                     <img src={loafs} alt="Loafs" className="menu-image" />
                     <div className="menu-text">
                         <h2>LOAFS</h2>
                         <p>{products?.LOAF_REG?.name}: ${products?.LOAF_REG?.price} (2 for $20 - discount applied at checkout)</p>
                         <p>Inclusions: ${products?.LOAF_PEP_MOZZ?.price}</p>
                         <ul>
                             <li>{products?.LOAF_PEP_MOZZ?.name}</li>
                             <li>{products?.LOAF_CHED_JAL?.name}</li>
                             <li>{products?.LOAF_CIN_APP?.name}</li>
                             <li>{products?.LOAF_EVERY?.name}</li>
                         </ul>
                     </div>
                 </div>
                 <div className="menu-item">
                     <img src={cookies} alt="Cookies" className="menu-image" />
                     <div className="menu-text">
                         <h2>COOKIES</h2>
                         <p>{products?.COOKIE_CHOC_CHIP?.name}: ${products?.COOKIE_CHOC_CHIP?.price}</p>
                     </div>
                 </div>
            </section>

            <OrderModal
                isOpen={isModalOpen}
                onClose={toggleModal}
                orderItems={currentCartItems} 
                onAddLoaf={addLoafToOrder} 
                onAddCookies={addCookiesToOrder} 
                onCustomizeBagels={startBagelCustomization} 
                onRemoveItem={handleRemoveItemFromOrder}
                onCheckout={() => {
                    toggleModal();
                    navigate('/checkout');
                }}
                products={products} 
                bagelToppings={BAGEL_TOPPINGS} 
                onUpdateQuantity={updateItemQuantity} 
                onUpdateBagelDistribution={updateBagelDistribution} 
            />

            <CustomizationModal
                isOpen={!!customizingItem}
                onClose={closeCustomization}
                itemToCustomize={customizingItem}
                selectedToppingIds={selectedToppingIds}
                onToppingChange={handleToppingChange}
                onConfirm={handleConfirmCustomization} 
                availableToppings={availableToppings} 
                maxToppings={customizingItem?.id === products?.BAGEL_HALF?.id ? 2 : 4}
                additionalCostPerTopping={BAGEL_TOPPINGS?.CHEDDAR?.additionalCost || 0} 
            />
        </div>
    );
};

export default HomePage;
