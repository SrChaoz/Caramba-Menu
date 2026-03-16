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
    return `🌯 Burrito ${i + 1}:\n   ${labels}.`;
  }).join('\n\n');

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
    burritoLines,
  ].join('\n');

  // Para WhatsApp Web es común que `encodeURIComponent` rompa emojis compuestos o multiforme
  // Una alternativa directa y más segura es aislar la codificación estándar y arreglar espacios
  // Otra opción que WhatsApp nativo prefiere es `window.encodeURI` o directamente enviar los emojis sin codificar,
  // dejando que la app/OS los parsee.
  let encodedMessage = encodeURI(message).replace(/#/g, '%23').replace(/\+/g, '%2B');
  
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
