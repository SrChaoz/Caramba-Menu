'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useMenuStore } from '@/store/menuStore';

// Pasos
import StepQty from '@/components/StepQty';
import StepMenu from '@/components/StepMenu';
import ItemTabs from '@/components/ItemTabs';
import CustomerForm from '@/components/CustomerForm';
import OrderSummary from '@/components/OrderSummary';
import ProductModeModal from '@/components/ProductModeModal';

import { ArrowLeft } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FLUJO UNIFICADO:  Qty/Menu → (ProductModeModal?) → Customize → Customer → Summary
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoading, error, fetchMenu, productos } = useMenuStore();
  const { getTotalQuantity, getConfigurableGroupsNeedingMode } = useCartStore();

  const isMultiProductFlow = !isLoading && productos.length > 1;
  const isSingleProductFlow = !isLoading && productos.length === 1;

  // Pasos:
  // 1: Menu (StepQty / StepMenu)
  // 2: Personalización (ItemTabs)
  // 3: Datos del cliente (CustomerForm)
  // 4: Resumen (OrderSummary)
  const [step, setStep] = useState(1);
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  // ── Funciones de navegación ────────────────────────────────

  const handleNextFromQtyOrMenu = () => {
    const groupsNeedingMode = getConfigurableGroupsNeedingMode();
    if (groupsNeedingMode.length > 0) {
      setShowModeModal(true);
    } else {
      setStep(2);
    }
  };

  const handleModeConfirm = () => {
    setShowModeModal(false);
    setStep(2);
  };

  const handleModeBack = () => {
    setShowModeModal(false);
  };

  const handleNextFromCustomize = () => setStep(3);
  const handleNextFromCustomer = () => setStep(4);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ── Progreso visual ────────────────────────────────────────
  const visualSteps = [1, 2, 3, 4];

  // ── Loading / Error ────────────────────────────────────────
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
        {visualSteps.map(s => {
          const isActive = s === step;
          const isPast = s < step;
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

        {/* ── PASO 1 ─────────────────────────────────────────── */}
        {step === 1 && isSingleProductFlow && (
          <StepQty onNext={handleNextFromQtyOrMenu} />
        )}
        {step === 1 && isMultiProductFlow && (
          <StepMenu onNext={handleNextFromQtyOrMenu} />
        )}

        {showModeModal && (
          <ProductModeModal onConfirm={handleModeConfirm} onBack={handleModeBack} />
        )}

        {/* ── PASO 2: Personalización ─────────────────────────── */}
        {step === 2 && (
          <ItemTabs onNext={handleNextFromCustomize} />
        )}

        {/* ── PASO 3: Datos del cliente ─────────────────────── */}
        {step === 3 && <CustomerForm onNext={handleNextFromCustomer} />}

        {/* ── PASO 4: Resumen ──────────────────────────────── */}
        {step === 4 && <OrderSummary onBack={handleBack} />}

      </div>
    </main>
  );
}
