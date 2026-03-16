import { useCartStore } from '@/store/cartStore';
import { BurritoMode } from '@/types';
import { CheckCircle2, Shuffle, ArrowLeft } from 'lucide-react';

interface Props {
  onConfirm: (mode: BurritoMode) => void;
  onBack: () => void;
}

export default function StepMode({ onConfirm, onBack }: Props) {
  const { setMode } = useCartStore();

  const handleSelect = (mode: BurritoMode) => {
    setMode(mode);
    onConfirm(mode);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-caramba-surface w-full max-w-md rounded-3xl p-6 border-2 border-caramba-border shadow-2xl flex flex-col gap-6">
        <h2 className="text-2xl font-black uppercase text-center text-white leading-tight">
          ¿Todos llevarán los mismos ingredientes?
        </h2>
        
        <div className="flex flex-col gap-4 mt-4">
          <button 
            onClick={() => handleSelect('same')}
            className="w-full bg-caramba-red text-white py-5 px-6 rounded-2xl text-xl font-black uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(192,0,12,0.3)] hover:shadow-[0_0_30px_rgba(192,0,12,0.5)] flex items-center justify-center gap-3"
          >
            <CheckCircle2 className="w-7 h-7" /> Sí, todos iguales
          </button>
          
          <button 
            onClick={() => handleSelect('individual')}
            className="w-full bg-caramba-bg border-2 border-caramba-border text-white font-bold py-5 px-6 rounded-2xl text-lg hover:border-caramba-red transition-colors flex items-center justify-center gap-3 active:scale-95"
          >
            <Shuffle className="w-7 h-7" /> No, los armaré distinto
          </button>

          <button 
            onClick={onBack}
            className="w-full bg-transparent text-caramba-muted font-bold py-3 px-6 mt-2 rounded-xl text-sm uppercase tracking-wider hover:text-white transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" /> Volver a cantidad
          </button>
        </div>
      </div>
    </div>
  );
}
