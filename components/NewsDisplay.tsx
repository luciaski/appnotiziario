
import React from 'react';
import { StructuredNewsSection } from '../types.ts';

interface NewsDisplayProps {
  sections: StructuredNewsSection[];
}

const NewsDisplay: React.FC<NewsDisplayProps> = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return <p className="text-slate-400">Nessun contenuto da visualizzare.</p>;
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        if (!section || !section.title) return null; // Should not happen with proper parsing

        return (
          <section key={section.title} aria-labelledby={`section-title-${section.title.replace(/\s+/g, '-').toLowerCase()}`}>
            <h2 
              id={`section-title-${section.title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-2xl font-semibold text-sky-400 mb-3 pb-2 border-b-2 border-slate-700"
            >
              {section.title}
            </h2>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-slate-300 whitespace-pre-line leading-relaxed selection:bg-sky-700 selection:text-sky-100">
              {section.content || "Nessuna notizia disponibile per questa sezione."}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default NewsDisplay;
