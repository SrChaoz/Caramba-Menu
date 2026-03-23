import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { TOPPINGS, sortToppings, calculateExtras } from '@/config/menu';
import { supabase } from '@/lib/supabase';
import { Receipt, User, MapPin, Package, ArrowLeft, Calendar, Phone } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function OrderSummary({ onBack }: Props) {
  const store = useCartStore();
  const { customer, quantity, burritos, total, mode } = store;


  const handleSend = async () => {
    const ticketId = `#${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Preparar el payload correcto (OrderPayload)
    const payload = {
      customer,
      quantity,
      mode: mode || 'same',
      burritos,
      total,
      ticketId,
    };

    try {
      const allBurritos = mode === 'same' ? [burritos[0]] : burritos;
      const ingredientsList: string[] = [];
      const extrasList: { nombre: string; precio: number }[] = [];

      allBurritos.forEach((b) => {
        const { extraIds } = calculateExtras(b.selectedToppings);
        const baseIds = b.selectedToppings.filter(id => !extraIds.includes(id));
        
        ingredientsList.push(...sortToppings(baseIds).map(resolveLabel));
        
        extraIds.forEach(eid => {
          const topping = TOPPINGS.find(t => t.id === eid);
          if (topping) {
            extrasList.push({ nombre: topping.label, precio: topping.price || 0 });
          }
        });
      });

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
        extras: extrasList
      });
    } catch (error) {
      console.error('Error guardando en Supabase:', error);
    }

    const url = buildWhatsAppURL(payload as any); // Tipado asegurado internamente
    window.open(url, '_blank');
  };

  const resolveLabel = (id: string) => TOPPINGS.find(t => t.id === id)?.label ?? id;

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
        </div>

        {/* Burritos */}
        <div className="flex flex-col gap-5 pb-5 border-b-2 border-caramba-border">
          {burritos.map((b, i) => {
            const { extraCost, extraIds } = calculateExtras(b.selectedToppings);
            const baseIds = b.selectedToppings.filter(id => !extraIds.includes(id));

            return (
              <div key={b.id} className="flex flex-col gap-1.5">
                <span className="text-caramba-red font-black text-sm uppercase tracking-wider">
                  Burrito {i + 1}
                </span>
                <span className="text-caramba-text text-sm leading-relaxed font-medium">
                  {sortToppings(baseIds).map(resolveLabel).join(', ')}
                </span>
                {extraIds.length > 0 && (
                  <span className="text-[#2EBA5B] text-sm leading-relaxed font-bold mt-0.5">
                    ✨ Extras (+${extraCost.toFixed(2)}): {sortToppings(extraIds).map(resolveLabel).join(', ')}
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
          className="w-3/4 bg-caramba-red text-white py-5 px-4 rounded-2xl text-lg sm:text-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_30px_rgba(192,0,12,0.3)] hover:shadow-[0_0_40px_rgba(192,0,12,0.4)]"
        >
          ENVIAR PEDIDO
        </button>
      </div>
    </div>
  );
}
