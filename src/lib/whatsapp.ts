import { OrderPayload } from '@/types';
import { MENU_CONFIG, TOPPINGS, sortToppings } from '@/config/menu';

export function buildWhatsAppURL(payload: OrderPayload): string {
  const { customer, quantity, burritos, total } = payload;
  const phone = MENU_CONFIG.whatsapp.phone;

  // Resuelve el label de un topping a partir de su id
  const resolveLabel = (id: string): string =>
    TOPPINGS.find(t => t.id === id)?.label ?? id;

  // Construye el detalle de cada burrito
  const burritoLines = burritos.map((b, i) => {
    const sortedToppings = sortToppings(b.selectedToppings);
    const labels = sortedToppings.map(resolveLabel).join(', ');
    return `🌯 Burrito ${i + 1}:\n   ${labels}.`;
  }).join('\n\n');

  const totalFormatted = `$${total.toFixed(2)}`;
  const qtyLabel = quantity === 1 ? '1 Burrito' : `${quantity} Burritos`;

  const message = [
    '¡Hola CARAMBA! 🌯 Quiero realizar un pedido.',
    '',
    `🗓️ *Para entregar el:* ${customer.deliveryDay?.toUpperCase() || 'FIN DE SEMANA'} (7:00pm - 8:00pm)`,
    `👤 *Nombre:* ${customer.name}`,
    `📞 *Teléfono:* ${customer.phone}`,
    `📍 *Dirección:* ${customer.address}`,
    `📦 *Cantidad:* ${qtyLabel}`,
    `💵 *Total a pagar:* ${totalFormatted}`,
    '',
    burritoLines,
  ].join('\n');

  // Usar encodeURIComponent es el estándar correcto para parámetros de consulta (query strings)
  // y usar api.whatsapp.com previene pérdida de datos o emojis en redesirecciones de wa.me en Desktop
  const encodedMessage = encodeURIComponent(message);
  
  return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodedMessage}`;
}
