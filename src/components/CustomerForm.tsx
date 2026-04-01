import { useCartStore } from '@/store/cartStore';
import { ClipboardList, Truck, ArrowRight, Calendar } from 'lucide-react';
import { DeliveryDay } from '@/types';

interface Props {
  onNext: () => void;
}

export default function CustomerForm({ onNext }: Props) {
  const { customer, setCustomer } = useCartStore();

  const isValid = customer.name.trim() !== '' && customer.address.trim() !== '' && customer.phone.trim() !== '' && customer.deliveryDay !== '';

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
        Datos de entrega <ClipboardList className="w-6 h-6" />
      </h2>

      <div className="flex flex-col gap-6">
        <div>
          <label className="text-caramba-muted text-sm font-bold uppercase mb-2 block tracking-wider">
            Tu Nombre
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Nombre Apellido"
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
            placeholder="Ej: Av. Principal y Secundaria"
            value={customer.address}
            onChange={(e) => setCustomer({ address: e.target.value })}
          />
        </div>

        <div>
          <label className="text-caramba-muted text-sm font-bold uppercase mb-2 block tracking-wider">
            Teléfono
          </label>
          <input
            type="tel"
            className="input-field"
            placeholder="Ej: 0987654321"
            value={customer.phone}
            onChange={(e) => {
              const onlyNumbers = e.target.value.replace(/[^0-9]/g, '');
              setCustomer({ phone: onlyNumbers });
            }}
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={15}
          />
        </div>

        {/* Selector de Día de Entrega */}
        <div className="bg-caramba-surface/50 p-4 rounded-2xl border border-caramba-border mt-2">
          <label className="text-caramba-muted text-sm font-bold uppercase mb-3 flex items-center gap-2 tracking-wider">
            <Calendar className="w-4 h-4" /> ¿Qué día te entregamos? (7 a 9 PM)
          </label>
          <div className="flex flex-col gap-2">
            {(['Viernes', 'Sábado'] as DeliveryDay[]).map((day) => (
              <button
                key={day}
                onClick={() => setCustomer({ deliveryDay: day })}
                className={`w-full py-4 px-4 rounded-xl font-bold uppercase tracking-wide transition-all ${customer.deliveryDay === day
                    ? 'bg-caramba-red text-white shadow-[0_0_15px_rgba(192,0,12,0.4)] scale-100'
                    : 'bg-caramba-bg border-2 border-caramba-border text-caramba-muted hover:border-caramba-red/50 hover:text-white'
                  }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[#2EBA5B] bg-[#2EBA5B]/10 p-4 rounded-xl border border-[#2EBA5B]/20 mt-2">
        <div className="flex items-center gap-3 font-bold">
          <Truck className="w-6 h-6" /> Envío GRATIS
        </div>
        <span className="text-xs opacity-80 pl-9">*Aplica términos y condiciones</span>
      </div>

      <button onClick={onNext} disabled={!isValid} className="btn-primary mt-6 text-lg py-5 flex items-center justify-center gap-2">
        VER RESUMEN <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
