export interface Topping {
  id: string;      // slug único, e.g. 'pollo'
  label: string;   // nombre visible, e.g. 'Pollo'
  emoji: string;   // emoji representativo
}

export const MENU_CONFIG = {
  product: {
    name: 'Burrito',
    basePrice: 3.50,          // USD
    currency: 'USD',
    currencySymbol: '$',
  },
  validation: {
    minToppings: 5,           // REGLA CRÍTICA: mínimo 5 toppings por burrito
    maxToppings: 11,          // máximo = total de toppings disponibles
  },
  toppings: [
    { id: 'pollo',         label: 'Pollo',           emoji: '🍗' },
    { id: 'arroz-amarillo',label: 'Arroz Amarillo',  emoji: '🍚' },
    { id: 'frejol-negro',  label: 'Frejol Negro',    emoji: '⚫' },
    { id: 'frejol-rojo',   label: 'Frejol Rojo',     emoji: '🔴' },
    { id: 'guacamole',     label: 'Guacamole',       emoji: '🥑' },
    { id: 'salsa-roja-hot',label: 'Salsa Roja Hot',  emoji: '🌶️' },
    { id: 'crema-agria',   label: 'Crema Agria',     emoji: '🥛' },
    { id: 'pico-de-gallo', label: 'Pico de Gallo',   emoji: '🍅' },
    { id: 'cebolla',       label: 'Cebolla',         emoji: '🧅' },
    { id: 'cilantro',      label: 'Cilantro',        emoji: '🌿' },
    { id: 'limon',         label: 'Limón',           emoji: '🍋' },
  ] as Topping[],
  whatsapp: {
    phone: '593987543310',
  },
} as const;

export const TOPPINGS = MENU_CONFIG.toppings;
export const BASE_PRICE = MENU_CONFIG.product.basePrice;
export const MIN_TOPPINGS = MENU_CONFIG.validation.minToppings;
