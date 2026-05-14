import { create } from 'zustand';
import { CartItem, CustomerInfo, ItemMode, ProductoTipo } from '@/types';

const randomId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : Math.random().toString(36).substring(2));
import { useMenuStore } from './menuStore';

// Modo por grupo de producto: cada productoId tiene su propio modo
type ModeMap = { [productoId: string]: ItemMode | null };

interface CartState {
  items: CartItem[];
  modeByProduct: ModeMap;   // modo 'same'|'individual' por tipo de plato
  customer: CustomerInfo;
  total: number;

  // Acciones
  setItemQuantity: (productoId: string, delta: number) => void;  // +1 o -1
  setModeForProduct: (productoId: string, mode: ItemMode) => void;
  toggleTopping: (instanceId: string, toppingId: string) => void;
  setNota: (instanceId: string, nota: string) => void;
  setCustomer: (info: Partial<CustomerInfo>) => void;
  resetCart: () => void;
  recalculateTotal: () => void;

  // Helpers de UI
  getTotalQuantity: () => number;
  getItemsByProduct: (productoId: string) => CartItem[];
  getConfigurableGroupsNeedingMode: () => { productoId: string; nombre: string; emoji: string; count: number }[];
  getConfigurableMultipleGroups: () => { productoId: string; nombre: string; emoji: string; count: number }[];
}

