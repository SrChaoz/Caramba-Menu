import { useCartStore } from '@/store/cartStore';
import { BurritoMode } from '@/types';

interface Props {
  onConfirm: (mode: BurritoMode) => void;
}

export default function StepMode({ onConfirm }: Props) {
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
            className="w-full bg-caramba-bg border-2 border-caramba-border text-white font-bold py-5 px-6 rounded-2xl text-lg hover:border-caramba-red transition-colors flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="text-2xl">✅</span> Sí, todos iguales
          </button>
          
          <button 
            onClick={() => handleSelect('individual')}
            className="w-full bg-caramba-bg border-2 border-caramba-border text-white font-bold py-5 px-6 rounded-2xl text-lg hover:border-caramba-red transition-colors flex items-center justify-center gap-3 active:scale-95"
          >
            <span className="text-2xl">🔀</span> No, los armaré distinto
          </button>
        </div>
      </div>
    </div>
  );
}
