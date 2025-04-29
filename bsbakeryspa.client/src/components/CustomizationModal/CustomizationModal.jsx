import React from 'react';
import '../../styles/CustomizationModal.css'

const CustomizationModal = ({
    isOpen,
    onClose,
    itemToCustomize, 
    selectedToppingIds,
    onToppingChange,
    onConfirm, 
    availableToppings, 
    maxToppings,
    additionalCostPerTopping
}) => {

    if (!isOpen || !itemToCustomize) {
        return null; 
    }

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className={"customization-modal"} onClick={onClose}>
            <div className={"customization-content"} onClick={handleContentClick}>
                <h2>Customize Your {itemToCustomize.name}</h2>
                <p>
                    Select up to {maxToppings} toppings.
                    (+${additionalCostPerTopping} for each topping that isn't Plain)
                </p>
                <ul className={"customization-option"}>
                    {availableToppings.map((topping) => (
                        <li key={topping.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    value={topping.id}
                                    onChange={(e) => onToppingChange(e, topping.id)}
                                    checked={selectedToppingIds.includes(topping.id)}
                                />
                                {topping.name} {topping.additionalCost > 0 ? `(+$${topping.additionalCost})` : ''}
                            </label>
                        </li>
                    ))}
                </ul>
                <button
                    className={"bagel-cancel-button"}
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className={"bagel-add-button"}
                    onClick={onConfirm}
                    disabled={selectedToppingIds.length === 0}
                >
                    Add to Order
                </button>
            </div>
        </div>
    );
};

export default CustomizationModal;
