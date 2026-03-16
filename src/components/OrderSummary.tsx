import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppURL } from '@/lib/whatsapp';
import { TOPPINGS } from '@/config/menu';

export default function OrderSummary() {
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
      <h2 className="text-2xl font-black uppercase tracking-wider text-white">
        Resumen de pedido 🧾
      </h2>

      <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 flex flex-col gap-6">
        {/* Customer info */}
        <div className="flex flex-col gap-2 pb-5 border-b-2 border-caramba-border border-dashed">
          <div className="flex items-center gap-3 text-caramba-text font-bold text-lg">
            <span className="text-2xl">👤</span> {customer.name}
          </div>
          <div className="flex items-center gap-3 text-caramba-muted text-sm font-medium">
            <span className="text-2xl">📍</span> {customer.address}
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
          <span className="text-caramba-muted font-black uppercase tracking-wider">
            📦 {quantity} {quantity === 1 ? 'Burrito' : 'Burritos'}
          </span>
          <span className="text-3xl font-black text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <button 
        onClick={handleSend} 
        className="mt-6 w-full bg-caramba-red text-white py-5 px-6 rounded-2xl text-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_30px_rgba(192,0,12,0.3)] hover:shadow-[0_0_40px_rgba(192,0,12,0.4)]"
      >
        ENVIAR PEDIDO POR WHATSAPP
      </button>
    </div>
  );
}
