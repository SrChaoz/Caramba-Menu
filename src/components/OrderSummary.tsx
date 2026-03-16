import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { TOPPINGS } from '@/config/menu';
import { Receipt, User, MapPin, Package, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function OrderSummary({ onBack }: Props) {
  const store = useCartStore();
  const { customer, quantity, burritos, total, mode } = store;

  const handleSend = () => {
    const payload = {
      customer,
      quantity,
      mode: mode || 'same', // Fallback for single item mode
      burritos,
      total,
    };
    const url = buildWhatsAppURL(payload);
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
        </div>

        {/* Burritos */}
        <div className="flex flex-col gap-5 pb-5 border-b-2 border-caramba-border">
          {burritos.map((b, i) => (
            <div key={b.id} className="flex flex-col gap-1.5">
              <span className="text-caramba-red font-black text-sm uppercase tracking-wider">
                Burrito {i + 1}
              </span>
              <span className="text-caramba-text text-sm leading-relaxed font-medium">
                {b.selectedToppings.map(resolveLabel).join(', ')}
              </span>
            </div>
          ))}
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
