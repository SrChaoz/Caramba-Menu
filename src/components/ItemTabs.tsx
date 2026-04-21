'use client';

import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';
import { useState, useMemo, useEffect, useRef } from 'react';
import ToppingSelector from './ToppingSelector';
import SimpleItemForm from './SimpleItemForm';
import { Check } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export default function ItemTabs({ onNext }: Props) {
  const { items, modeByProduct, toggleTopping } = useCartStore();
  const { validateItem } = useMenuStore();

  const tabs = useMemo(() => {
    const result: { id: string; label: string; emoji: string; count?: number; item: any }[] = [];
    const groups: { [id: string]: any[] } = {};
    items.forEach(item => {
      if (!groups[item.productoId]) groups[item.productoId] = [];
      groups[item.productoId].push(item);
    });

    Object.entries(groups).forEach(([productoId, groupItems]) => {
      const mode = modeByProduct[productoId];
      if (mode === 'same') {
        result.push({
          id: `group-${productoId}`,
          label: groupItems[0].productoNombre,
          emoji: groupItems[0].productoEmoji,
          count: groupItems.length,
          item: groupItems[0],
        });
      } else {
        groupItems.forEach((item, index) => {
          result.push({
            id: item.instanceId,
            label: groupItems.length > 1 ? `${item.productoNombre} ${index + 1}` : item.productoNombre,
            emoji: item.productoEmoji,
            item,
          });
        });
      }
    });
    return result;
  }, [items, modeByProduct]);

  const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || '');

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const allValid = items.every(item => validateItem(item.productoId, item.selectedToppings));

  // ── Refs para auto-scroll de tabs ──
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [id: string]: HTMLButtonElement | null }>({});
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Auto-scroll al tab activo cuando cambia
  useEffect(() => {
    const el = tabRefs.current[activeTabId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTabId]);

  // Detectar si hay contenido oculto a la derecha
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const check = () => {
      setCanScrollRight(container.scrollWidth > container.clientWidth + container.scrollLeft + 4);
    };
    check();
    container.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => {
      container.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [tabs]);

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in mb-28">

      {/* ── Tabs — solo si hay más de 1 ítem, sin sticky ni fondo ── */}
      {tabs.length > 1 && (
        <div className="relative -mx-4">
          {/* Barra de tabs */}
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1"
          >
            {tabs.map(tab => {
              const isActive = tab.id === activeTabId;
              const isValid = validateItem(tab.item.productoId, tab.item.selectedToppings);
              return (
                <button
                  key={tab.id}
                  ref={el => { tabRefs.current[tab.id] = el; }}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border-2 font-black text-sm transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-caramba-red border-caramba-red text-white shadow-lg shadow-caramba-red/20'
                      : 'bg-transparent border-caramba-border text-white/50 hover:border-white/30 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                  {tab.count && tab.count > 1 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                    }`}>
                      x{tab.count}
                    </span>
                  )}
                  {isValid && (
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-green-400'}`} />
                  )}
                </button>
              );
            })}
            {/* Espaciado extra al final para que el último tab pueda centrarse */}
            <div className="shrink-0 w-4" />
          </div>

          {/* Indicador de scroll: gradiente que desaparece al llegar al final */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to right, transparent, #000)',
              opacity: canScrollRight ? 1 : 0,
            }}
          />
        </div>
      )}

      {/* ── Contenido activo ── */}
      <div key={activeTabId} className="animate-fade-in-up">
        {activeTab?.item.tipo === 'configurable' ? (
          <ToppingSelector item={activeTab.item} onToggle={toggleTopping} />
        ) : activeTab?.item.tipo === 'simple' ? (
          <SimpleItemForm item={activeTab.item} />
        ) : null}
      </div>

      {/* ── Botón flotante ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-40 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            onClick={onNext}
            disabled={!allValid}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
              allValid
                ? 'bg-caramba-red text-white active:scale-95 shadow-caramba-red/30'
                : 'bg-caramba-border text-caramba-muted cursor-not-allowed'
            }`}
          >
            {allValid 
              ? 'Continuar →' 
              : items.length > 1 
                ? 'Completa todos los platos' 
                : 'Faltan ingredientes'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
