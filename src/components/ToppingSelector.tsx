import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { Info } from 'lucide-react';
import { CartItem } from '@/types';

interface Props {
  item: CartItem;
  onToggle: (instanceId: string, toppingId: string) => void;
}

const ToppingSelector = React.memo(function ToppingSelector({ item, onToggle }: Props) {
  const menuStore = useMenuStore();
  const producto = menuStore.getProductConfig(item.productoId);
  
  if (!producto) return null;

  const MIN_TOPPINGS = producto.min_toppings;
  const FREE_TOPPINGS_LIMIT = producto.free_toppings_limit;

  const isValid = menuStore.validateItem(item.productoId, item.selectedToppings);
  const isOverLimit = item.selectedToppings.length >= FREE_TOPPINGS_LIMIT;
  const { extraCost, surchargeCost } = menuStore.calculateExtras(item.productoId, item.selectedToppings);

  const isDoubleProtein = item.selectedToppings
    .slice(0, FREE_TOPPINGS_LIMIT)
    .filter(id => menuStore.toppings.find(t => t.id === id)?.exclusiveGroup === 'meat')
    .length >= 2;

  const displayAddonCost = extraCost;

  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [pendingExtraTopping, setPendingExtraTopping] = useState<string | null>(null);
  const [pendingDoubleProtein, setPendingDoubleProtein] = useState<string | null>(null);
  const staticCounterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (staticCounterRef.current) observer.observe(staticCounterRef.current);
    return () => observer.disconnect();
  }, []);

  const selectedExclusiveGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const id of item.selectedToppings) {
      const t = menuStore.toppings.find(to => to.id === id);
      if (t && t.exclusiveGroup) groups.add(t.exclusiveGroup);
    }
    return groups;
  }, [item.selectedToppings]);

  const doubleProteinModalInfo = useMemo(() => {
    if (!pendingDoubleProtein) return null;
    const newTopping = menuStore.toppings.find(t => t.id === pendingDoubleProtein);
    if (!newTopping) return null;

    const basePrice = item.basePrice;
    const addedCost = newTopping.price;
    const newTotal = basePrice + surchargeCost + addedCost;

    return { topping: newTopping, newTotal, addedCost };
  }, [pendingDoubleProtein, item.selectedToppings, menuStore, surchargeCost, item.basePrice]);

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
              {item.selectedToppings.length}
            </strong> 
            seleccionados
            {!isValid && (
              <span className="text-caramba-red/80 font-medium text-[10px] sm:text-xs ml-1 uppercase tracking-wide">
                (Mín. {MIN_TOPPINGS})
              </span>
            )}
          </span>
          {displayAddonCost > 0 && (
            <span className="text-[#2EBA5B] font-bold bg-[#2EBA5B]/20 px-2 rounded-full border border-[#2EBA5B]/30 ml-1">
              +${displayAddonCost.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          {producto.nombre}
        </h2>
        <span className="text-caramba-muted text-xs font-bold flex items-center gap-2 flex-wrap">
          (Mín. <span className="text-white bg-caramba-surface px-1.5 py-0.5 rounded-md border border-caramba-border">{MIN_TOPPINGS}</span>, Max <span className="text-white bg-caramba-surface px-1.5 py-0.5 rounded-md border border-caramba-border">{FREE_TOPPINGS_LIMIT}</span> libres + Extras)
        </span>
      </div>

      <div ref={staticCounterRef} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-caramba-surface rounded-lg px-4 py-3 mb-2 w-full border border-caramba-border shadow-md">
        <div className="text-caramba-muted text-sm font-medium flex-1">
          {item.productoNombre} seleccionados: <strong className={`text-lg ml-1 ${isOverLimit ? 'text-[#2EBA5B]' : isValid ? 'text-white' : 'text-caramba-red'}`}>{item.selectedToppings.length}</strong>
        </div>
        {displayAddonCost > 0 && (
          <div className="bg-[#2EBA5B]/10 border border-[#2EBA5B]/20 text-[#2EBA5B] text-sm font-black px-3 py-1 rounded-lg flex items-center gap-2">
            EXTRAS: +${displayAddonCost.toFixed(2)}
          </div>
        )}
      </div>

      {menuStore.getCategoriesByProduct(item.productoId).map(category => {
        const categoryToppings = menuStore.toppings.filter(t => t.categoryId === category.id);
        if (categoryToppings.length === 0) return null;

        return (
          <div key={category.id} className="mb-4">
            <h3 className="text-sm font-medium text-caramba-muted/80 mb-2 uppercase tracking-wide flex items-center justify-between">
              {category.name}
              {category.required && (
                <span className="text-[10px] bg-caramba-red/10 text-caramba-red px-1.5 py-0.5 rounded font-black">Requerido</span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3 pb-2">
              {categoryToppings.map((topping) => {
                const isActive = item.selectedToppings.includes(topping.id);
                
                const hasAnotherInExclusiveGroup = topping.exclusiveGroup 
                  ? selectedExclusiveGroups.has(topping.exclusiveGroup) && !isActive
                  : false;
                  
                const isRice = topping.exclusiveGroup === 'arroz';
                const isMeat = topping.exclusiveGroup === 'meat';
                const isAgotado = !topping.disponible;
                const isDisabled = (isRice ? hasAnotherInExclusiveGroup : false) || isAgotado;
                
                const isSurcharge = !isActive && !isOverLimit && topping.surcharge > 0 && topping.exclusiveGroup !== 'meat';
                const isExtra = !isActive && isOverLimit && topping.price > 0;
                const isComboProtein = !isActive && !isOverLimit && isMeat && hasAnotherInExclusiveGroup && topping.price > 0;

                const handleToggle = () => {
                  if (!isActive && isMeat && hasAnotherInExclusiveGroup && !isOverLimit) {
                    setPendingDoubleProtein(topping.id);
                    return;
                  }
                  if (!isActive && item.selectedToppings.length === FREE_TOPPINGS_LIMIT) {
                    const isRiceSwap = isRice && hasAnotherInExclusiveGroup;
                    if (!isRiceSwap) {
                      setPendingExtraTopping(topping.id);
                      return;
                    }
                  }
                  onToggle(item.instanceId, topping.id);
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
                    <span className="font-bold text-xs leading-tight text-center text-white">{topping.label}</span>
                    
                    {isComboProtein && !isDisabled && (
                      <span className="absolute top-1 right-1 bg-[#F59E0B]/90 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/20 shadow-md">
                        +${topping.price.toFixed(2)}
                      </span>
                    )}

                    {isSurcharge && !isDisabled && !isComboProtein && (
                      <span className="absolute top-1 right-1 bg-[#F59E0B]/90 backdrop-blur-sm text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/20 shadow-md">
                        +${topping.surcharge.toFixed(2)}
                      </span>
                    )}

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

      {/* Modales de Confirmación omitidos por brevedad, se mantienen igual pero usando item.instanceId */}
      {pendingExtraTopping && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setPendingExtraTopping(null)}>
          <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">🌯 Límite alcanzado</h3>
            <p className="text-caramba-text text-sm font-medium">Tus <strong className="text-white">{FREE_TOPPINGS_LIMIT} ingredientes</strong> ya están cubiertos.</p>
            <p className="text-caramba-muted text-sm">Los ingredientes adicionales tendrán costo extra según el menú.</p>
            <div className="flex gap-3 mt-3">
              <button onClick={() => setPendingExtraTopping(null)} className="flex-1 bg-transparent border-2 border-caramba-border text-white py-3 rounded-xl font-bold uppercase text-xs">No, gracias</button>
              <button onClick={() => { onToggle(item.instanceId, pendingExtraTopping); setPendingExtraTopping(null); }} className="flex-1 bg-[#2EBA5B] text-white py-3 rounded-xl font-bold uppercase shadow-[0_0_20px_rgba(46,186,91,0.3)] text-xs">Sí, aceptar</button>
            </div>
          </div>
        </div>
      )}

      {pendingDoubleProtein && doubleProteinModalInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setPendingDoubleProtein(null)}>
          <div className="bg-caramba-surface border-2 border-[#F59E0B]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">🥩 ¡Doble Proteína!</h3>
            <p className="text-caramba-text text-sm font-medium">Costo adicional: <strong className="text-[#F59E0B]">+${doubleProteinModalInfo.addedCost.toFixed(2)}</strong></p>
            <div className="flex gap-3 mt-1">
              <button onClick={() => setPendingDoubleProtein(null)} className="flex-1 bg-transparent border-2 border-caramba-border text-white py-3 rounded-xl font-bold uppercase text-xs">Cancelar</button>
              <button onClick={() => { onToggle(item.instanceId, pendingDoubleProtein); setPendingDoubleProtein(null); }} className="flex-1 bg-[#F59E0B] text-black py-3 rounded-xl font-bold uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] text-xs">Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ToppingSelector;
