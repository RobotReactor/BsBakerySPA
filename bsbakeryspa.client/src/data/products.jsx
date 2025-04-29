export const PRODUCTS = {
    LOAF_REG: { id: 'L001', name: 'Regular', price: 12, category: 'Loaf' },
    LOAF_PEP_MOZZ: { id: 'L002', name: 'Pepperoni Mozzarella', price: 14, category: 'Loaf' },
    LOAF_CHED_JAL: { id: 'L003', name: 'Cheddar Jalapeño', price: 14, category: 'Loaf' },
    LOAF_CIN_APP: { id: 'L004', name: 'Cinnamon Apple', price: 14, category: 'Loaf' },
    LOAF_EVERY: { id: 'L005', name: 'Everything', price: 14, category: 'Loaf' },
    COOKIE_CHOC_CHIP: { id: 'C001', name: 'Chocolate Chip Cookies (Dozen)', price: 20, category: 'Cookie' },
    BAGEL_HALF: { id: 'B001', name: 'Half Dozen Bagels', price: 12, category: 'Bagel', baseQuantity: 6 },
    BAGEL_FULL: { id: 'B002', name: 'Dozen Bagels', price: 22, category: 'Bagel', baseQuantity: 12 },
  };
  
  export const BAGEL_TOPPINGS = {
    PLAIN: { id: 'T000', name: 'Plain', additionalCost: 0 },
    CHEDDAR: { id: 'T001', name: 'Cheddar', additionalCost: 1 },
    ASIAGO: { id: 'T002', name: 'Asiago', additionalCost: 1 },
    SESAME: { id: 'T003', name: 'Sesame', additionalCost: 1 },
    EVERYTHING: { id: 'T004', name: 'Everything', additionalCost: 1 },
    CHED_JAL: { id: 'T005', name: 'Cheddar Jalapeño', additionalCost: 1 },
  };
  
  export const getAvailableToppings = () => Object.values(BAGEL_TOPPINGS);
  
  export const getToppingById = (id) => BAGEL_TOPPINGS[Object.keys(BAGEL_TOPPINGS).find(key => BAGEL_TOPPINGS[key].id === id)];
  
  export const getProductById = (id) => PRODUCTS[Object.keys(PRODUCTS).find(key => PRODUCTS[key].id === id)];
  