'use client';

import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  onNext: () => void;
}

/**
 * StepQty: Paso 1 cuando solo hay 1 producto en el menú.
 * Permite ajustar la cantidad de ese único producto.
 */
export default function StepQty({ onNext }: Props) {
  const { productos } = useMenuStore();
  const { setItemQuantity, getItemsByProduct, getTotalQuantity, setNota } = useCartStore();

  // Si solo hay un producto, usamos ese
  const producto = productos[0];
  if (!producto) return null;

  const count = getItemsByProduct(producto.id).length;
  const totalQty = getTotalQuantity();

  // Un solo plato activo → arrancar en 1 automáticamente
  useEffect(() => {
    if (getItemsByProduct(producto.id).length === 0) {
      setItemQuantity(producto.id, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto.id]);

  const handleDecrement = () => {
    if (count > 1) setItemQuantity(producto.id, -1); // mínimo 1
  };

  const handleIncrement = () => {
    if (count < 10) setItemQuantity(producto.id, 1);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <h2 className="text-2xl font-black uppercase tracking-wider text-caramba-text">
        ¿Cuántos {producto.nombre.toLowerCase()}s?
      </h2>

      <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <button
          onClick={handleDecrement}
          disabled={count <= 1}
          className="w-[72px] h-[72px] bg-caramba-red text-white flex items-center justify-center rounded-2xl text-4xl font-black active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all shadow-md"
        >
          <Minus className="w-8 h-8" />
        </button>
        <div className="text-7xl font-black tracking-tighter w-24 text-center select-none text-white">
          {count.toString().padStart(2, '0')}
        </div>
        <button
          onClick={handleIncrement}
          disabled={count >= 10}
          className="w-[72px] h-[72px] bg-caramba-red text-white flex items-center justify-center rounded-2xl text-4xl font-black active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all shadow-md"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {count > 0 && (
        <div className="flex flex-col gap-3 mt-2 animate-fade-in">
          <h3 className="text-caramba-text font-bold text-lg mb-1">
            {count === 1 ? 'Anotación especial (Opcional)' : 'Anotaciones por plato (Opcional)'}
          </h3>
          {getItemsByProduct(producto.id).map((item, index) => (
            <div key={item.instanceId} className="bg-caramba-surface/50 border border-caramba-border p-3 rounded-2xl flex gap-3 items-start transition-all focus-within:border-caramba-red focus-within:bg-caramba-surface">
               {count > 1 && (
                 <div className="bg-caramba-border/50 text-caramba-muted w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 mt-1">
                   {index + 1}
                 </div>
               )}
               <textarea 
                  className="w-full bg-transparent text-white text-sm font-medium outline-none resize-none placeholder-caramba-muted/50 py-1"
                  placeholder={count === 1 ? "Ej: Sin cebolla, extra picante..." : `Ej: El #${index + 1} sin cebolla, bien picante...`}
                  rows={2}
                  value={item.nota || ''}
                  onChange={(e) => setNota(item.instanceId, e.target.value)}
               />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={totalQty === 0}
        className="btn-primary mt-4 text-lg py-5 flex items-center justify-center gap-2"
      >
        SIGUIENTE <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
