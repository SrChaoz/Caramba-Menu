import { useMenuStore } from '@/store/menuStore';

export function buildWhatsAppURL(payload: any): string {
  const { customer, items, total } = payload;
  const menuStore = useMenuStore.getState();
  const rawPhone = menuStore.whatsappPhone || '593987543310';
  const phone = rawPhone.replace(/\D/g, ''); 

  const resolveLabel = (id: string, includePrice = false): string => {
    const t = menuStore.toppings.find(to => to.id === id);
    if (!t) return id;
    if (includePrice && t.price > 0) return `${t.label} (+$${t.price.toFixed(2)})`;
    return t.label;
  };

  const generateItemText = (item: any, idx?: number) => {
    let text = `🌯 ${item.productoNombre}`;
    if (items.length > 1) {
      text += ` ${idx !== undefined ? idx + 1 : ''}:`;
    } else {
      text += ':';
    }

    if (item.tipo === 'configurable') {
      const { extraIds, surchargeDetails } = menuStore.calculateExtras(item.productoId, item.selectedToppings);
      
      // Ingredientes base (incluye las carnes extra/surcharges, ya que estas van en la misma línea)
      const baseIds = item.selectedToppings.filter((id: string) => !extraIds.includes(id));
      const baseLabels = menuStore.sortToppings(baseIds).map(l => resolveLabel(l)).join(', ');
      
      text += `\n   ${baseLabels || 'Ninguno'}.`;
      
      if (extraIds.length > 0) {
        const extraLabels = menuStore.sortToppings(extraIds).map(l => resolveLabel(l, true)).join(', ');
        text += `\n   ✨ Extras: ${extraLabels}`;
      }
    } else {
      if (item.productoIngredientesTexto) {
        text += `\n   ${item.productoIngredientesTexto}`;
      }
      if (item.nota) text += `\n   📝 *Nota:* ${item.nota}`;
    }
    
    return text;
  };

  const itemLines = items.map((item: any, i: number) => generateItemText(item, i)).join('\n\n');

  const totalFormatted = `$${total.toFixed(2)}`;
  const qtyLabel = items.length === 1 ? '1 Producto' : `${items.length} Productos`;

  const titleLine = payload.ticketId 
    ? `¡Hola CARAMBA! 🌯 Quiero realizar un pedido. (Ticket *${payload.ticketId}*)` 
    : '¡Hola CARAMBA! 🌯 Quiero realizar un pedido.';

  const messageParts = [
    titleLine,
    '',
    `🗓️ Para entregar el: ${customer.deliveryDay?.toUpperCase() || 'FIN DE SEMANA'} (19:00 - 21:00)`,
    `👤 Nombre: ${customer.name}`,
    `📞 Teléfono: ${customer.phone}`,
    `📍 Dirección: ${customer.address}`,
    `📦 Cantidad: ${qtyLabel}`,
    `💳 Método de Pago: ${customer.paymentMethod}`,
    `💵 Total a pagar: ${totalFormatted}`,
  ];

  if (payload.promo) {
    messageParts.push(`🎁 PROMOCIÓN APLICADA: ${payload.promo}`);
  }

  messageParts.push(' ', itemLines);

  const message = messageParts.join('\n');
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
