import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// ============================================================
// INTERFACES — Mapeadas al esquema de PRODUCCIÓN (mixiwhgzaoyiaqsangez)
// ============================================================

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  min_toppings: number;
  free_toppings_limit: number;
  orden: number;
  activo: boolean;
  visible_web: boolean;
  tipo: 'configurable' | 'simple' | 'bebida';
  emoji: string;
  imagen_url: string | null;
  ingredientes_texto?: string;
}

export interface ToppingCategory {
  id: string;
  productoId: string;
  name: string;
  required?: boolean;
  maxSeleccion: number | null; 
}

export interface Topping {
  id: string;
  categoryId: string;
  label: string;
  emoji: string;
  exclusiveGroup?: string;
  price: number; 
  surcharge: number;
  comboPrice: number;
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

interface MenuState {
  productos: Producto[];
  categories: ToppingCategory[];
  toppings: Topping[];
  promociones: Promocion[];
  whatsappPhone: string;
  deliveryDays: string[];
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  
  // Helpers
  getProductConfig: (productoId: string) => Producto | null;
  getCategoriesByProduct: (productoId: string) => ToppingCategory[];
  getToppingsByProduct: (productoId: string) => Topping[];
  
  calculateExtras: (productoId: string, selectedIds: string[]) => { 
    extraCost: number; 
    extraIds: string[]; 
    surchargeCost: number; 
    surchargeIds: string[]; 
    surchargeDetails: { id: string; amount: number; label: string }[] 
  };
  validateItem: (productoId: string, selectedIds: string[]) => boolean;
  sortToppings: (selectedIds: string[]) => string[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  productos: [],
  categories: [],
  toppings: [],
  promociones: [],
  whatsappPhone: '',
  deliveryDays: [],
  isLoading: true,
  error: null,

  fetchMenu: async () => {
    try {
      set({ isLoading: true, error: null });

      const [confRes, prodRes, catRes, topRes, promoRes] = await Promise.all([
        supabase.from('restaurante_config').select('*'),
        supabase.from('menu_productos').select('*').eq('activo', true).eq('visible_web', true).order('orden'),
        supabase.from('menu_categorias').select('*').order('orden'),
        supabase.from('menu_toppings').select('*').eq('disponible', true).order('orden'),
        supabase.from('promociones').select('*').eq('activo', true).order('condicion_valor', { ascending: false })
      ]);

      const productos: Producto[] = (prodRes.data || []).map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio_base: Number(p.precio_base),
        min_toppings: Number(p.min_toppings ?? 0),
        free_toppings_limit: Number(p.free_toppings_limit ?? 0),
        orden: Number(p.orden ?? 0),
        activo: p.activo,
        visible_web: p.visible_web ?? true,
        tipo: (p.tipo ?? 'configurable') as 'configurable' | 'simple' | 'bebida',
        emoji: p.emoji ?? '🍽️',
        imagen_url: p.imagen_url ?? null,
        ingredientes_texto: p.ingredientes_texto ?? undefined,
      }));

      const categories: ToppingCategory[] = (catRes.data || []).map(c => ({
        id: c.id,
        productoId: c.producto_id,
        name: c.nombre,
        required: c.es_requerido,
        maxSeleccion: c.max_seleccion ?? null,
      }));

