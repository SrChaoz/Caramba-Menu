import { OrderPayload } from '@/types';
import { MENU_CONFIG, TOPPINGS } from '@/config/menu';

export function buildWhatsAppURL(payload: OrderPayload): string {
  const { customer, quantity, burritos, total } = payload;
  const phone = MENU_CONFIG.whatsapp.phone;

  // Resuelve el label de un topping a partir de su id
  const resolveLabel = (id: string): string =>
    TOPPINGS.find(t => t.id === id)?.label ?? id;

  // Construye el detalle de cada burrito
  const burritoLines = burritos.map((b, i) => {
    const labels = b.selectedToppings.map(resolveLabel).join(', ');
    return `Burrito ${i + 1}: ${labels}.`;
  }).join('\n');

  const totalFormatted = `$${total.toFixed(2)}`;
  const qtyLabel = quantity === 1 ? '1 Burrito' : `${quantity} Burritos`;

  const message = [
    '¡Hola CARAMBA! 🌯 Quiero realizar un pedido.',
    '',
    `👤 Nombre: ${customer.name}`,
    `📍 Dirección: ${customer.address}`,
    `📦 Cantidad: ${qtyLabel}`,
    `💵 Total a pagar: ${totalFormatted}`,
    '',
    '🌮 Detalle del Pedido:',
    burritoLines,
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
