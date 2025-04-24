// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowDown } from 'react-icons/fa';
// Removed uuidv4 import as item creation should be handled by the context now
// import { v4 as uuidv4 } from 'uuid';

import Navbar from '../components/NavBar/NavBar';
import OrderModal from '../components/OrderModal/OrderModal';
import CustomizationModal from '../components/CustomizationModal/CustomizationModal';
import CartDropdown from '../components/CartDropdown/CartDropdown';

// --- Import the useCart hook ---
import { useCart } from '../hooks/useCart';

// Keep product data imports if needed for display or passing to modals
import { PRODUCTS, BAGEL_TOPPINGS, getAvailableToppings, getToppingById } from '../data/products';

// Keep asset imports
import bagels from '../assets/Bagels.jpg';
import loafs from '../assets/Loafs.jpg';
import cookies from '../assets/Cookies.jpg';
import baked_goods from '../assets/baked_goods.jpg';

import '../styles/HomePage.css';

// --- Remove cart-related props ---
const HomePage = ({ products, availableToppings }) => { // Keep products/toppings props if needed for display
    const navigate = useNavigate();
    // --- Get cart state and functions from the useCart hook ---
    const {
        cartItems,
        addItemToCart,
        addPrebuiltItemToCart, // Assuming this exists in your context for customized items
        removeItemFromCart,
        updateItemQuantity,
        updateBagelDistribution,
        calculateTotal
    } = useCart();

    // Local state for UI elements remains the same
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customizingItem, setCustomizingItem] = useState(null);
    const [selectedToppingIds, setSelectedToppingIds] = useState([]);
    const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // useEffect remains the same
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


    // UI state functions remain the same
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

    // --- Update handlers to use context functions ---
    const addCookiesToOrder = (product) => {
        // Use addItemToCart from context
        addItemToCart(product, 'cookie');
    };

    const addLoafToOrder = (product) => {
        // Use addItemToCart from context
        addItemToCart(product, 'loaf');
    };

    // This function only sets local state for the customization modal
    const startBagelCustomization = (baseBagelProduct) => {
        setCustomizingItem(baseBagelProduct);
        setSelectedToppingIds([]);
    };

    // This function only resets local state
    const closeCustomization = () => {
        setCustomizingItem(null);
        setSelectedToppingIds([]);
    };

    // handleToppingChange remains the same as it modifies local state for the modal
    const handleToppingChange = (e, toppingId) => {
        const maxToppings = customizingItem.id === PRODUCTS.BAGEL_HALF.id ? 2 : 4;
        const isChecked = e.target.checked;
        let nextSelectedIds;

        if (isChecked) {
            if (selectedToppingIds.length < maxToppings) {
                nextSelectedIds = [...selectedToppingIds, toppingId];
            } else {
                alert(`You can only select up to ${maxToppings} toppings for ${customizingItem.name}.`);
                e.target.checked = false; // Prevent checking
                return;
            }
        } else {
            nextSelectedIds = selectedToppingIds.filter((id) => id !== toppingId);
        }
        setSelectedToppingIds(nextSelectedIds);
    };

    // handleConfirmCustomization now uses addPrebuiltItemToCart from context
    const handleConfirmCustomization = () => {
        if (!customizingItem) return;

        // --- Logic to calculate price, distribution etc. remains the same ---
        const basePrice = customizingItem.price;
        let toppingsCost = 0;
        const currentAvailableToppings = getAvailableToppings(); // Use prop if passed, otherwise import
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

            // Correction logic for distribution remains the same
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

        // Create the new item object
        const newItem = {
            productId: customizingItem.id,
            // lineItemId will be generated by the context function
            name: `${customizingItem.name} (Customized)`,
            price: finalPrice,
            quantity: 1, // Always 1 for customized bagels added this way
            bagelDistribution: bagelDistribution,
            selectedToppingIds: selectedToppingIds // Include selected toppings if needed later
        };

        // Use the context function to add the fully built item
        // Ensure addPrebuiltItemToCart exists in your CartContext
        if (addPrebuiltItemToCart) {
             addPrebuiltItemToCart(newItem);
        } else {
             // Fallback or alternative if addPrebuiltItemToCart isn't defined
             console.warn("addPrebuiltItemToCart not found in context, using addItemToCart");
             addItemToCart(newItem, 'bagel'); // May need adjustments in addItemToCart
        }


        closeCustomization();
    };

    // handleRemoveItemFromOrder now uses removeItemFromCart from context
    const handleRemoveItemFromOrder = (removalInfo) => {
        // The context function removeItemFromCart expects an object { type, id }
        // or just the lineItemId, depending on how you defined it.
        // Adjust the call if necessary based on your CartContext implementation.
        if (typeof removalInfo === 'object' && removalInfo.type && removalInfo.id) {
            removeItemFromCart(removalInfo); // Pass the object { type, id }
        } else if (typeof removalInfo === 'string') {
            removeItemFromCart({ type: 'lineItem', id: removalInfo }); // Assume it's a lineItemId string
        } else {
             console.error("Invalid argument passed to handleRemoveItemFromOrder:", removalInfo);
        }
    };

    // --- Calculate cartItemCount for Navbar using cartItems from context ---
    // Ensure cartItems is always an array, even if initially null/undefined from context
    const currentCartItems = cartItems || [];
    const cartItemCount = currentCartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);

    return (
        <div>
            {/* Pass cartItemCount derived from context state */}
            <Navbar
                cartItemCount={cartItemCount}
                className={isModalOpen ? 'navbar-modal-open' : ''}
                isScrolled={isScrolled}
                onCartIconClick={toggleCartDropdown}
            />

            {/* Pass cartItems from context state */}
            <CartDropdown
                isOpen={isCartDropdownOpen}
                orderItems={currentCartItems} // Use the safe array
                bagelToppings={BAGEL_TOPPINGS} // Assuming this comes from data/products or props
                onClose={closeCartDropdown}
                onGoToCheckout={handleGoToCheckout}
                isScrolled={isScrolled}
            />

            {/* Home Section remains the same */}
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

            {/* --- Menu Section remains the same --- */}
            {/* Ensure products and availableToppings are available here, either via props or context */}
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
                         {/* Use products prop */}
                         <p>{products?.BAGEL_HALF?.name}: ${products?.BAGEL_HALF?.price}</p>
                         <p>{products?.BAGEL_FULL?.name}: ${products?.BAGEL_FULL?.price}</p>
                         <p>Toppings (+${BAGEL_TOPPINGS?.CHEDDAR?.additionalCost || '?.??'} each, except Plain):</p>
                         <ul>
                            {/* Use availableToppings prop */}
                            {(availableToppings || []).map(t => <li key={t.id}>{t.name}</li>)}
                         </ul>
                     </div>
                 </div>
                 {/* Loafs */}
                 <div className="menu-item">
                     <img src={loafs} alt="Loafs" className="menu-image" />
                     <div className="menu-text">
                         <h2>LOAFS</h2>
                         {/* Use products prop */}
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
                 {/* Cookies */}
                 <div className="menu-item">
                     <img src={cookies} alt="Cookies" className="menu-image" />
                     <div className="menu-text">
                         <h2>COOKIES</h2>
                         {/* Use products prop */}
                         <p>{products?.COOKIE_CHOC_CHIP?.name}: ${products?.COOKIE_CHOC_CHIP?.price}</p>
                     </div>
                 </div>
            </section>

            {/* --- Pass cart state and context functions to OrderModal --- */}
            <OrderModal
                isOpen={isModalOpen}
                onClose={toggleModal}
                orderItems={currentCartItems} // from context (safe array)
                calculateTotal={calculateTotal} // from context
                onAddLoaf={addLoafToOrder} // local handler using context
                onAddCookies={addCookiesToOrder} // local handler using context
                onCustomizeBagels={startBagelCustomization} // local handler for modal state
                onRemoveItem={handleRemoveItemFromOrder} // local handler using context
                onCheckout={() => {
                    toggleModal();
                    navigate('/checkout');
                }}
                products={products} // from props
                bagelToppings={BAGEL_TOPPINGS} // from data/products or props
                onUpdateQuantity={updateItemQuantity} // from context
                onUpdateBagelDistribution={updateBagelDistribution} // from context
            />

            {/* --- Customization Modal remains the same --- */}
            <CustomizationModal
                isOpen={!!customizingItem}
                onClose={closeCustomization}
                itemToCustomize={customizingItem}
                selectedToppingIds={selectedToppingIds}
                onToppingChange={handleToppingChange}
                onConfirm={handleConfirmCustomization} // local handler using context
                availableToppings={availableToppings} // from props
                maxToppings={customizingItem?.id === products?.BAGEL_HALF?.id ? 2 : 4}
                additionalCostPerTopping={BAGEL_TOPPINGS?.CHEDDAR?.additionalCost || 0} // from data/products or props
            />
        </div>
    );
};

export default HomePage;
