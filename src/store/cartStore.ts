import { create } from 'zustand';
import { BurritoConfig, BurritoMode, CustomerInfo } from '@/types';
import { BASE_PRICE, MENU_CONFIG } from '@/config/menu';

interface CartState {
  // ── Estado del pedido ──────────────────────────────────────────
  quantity: number;
  mode: BurritoMode | null;      // null = aún no elegido
  burritos: BurritoConfig[];
  customer: CustomerInfo;

  // ── Computed (derivado) ────────────────────────────────────────
  total: number;

  // ── Acciones ──────────────────────────────────────────────────
  setQuantity: (qty: number) => void;
  setMode: (mode: BurritoMode) => void;
  toggleTopping: (burritoId: number, toppingId: string) => void;
  setCustomer: (info: Partial<CustomerInfo>) => void;
  resetCart: () => void;
}

// Crea un BurritoConfig vacío para el índice dado
const emptyBurrito = (id: number): BurritoConfig => ({
  id,
  selectedToppings: [],
});

export const useCartStore = create<CartState>((set, get) => ({
  quantity: 1,
  mode: 'same',
  burritos: [emptyBurrito(0)],
  customer: { name: '', address: '', deliveryDay: '' },
  total: BASE_PRICE,

  setQuantity: (qty) => set({
    quantity: qty,
    total: qty * BASE_PRICE,
    burritos: Array.from({ length: qty }, (_, i) => emptyBurrito(i)),
    mode: qty === 1 ? 'same' : null,  // qty=1 no necesita preguntar el modo
  }),

  setMode: (mode) => set({ mode }),

  toggleTopping: (burritoId, toppingId) => {
    const { burritos, mode, quantity } = get();

    const updated = burritos.map(b => {
      // En modo 'same', actualiza TODOS los burritos simultáneamente
      if (mode === 'same' || b.id === burritoId) {
        const has = b.selectedToppings.includes(toppingId);
        return {
          ...b,
          selectedToppings: has
            ? b.selectedToppings.filter(t => t !== toppingId)
            : [...b.selectedToppings, toppingId],
        };
      }
      return b;
    });

    set({ burritos: updated });
  },

  setCustomer: (info) =>
    set(s => ({ customer: { ...s.customer, ...info } })),

  resetCart: () => set({
    quantity: 1, mode: 'same',
    burritos: [emptyBurrito(0)],
    customer: { name: '', address: '', deliveryDay: '' },
    total: BASE_PRICE,
  }),
}));
