'use client';

import { useCartStore } from '@/store/cartStore';
import { CartItem } from '@/types';

interface Props {
  item: CartItem;
}

/**
 * SimpleItemForm: Formulario para platos tipo 'simple'.
 * Solo muestra el nombre del plato y un campo de nota opcional.
 */
export default function SimpleItemForm({ item }: Props) {
  const { setNota } = useCartStore();

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      {/* Header visual del plato */}
      <div className="flex items-center gap-4 bg-caramba-surface border border-caramba-border rounded-2xl p-5">
        <span className="text-4xl">{item.productoEmoji}</span>
        <div>
          <div className="text-white font-black text-lg leading-tight">{item.productoNombre}</div>
          <div className="text-caramba-red font-bold text-base">${item.basePrice.toFixed(2)}</div>
        </div>
      </div>

      {/* Campo de nota */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-caramba-muted uppercase tracking-wide">
          ¿Alguna indicación especial? <span className="normal-case font-normal text-caramba-muted/50">(opcional)</span>
        </label>
        <textarea
          value={item.nota || ''}
          onChange={e => setNota(item.instanceId, e.target.value)}
          placeholder={`Ej: Quiero presa pechuga, sin sal...`}
          rows={3}
          className="w-full bg-caramba-surface border-2 border-caramba-border rounded-xl px-4 py-3 text-white placeholder:text-caramba-muted/50 resize-none focus:outline-none focus:border-caramba-red/50 transition-colors text-sm font-medium"
        />
        {item.nota && (
          <div className="text-xs text-caramba-muted text-right">{item.nota.length}/200</div>
        )}
      </div>
    </div>
  );
}
