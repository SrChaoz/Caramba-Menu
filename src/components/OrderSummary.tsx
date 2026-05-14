'use client';

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
  const { customer, items, total, modeByProduct, getTotalQuantity } = store;
  const menuStore = useMenuStore();
  const [isSending, setIsSending] = useState(false);

  const quantity = getTotalQuantity();

  // Determinar promoción aplicable
  const appliedPromo = menuStore.promociones
    .filter(p => quantity >= p.condicion_valor)
    .sort((a, b) => b.condicion_valor - a.condicion_valor)[0] || null;

  const handleSend = async () => {
    if (isSending) return;
    setIsSending(true);

    const ticketId = `#${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Payload para WhatsApp
    const payload = {
      customer,
      items,
      total,
      ticketId,
      promo: appliedPromo ? appliedPromo.recompensa : null
    };

    // 1. Redirigir a WhatsApp (Síncrono para evitar el bloqueo del navegador)
    const url = buildWhatsAppURL(payload as any);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // 2. Guardar en Supabase (Background)
    try {
      // Preparar DATA para tabla legada 'pedidos'
      const legacyIngredients: string[] = [];
      const legacyExtras: any[] = [];
      
      // Agrupar ítems para el resumen legado (similar a como lo hacía antes)
      items.forEach((item, idx) => {
        if (items.length > 1) {
          legacyIngredients.push(`--- ${item.productoNombre} (${idx + 1}) ---`);
        } else {
          legacyIngredients.push(`--- ${item.productoNombre} ---`);
        }

        if (item.tipo === 'configurable') {
          const { extraIds, surchargeDetails } = menuStore.calculateExtras(item.productoId, item.selectedToppings);
          const baseIds = item.selectedToppings.filter(id => !extraIds.includes(id));
          
          legacyIngredients.push(...menuStore.sortToppings(baseIds).map(id => menuStore.toppings.find(t => t.id === id)?.label || id));
          
          surchargeDetails.forEach(s => legacyExtras.push({ nombre: `[B${idx+1}] Recargo: ${s.label}`, precio: s.amount }));
          extraIds.forEach(id => {
            const t = menuStore.toppings.find(t => t.id === id);
            if (t) legacyExtras.push({ nombre: `[B${idx+1}] Extra: ${t.label}`, precio: t.price });
          });
        } else {
          if (item.productoIngredientesTexto) {
            legacyIngredients.push(item.productoIngredientesTexto);
          }
          if (item.nota) legacyIngredients.push(`Nota: ${item.nota}`);
        }
      });

      if (appliedPromo) {
        legacyExtras.push({ nombre: `Regalo: ${appliedPromo.recompensa}`, precio: 0 });
      }

      // Insertar pedido principal (generamos ID localmente para evitar RLS select issues)
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const pedidoId = generateUUID();

      const { error: pedidoError } = await supabase.from('pedidos').insert({
        id: pedidoId,
        codigo_ticket: ticketId,
        dia_entrega: customer.deliveryDay?.toUpperCase() || 'FIN DE SEMANA',
        bloque_horario: '19:00 - 21:00',
        cliente_nombre: customer.name,
        cliente_telefono: customer.phone,
        cliente_direccion: customer.address,
        cantidad_burritos: quantity,
        total: total,
        estado: 'no_confirmado',
        ingredientes: legacyIngredients,
        extras: legacyExtras,
        metodo_pago: customer.paymentMethod || 'Efectivo'
      });

      if (pedidoError) {
        console.error('Error insertando pedido:', pedidoError);
        throw pedidoError;
      }

      // Insertar ítems granulares en pedido_items
      const itemsToInsert = items.map(item => {
        const { extraCost, surchargeCost, surchargeDetails } = item.tipo === 'configurable'
          ? menuStore.calculateExtras(item.productoId, item.selectedToppings)
          : { extraCost: 0, surchargeCost: 0, surchargeDetails: [] as { id: string; amount: number; label: string }[] };

        return {
          pedido_id: pedidoId,
          producto_id: item.productoId,
          producto_nombre: item.productoNombre,
          cantidad: 1,
          ingredientes: item.selectedToppings,
          extras: surchargeDetails,
          nota: item.nota || null,
          subtotal: item.basePrice + extraCost + surchargeCost
        };
      });

      await supabase.from('pedido_items').insert(itemsToInsert);

    } catch (error) {
      console.error('Error guardando pedido:', error);
    }
  };

  const resolveLabel = (id: string) => menuStore.toppings.find(t => t.id === id)?.label ?? id;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-10">
      <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
        Resumen de pedido <Receipt className="w-6 h-6" />
      </h2>

      <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 flex flex-col gap-6">
        {/* Info Cliente */}
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
            <CreditCard className="w-6 h-6" /> <span>Pago: {customer.paymentMethod}</span>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="flex flex-col gap-6 pb-5 border-b-2 border-caramba-border border-dashed">
          {items.map((item, i) => {
            const extras = item.tipo === 'configurable'
              ? menuStore.calculateExtras(item.productoId, item.selectedToppings)
              : { extraCost: 0, extraIds: [] as string[], surchargeCost: 0, surchargeDetails: [] as { id: string; amount: number; label: string }[] };
            const { extraCost, extraIds, surchargeCost, surchargeDetails } = extras;

            const baseIds = item.tipo === 'configurable' 
              ? item.selectedToppings.filter(id => !extraIds.includes(id))
              : [];
            const itemTotal = item.basePrice + extraCost + surchargeCost;

            return (
              <div key={item.instanceId} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-caramba-red font-black text-sm uppercase tracking-widest">
                    {item.productoNombre} {items.length > 1 ? i + 1 : ''}
                  </span>
                  <span className="text-white font-black text-xs opacity-70">
                    ${itemTotal.toFixed(2)}
                  </span>
                </div>

                {item.tipo === 'configurable' ? (
                  <>
                    <span className="text-white text-sm font-medium leading-relaxed">
                      {baseIds.length > 0 
                        ? menuStore.sortToppings(baseIds).map(resolveLabel).join(', ')
                        : 'Sin ingredientes seleccionados'}
                    </span>
                    
                    {/* Surcharges (Doble Proteína) */}
                    {surchargeDetails.map((s, idx) => (
                      <span key={`surcharge-${idx}`} className="text-caramba-red text-sm font-bold mt-1">
                        🥩 {s.label} (+${s.amount.toFixed(2)})
                      </span>
                    ))}

                    {/* Extras Over Limit */}
                    {extraIds.length > 0 && (
                      <span className="text-[#2EBA5B] text-sm font-bold mt-1">
                        ✨ Extras (+${extraCost.toFixed(2)}): {menuStore.sortToppings(extraIds).map(resolveLabel).join(', ')}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-1 mt-1">
                    {item.productoIngredientesTexto && (
                      <span className="text-white text-sm font-medium leading-relaxed">
                        {item.productoIngredientesTexto}
                      </span>
                    )}
                    {item.nota ? (
                      <span className="text-caramba-red text-sm font-bold mt-1">
                        📝 Nota: {item.nota}
                      </span>
                    ) : (
                      <span className="text-caramba-muted text-sm italic opacity-50">
                        Sin notas adicionales
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-caramba-muted font-black uppercase tracking-wider flex items-center gap-2">
            <Package className="w-5 h-5" /> {quantity} {quantity === 1 ? 'Producto' : 'Productos'}
          </span>
          <span className="text-3xl font-black text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Promoción */}
      {appliedPromo && (
        <div className="flex flex-col gap-1 bg-[#F59E0B]/10 p-4 rounded-xl border border-[#F59E0B]/20">
          <div className="flex items-center gap-3 font-bold uppercase tracking-wider text-xs text-[#F59E0B]">
            🎁 ¡Promo Aplicada!
          </div>
          <span className="text-xs font-medium text-white">
            Incluiremos un/a <strong>{appliedPromo.recompensa}</strong> gratis.
          </span>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="w-1/4 bg-caramba-surface border-2 border-caramba-border text-caramba-muted py-5 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
          <ArrowLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={handleSend}
          disabled={isSending}
          className="w-3/4 bg-caramba-red text-white py-5 rounded-2xl text-xl font-black uppercase shadow-[0_0_30px_rgba(192,0,12,0.3)] active:scale-95 disabled:opacity-50"
        >
          {isSending ? 'ENVIANDO...' : 'ENVIAR PEDIDO'}
        </button>
      </div>
    </div>
  );
}
