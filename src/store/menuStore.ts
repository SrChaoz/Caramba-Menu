import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ToppingCategory {
  id: string;
  name: string;
  required?: boolean;
}

export interface Topping {
  id: string;      
  categoryId: string; 
  label: string;   
  emoji: string;   
  exclusiveGroup?: string; 
  price: number;        // costo cuando es extra real (9+ ingredientes)
  surcharge: number;    // costo adicional cuando está dentro del límite como proteína primaria (ej. carne-res = $0.50)
  comboPrice: number;   // costo adicional cuando esta proteína es secundaria en un combo (ej. pollo como segunda carne = $1.00)
  disponible: boolean;
}
export interface Promocion {
  id: string;
  nombre: string;
  descripcion: string | null;
  condicion_valor: number;
  recompensa: string;
  activo: boolean;
}

interface MenuConfig {
  basePrice: number;
  minToppings: number;
  freeToppingsLimit: number;
  whatsappPhone: string;
}

interface MenuState {
  config: MenuConfig | null;
  categories: ToppingCategory[];
  toppings: Topping[];
  promociones: Promocion[];
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  
  // Helpers
  calculateExtras: (selectedIds: string[]) => { extraCost: number; extraIds: string[]; surchargeCost: number; surchargeIds: string[]; surchargeDetails: { id: string; amount: number; label: string }[] };
  validateBurrito: (selectedIds: string[]) => boolean;
  sortToppings: (selectedIds: string[]) => string[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  config: null,
  categories: [],
  toppings: [],
  promociones: [],
  isLoading: true,
  error: null,

  fetchMenu: async () => {
    try {
      set({ isLoading: true, error: null });

      // Parallel fetch
      const [confRes, prodRes, catRes, topRes, promoRes] = await Promise.all([
        supabase.from('restaurante_config').select('*'),
        supabase.from('menu_productos').select('*').eq('id', 'burrito-armalo').single(),
        supabase.from('menu_categorias').select('*').eq('producto_id', 'burrito-armalo').order('orden'),
        supabase.from('menu_toppings').select('*').order('orden'),
        supabase.from('promociones').select('*').eq('activo', true).order('condicion_valor', { ascending: false })
      ]);

      if (prodRes.error) throw prodRes.error;
      
      const config: MenuConfig = {
        basePrice: Number(prodRes.data.precio_base),
        minToppings: Number(prodRes.data.min_toppings),
        freeToppingsLimit: Number(prodRes.data.free_toppings_limit),
        whatsappPhone: confRes.data?.find(c => c.clave === 'whatsapp_phone')?.valor || ''
      };

      const categories: ToppingCategory[] = (catRes.data || []).map(c => ({
        id: c.id,
        name: c.nombre,
        required: c.es_requerido
      }));

      // Filter toppings belonging only to these categories
      const catIds = categories.map(c => c.id);
      const toppings: Topping[] = (topRes.data || [])
        .filter(t => catIds.includes(t.categoria_id) && !t.oculto)
        .map(t => ({
          id: t.id,
          categoryId: t.categoria_id,
          label: t.nombre,
          emoji: t.emoji || '',
          exclusiveGroup: t.exclusive_group,
          price: Number(t.precio_extra),
          surcharge: Number(t.precio_surcharge ?? 0),
          comboPrice: Number(t.precio_proteina_combo ?? 0),
          disponible: t.disponible
        }));

      set({ config, categories, toppings, promociones: promoRes.data || [], isLoading: false });

    } catch (err: any) {
      console.error('Error fetching menu:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  calculateExtras: (selectedIds: string[]) => {
    const { config, toppings } = get();
    if (!config) return { extraCost: 0, extraIds: [], surchargeCost: 0, surchargeIds: [], surchargeDetails: [] };

    const freeIds = selectedIds.slice(0, config.freeToppingsLimit);

    // Identificar proteínas dentro del pool libre (orden cronológico según selectedIds)
    const proteinsInFree = freeIds
      .map(id => toppings.find(to => to.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t && t.exclusiveGroup === 'meat');

    let surchargeCost = 0;
    const surchargeIds: string[] = [];
    const surchargeDetails: { id: string, amount: number, label: string }[] = [];

    if (proteinsInFree.length > 0) {
      const primary = proteinsInFree[0];
      const secondaries = proteinsInFree.slice(1);

      if (primary.surcharge > 0) {
        surchargeIds.push(primary.id);
        surchargeCost += primary.surcharge;
        // Se omite agregar al surchargeDetails para ocultar el recargo de la proteína principal según elección del usuario (Opción A)
      }

      for (const sec of secondaries) {
        if (sec.price > 0) {
          surchargeIds.push(sec.id);
          surchargeCost += sec.price;
          surchargeDetails.push({ id: sec.id, amount: sec.price, label: `Extra: ${sec.label}` });
        }
      }
    }

    // Caso normal: otros no-proteina con surcharge
    const otherSurcharges = freeIds
      .map(id => toppings.find(to => to.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t && t.surcharge > 0 && t.exclusiveGroup !== 'meat');
      
    for (const other of otherSurcharges) {
      surchargeIds.push(other.id);
      surchargeCost += other.surcharge;
      surchargeDetails.push({ id: other.id, amount: other.surcharge, label: `Recargo: ${other.label}` });
    }

    // Extras: ingredientes más allá del límite libre
    let extraCost = 0;
    const extraIds: string[] = [];
    
    if (selectedIds.length > config.freeToppingsLimit) {
      const eIds = selectedIds.slice(config.freeToppingsLimit);
      eIds.forEach(id => {
        const t = toppings.find(to => to.id === id);
        if (t) {
          extraIds.push(id);
          if (t.price) extraCost += t.price;
        }
      });
    }

    return { extraCost, extraIds, surchargeCost, surchargeIds, surchargeDetails };
  },

  validateBurrito: (selectedIds: string[]) => {
    const { config, categories, toppings } = get();
    if (!config) return false;

    if (selectedIds.length < config.minToppings) return false;
    
    for (const cat of categories) {
      if (cat.required) {
        const hasRequired = selectedIds.some(id => {
          const topping = toppings.find(t => t.id === id);
          return topping?.categoryId === cat.id;
        });
        if (!hasRequired) return false;
      }
    }
    return true;
  },

  sortToppings: (toppingIds: string[]) => {
    const { toppings } = get();
    
    const getPriority = (id: string): number => {
      if (id === 'crema-agria') return 0; // Siempre primero
      
      const topping = toppings.find(t => t.id === id);
      if (!topping) return 4;
      
      if (topping.categoryId === 'base') return 1;
      if (id.includes('frejol')) return 2;
      if (topping.categoryId === 'meat') return 3;
      if (id === 'guacamole') return 5; // Siempre último
      
      return 4; // Demás ingredientes (queso, salsas, etc)
    };

    return [...toppingIds].sort((a, b) => getPriority(a) - getPriority(b) || a.localeCompare(b));
  }
}));
