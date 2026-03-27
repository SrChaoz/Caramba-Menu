import { OrderPayload } from '@/types';
import { useMenuStore } from '@/store/menuStore';

export function buildWhatsAppURL(payload: OrderPayload): string {
  const { customer, quantity, burritos, total, mode } = payload;
  const menuStore = useMenuStore.getState();
  const phone = menuStore.config?.whatsappPhone || '593987543310';

  // Resuelve el label de un topping a partir de su id y opcionalmente añade el precio
  const resolveLabel = (id: string, includePrice = false): string => {
    const t = menuStore.toppings.find(to => to.id === id);
    if (!t) return id;
    if (includePrice && t.price > 0) return `${t.label} (+$${t.price.toFixed(2)})`;
    return t.label;
  };

  // Construye el detalle de cada burrito (usando burritos[0] si es 'same')
  const generateBurritoText = (b: typeof burritos[0], idx?: number) => {
    const { extraCost, extraIds } = menuStore.calculateExtras(b.selectedToppings);
    const baseIds = b.selectedToppings.filter(id => !extraIds.includes(id));
    
    const baseLabels = menuStore.sortToppings(baseIds).map(l => resolveLabel(l)).join(', ');
    
    let text = idx !== undefined 
      ? `🌯 Burrito ${idx + 1}:\n   ${baseLabels}.`
      : `🌯 Ingredientes:\n   ${baseLabels}.`;

    if (extraIds.length > 0) {
      const extraLabels = menuStore.sortToppings(extraIds).map(l => resolveLabel(l, true)).join(', ');
      text += `\n   ✨ Extras: ${extraLabels}`;
    }
    
    return text;
  };

  let burritoLines = '';
  if (mode === 'same') {
    const label = quantity > 1 ? `${quantity} Burritos iguales` : 'Ingredientes';
    burritoLines = generateBurritoText(burritos[0]).replace('🌯 Ingredientes', `🌯 ${label}`);
  } else {
    burritoLines = burritos.map((b, i) => generateBurritoText(b, i)).join('\n\n');
  }

  const totalFormatted = `$${total.toFixed(2)}`;
  const qtyLabel = quantity === 1 ? '1 Burrito' : `${quantity} Burritos`;

  const titleLine = payload.ticketId 
    ? `¡Hola CARAMBA! 🌯 Quiero realizar un pedido. (Ticket *${payload.ticketId}*)` 
    : '¡Hola CARAMBA! 🌯 Quiero realizar un pedido.';

  const message = [
    titleLine,
    '',
    `🗓️ *Para entregar el:* ${customer.deliveryDay?.toUpperCase() || 'FIN DE SEMANA'} (19:00 - 21:00)`,
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
