import React, { useMemo, useEffect, useState, useRef } from 'react';
import { TOPPINGS, MIN_TOPPINGS, FREE_TOPPINGS_LIMIT, TOPPING_CATEGORIES, validateBurrito, calculateExtras } from '@/config/menu';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  burritoId: number;
  selectedToppings: string[];
  onToggle: (burritoId: number, toppingId: string) => void;
}

const ToppingSelector = React.memo(function ToppingSelector({ burritoId, selectedToppings, onToggle }: Props) {
  const isValid = validateBurrito(selectedToppings);
  const isOverLimit = selectedToppings.length >= FREE_TOPPINGS_LIMIT;
  const { extraCost } = calculateExtras(selectedToppings);

  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [pendingExtraTopping, setPendingExtraTopping] = useState<string | null>(null);
  const [unavailableToppings, setUnavailableToppings] = useState<Set<string>>(new Set());
  const staticCounterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (staticCounterRef.current) observer.observe(staticCounterRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchToppings = async () => {
      const { data } = await supabase.from('menu_toppings').select('id, disponible').eq('disponible', false);
      if (data) setUnavailableToppings(new Set(data.map(d => d.id)));
    };
    fetchToppings();
    
    const sub = supabase.channel('menu_toppings_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_toppings' }, fetchToppings)
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, []);

  const selectedExclusiveGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const id of selectedToppings) {
      const t = TOPPINGS.find(to => to.id === id);
      if (t && t.exclusiveGroup) groups.add(t.exclusiveGroup);
    }
    return groups;
  }, [selectedToppings]);

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in relative">
      
      {/* Sticky Pill */}
      <div 
        className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          isStickyVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
        }`}
      >
        <div className="bg-caramba-surface/90 backdrop-blur-xl px-4 py-2 rounded-full border border-caramba-border shadow-lg shadow-black/40 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
          <span>🛒</span>
          <span className="text-white font-bold flex items-baseline gap-1">
            <strong className={`text-base ${isOverLimit ? 'text-[#2EBA5B]' : isValid ? 'text-white' : 'text-caramba-red'}`}>
              {selectedToppings.length}
            </strong> 
            seleccionados
            {!isValid && (
              <span className="text-caramba-red/80 font-medium text-[10px] sm:text-xs ml-1 uppercase tracking-wide">
                (Mín. {MIN_TOPPINGS})
              </span>
            )}
          </span>
          {extraCost > 0 && (
            <span className="text-[#2EBA5B] font-bold bg-[#2EBA5B]/20 px-2 rounded-full border border-[#2EBA5B]/30 ml-1">
              +${extraCost.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Arma tu burrito
        </h2>
        <span className="text-caramba-muted text-sm font-bold flex items-center gap-2 flex-wrap">
          (Mín. <span className="text-white bg-caramba-surface px-1.5 py-0.5 rounded-md border border-caramba-border">{MIN_TOPPINGS}</span>, Max <span className="text-white bg-caramba-surface px-1.5 py-0.5 rounded-md border border-caramba-border">{FREE_TOPPINGS_LIMIT}</span> libres + Extras)
        </span>
      </div>

      <div ref={staticCounterRef} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-caramba-surface rounded-lg px-4 py-3 mb-2 w-full border border-caramba-border shadow-md">
        <div className="text-caramba-muted text-sm font-medium flex-1">
          Seleccionados: <strong className={`text-lg ml-1 ${isOverLimit ? 'text-[#2EBA5B]' : isValid ? 'text-white' : 'text-caramba-red'}`}>{selectedToppings.length}</strong>
        </div>
        {extraCost > 0 && (
          <div className="bg-[#2EBA5B]/10 border border-[#2EBA5B]/20 text-[#2EBA5B] text-sm font-black px-3 py-1 rounded-lg flex items-center gap-2">
            EXTRAS: +${extraCost.toFixed(2)}
          </div>
        )}
      </div>

      {TOPPING_CATEGORIES.map(category => {
        const categoryToppings = TOPPINGS.filter(t => t.categoryId === category.id);
        if (categoryToppings.length === 0) return null;

        return (
          <div key={category.id} className="mb-4">
            <h3 className="text-sm font-medium text-caramba-muted/80 mb-2 uppercase tracking-wide flex items-center justify-between">
              {category.name}
              {category.id === 'base' && (
                <span className="text-xs normal-case font-normal flex items-center gap-1 opacity-80">
                  <Info className="w-3 h-3"/> Puedes elegir 1 tipo de arroz
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3 pb-2">
              {categoryToppings.map((topping) => {
                const isActive = selectedToppings.includes(topping.id);
                
                const hasAnotherInExclusiveGroup = topping.exclusiveGroup 
                  ? selectedExclusiveGroups.has(topping.exclusiveGroup) && !isActive
                  : false;
                  
                const isRice = topping.exclusiveGroup === 'arroz';
                const isAgotado = unavailableToppings.has(topping.id);
                const isDisabled = (isRice ? hasAnotherInExclusiveGroup : false) || isAgotado;
                
                // Mostrar badge de precio si agregarlo costará extra
                const isExtra = !isActive && isOverLimit && topping.price > 0;

                const handleToggle = () => {
                  if (!isActive && selectedToppings.length === FREE_TOPPINGS_LIMIT) {
                    const isRiceSwap = isRice && hasAnotherInExclusiveGroup;
                    if (!isRiceSwap) {
                      setPendingExtraTopping(topping.id);
                      return;
                    }
                  }
                  onToggle(burritoId, topping.id);
                };

                return (
                  <button
                    key={topping.id}
                    onClick={handleToggle}
                    disabled={isDisabled}
                    className={`topping-card relative overflow-hidden ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    type="button"
                  >
                    <span className="text-3xl mb-1">{topping.emoji}</span>
                    <span className="font-bold text-sm leading-tight text-center text-white">{topping.label}</span>
                    
                    {isExtra && !isDisabled && (
                      <span className="absolute top-1 right-1 bg-[#2EBA5B]/90 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/20 shadow-md">
                        +${topping.price.toFixed(2)}
                      </span>
                    )}

                    {isAgotado && (
                      <span className="absolute top-1 right-1 bg-caramba-red/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-white/20 shadow-md tracking-wider uppercase">
                        Agotado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Modal Personalizado para Confirmar Extras */}
      {pendingExtraTopping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setPendingExtraTopping(null)}>
          <div 
            className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-slide-up"
            onClick={e => e.stopPropagation()} // Previene cerrar si hace clic en la tarjeta
          >
            <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-2xl">🌯</span> Límite alcanzado
            </h3>
            <p className="text-caramba-text text-sm font-medium leading-relaxed">
              Tus <strong className="text-white">8 ingredientes incluidos</strong> ya están cubiertos.
            </p>
            <p className="text-caramba-muted text-sm font-medium">
              A partir de aquí, los ingredientes adicionales tendrán costo extra según el menú.
            </p>
            <p className="text-[#2EBA5B] font-bold text-sm mt-1">
              ¿Deseas activarlos y pagar por extras?
            </p>
            
            <div className="flex gap-3 mt-3">
              <button 
                onClick={() => setPendingExtraTopping(null)}
                className="flex-1 bg-transparent border-2 border-caramba-border text-white py-3 rounded-xl font-bold uppercase tracking-wider active:scale-95 transition-all text-xs"
              >
                No, gracias
              </button>
              <button 
                onClick={() => {
                  onToggle(burritoId, pendingExtraTopping);
                  setPendingExtraTopping(null);
                }}
                className="flex-1 bg-[#2EBA5B] text-white py-3 rounded-xl font-bold uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(46,186,91,0.3)] text-xs"
              >
                Sí, aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ToppingSelector;
