import { useCartStore } from '@/store/cartStore';
import { ArrowRight } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export default function StepQty({ onNext }: Props) {
  const { quantity, setQuantity } = useCartStore();

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <h2 className="text-2xl font-black uppercase tracking-wider text-caramba-text">
        ¿Cuántos burritos?
      </h2>
      
      <div className="bg-caramba-surface border-2 border-caramba-border rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <button 
          onClick={handleDecrement}
          disabled={quantity <= 1}
          className="w-[72px] h-[72px] bg-caramba-red text-white flex items-center justify-center rounded-2xl text-4xl font-black active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all shadow-md"
        >
          -
        </button>
        <div className="text-7xl font-black tracking-tighter w-24 text-center select-none text-white">
          {quantity.toString().padStart(2, '0')}
        </div>
        <button 
          onClick={handleIncrement}
          disabled={quantity >= 10}
          className="w-[72px] h-[72px] bg-caramba-red text-white flex items-center justify-center rounded-2xl text-4xl font-black active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all shadow-md"
        >
          +
        </button>
      </div>

      <button onClick={onNext} className="btn-primary mt-6 text-lg py-5 flex items-center justify-center gap-2">
        SIGUIENTE <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
