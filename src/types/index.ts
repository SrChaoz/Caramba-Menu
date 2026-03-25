import type { Topping } from '@/store/menuStore';

// Un burrito configurado individualmente
export interface BurritoConfig {
  id: number;             // índice 0-based (Burrito 1 = id 0)
  selectedToppings: Topping['id'][];  // array de topping ids
}

// Modo de configuración cuando qty > 1
export type BurritoMode = 'same' | 'individual';

// Tipos permitidos para días de entrega
export type DeliveryDay = 'Viernes' | 'Sábado' | 'Domingo' | '';

// Información del cliente
export interface CustomerInfo {
  name: string;
  address: string;
  phone: string;
  deliveryDay: DeliveryDay;
}

// Payload completo para buildWhatsAppURL
export interface OrderPayload {
  customer: CustomerInfo;
  quantity: number;
  mode: BurritoMode;
  burritos: BurritoConfig[];  // length === quantity
  total: number;              // quantity * BASE_PRICE
  ticketId?: string;          // Código corto para validar el pedido
}
