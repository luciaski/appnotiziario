
import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { generateNewsBulletin } from './services/geminiService.ts';
import { NewsCategory, ALL_NEWS_CATEGORIES, StructuredNewsSection, GroundingChunk } from './types.ts';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import ErrorDisplay from './components/ErrorDisplay.tsx';
import NewsDisplay from './components/NewsDisplay.tsx';
import GenerationOptions from './components/GenerationOptions.tsx';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 7.5l-.813 2.846a2.25 2.25 0 01-1.545 1.545L13.25 12l2.642.813a2.25 2.25 0 011.545 1.545L18.25 17.25l.813-2.846a2.25 2.25 0 011.545-1.545L23.25 12l-2.642-.813a2.25 2.25 0 01-1.545-1.545L18.25 7.5z" />
    </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);


const App: React.FC = () => {
  const [todayDate, setTodayDate] = useState<string>('');
  const [generatedSections, setGeneratedSections] = useState<StructuredNewsSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  
  const [selectedCategories, setSelectedCategories] = useState<Set<NewsCategory>>(() => new Set(ALL_NEWS_CATEGORIES));
  const [customTopicInput1, setCustomTopicInput1] = useState<string>('');
  const [customTopicInput2, setCustomTopicInput2] = useState<string>('');
  const [isWebShareSupported, setIsWebShareSupported] = useState<boolean>(false);


  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }));
    if (navigator.share) {
      setIsWebShareSupported(true);
    }
  }, []);

  const handleCategoryToggle = (category: NewsCategory) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  const parseBulletinText = useCallback((text: string, activeCategoryTitles: string[], activeCustomTopic1?: string, activeCustomTopic2?: string): StructuredNewsSection[] => {
    const sections: StructuredNewsSection[] = [];
    let currentTitle: string | null = null;
    let currentContent: string[] = [];
    const lines = text.split('\n');

    const allPossibleHeaders = [...activeCategoryTitles];
    if (activeCustomTopic1 && activeCustomTopic1.trim() !== "") {
        allPossibleHeaders.push(activeCustomTopic1.trim());
    }
    if (activeCustomTopic2 && activeCustomTopic2.trim() !== "") {
        allPossibleHeaders.push(activeCustomTopic2.trim());
    }
    
    const escapedHeaders = allPossibleHeaders.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const headerRegex = new RegExp(`^(${escapedHeaders.join('|')})$`);

    for (const line of lines) {
      const trimmedLine = line.trim();
      const match = headerRegex.exec(trimmedLine);

      if (match && allPossibleHeaders.includes(trimmedLine)) {
        if (currentTitle && currentContent.length > 0) {
          sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
        }
        currentTitle = trimmedLine;
        currentContent = [];
      } else if (currentTitle) {
        currentContent.push(line);
      }
    }

    if (currentTitle && currentContent.length > 0) {
      sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
    }
    
    const orderedSections: StructuredNewsSection[] = [];
    const foundTitles = new Set<string>();

    ALL_NEWS_CATEGORIES.forEach(cat => {
        if (selectedCategories.has(cat)) {
            const section = sections.find(s => s.title === cat);
            if (section) {
                orderedSections.push(section);
                foundTitles.add(cat);
            }
        }
    });
    
    if (activeCustomTopic1 && activeCustomTopic1.trim() !== "") {
        const customSection1 = sections.find(s => s.title === activeCustomTopic1.trim());
        if (customSection1) {
            orderedSections.push(customSection1);
            foundTitles.add(customSection1.title);
        }
    }
    if (activeCustomTopic2 && activeCustomTopic2.trim() !== "") {
        const customSection2 = sections.find(s => s.title === activeCustomTopic2.trim());
        if (customSection2) {
            orderedSections.push(customSection2);
            foundTitles.add(customSection2.title);
        }
    }
        
    sections.forEach(s => {
        if (!foundTitles.has(s.title)) {
            orderedSections.push(s);
        }
    });

    return orderedSections;
  }, [selectedCategories]);


  const handleGenerateNews = async () => {
    if (selectedCategories.size === 0 && !customTopicInput1.trim() && !customTopicInput2.trim()) {
      setError("Seleziona almeno una categoria o inserisci un argomento personalizzato.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedSections([]);
    setGroundingSources([]);

    try {
      const activeCategoriesArray = Array.from(selectedCategories);
      const { text: newBulletinText, groundingChunks } = await generateNewsBulletin(todayDate, activeCategoriesArray, customTopicInput1, customTopicInput2);
      
      const activeCategoryTitles = activeCategoriesArray.map(cat => cat.toString());
      setGeneratedSections(parseBulletinText(newBulletinText, activeCategoryTitles, customTopicInput1, customTopicInput2));
      
      if (groundingChunks) {
        setGroundingSources(groundingChunks);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore sconosciuto.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedSections.length === 0) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    const addFormattedText = (text: string, size: number, options: { isBold?: boolean, spaceAfter?: number, color?: string } = {}) => {
        const { isBold = false, spaceAfter = 5, color = '#000000' } = options;
        
        if (yPosition + size > pageHeight - margin && yPosition > margin) { 
            doc.addPage();
            yPosition = margin;
        }
        
        doc.setFontSize(size);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        doc.setTextColor(color);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
            if (yPosition + (size / doc.internal.scaleFactor) > pageHeight - margin && yPosition > margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += (size / doc.internal.scaleFactor) * 1.2; 
        });
        yPosition += spaceAfter;
    };
    
    addFormattedText(`Notiziario IA Quotidiano - ${todayDate}`, 18, { isBold: true, spaceAfter: 10 });

    generatedSections.forEach(section => {
      if (section.content && section.content.trim().length > 0) {
        addFormattedText(section.title, 14, { isBold: true, spaceAfter: 3, color: '#007bff' }); 
        addFormattedText(section.content, 10, { spaceAfter: 8 });
      }
    });

    doc.save(`Notiziario_IA_${todayDate.replace(/[ ,]/g, '_')}.pdf`);
  };

  const handleListenNews = async () => {
    if (!generatedSections || generatedSections.length === 0 || !navigator.share) {
      return;
    }

    const introText = "Leggi ad alta voce il seguente testo:\n\n";
    const newsContent = generatedSections
      .map(section => `${section.title}\n${section.content}`)
      .join('\n\n');
    
    const fullTextToShare = introText + newsContent;

    try {
      await navigator.share({
        title: `Notiziario IA - ${todayDate}`,
        text: fullTextToShare,
      });
      console.log('Contenuto condiviso con successo.');
    } catch (shareError) {
      console.error('Errore durante la condivisione:', shareError);
      setError('Impossibile condividere il contenuto. L\'operazione potrebbe essere stata annullata o non supportata.');
    }
  };


  const hasNewsContent = generatedSections.length > 0;
  const canGenerate = selectedCategories.size > 0 || customTopicInput1.trim() !== '' || customTopicInput2.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-400 selection:text-sky-900">
      <header className="w-full max-w-4xl text-center my-6 md:my-10">
        <div className="flex items-center justify-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12 mr-3 text-sky-500">
            <rect width="100" height="100" rx="20" fill="currentColor"/>
            <text x="50" y="60" fontSize="40" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif">📰</text>
            <text x="50" y="85" fontSize="15" fill="#e0f2fe" textAnchor="middle" fontFamily="Arial, sans-serif">IA</text>
          </svg>
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">Notiziario IA Quotidiano</h1>
        </div>
        <p className="text-slate-400 text-lg">Bollettino del {todayDate}</p>
      </header>

      <main className="w-full max-w-4xl bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 flex-grow">
        <GenerationOptions
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            customTopic1={customTopicInput1}
            onCustomTopic1Change={setCustomTopicInput1}
            customTopic2={customTopicInput2}
            onCustomTopic2Change={setCustomTopicInput2}
            allCategories={ALL_NEWS_CATEGORIES}
            canGenerate={canGenerate}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-6 pt-6 border-t border-slate-700 gap-4">
          <button
            onClick={handleGenerateNews}
            disabled={isLoading || !canGenerate}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto"
            aria-live="polite"
            aria-label={isLoading ? "Generazione bollettino in corso" : "Genera bollettino notizie"}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="text-white" />
                <span className="ml-2">Generazione...</span>
              </>
            ) : (
              <>
                <SparklesIcon />
                <span>Genera Bollettino</span>
              </>
            )}
          </button>
          
          {hasNewsContent && !isLoading && (
            <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
              <button
                onClick={handleDownloadPDF}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-full sm:w-auto"
                aria-label="Scarica bollettino in formato PDF"
              >
                <DownloadIcon />
                <span>Scarica PDF</span>
              </button>
              <button
                onClick={handleListenNews}
                disabled={!isWebShareSupported}
                title={isWebShareSupported ? "Ascolta le notizie tramite un'app esterna" : "Funzione di condivisione non supportata dal tuo browser"}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Ascolta le notizie"
              >
                <SpeakerIcon />
                <span>Ascolta Notizie</span>
              </button>
            </div>
          )}
        </div>

        {error && <ErrorDisplay message={error} />}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 h-60">
            <LoadingSpinner size="lg" color="text-sky-500" />
            <p className="mt-4 text-lg">Recupero e generazione delle notizie in corso...</p>
            <p className="text-sm">Potrebbe richiedere qualche istante.</p>
          </div>
        ) : hasNewsContent ? (
          <>
            <NewsDisplay sections={generatedSections} />
            {groundingSources.length > 0 && (
              <section className="mt-10 pt-6 border-t border-slate-700" aria-labelledby="sources-title">
                <h3 id="sources-title" className="text-xl font-semibold text-sky-500 mb-4">Fonti Utilizzate</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  {groundingSources.map((source, index) =>
                    source.web?.uri ? (
                      <li key={index} className="text-slate-300">
                        <a
                          href={source.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-sky-400 underline transition-colors duration-150"
                          aria-label={`Fonte ${index + 1}: ${source.web.title || source.web.uri} (apre in una nuova scheda)`}
                        >
                          {source.web.title || source.web.uri}
                        </a>
                      </li>
                    ) : null
                  )}
                </ul>
              </section>
            )}
          </>
        ) : (
          !error && (
            <div className="text-center text-slate-500 py-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="mt-3 text-lg">Nessun bollettino generato.</p>
              <p className="text-sm">Seleziona le sezioni desiderate e clicca su "Genera Bollettino" per iniziare.</p>
            </div>
          )
        )}
      </main>

      <footer className="w-full max-w-4xl text-center py-6 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Notiziario IA Quotidiano. Realizzato con Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