      const toppings: Topping[] = (topRes.data || []).map(t => ({
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

      // Extraer whatsapp_phone de restaurante_config
      const rawPhone = confRes.data?.find(c => c.clave === 'whatsapp_phone')?.valor || '';
      // El valor puede venir como JSON string con comillas
      const cleanPhone = typeof rawPhone === 'string' ? rawPhone.replace(/"/g, '') : String(rawPhone);

      // Extraer dias_entrega
      const rawDays = confRes.data?.find(c => c.clave === 'dias_entrega')?.valor;
      let parsedDays: string[] = ['Viernes', 'Sábado']; // Default
      if (rawDays) {
        try {
          parsedDays = typeof rawDays === 'string' ? JSON.parse(rawDays) : rawDays;
          if (!Array.isArray(parsedDays)) parsedDays = ['Viernes', 'Sábado'];
        } catch (e) {
          console.error('Error parsing dias_entrega', e);
        }
      }

      const sortDays = (days: string[]) => {
        const dayOrder: Record<string, number> = {
          'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
          'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 7
        };
        return [...days].sort((a, b) => (dayOrder[a.toLowerCase()] || 99) - (dayOrder[b.toLowerCase()] || 99));
      };

      set({ 
        productos, 
        categories, 
        toppings, 
        promociones: promoRes.data || [], 
        whatsappPhone: cleanPhone,
        deliveryDays: sortDays(parsedDays),
        isLoading: false 
      });

    } catch (err: any) {
      console.error('Error fetching menu:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  getProductConfig: (productoId) => get().productos.find(p => p.id === productoId) ?? null,
  
  getCategoriesByProduct: (productoId) => get().categories.filter(c => c.productoId === productoId),
  
  getToppingsByProduct: (productoId) => {
    const cats = get().getCategoriesByProduct(productoId).map(c => c.id);
    return get().toppings.filter(t => cats.includes(t.categoryId));
  },

  calculateExtras: (productoId, selectedIds) => {
    const { toppings } = get();
    const producto = get().getProductConfig(productoId);
    if (!producto) return { extraCost: 0, extraIds: [], surchargeCost: 0, surchargeIds: [], surchargeDetails: [] };

    const freeToppingsLimit = producto.free_toppings_limit;
    const freeIds = selectedIds.slice(0, freeToppingsLimit);

    const proteinsInFree = freeIds
      .map(id => toppings.find(to => to.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t && t.exclusiveGroup === 'meat');

    let surchargeCost = 0;
    const surchargeIds: string[] = [];
    const surchargeDetails: { id: string; amount: number; label: string }[] = [];

    if (proteinsInFree.length > 0) {
      const primary = proteinsInFree[0];
      const secondaries = proteinsInFree.slice(1);

      if (primary.surcharge > 0) {
        surchargeIds.push(primary.id);
        surchargeCost += primary.surcharge;
      }

      for (const sec of secondaries) {
        if (sec.price > 0) {
          surchargeIds.push(sec.id);
          surchargeCost += sec.price;
          surchargeDetails.push({ id: sec.id, amount: sec.price, label: `Extra: ${sec.label}` });
        }
      }
    }

    const otherSurcharges = freeIds
      .map(id => toppings.find(to => to.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t && t.surcharge > 0 && t.exclusiveGroup !== 'meat');

    for (const other of otherSurcharges) {
      surchargeIds.push(other.id);
      surchargeCost += other.surcharge;
      surchargeDetails.push({ id: other.id, amount: other.surcharge, label: `Recargo: ${other.label}` });
    }

    let extraCost = 0;
    const extraIds: string[] = [];

    if (selectedIds.length > freeToppingsLimit) {
      const eIds = selectedIds.slice(freeToppingsLimit);
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

  validateItem: (productoId, selectedIds) => {
    const producto = get().getProductConfig(productoId);
    if (!producto) return false;
    if (producto.tipo === 'simple') return true;
    if (selectedIds.length < producto.min_toppings) return false;

    const cats = get().getCategoriesByProduct(productoId);
    for (const cat of cats) {
      if (cat.required) {
        const toppingsInCat = get().toppings.filter(t => t.categoryId === cat.id);
        const hasRequired = selectedIds.some(id => toppingsInCat.some(t => t.id === id));
        if (!hasRequired) return false;
      }
    }
    return true;
  },

  sortToppings: (toppingIds) => {
    const { toppings } = get();
    const getPriority = (id: string): number => {
      if (id === 'crema-agria') return 0;
      const topping = toppings.find(t => t.id === id);
      if (!topping) return 4;
      if (topping.categoryId?.includes('base')) return 1;
      if (id.includes('frejol')) return 2;
      if (topping.categoryId?.includes('meat')) return 3;
      if (id === 'guacamole') return 5;
      return 4;
    };
    return [...toppingIds].sort((a, b) => getPriority(a) - getPriority(b) || a.localeCompare(b));
  },
}));
