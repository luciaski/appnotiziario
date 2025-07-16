
import { GoogleGenAI, GenerateContentResponse, GroundingChunk as GenAIGroundingChunk } from "@google/genai";
import { GroundingChunk, NewsCategory } from '../types.ts';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "NO_API_KEY_FOUND" });

export const generateNewsBulletin = async (
  currentDateString: string,
  selectedCategories: NewsCategory[],
  customTopic1?: string,
  customTopic2?: string
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!API_KEY) {
    throw new Error("API_KEY non configurata. Impossibile contattare il servizio Gemini.");
  }

  let sectionsToGenerate = "";
  const sectionTitlesForPrompt: string[] = [];

  if (selectedCategories.includes(NewsCategory.BREAKING_NEWS)) {
    sectionTitlesForPrompt.push(NewsCategory.BREAKING_NEWS);
    sectionsToGenerate += `${NewsCategory.BREAKING_NEWS}
[Contenuto per ${NewsCategory.BREAKING_NEWS}. Focalizzati sugli eventi più urgenti delle ultime 8 ore. Rispondi alle "5 W" (Chi, Cosa, Dove, Quando, Perché) e scrivi con uno stile diretto, da giornale radio.]

`;
  }
  if (selectedCategories.includes(NewsCategory.NATIONAL_CHRONICLE)) {
    sectionTitlesForPrompt.push(NewsCategory.NATIONAL_CHRONICLE);
    sectionsToGenerate += `${NewsCategory.NATIONAL_CHRONICLE}
[Contenuto per ${NewsCategory.NATIONAL_CHRONICLE}. Copri eventi significativi da diverse regioni d'Italia, fornendo dettagli precisi (luoghi, persone coinvolte) e applicando la regola delle "5 W".]

`;
  }
  if (selectedCategories.includes(NewsCategory.ITALIAN_POLITICS)) {
    sectionTitlesForPrompt.push(NewsCategory.ITALIAN_POLITICS);
    sectionsToGenerate += `${NewsCategory.ITALIAN_POLITICS}
[Contenuto per ${NewsCategory.ITALIAN_POLITICS}. Analizza i principali avvenimenti politici, decisioni del Governo e dibattiti parlamentari. Includi dichiarazioni chiave. Fonti di riferimento: parlamento.it, senato.it.]

`;
  }
  if (selectedCategories.includes(NewsCategory.INTERNATIONAL)) {
    sectionTitlesForPrompt.push(NewsCategory.INTERNATIONAL);
    sectionsToGenerate += `${NewsCategory.INTERNATIONAL}
[Contenuto per ${NewsCategory.INTERNATIONAL}. Seleziona gli eventi globali di maggiore impatto, con dettagli e contesto. Fonti di riferimento: edition.cnn.com, bbc.com/news, france24.com, aljazeera.com, isponline.it, politico.com, politico.eu.]

`;
  }
  if (selectedCategories.includes(NewsCategory.RASSEGNA_STAMPA_INTERNAZIONALE)) {
    sectionTitlesForPrompt.push(NewsCategory.RASSEGNA_STAMPA_INTERNAZIONALE);
    sectionsToGenerate += `${NewsCategory.RASSEGNA_STAMPA_INTERNAZIONALE}
[Contenuto per ${NewsCategory.RASSEGNA_STAMPA_INTERNAZIONALE}. Recupera i titoli di testa e i sottotitoli PRINCIPALI attualmente presenti sulle homepage dei seguenti siti, TRADOTTI IN ITALIANO: BBC (bbc.com/news), France24 (france24.com/en/), Le Monde (lemonde.fr), CNN (edition.cnn.com), Fox News (foxnews.com), Le Soir (lesoir.be), El País (elpais.com). Specifica la fonte per ogni gruppo di titoli. Le notizie devono essere quelle di oggi, ${currentDateString}.]

`;
  }
  if (selectedCategories.includes(NewsCategory.ECONOMY_FINANCE)) {
    sectionTitlesForPrompt.push(NewsCategory.ECONOMY_FINANCE);
    sectionsToGenerate += `${NewsCategory.ECONOMY_FINANCE}
[Contenuto per ${NewsCategory.ECONOMY_FINANCE}. Notizie su economia italiana e finanza. Fornisci SEMPRE un aggiornamento dettagliato sulle borse mondiali (es. NYSE, NASDAQ), europee (es. FTSE 100, DAX) e Borsa Italiana (FTSE MIB). Fonti di riferimento: milanofinanza.it, borse.it, teleborsa.it.]

`;
  }
  if (selectedCategories.includes(NewsCategory.SPORTS)) {
    sectionTitlesForPrompt.push(NewsCategory.SPORTS);
    sectionsToGenerate += `${NewsCategory.SPORTS}
[Contenuto per ${NewsCategory.SPORTS}. Copri eventi e risultati di rilievo nazionale e internazionale, con dettagli su protagonisti e performance. Fonti di riferimento: corrieredellosport.it, tuttosport.com.]

`;
  }
  if (selectedCategories.includes(NewsCategory.METEO)) {
    sectionTitlesForPrompt.push(NewsCategory.METEO);
    sectionsToGenerate += `${NewsCategory.METEO}
[Contenuto per ${NewsCategory.METEO}. Fornisci previsioni dettagliate per oggi (${currentDateString}) sull'Italia e su Roma (temperature, vento, precipitazioni). Includi una tendenza per i prossimi 3-7 giorni. Fonti di riferimento: ilmeteo.it, meteoam.it, 3bmeteo.com.]

`;
  }
  if (selectedCategories.includes(NewsCategory.SCIENCE_TECH)) {
    sectionTitlesForPrompt.push(NewsCategory.SCIENCE_TECH);
    sectionsToGenerate += `${NewsCategory.SCIENCE_TECH}
[Contenuto per ${NewsCategory.SCIENCE_TECH}. Riporta scoperte e innovazioni importanti, spiegando il contesto e l'impatto. Fonti di riferimento: futuroprossimo.it, scienzainrete.it, sciencenews.org.]

`;
  }
  
  if (selectedCategories.includes(NewsCategory.RASSEGNA_STAMPA_NAZIONALE)) {
    sectionTitlesForPrompt.push(NewsCategory.RASSEGNA_STAMPA_NAZIONALE);
    sectionsToGenerate += `${NewsCategory.RASSEGNA_STAMPA_NAZIONALE}
[Contenuto per ${NewsCategory.RASSEGNA_STAMPA_NAZIONALE}. Recupera i titoli di testa e i sottotitoli PRINCIPALI attualmente presenti sulle homepage dei seguenti quotidiani: Corriere della Sera (corriere.it), la Repubblica (repubblica.it), Il Messaggero (ilmessaggero.it), La Stampa (lastampa.it), Il Fatto Quotidiano (ilfattoquotidiano.it), Libero (liberoquotidiano.it), La Verità (laverita.info). Specifica la fonte per ogni gruppo di titoli. Le notizie devono essere quelle di oggi, ${currentDateString}.]

`;
  }

  if (customTopic1 && customTopic1.trim() !== "") {
    const trimmedCustomTopic1 = customTopic1.trim();
    sectionTitlesForPrompt.push(trimmedCustomTopic1);
    sectionsToGenerate += `${trimmedCustomTopic1}
[Contenuto dettagliato e approfondito sull'argomento: ${trimmedCustomTopic1}. Applica sempre la regola delle "5 W" e lo stile da giornale radio.]

`;
  }
  
  if (customTopic2 && customTopic2.trim() !== "") {
    const trimmedCustomTopic2 = customTopic2.trim();
    sectionTitlesForPrompt.push(trimmedCustomTopic2);
    sectionsToGenerate += `${trimmedCustomTopic2}
[Contenuto dettagliato e approfondito sull'argomento: ${trimmedCustomTopic2}. Applica sempre la regola delle "5 W" e lo stile da giornale radio.]

`;
  }
  
  if (sectionTitlesForPrompt.length === 0) {
    return { text: "Nessuna sezione selezionata per la generazione.", groundingChunks: [] };
  }

  const prompt = `Oggi è il ${currentDateString}.
Agisci come un esperto giornalista e caporedattore di un giornale radiofonico. Il tuo compito è creare un bollettino di notizie dettagliato, scritto in uno stile chiaro, diretto e coinvolgente, pronto per essere letto in onda.

Segui SCRUPOLOSAMENTE queste direttive:

1.  **Stile di Scrittura Radiofonico e Regola delle "5 W"**:
    *   Per ogni notizia (escluse Rassegna Stampa e Meteo), applica rigorosamente la regola giornalistica delle "5 W": **CHI** (i protagonisti), **COSA** (l'evento), **DOVE** (il luogo), **QUANDO** (il momento) e **PERCHÉ** (le cause e il contesto).
    *   Arricchisci il testo con il massimo livello di dettaglio possibile: dati numerici, nomi specifici di persone e luoghi, e, ove disponibili e pertinenti, **dichiarazioni ufficiali o commenti significativi**.
    *   Usa uno stile da notiziario radiofonico: frasi concise, linguaggio accessibile ma preciso, e un ritmo che mantenga alta l'attenzione dell'ascoltatore.

2.  **Fonti di Riferimento Obbligatorie**:
    *   Per la tua ricerca, oltre alla ricerca web generale, fai riferimento in modo prioritario alle seguenti fonti autorevoli. Cerca di includere notizie da questo elenco:
        *   **Notizie Generali (Italia e Mondo)**: https://tg24.sky.it/, https://www.tgcom24.mediaset.it/, https://www.rainews.it/, https://www.agi.it/, https://www.ilpost.it/, https://edition.cnn.com/, https://www.bbc.com/news, https://www.france24.com/en/, https://www.aljazeera.com/
        *   **Politica**: https://www.politico.com/, https://www.politico.eu/, parlamento.it, senato.it
        *   **Economia e Finanza**: https://www.milanofinanza.it/, borse.it, teleborsa.it
        *   **Sport**: https://www.corrieredellosport.it/, https://www.tuttosport.com/
        *   **Scienza e Tecnologia**: https://www.futuroprossimo.it/, https://www.scienzainrete.it/, https://www.sciencenews.org/
        *   **Approfondimenti Internazionali**: https://www.ispionline.it/it
        *   **Meteo (solo per meteo)**: https://www.ilmeteo.it/, https://www.meteoam.it/, https://www.3bmeteo.com/

3.  **Struttura e Formattazione del Bollettino**:
    *   Genera un unico testo coeso contenente SOLO le sezioni richieste qui sotto.
    *   Le sezioni da generare sono: ${sectionTitlesForPrompt.join(', ')}.
    *   Formatta il bollettino usando i seguenti titoli di sezione, scritti ESATTAMENTE come indicato, senza simboli come "#" e seguiti da un a capo:
${sectionsToGenerate}
    *   Assicurati che ogni sezione richiesta sia presente nel testo finale.
    *   Inizia direttamente con la prima sezione richiesta, senza introduzioni come "Buongiorno e benvenuti...".
    *   Se una sezione non produce risultati significativi, indica "Nessun aggiornamento di rilievo per [Nome Sezione] oggi." sotto il titolo.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const genAIGroundingChunks: GenAIGroundingChunk[] | undefined = groundingMetadata?.groundingChunks;

    const localGroundingChunks: GroundingChunk[] = genAIGroundingChunks
      ? genAIGroundingChunks.map(chunk => ({
          web: chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : undefined,
        }))
      : [];
      
    return { text: response.text, groundingChunks: localGroundingChunks };
  } catch (error) {
    console.error("Errore durante la generazione del bollettino:", error);
    if (error instanceof Error) {
        throw new Error(`Errore API Gemini: ${error.message}`);
    }
    throw new Error("Errore sconosciuto durante la generazione del bollettino.");
  }
};
