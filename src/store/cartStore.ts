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
  customer: { name: '', address: '', phone: '', deliveryDay: '' },
  total: BASE_PRICE,

  setQuantity: (qty) => set({
    quantity: qty,
    total: qty * BASE_PRICE,
    burritos: Array.from({ length: qty }, (_, i) => emptyBurrito(i)),
    mode: qty === 1 ? 'same' : null,  // qty=1 no necesita preguntar el modo
  }),

  setMode: (mode) => set({ mode }),

  toggleTopping: (burritoId, toppingId) => {
    const { burritos, mode } = get();
    // Encuentra la configuración del topping que estamos intentando agregar
    const toppingConfig = MENU_CONFIG.toppings.find(t => t.id === toppingId);

    const updated = burritos.map(b => {
      // En modo 'same', actualiza TODOS los burritos simultáneamente
      if (mode === 'same' || b.id === burritoId) {
        const has = b.selectedToppings.includes(toppingId);
        
        let newSelected = [...b.selectedToppings];

        if (has) {
          // Si ya lo tiene, simplemente lo quita
          newSelected = newSelected.filter(t => t !== toppingId);
        } else {
          // Si va a agregarlo, se procesan reglas de exclusividad primero
          if (toppingConfig?.exclusiveGroup) {
            // Elimina cualquier topping que pertenezca al mismo exclusiveGroup
            const exclusiveIds = MENU_CONFIG.toppings
              .filter(t => t.exclusiveGroup === toppingConfig.exclusiveGroup)
              .map(t => t.id);
            newSelected = newSelected.filter(t => !exclusiveIds.includes(t));
          }
          
          // Luego, verificar si alcanzó el máximo permitido
          if (newSelected.length < MENU_CONFIG.validation.maxToppings) {
            newSelected.push(toppingId);
          } else {
            // Si ya alcanzó el máximo, ignorar el toggle para agregar (no hacer push)
            return b; // Retorna sin cambios
          }
        }

        return { ...b, selectedToppings: newSelected };
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
    customer: { name: '', address: '', phone: '', deliveryDay: '' },
    total: BASE_PRICE,
  }),
}));
