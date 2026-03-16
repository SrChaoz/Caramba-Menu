import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { MIN_TOPPINGS } from '@/config/menu';
import ToppingSelector from './ToppingSelector';

interface Props {
  onNext: () => void;
}

export default function BurritoTabs({ onNext }: Props) {
  const { burritos, toggleTopping } = useCartStore();
  const [activeTab, setActiveTab] = useState(0);

  const allValid = burritos.every(b => b.selectedToppings.length >= MIN_TOPPINGS);

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in relative pb-24">
      {/* Tabs list */}
      <div className="flex gap-3 w-full overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
        {burritos.map((b, idx) => {
          const isValid = b.selectedToppings.length >= MIN_TOPPINGS;
          const isActive = activeTab === idx;
          return (
            <button
              key={b.id}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap rounded-xl px-5 py-3 font-bold text-sm transition-colors border-2 snap-center flex-shrink-0 flex items-center gap-2
                ${isActive 
                  ? 'bg-caramba-red border-caramba-red text-white shadow-md shadow-red-900/20'
                  : 'bg-caramba-bg border-caramba-border text-caramba-muted hover:border-caramba-red/50'
                }`}
            >
              Burrito {idx + 1}
              {isValid && <span className="text-sm">✅</span>}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="mt-2 flex-grow">
        {burritos.map((b, idx) => (
          <div key={b.id} className={activeTab === idx ? 'block' : 'hidden'}>
            <ToppingSelector
              burritoId={b.id}
              selectedToppings={b.selectedToppings}
              onToggle={(tId) => toggleTopping(b.id, tId)}
            />
          </div>
        ))}
      </div>

      {/* Global Action Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-caramba-bg/95 backdrop-blur-md border-t border-caramba-border">
        <div className="max-w-md mx-auto">
          <button 
            onClick={onNext} 
            disabled={!allValid}
            className="btn-primary"
          >
            {allValid ? 'CONTINUAR →' : 'COMPLETA TODOS LOS BURRITOS'}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
