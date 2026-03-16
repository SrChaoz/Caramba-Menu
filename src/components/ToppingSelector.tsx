import { TOPPINGS, MIN_TOPPINGS } from '@/config/menu';

interface Props {
  burritoId: number;
  selectedToppings: string[];
  onToggle: (toppingId: string) => void;
}

export default function ToppingSelector({ burritoId, selectedToppings, onToggle }: Props) {
  const isValid = selectedToppings.length >= MIN_TOPPINGS;

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-black uppercase tracking-wider text-white">
          Selecciona tus toppings
        </h2>
        <span className="text-caramba-red text-sm font-bold">
          (Mínimo {MIN_TOPPINGS})
        </span>
      </div>

      <div className="flex bg-caramba-surface rounded-lg px-4 py-2 mb-2 w-fit border border-caramba-border">
        <span className="text-caramba-muted text-sm font-medium">
          Seleccionados: <strong className={`text-lg ml-1 ${isValid ? 'text-green-500' : 'text-caramba-red'}`}>{selectedToppings.length}</strong> <span className="text-xs">/ {TOPPINGS.length}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {TOPPINGS.map((topping) => {
          const isActive = selectedToppings.includes(topping.id);
          return (
            <button
              key={topping.id}
              onClick={() => onToggle(topping.id)}
              className={`topping-card ${isActive ? 'active' : ''}`}
              type="button"
            >
              {/* No emojis in screenshot design but SRS explicitly asks to use emoji property, so I'll render both elegantly */}
              <span className="text-3xl mb-1">{topping.emoji}</span>
              <span className="font-bold text-sm leading-tight text-white">{topping.label}</span>
            </button>
          );
        })}
      </div>

      {!isValid && (
        <p className="text-caramba-red text-sm font-bold bg-caramba-red/10 p-3 rounded-lg border border-caramba-red/20 text-center">
          ⚠ Faltan {MIN_TOPPINGS - selectedToppings.length} ingredientes para confirmar
        </p>
      )}
    </div>
  );
}
