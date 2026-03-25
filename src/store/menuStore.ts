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
  price: number;
  disponible: boolean;
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
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  
  // Helpers
  calculateExtras: (selectedIds: string[]) => { extraCost: number, extraIds: string[] };
  validateBurrito: (selectedIds: string[]) => boolean;
  sortToppings: (selectedIds: string[]) => string[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  config: null,
  categories: [],
  toppings: [],
  isLoading: true,
  error: null,

  fetchMenu: async () => {
    try {
      set({ isLoading: true, error: null });

      // Parallel fetch
      const [confRes, prodRes, catRes, topRes] = await Promise.all([
        supabase.from('restaurante_config').select('*'),
        supabase.from('menu_productos').select('*').eq('id', 'burrito-armalo').single(),
        supabase.from('menu_categorias').select('*').eq('producto_id', 'burrito-armalo').order('orden'),
        supabase.from('menu_toppings').select('*').order('orden')
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
        .filter(t => catIds.includes(t.categoria_id))
        .map(t => ({
          id: t.id,
          categoryId: t.categoria_id,
          label: t.nombre,
          emoji: t.emoji || '',
          exclusiveGroup: t.exclusive_group,
          price: Number(t.precio_extra),
          disponible: t.disponible
        }));

      set({ config, categories, toppings, isLoading: false });

    } catch (err: any) {
      console.error('Error fetching menu:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  calculateExtras: (selectedIds: string[]) => {
    const { config, toppings } = get();
    if (!config) return { extraCost: 0, extraIds: [] };

    if (selectedIds.length <= config.freeToppingsLimit) {
      return { extraCost: 0, extraIds: [] };
    }
    
    const extraIds = selectedIds.slice(config.freeToppingsLimit);
    let extraCost = 0;
    
    extraIds.forEach(id => {
      const t = toppings.find(to => to.id === id);
      if (t && t.price) {
        extraCost += t.price;
      }
    });

    return { extraCost, extraIds };
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
