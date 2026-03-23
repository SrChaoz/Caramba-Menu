export interface ToppingCategory {
  id: string;
  name: string;
  required?: boolean;
}

export const TOPPING_CATEGORIES: ToppingCategory[] = [
  { id: 'base', name: 'Elige tu base', required: true },
  { id: 'meat', name: 'Proteína' },
  { id: 'regular', name: 'Adicionales' },
];

export interface Topping {
  id: string;      
  categoryId: string; 
  label: string;   
  emoji: string;   
  exclusiveGroup?: string; 
  price: number; // Precio si se pide como extra
}

export const MENU_CONFIG = {
  product: {
    name: 'Burrito',
    basePrice: 3.50,          
    currency: 'USD',
    currencySymbol: '$',
  },
  validation: {
    minToppings: 5,           
    freeToppings: 8,          // A partir del 9no se cobra como extra
  },
  toppings: [
    // Base (Arroz nunca es extra, siempre exclusivo)
    { id: 'arroz-amarillo', categoryId: 'base', exclusiveGroup: 'arroz', label: 'Arroz Amarillo', emoji: '🥘', price: 0 },
    { id: 'arroz-verde',    categoryId: 'base', exclusiveGroup: 'arroz', label: 'Arroz Verde',    emoji: '🍚', price: 0 },
    { id: 'lechuga',        categoryId: 'base', label: 'Lechuga',         emoji: '🥬', price: 0.25 },
    // Proteína
    { id: 'pollo',          categoryId: 'meat', exclusiveGroup: 'meat', label: 'Pollo',           emoji: '🍗', price: 1.00 },
    { id: 'carne-res',      categoryId: 'meat', exclusiveGroup: 'meat', label: 'Carne de Res',    emoji: '🥩', price: 1.00 },
    // Adicionales
    { id: 'frejol-negro',   categoryId: 'regular', label: 'Frejol Negro',    emoji: '⚫', price: 0.50 },
    { id: 'frejol-rojo',    categoryId: 'regular', label: 'Frejol Rojo',     emoji: '🔴', price: 0.50 },
    { id: 'guacamole',      categoryId: 'regular', label: 'Guacamole',       emoji: '🥑', price: 0.50 },
    { id: 'crema-agria',    categoryId: 'regular', label: 'Crema Agria',     emoji: '🥛', price: 0.50 },
    { id: 'salsa-roja-hot', categoryId: 'regular', label: 'Salsa Hot',       emoji: '🌶️', price: 0.50 },
    { id: 'queso',          categoryId: 'regular', label: 'Queso',           emoji: '🧀', price: 0.50 },
    { id: 'choclo',         categoryId: 'regular', label: 'Choclo',          emoji: '🌽', price: 0.50 },
    { id: 'pico-de-gallo',  categoryId: 'regular', label: 'Pico de Gallo',   emoji: '🍅', price: 0.50 },
    { id: 'cebolla',        categoryId: 'regular', label: 'Cebolla',         emoji: '🧅', price: 0.25 },
    { id: 'cilantro',       categoryId: 'regular', label: 'Cilantro',        emoji: '🌿', price: 0.25 },
  ] as Topping[],
  whatsapp: {
    phone: '593987543310',
  },
} as const;

export const TOPPINGS = MENU_CONFIG.toppings;
export const BASE_PRICE = MENU_CONFIG.product.basePrice;
export const MIN_TOPPINGS = MENU_CONFIG.validation.minToppings;
export const FREE_TOPPINGS_LIMIT = MENU_CONFIG.validation.freeToppings;

export function calculateExtras(selectedToppingIds: string[]): { extraCost: number, extraIds: string[] } {
  if (selectedToppingIds.length <= FREE_TOPPINGS_LIMIT) {
    return { extraCost: 0, extraIds: [] };
  }
  
  const extraIds = selectedToppingIds.slice(FREE_TOPPINGS_LIMIT);
  let extraCost = 0;
  
  extraIds.forEach(id => {
    const t = TOPPINGS.find(to => to.id === id);
    if (t && t.price) {
      extraCost += t.price;
    }
  });

  return { extraCost, extraIds };
}

export function validateBurrito(selectedToppingIds: string[]): boolean {
  if (selectedToppingIds.length < MIN_TOPPINGS) return false;
  
  for (const cat of TOPPING_CATEGORIES) {
    if (cat.required) {
      const hasRequired = selectedToppingIds.some(id => {
        const topping = TOPPINGS.find(t => t.id === id);
        return topping?.categoryId === cat.id;
      });
      if (!hasRequired) return false;
    }
  }
  return true;
}

/**
 * Ordena los IDs de los ingredientes según el orden físico de preparación del burrito
 */
export function sortToppings(toppingIds: string[]): string[] {
  const getPriority = (id: string): number => {
    if (id === 'crema-agria') return 0; // Siempre primero
    
    const topping = TOPPINGS.find(t => t.id === id);
    if (!topping) return 4; // Por defecto: regular
    
    if (topping.categoryId === 'base') return 1;
    if (id.includes('frejol')) return 2;
    if (topping.categoryId === 'meat') return 3;
    if (id === 'guacamole') return 5; // Siempre último
    
    return 4; // Demás ingredientes (queso, salsas, etc)
  };

  return [...toppingIds].sort((a, b) => getPriority(a) - getPriority(b) || a.localeCompare(b));
}

