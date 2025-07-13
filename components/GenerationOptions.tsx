
import React from 'react';
import { NewsCategory } from '../types.ts';

interface GenerationOptionsProps {
  selectedCategories: Set<NewsCategory>;
  onCategoryToggle: (category: NewsCategory) => void;
  customTopic1: string;
  onCustomTopic1Change: (topic: string) => void;
  customTopic2: string;
  onCustomTopic2Change: (topic: string) => void;
  allCategories: NewsCategory[];
  canGenerate: boolean;
}

const GenerationOptions: React.FC<GenerationOptionsProps> = ({
  selectedCategories,
  onCategoryToggle,
  customTopic1,
  onCustomTopic1Change,
  customTopic2,
  onCustomTopic2Change,
  allCategories,
  canGenerate
}) => {
  return (
    <div className="bg-slate-700 p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold text-sky-400 mb-4">Personalizza il tuo Bollettino</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <div>
          <label htmlFor="custom-topic-1" className="block text-sm font-medium text-slate-300 mb-1">
            Argomento Personalizzato 1 (opzionale):
          </label>
          <input
            type="text"
            id="custom-topic-1"
            value={customTopic1}
            onChange={(e) => onCustomTopic1Change(e.target.value)}
            placeholder="Es: Sviluppi recenti in F1"
            className="w-full p-2.5 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">Se inserito, verrà creata una sezione dedicata.</p>
        </div>
        <div>
          <label htmlFor="custom-topic-2" className="block text-sm font-medium text-slate-300 mb-1">
            Argomento Personalizzato 2 (opzionale):
          </label>
          <input
            type="text"
            id="custom-topic-2"
            value={customTopic2}
            onChange={(e) => onCustomTopic2Change(e.target.value)}
            placeholder="Es: Ultimi film usciti al cinema"
            className="w-full p-2.5 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">Se inserito, verrà creata una sezione dedicata.</p>
        </div>
      </div>


      <div>
        <p className="block text-sm font-medium text-slate-300 mb-2">Seleziona le sezioni da includere:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allCategories.map((category) => (
            <label
              key={category}
              htmlFor={`category-${category}`}
              className="flex items-center space-x-2 p-2.5 bg-slate-600 hover:bg-slate-500 rounded-md cursor-pointer transition-colors duration-150"
            >
              <input
                type="checkbox"
                id={`category-${category}`}
                checked={selectedCategories.has(category)}
                onChange={() => onCategoryToggle(category)}
                className="h-5 w-5 rounded border-slate-400 text-sky-500 focus:ring-sky-500 bg-slate-700 checked:bg-sky-500"
              />
              <span className="text-slate-200 text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>
       {!canGenerate && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          Attenzione: Devi selezionare almeno una categoria o inserire un argomento personalizzato per generare il bollettino.
        </p>
      )}
    </div>
  );
};

export default GenerationOptions;
