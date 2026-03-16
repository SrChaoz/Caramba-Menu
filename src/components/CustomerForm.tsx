import { useCartStore } from '@/store/cartStore';

interface Props {
  onNext: () => void;
}

export default function CustomerForm({ onNext }: Props) {
  const { customer, setCustomer } = useCartStore();

  const isValid = customer.name.trim() !== '' && customer.address.trim() !== '';

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <h2 className="text-2xl font-black uppercase tracking-wider text-white">
        Datos de entrega 📋
      </h2>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-caramba-muted text-sm font-bold uppercase mb-2 block tracking-wider">
            Tu Nombre
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: María García"
            value={customer.name}
            onChange={(e) => setCustomer({ name: e.target.value })}
          />
        </div>

        <div>
          <label className="text-caramba-muted text-sm font-bold uppercase mb-2 block tracking-wider">
            Dirección
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Av. Principal #123"
            value={customer.address}
            onChange={(e) => setCustomer({ address: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[#2EBA5B] font-bold bg-[#2EBA5B]/10 p-4 rounded-xl border border-[#2EBA5B]/20 mt-2">
        <span className="text-2xl">🚚</span> Envío GRATIS
      </div>

      <button onClick={onNext} disabled={!isValid} className="btn-primary mt-6 text-lg py-5">
        VER RESUMEN →
      </button>
    </div>
  );
}
