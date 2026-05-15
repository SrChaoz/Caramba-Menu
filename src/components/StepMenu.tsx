'use client';

import { useState } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { useCartStore } from '@/store/cartStore';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export default function StepMenu({ onNext }: Props) {
  const { productos, isLoading } = useMenuStore();
  const { getItemsByProduct, setItemQuantity, getTotalQuantity } = useCartStore();
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalQty = getTotalQuantity();

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in mb-28">
      {/* Título */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-3xl font-black uppercase text-white leading-tight">
          ¿Qué quieres pedir?
        </h1>
        <p className="text-caramba-muted font-medium text-sm">
          Elige tus platos y las cantidades que quieres.
        </p>
      </div>

      {/* Cards */}
      {productos.map((producto) => {
        const items = getItemsByProduct(producto.id);
        const count = items.length;
        const isSelected = count > 0;
        const isExpanded = expandedDesc[producto.id];
        const isLongText = producto.descripcion && producto.descripcion.length > 85;

        return (
          <div
            key={producto.id}
            className={`rounded-3xl overflow-hidden transition-all duration-300 border-2 ${
              isSelected
                ? 'border-caramba-red shadow-lg shadow-caramba-red/10'
                : 'border-caramba-border'
            }`}
            style={{ background: '#1a1a1a' }}
          >
            {/* Área imagen/emoji */}
            <div
              className="w-full flex items-center justify-center"
              style={{ height: 140, background: '#111' }}
            >
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="select-none"
                  style={{
                    fontSize: '6rem',
                    filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.7))',
                    lineHeight: 1,
                  }}
                >
                  {producto.emoji}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="px-5 pt-4 pb-5 flex flex-col gap-2">
              {/* Fila: emoji pequeño + nombre + badge + counter */}
              <div className="flex items-center gap-2">
                <span className="text-2xl shrink-0">{producto.emoji}</span>
                <span className="text-white font-black text-lg leading-tight flex-1 truncate">
                  {producto.nombre}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-caramba-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                  {producto.tipo === 'configurable' ? 'Personalizable' : 'Clásico'}
                </span>
              </div>

              {/* Descripción */}
              {producto.descripcion && (
                <div className="flex flex-col items-start gap-1">
                  <p 
                    className={`text-caramba-muted text-sm leading-snug transition-all duration-300 ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                    onClick={() => isLongText && toggleExpand(producto.id)}
                  >
                    {producto.descripcion}
                  </p>
                  {isLongText && (
                    <button
                      onClick={() => toggleExpand(producto.id)}
                      className="text-caramba-red text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors py-1"
                    >
                      {isExpanded ? (
                        <>Ver menos <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Ver más <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Precio + counter */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-caramba-red font-black text-xl tracking-tighter">
                  ${producto.precio_base.toFixed(2)}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setItemQuantity(producto.id, -1)}
                    disabled={count === 0}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      count > 0
                        ? 'text-white hover:bg-white/10 active:scale-95'
                        : 'text-caramba-muted opacity-25'
                    }`}
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <span
                    className={`text-xl font-black min-w-[1.2rem] text-center ${
                      count > 0 ? 'text-white' : 'text-caramba-muted'
                    }`}
                  >
                    {count}
                  </span>

                  <button
                    onClick={() => setItemQuantity(producto.id, 1)}
                    className="w-10 h-10 rounded-2xl bg-caramba-red text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-caramba-red/30"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Botón flotante */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-md mx-auto px-4 pb-6 pointer-events-auto">
          <button
            onClick={onNext}
            disabled={totalQty === 0}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-base transition-all flex items-center justify-center gap-2 ${
              totalQty > 0
                ? 'bg-caramba-red text-white active:scale-95 shadow-2xl shadow-caramba-red/40'
                : 'bg-caramba-border text-caramba-muted cursor-not-allowed'
            }`}
          >
            Continuar
            {totalQty > 0 && <span className="text-lg">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
