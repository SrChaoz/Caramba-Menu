import { create } from 'zustand';
import { BurritoConfig, BurritoMode, CustomerInfo } from '@/types';
import { BASE_PRICE, MENU_CONFIG, calculateExtras, FREE_TOPPINGS_LIMIT } from '@/config/menu';

interface CartState {
  quantity: number;
  mode: BurritoMode | null;     
  burritos: BurritoConfig[];
  customer: CustomerInfo;
  total: number;
  setQuantity: (qty: number) => void;
  setMode: (mode: BurritoMode) => void;
  toggleTopping: (burritoId: number, toppingId: string) => void;
  setCustomer: (info: Partial<CustomerInfo>) => void;
  resetCart: () => void;
}

const emptyBurrito = (id: number): BurritoConfig => ({
  id,
  selectedToppings: [],
});

export const useCartStore = create<CartState>((set, get) => ({
  quantity: 1,
  mode: 'same',
  burritos: [emptyBurrito(0)],
  customer: { name: '', address: '', phone: '', deliveryDay: '' },
  total: BASE_PRICE,

  setQuantity: (qty) => set({
    quantity: qty,
    total: qty * BASE_PRICE,
    burritos: Array.from({ length: qty }, (_, i) => emptyBurrito(i)),
    mode: qty === 1 ? 'same' : null,
  }),

  setMode: (mode) => set({ mode }),

  toggleTopping: (burritoId, toppingId) => {
    const { burritos, mode, quantity } = get();
    const toppingConfig = MENU_CONFIG.toppings.find(t => t.id === toppingId);

    let updated = burritos.map(b => {
      if (mode === 'same' || b.id === burritoId) {
        const has = b.selectedToppings.includes(toppingId);
        let newSelected = [...b.selectedToppings];

        if (has) {
          // Si ya lo tiene, se quita
          newSelected = newSelected.filter(t => t !== toppingId);
        } else {
          // Si va a agregarlo, evaluamos exclusividad
          if (toppingConfig?.exclusiveGroup) {
            const isRice = toppingConfig.exclusiveGroup === 'arroz';
            const isMeat = toppingConfig.exclusiveGroup === 'meat';
            
            // Se permite una segunda carne SÓLO si con ella se exceden los toppings gratuitos (Es decir, ya se vuelve un extra)
            // o si el usuario quiere reemplazarla. Para simplificar la UX: Si ya llegó a 8 toppings, le liberamos la restricción de carne.
            const allowExtraMeat = isMeat && newSelected.length >= FREE_TOPPINGS_LIMIT;

            if (isRice || (isMeat && !allowExtraMeat)) {
              // Eliminar el topping previo excluyente
              const exclusiveIds = MENU_CONFIG.toppings
                .filter(t => t.exclusiveGroup === toppingConfig.exclusiveGroup)
                .map(t => t.id);
              newSelected = newSelected.filter(t => !exclusiveIds.includes(t));
            }
          }
          
          // Agregamos el topping libremente (Max límite ya no aplica de forma dura)
          newSelected.push(toppingId);
        }

        return { ...b, selectedToppings: newSelected };
      }
      return b;
    });

    // En modo 'same', aseguramos que todos los burritos sean clones exactos del primero
    if (mode === 'same') {
      const template = updated.find(b => b.id === burritoId) || updated[0];
      updated = updated.map(b => ({ ...b, selectedToppings: [...template.selectedToppings] }));
    }

    // Calcular el nuevo total sumando los extras
    let newTotal = 0;
    updated.forEach(b => {
      const { extraCost } = calculateExtras(b.selectedToppings);
      newTotal += BASE_PRICE + extraCost;
    });

    set({ burritos: updated, total: newTotal });
  },

  setCustomer: (info) =>
    set(s => ({ customer: { ...s.customer, ...info } })),

  resetCart: () => set({
    quantity: 1, mode: 'same',
    burritos: [emptyBurrito(0)],
    customer: { name: '', address: '', phone: '', deliveryDay: '' },
    total: BASE_PRICE,
  }),
}));
