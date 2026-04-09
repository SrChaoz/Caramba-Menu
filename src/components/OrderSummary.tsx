import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { useMenuStore } from '@/store/menuStore';
import { supabase } from '@/lib/supabase';
import { Receipt, User, MapPin, Package, ArrowLeft, Calendar, Phone, CreditCard } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function OrderSummary({ onBack }: Props) {
  const store = useCartStore();
  const { customer, quantity, burritos, total, mode } = store;
  const menuStore = useMenuStore();
  const [isSending, setIsSending] = useState(false);

  // Determinar promoción aplicable (la que pida más cantidad que a la vez se cumpla)
  const appliedPromo = menuStore.promociones
    .filter(p => quantity >= p.condicion_valor)
    .sort((a, b) => b.condicion_valor - a.condicion_valor)[0] || null;

  const handleSend = async () => {
    // Guard: evitar spameo y pedidos duplicados
    if (isSending) return;
    setIsSending(true);

    const ticketId = `#${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payload = {
      customer,
      quantity,
      mode: mode || 'same',
      burritos,
      total,
      ticketId,
      promo: appliedPromo ? appliedPromo.recompensa : null
    };

    // PASO 1: Redirigir a WhatsApp de forma SÍNCRONA antes de cualquier await.
    // Safari iOS bloquea window.open() si se llama después de un await porque
    // rompe la "cadena de confianza" del evento de usuario. window.location.href
    // no es un popup, por lo que nunca es bloqueado.
    const url = buildWhatsAppURL(payload as any);
    window.location.href = url;

    // PASO 2: Guardar en Supabase en segundo plano (ya redirigimos, esto es best-effort).
    // En modo 'same' todos los burritos son iguales: guardamos los ingredientes de burritos[0]
    // y cantidad_burritos ya refleja la cantidad real.
    try {
      const sourceBurrito = burritos[0];
      const ingredientsList: string[] = [];
      const extrasList: { nombre: string; precio: number }[] = [];

      const { extraIds, surchargeDetails } = menuStore.calculateExtras(sourceBurrito.selectedToppings);
      const baseIds = sourceBurrito.selectedToppings.filter(id => !extraIds.includes(id));

      ingredientsList.push(...menuStore.sortToppings(baseIds).map(resolveLabel));

      surchargeDetails.forEach(sConfig => {
        extrasList.push({ nombre: sConfig.label, precio: sConfig.amount });
      });

      extraIds.forEach(eid => {
        const topping = menuStore.toppings.find(t => t.id === eid);
        if (topping) {
          extrasList.push({ nombre: topping.label, precio: topping.price || 0 });
        }
      });

      if (mode !== 'same') {
        // Modo diferente: añadir ingredientes de los burritos restantes separados por '---'
        burritos.slice(1).forEach((b, i) => {
          const { extraIds: eIds, surchargeDetails: sDetails } = menuStore.calculateExtras(b.selectedToppings);
          const bIds = b.selectedToppings.filter(id => !eIds.includes(id));
          ingredientsList.push(`--- Burrito ${i + 2}`);
          ingredientsList.push(...menuStore.sortToppings(bIds).map(resolveLabel));
          
          sDetails.forEach(sConfig => {
            extrasList.push({ nombre: `[B${i+2}] ${sConfig.label}`, precio: sConfig.amount });
          });

          eIds.forEach(eid => {
            const topping = menuStore.toppings.find(t => t.id === eid);
            if (topping) extrasList.push({ nombre: `[B${i+2}] ${topping.label}`, precio: topping.price || 0 });
          });
        });
      }

      if (appliedPromo) {
        extrasList.push({ nombre: `Promoción: ${appliedPromo.recompensa}`, precio: 0 });
      }

      await supabase.from('pedidos').insert({
        codigo_ticket: ticketId,
        dia_entrega: customer.deliveryDay?.toUpperCase() || 'FIN DE SEMANA',
        bloque_horario: '19:00 - 21:00',
        cliente_nombre: customer.name,
        cliente_telefono: customer.phone,
        cliente_direccion: customer.address,
        cantidad_burritos: quantity,
        total: total,
        estado: 'no_confirmado',
        ingredientes: ingredientsList,
        extras: extrasList,
        metodo_pago: customer.paymentMethod || 'Efectivo'
      });
    } catch (error) {
      console.error('Error guardando en Supabase:', error);
    }
  };

  const resolveLabel = (id: string) => menuStore.toppings.find(t => t.id === id)?.label ?? id;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-10">
      <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
        Resumen de pedido <Receipt className="w-6 h-6" />
      </h2>

      <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 flex flex-col gap-6">
        {/* Customer info */}
        <div className="flex flex-col gap-2 pb-5 border-b-2 border-caramba-border border-dashed">
          <div className="flex items-center gap-3 text-caramba-text font-bold text-lg">
            <User className="w-6 h-6 text-caramba-muted" /> {customer.name}
          </div>
          <div className="flex items-center gap-3 text-caramba-muted text-sm font-medium">
            <MapPin className="w-6 h-6" /> {customer.address}
          </div>
          <div className="flex items-center gap-3 text-caramba-muted text-sm font-medium">
            <Phone className="w-6 h-6" /> {customer.phone}
          </div>
          <div className="flex items-center gap-3 text-caramba-red text-sm font-black uppercase mt-1">
            <Calendar className="w-6 h-6" /> Entrega: {customer.deliveryDay} (19:00 - 21:00)
          </div>
          <div className="flex items-center gap-3 text-caramba-text text-sm font-bold mt-1">
            <CreditCard className="w-6 h-6" /> <span>Método de pago: {customer.paymentMethod}</span>
          </div>
        </div>

        {/* Burritos */}
        <div className="flex flex-col gap-5 pb-5 border-b-2 border-caramba-border">
          {burritos.map((b, i) => {
            const { extraCost, extraIds, surchargeCost, surchargeDetails } = menuStore.calculateExtras(b.selectedToppings);
            const baseIds = b.selectedToppings.filter(id => !extraIds.includes(id));
            const burritoTotal = (menuStore.config?.basePrice || 0) + extraCost + surchargeCost;

            return (
              <div key={b.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-caramba-red font-black text-sm uppercase tracking-wider">
                    Burrito {i + 1}
                  </span>
                  {quantity >= 2 && (
                    <span className="text-caramba-muted font-bold text-xs bg-caramba-border/50 px-2 py-0.5 rounded-full">
                      ${burritoTotal.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-caramba-text text-sm leading-relaxed font-medium">
                  {menuStore.sortToppings(baseIds).map(resolveLabel).join(', ')}
                </span>
                {surchargeDetails.map((sConfig, idx) => (
                  <span key={idx} className="text-[#F59E0B] text-sm leading-relaxed font-bold mt-0.5">
                    🥩 {sConfig.label} (+${sConfig.amount.toFixed(2)})
                  </span>
                ))}
                {extraIds.length > 0 && (
                  <span className="text-[#2EBA5B] text-sm leading-relaxed font-bold mt-0.5">
                    ✨ Extras (+${extraCost.toFixed(2)}): {menuStore.sortToppings(extraIds).map(resolveLabel).join(', ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-caramba-muted font-black uppercase tracking-wider flex items-center gap-2">
            <Package className="w-5 h-5" /> {quantity} {quantity === 1 ? 'Burrito' : 'Burritos'}
          </span>
          <span className="text-3xl font-black text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Promoción Aplicada Banner */}
      {appliedPromo && (
        <div className="flex flex-col gap-1 text-[var(--accent)] bg-[var(--accent)]/10 p-4 rounded-xl border border-[var(--accent)]/20 shadow-md">
          <div className="flex items-center gap-3 font-bold uppercase tracking-wider text-sm">
            🎁 Promo Aplicada
          </div>
          <span className="text-sm font-medium pl-8 text-white">
            ¡Agregaremos <strong>{appliedPromo.recompensa}</strong> a tu pedido completamente GRATIS! 🥳
          </span>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button 
          onClick={onBack}
          className="w-1/4 bg-caramba-surface border-2 border-caramba-border text-caramba-muted hover:text-white hover:border-caramba-muted py-5 px-2 rounded-2xl text-2xl font-black transition-all active:scale-95 flex items-center justify-center"
          aria-label="Volver atrás"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        
        <button 
          onClick={handleSend}
          disabled={isSending}
          className="w-3/4 bg-caramba-red text-white py-5 px-4 rounded-2xl text-lg sm:text-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_30px_rgba(192,0,12,0.3)] hover:shadow-[0_0_40px_rgba(192,0,12,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isSending ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
        </button>
      </div>
    </div>
  );
}