const makeItem = (
  productoId: string,
  productoNombre: string,
  productoEmoji: string,
  tipo: ProductoTipo,
  basePrice: number,
  productoIngredientesTexto?: string
): CartItem => ({
  instanceId: randomId(),
  productoId,
  productoNombre,
  productoEmoji,
  productoIngredientesTexto,
  tipo,
  selectedToppings: [],
  nota: undefined,
  basePrice,
});

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  modeByProduct: {},
  customer: { name: '', address: '', phone: '', deliveryDay: '', paymentMethod: '' },
  total: 0,

  // ── Recalcular total ───────────────────────────────────────

  recalculateTotal: () => {
    const { items } = get();
    const menuStore = useMenuStore.getState();

    let newTotal = 0;
    items.forEach(item => {
      const { extraCost, surchargeCost } = menuStore.calculateExtras(item.productoId, item.selectedToppings);
      newTotal += item.basePrice + extraCost + surchargeCost;
    });

    set({ total: newTotal });
  },

  // ── Ajustar cantidad de un producto (+1 o -1) ─────────────

  setItemQuantity: (productoId, delta) => {
    const menuStore = useMenuStore.getState();
    const producto = menuStore.getProductConfig(productoId);
    if (!producto) return;

    const { items, modeByProduct } = get();
    const existing = items.filter(i => i.productoId === productoId);
    const newCount = existing.length + delta;

    if (newCount < 0) return; // No puede ser negativo

    let updatedItems: CartItem[];

    if (delta > 0) {
      // Agregar un ítem nuevo
      const newItem = makeItem(
        productoId, 
        producto.nombre, 
        producto.emoji, 
        producto.tipo, 
        producto.precio_base,
        producto.ingredientes_texto
      );

      // Si hay modo 'same', copiar los toppings del primer ítem del mismo grupo
      const firstOfGroup = existing[0];
      if (modeByProduct[productoId] === 'same' && firstOfGroup && producto.tipo === 'configurable') {
        newItem.selectedToppings = [...firstOfGroup.selectedToppings];
      }

      updatedItems = [...items, newItem];
    } else {
      // Eliminar el último ítem del producto
      const lastIndex = items.map((item, i) => ({ item, i }))
        .filter(({ item }) => item.productoId === productoId)
        .at(-1)?.i;
      if (lastIndex === undefined) return;
      updatedItems = items.filter((_, i) => i !== lastIndex);
    }

    // Si queda 0, limpiar el modo
    const newMode = { ...modeByProduct };
    if (updatedItems.filter(i => i.productoId === productoId).length <= 1) {
      delete newMode[productoId];
    }

    set({ items: updatedItems, modeByProduct: newMode });
    get().recalculateTotal();
  },

  // ── Establecer modo para un producto ──────────────────────

  setModeForProduct: (productoId, mode) => {
    const { items } = get();
    let updatedItems = [...items];

    if (mode === 'same') {
      // Sincronizar todos los ítems del grupo con los toppings del primero
      const firstItem = updatedItems.find(i => i.productoId === productoId);
      if (firstItem) {
        updatedItems = updatedItems.map(item =>
          item.productoId === productoId
            ? { ...item, selectedToppings: [...firstItem.selectedToppings] }
            : item
        );
      }
    }

    set({ modeByProduct: { ...get().modeByProduct, [productoId]: mode }, items: updatedItems });
  },

  // ── Toggle topping en un ítem ──────────────────────────────

  toggleTopping: (instanceId, toppingId) => {
    const { items, modeByProduct } = get();
    const menuStore = useMenuStore.getState();

    const targetItem = items.find(i => i.instanceId === instanceId);
    if (!targetItem) return;

    const toppingConfig = menuStore.toppings.find(t => t.id === toppingId);
    const categories = menuStore.getCategoriesByProduct(targetItem.productoId);
    const cat = categories.find(c => c.id === toppingConfig?.categoryId);
    const mode = modeByProduct[targetItem.productoId] ?? null;

    const applyToggle = (item: CartItem): CartItem => {
      if (item.instanceId !== instanceId && mode !== 'same') return item;
      if (mode === 'same' && item.productoId !== targetItem.productoId) return item;

      const has = item.selectedToppings.includes(toppingId);
      let newSelected = [...item.selectedToppings];

      if (has) {
        newSelected = newSelected.filter(t => t !== toppingId);
      } else {
        // Respetar max_seleccion por categoría
        if (cat?.maxSeleccion !== null && cat?.maxSeleccion !== undefined) {
          const toppingsInSameCat = menuStore.toppings
            .filter(t => t.categoryId === cat.id)
            .map(t => t.id);
          const selectedInCat = newSelected.filter(id => toppingsInSameCat.includes(id));
          if (selectedInCat.length >= cat.maxSeleccion) {
            // Eliminar el primero seleccionado de esa categoría para hacer espacio
            newSelected = newSelected.filter(id => id !== selectedInCat[0]);
          }
        }
        newSelected.push(toppingId);
      }

      return { ...item, selectedToppings: newSelected };
    };

    const updatedItems = items.map(applyToggle);
    set({ items: updatedItems });
    get().recalculateTotal();
  },

  // ── Nota para ítems simples ───────────────────────────────

  setNota: (instanceId, nota) => {
    set(s => ({
      items: s.items.map(item =>
        item.instanceId === instanceId ? { ...item, nota } : item
      )
    }));
  },

  // ── Customer ──────────────────────────────────────────────

  setCustomer: (info) =>
    set(s => ({ customer: { ...s.customer, ...info } })),

  // ── Reset ─────────────────────────────────────────────────

  resetCart: () => {
    set({
      items: [],
      modeByProduct: {},
      customer: { name: '', address: '', phone: '', deliveryDay: '', paymentMethod: '' },
      total: 0,
    });
  },

  // ── Helpers ───────────────────────────────────────────────

  getTotalQuantity: () => get().items.length,

  getItemsByProduct: (productoId) =>
    get().items.filter(i => i.productoId === productoId),

  getConfigurableGroupsNeedingMode: () => {
    const { items, modeByProduct } = get();
    const groups: { [productoId: string]: CartItem[] } = {};

    items.forEach(item => {
      if (item.tipo === 'configurable') {
        if (!groups[item.productoId]) groups[item.productoId] = [];
        groups[item.productoId].push(item);
      }
    });

    return Object.entries(groups)
      .filter(([productoId, groupItems]) => groupItems.length > 1 && modeByProduct[productoId] == null)
      .map(([productoId, groupItems]) => ({
        productoId,
        nombre: groupItems[0].productoNombre,
        emoji: groupItems[0].productoEmoji,
        count: groupItems.length,
      }));
  },

  getConfigurableMultipleGroups: () => {
    const { items } = get();
    const groups: { [productoId: string]: CartItem[] } = {};

    items.forEach(item => {
      if (item.tipo === 'configurable') {
        if (!groups[item.productoId]) groups[item.productoId] = [];
        groups[item.productoId].push(item);
      }
    });

    return Object.entries(groups)
      .filter(([_, groupItems]) => groupItems.length > 1)
      .map(([productoId, groupItems]) => ({
        productoId,
        nombre: groupItems[0].productoNombre,
        emoji: groupItems[0].productoEmoji,
        count: groupItems.length,
      }));
  },
}));
