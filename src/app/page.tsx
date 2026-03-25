'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import StepQty from '@/components/StepQty';
import StepMode from '@/components/StepMode';
import ToppingSelector from '@/components/ToppingSelector';
import BurritoTabs from '@/components/BurritoTabs';
import CustomerForm from '@/components/CustomerForm';
import OrderSummary from '@/components/OrderSummary';
import { useMenuStore } from '@/store/menuStore';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState(1);
  const { quantity, mode, burritos, toggleTopping } = useCartStore();
  const { isLoading, error, fetchMenu, validateBurrito } = useMenuStore();

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleNextFromQty = () => {
    if (quantity > 1) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleConfirmMode = () => {
    setStep(3);
  };

  const handleNextFromToppings = () => {
    setStep(4);
  };

  const handleNextFromCustomer = () => {
    setStep(5);
  };

  const handleBack = () => {
    if (step === 3 && quantity === 1) {
      setStep(1); // Skip mode selection if qty is 1
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24 pb-12 px-4 max-w-md mx-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white animate-pulse">
          <div className="text-4xl">🌯</div>
          <div className="font-bold uppercase tracking-widest text-sm text-caramba-red">Cargando menú...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen pt-24 pb-12 px-4 max-w-md mx-auto flex items-center justify-center">
        <div className="p-6 bg-red-950/50 border border-red-500 rounded-xl text-center">
          <p className="text-white font-bold mb-2">Error al cargar el menú</p>
          <p className="text-sm text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8 relative">
        {step > 1 && (
          <button 
            onClick={handleBack} 
            className="absolute left-0 top-1/2 -translate-y-1/2 text-caramba-muted hover:text-white transition-colors p-2 -ml-2 rounded-full active:bg-white/10 flex items-center justify-center"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        {[1, 3, 4, 5].map((s) => {
          // Visual steps map to logical steps
          const isActive = s === step || (s === 3 && step === 2);
          const isPast = s < step && !(s === 3 && step === 2);
          
          return (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all duration-300 ${
                isActive ? 'w-8 bg-caramba-red shadow-[0_0_10px_rgba(192,0,12,0.5)]' : 
                isPast ? 'w-4 bg-caramba-red/40' : 'w-4 bg-caramba-border'
              }`}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-6 relative">
        {step === 1 && <StepQty onNext={handleNextFromQty} />}
        
        {step === 2 && <StepMode onConfirm={handleConfirmMode} onBack={handleBack} />}
        
        {step === 3 && mode === 'same' && (
          <div className="animate-fade-in flex flex-col items-center">
            <ToppingSelector 
              burritoId={burritos[0].id}
              selectedToppings={burritos[0].selectedToppings} 
              onToggle={toggleTopping} 
            />
            {/* Same mode global continue button */}
            <div className="w-full mt-4 bg-caramba-bg pt-2 pb-6 sticky bottom-0 border-t border-caramba-border/50">
              <button 
                onClick={handleNextFromToppings}
                disabled={!validateBurrito(burritos[0].selectedToppings)} 
                className="btn-primary text-lg py-5 shadow-lg shadow-black/50 flex items-center justify-center gap-2 w-full"
              >
                {validateBurrito(burritos[0].selectedToppings) ? (
                  <>CONTINUAR <ArrowRight className="w-5 h-5" /></>
                ) : `COMPLETA TU BURRITO`}
              </button>
            </div>
          </div>
        )}

        {step === 3 && mode === 'individual' && (
          <BurritoTabs onNext={handleNextFromToppings} />
        )}

        {step === 4 && <CustomerForm onNext={handleNextFromCustomer} />}
        
        {step === 5 && <OrderSummary onBack={handleBack} />}
      </div>
    </main>
  );
}
