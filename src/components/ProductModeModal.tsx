'use client';

import { useCartStore } from '@/store/cartStore';
import { ArrowLeft, CheckCircle2, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  onConfirm: () => void;
  onBack: () => void;
}

export default function ProductModeModal({ onConfirm, onBack }: Props) {
  const { modeByProduct, getConfigurableMultipleGroups, setModeForProduct } = useCartStore();
  const groups = getConfigurableMultipleGroups();
  const [localModes, setLocalModes] = useState<Record<string, 'same' | 'individual'>>({});

  // Sync with store on mount
  useEffect(() => {
    setLocalModes(modeByProduct as Record<string, 'same' | 'individual'>);
  }, []); // Only on mount

  const handleSelect = (productoId: string, mode: 'same' | 'individual') => {
    setLocalModes(prev => ({ ...prev, [productoId]: mode }));
  };

  const handleConfirm = () => {
    // Apply local modes to the store and trigger onConfirm
    Object.entries(localModes).forEach(([id, mode]) => {
      setModeForProduct(id, mode as 'same' | 'individual');
    });
    onConfirm();
  };

  // Check if all groups have a mode selected
  const isReady = groups.length > 0 && groups.every(g => localModes[g.productoId] != null);

  if (groups.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-caramba-surface w-full max-w-md max-h-[90vh] overflow-hidden rounded-3xl border-2 border-caramba-border shadow-2xl flex flex-col">
        
        <div className="p-6 pb-4 border-b border-caramba-border shrink-0">
          <h2 className="text-xl md:text-2xl font-black uppercase text-center text-white leading-tight">
            ¿Cómo preparamos tus platos?
          </h2>
          <p className="text-caramba-muted text-sm text-center mt-2 font-medium">
            Por favor, indica si quieres los platos iguales o si prefieres armar cada uno por separado.
          </p>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--theme-accent) transparent' }}>
          {groups.map(group => {
            const isSame = localModes[group.productoId] === 'same';
            const isIndividual = localModes[group.productoId] === 'individual';

            return (
              <div key={group.productoId} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{group.emoji}</span>
                  <div className="font-bold text-white uppercase tracking-wider text-base">
                    {group.count} {group.nombre}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Option: Todos Iguales */}
                  <button
                    onClick={() => handleSelect(group.productoId, 'same')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                      isSame
                        ? 'border-caramba-red bg-caramba-red/10 text-white shadow-[0_0_15px_rgba(192,0,12,0.2)]'
                        : 'border-caramba-border bg-caramba-bg hover:border-caramba-red/40 text-caramba-muted hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className={`w-8 h-8 ${isSame ? 'text-caramba-red' : ''}`} />
                    <span className="font-bold text-sm">Todos Iguales</span>
                  </button>

                  {/* Option: Diferentes */}
                  <button
                    onClick={() => handleSelect(group.productoId, 'individual')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                      isIndividual
                        ? 'border-caramba-red bg-caramba-red/10 text-white shadow-[0_0_15px_rgba(192,0,12,0.2)]'
                        : 'border-caramba-border bg-caramba-bg hover:border-caramba-red/40 text-caramba-muted hover:text-white'
                    }`}
                  >
                    <Shuffle className={`w-8 h-8 ${isIndividual ? 'text-caramba-red' : ''}`} />
                    <span className="font-bold text-sm">Diferentes</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-caramba-border shrink-0 bg-caramba-bg flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={!isReady}
            className="w-full bg-caramba-red disabled:bg-caramba-border disabled:text-caramba-muted text-white py-4 px-6 rounded-2xl text-lg font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 disabled:cursor-not-allowed"
          >
            Confirmar Selección
          </button>
          
          <button
            onClick={onBack}
            className="w-full bg-transparent text-caramba-muted font-bold py-3 px-6 rounded-xl text-sm uppercase tracking-wider hover:text-white transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a Cantidades
          </button>
        </div>
      </div>
    </div>
  );
}
