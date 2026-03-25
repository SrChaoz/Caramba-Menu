import { create } from 'zustand';
import { BurritoConfig, BurritoMode, CustomerInfo } from '@/types';
import { useMenuStore } from './menuStore';

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
  recalculateTotal: () => void;
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
  total: 0, 

  recalculateTotal: () => {
    const { burritos } = get();
    const menuStore = useMenuStore.getState();
    const baseP = menuStore.config?.basePrice || 0;
    
    let newTotal = 0;
    burritos.forEach(b => {
      const { extraCost } = menuStore.calculateExtras(b.selectedToppings);
      newTotal += baseP + extraCost;
    });
    
    set({ total: newTotal });
  },

  setQuantity: (qty) => {
    const menuStore = useMenuStore.getState();
    const baseP = menuStore.config?.basePrice || 0;
    set({
      quantity: qty,
      total: qty * baseP,
      burritos: Array.from({ length: qty }, (_, i) => emptyBurrito(i)),
      mode: qty === 1 ? 'same' : null,
    });
  },

  setMode: (mode) => set({ mode }),

  toggleTopping: (burritoId, toppingId) => {
    const { burritos, mode } = get();
    const menuStore = useMenuStore.getState();
    const config = menuStore.config;
    const toppings = menuStore.toppings;
    if (!config) return;

    const toppingConfig = toppings.find(t => t.id === toppingId);

    let updated = burritos.map(b => {
      if (mode === 'same' || b.id === burritoId) {
        const has = b.selectedToppings.includes(toppingId);
        let newSelected = [...b.selectedToppings];

        if (has) {
          newSelected = newSelected.filter(t => t !== toppingId);
        } else {
          if (toppingConfig?.exclusiveGroup) {
            const isRice = toppingConfig.exclusiveGroup === 'arroz';
            const isMeat = toppingConfig.exclusiveGroup === 'meat';
            const allowExtraMeat = isMeat && newSelected.length >= config.freeToppingsLimit;

            if (isRice || (isMeat && !allowExtraMeat)) {
              const exclusiveIds = toppings
                .filter(t => t.exclusiveGroup === toppingConfig.exclusiveGroup)
                .map(t => t.id);
              newSelected = newSelected.filter(t => !exclusiveIds.includes(t));
            }
          }
          newSelected.push(toppingId);
        }

        return { ...b, selectedToppings: newSelected };
      }
      return b;
    });

    if (mode === 'same') {
      const template = updated.find(b => b.id === burritoId) || updated[0];
      updated = updated.map(b => ({ ...b, selectedToppings: [...template.selectedToppings] }));
    }

    set({ burritos: updated });
    get().recalculateTotal();
  },

  setCustomer: (info) =>
    set(s => ({ customer: { ...s.customer, ...info } })),

  resetCart: () => {
    const menuStore = useMenuStore.getState();
    const baseP = menuStore.config?.basePrice || 0;
    set({
      quantity: 1, mode: 'same',
      burritos: [emptyBurrito(0)],
      customer: { name: '', address: '', phone: '', deliveryDay: '' },
      total: baseP,
    });
  },
}));
