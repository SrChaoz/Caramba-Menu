import React, { useMemo, useEffect, useState, useRef } from 'react';
import { TOPPINGS, MIN_TOPPINGS, MAX_TOPPINGS, TOPPING_CATEGORIES, validateBurrito } from '@/config/menu';
import { Info } from 'lucide-react';

interface Props {
  burritoId: number;
  selectedToppings: string[];
  onToggle: (burritoId: number, toppingId: string) => void;
}

const ToppingSelector = React.memo(function ToppingSelector({ burritoId, selectedToppings, onToggle }: Props) {
  const isValid = validateBurrito(selectedToppings);
  const reachedMax = selectedToppings.length >= MAX_TOPPINGS;

  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const staticCounterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (staticCounterRef.current) observer.observe(staticCounterRef.current);
    return () => observer.disconnect();
  }, []);

  // Optimización de rendimiento para iterar una sola vez sobre los exclusivos
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
        <div className="bg-caramba-surface/85 backdrop-blur-xl px-4 py-2 rounded-full border border-caramba-border shadow-lg shadow-black/40 text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
          <span>🛒</span>
          <span className="text-white font-bold">
            <strong className={`text-base ${reachedMax ? 'text-caramba-red' : isValid ? 'text-[#2EBA5B]' : 'text-white'}`}>
              {selectedToppings.length}
            </strong> seleccionados
          </span>
          <span className="text-caramba-muted font-medium ml-1">
            (Mín: {MIN_TOPPINGS} - Máx: {MAX_TOPPINGS})
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Arma tu burrito
        </h2>
        <span className="text-caramba-red text-sm font-bold">
          (Mínimo {MIN_TOPPINGS}, Máximo {MAX_TOPPINGS})
        </span>
      </div>

      <div ref={staticCounterRef} className="flex bg-caramba-surface rounded-lg px-4 py-2 mb-2 w-fit border border-caramba-border">
        <span className="text-caramba-muted text-sm font-medium">
          Seleccionados: <strong className={`text-lg ml-1 ${isValid ? 'text-green-500' : 'text-caramba-red'}`}>{selectedToppings.length}</strong> <span className="text-xs">/ {MAX_TOPPINGS}</span>
        </span>
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
              {category.id === 'meat' && (
                <span className="text-xs normal-case font-normal flex items-center gap-1 opacity-80">
                  <Info className="w-3 h-3"/> Elige 1 proteína
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3 pb-2">
              {categoryToppings.map((topping) => {
                const isActive = selectedToppings.includes(topping.id);
                
                const hasAnotherInExclusiveGroup = topping.exclusiveGroup 
                  ? selectedExclusiveGroups.has(topping.exclusiveGroup) && !isActive
                  : false;
                  
                const isDisabled = reachedMax && !isActive && !hasAnotherInExclusiveGroup;

                return (
                  <button
                    key={topping.id}
                    onClick={() => onToggle(burritoId, topping.id)}
                    className={`topping-card ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    type="button"
                    title={isDisabled ? `Límite de ${MAX_TOPPINGS} toppings alcanzado` : ''}
                  >
                    <span className="text-3xl mb-1">{topping.emoji}</span>
                    <span className="font-bold text-sm leading-tight text-center text-white">{topping.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

    </div>
  );
});

export default ToppingSelector;
