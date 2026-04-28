// ============================================================
// TIPOS GLOBALES — Sistema Caramba
// ============================================================

import type { Topping } from '@/store/menuStore';

// Tipo de plato
export type ProductoTipo = 'configurable' | 'simple';

// Un ítem en el carrito (puede ser cualquier tipo de plato)
export interface CartItem {
  instanceId: string;       // UUID local único por ítem
  productoId: string;       // 'burrito-armalo', 'arroz-chino', etc.
  productoNombre: string;   // Nombre para display
  productoEmoji: string;    // Emoji del plato
  tipo: ProductoTipo;       // 'configurable' = toppings | 'simple' = solo nota
  selectedToppings: Topping['id'][];
  nota?: string;            // Para platos 'simple': indicaciones especiales
  basePrice: number;        // Precio base del plato
}

// Modo de configuración por grupo de plato (cuando qty > 1 del mismo plato configurable)
export type ItemMode = 'same' | 'individual';

// Información del cliente
export type DeliveryDay = string;

export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  deliveryDay: DeliveryDay;
  paymentMethod: 'Efectivo' | 'Transferencia' | '';
}

// Payload completo para buildWhatsAppURL y guardado en DB
export interface OrderPayload {
  customer: CustomerInfo;
  items: CartItem[];
  total: number;
  ticketId?: string;
  promo?: string | null;
}

// Compatibilidad (se irá eliminando)
export interface BurritoConfig {
  id: number;
  selectedToppings: Topping['id'][];
}
export type BurritoMode = 'same' | 'individual';
