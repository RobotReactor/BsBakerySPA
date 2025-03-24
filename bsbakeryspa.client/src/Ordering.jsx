import { useEffect, useState, React } from 'react';
import './App.css';

const Ordering = () => {
    const options = [
        { id: 1, name: 'Bagels', special: 'Cedar, Asiago, Sesame, Everything, Cheddar Jalapeno', price: '$20' },
        { id: 2, name: 'Loafs', special: 'Pepperoni Mozzarella, Cheddar Jalapeno, Cinnamon Apple, Everything', price: '$5' },
        { id: 3, name: 'Cookies', special: 'Chocolate Chips', price: '$15' },
    ];

    const handleOrder = (item) => {
        alert(`You have ordered: ${item.name}`);
    };

    return (
        <div className="orderingMenu">
            <h1>Order Here</h1>
            <div className="options">
                {options.map((item) => (
                    <div key={item.id} className="option">
                        <h2>{item.name}</h2>
                        {item.special && <p className="special">{item.special}</p>}
                        <p>{item.price}</p>
                        <button onClick={() => handleOrder(item)}>Order</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Ordering;