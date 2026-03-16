'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import StepQty from '@/components/StepQty';
import StepMode from '@/components/StepMode';
import ToppingSelector from '@/components/ToppingSelector';
import BurritoTabs from '@/components/BurritoTabs';
import CustomerForm from '@/components/CustomerForm';
import OrderSummary from '@/components/OrderSummary';
import { MIN_TOPPINGS } from '@/config/menu';

export default function Home() {
  const [step, setStep] = useState(1);
  const { quantity, mode, burritos, toggleTopping } = useCartStore();

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

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
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
        
        {step === 2 && <StepMode onConfirm={handleConfirmMode} />}
        
        {step === 3 && mode === 'same' && (
          <div className="animate-fade-in flex flex-col items-center">
            <ToppingSelector 
              burritoId={burritos[0].id} 
              selectedToppings={burritos[0].selectedToppings} 
              onToggle={(tId) => toggleTopping(burritos[0].id, tId)} 
            />
            {/* Same mode global continue button */}
            <div className="w-full mt-4 bg-caramba-bg pt-2 pb-6 sticky bottom-0 border-t border-caramba-border/50">
              <button 
                onClick={handleNextFromToppings}
                disabled={burritos[0].selectedToppings.length < MIN_TOPPINGS} 
                className="btn-primary text-lg py-5 shadow-lg shadow-black/50"
              >
                {burritos[0].selectedToppings.length >= MIN_TOPPINGS ? 'CONTINUAR →' : `SELECCIONA ${MIN_TOPPINGS} TOPPINGS`}
              </button>
            </div>
          </div>
        )}

        {step === 3 && mode === 'individual' && (
          <BurritoTabs onNext={handleNextFromToppings} />
        )}

        {step === 4 && <CustomerForm onNext={handleNextFromCustomer} />}
        
        {step === 5 && <OrderSummary />}
      </div>
    </main>
  );
}
