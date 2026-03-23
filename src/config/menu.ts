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
  id: string;      // slug único, e.g. 'pollo'
  categoryId: string; // categoría del topping
  label: string;   // nombre visible, e.g. 'Pollo'
  emoji: string;   // emoji representativo
  exclusiveGroup?: string; // para toppings mutuamente excluyentes (ej: 'arroz')
}

export const MENU_CONFIG = {
  product: {
    name: 'Burrito',
    basePrice: 3.50,          // USD
    currency: 'USD',
    currencySymbol: '$',
  },
  validation: {
    minToppings: 5,           // Mínimo 5 toppings por burrito
    maxToppings: 10,          // Máximo 10 toppings en total
  },
  toppings: [
    // Base
    { id: 'arroz-amarillo', categoryId: 'base', exclusiveGroup: 'arroz', label: 'Arroz Amarillo', emoji: '🥘' },
    { id: 'arroz-verde',    categoryId: 'base', exclusiveGroup: 'arroz', label: 'Arroz Verde',    emoji: '🍚' },
    { id: 'lechuga',        categoryId: 'base', label: 'Lechuga',         emoji: '🥬' },
    // Proteína
    { id: 'pollo',          categoryId: 'meat', exclusiveGroup: 'meat', label: 'Pollo',           emoji: '🍗' },
    { id: 'carne-res',      categoryId: 'meat', exclusiveGroup: 'meat', label: 'Carne de Res',    emoji: '🥩' },
    // Adicionales
    { id: 'frejol-negro',   categoryId: 'regular', label: 'Frejol Negro',    emoji: '⚫' },
    { id: 'frejol-rojo',    categoryId: 'regular', label: 'Frejol Rojo',     emoji: '🔴' },
    { id: 'guacamole',      categoryId: 'regular', label: 'Guacamole',       emoji: '🥑' },
    { id: 'crema-agria',    categoryId: 'regular', label: 'Crema Agria',     emoji: '🥛' },
    { id: 'salsa-roja-hot', categoryId: 'regular', label: 'Salsa Hot',       emoji: '🌶️' },
    { id: 'queso',          categoryId: 'regular', label: 'Queso',           emoji: '🧀' },
    { id: 'choclo',         categoryId: 'regular', label: 'Choclo',          emoji: '🌽' },
    { id: 'pico-de-gallo',  categoryId: 'regular', label: 'Pico de Gallo',   emoji: '🍅' },
    { id: 'cebolla',        categoryId: 'regular', label: 'Cebolla',         emoji: '🧅' },
    { id: 'cilantro',       categoryId: 'regular', label: 'Cilantro',        emoji: '🌿' },

  ] as Topping[],
  whatsapp: {
    phone: '593987543310',
  },
} as const;

export const TOPPINGS = MENU_CONFIG.toppings;
export const BASE_PRICE = MENU_CONFIG.product.basePrice;
export const MIN_TOPPINGS = MENU_CONFIG.validation.minToppings;
export const MAX_TOPPINGS = MENU_CONFIG.validation.maxToppings;

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

