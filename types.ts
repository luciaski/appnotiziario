
export enum NewsCategory {
  BREAKING_NEWS = "Ultime Notizie (ultime 8 ore)",
  NATIONAL_CHRONICLE = "Cronaca Nazionale",
  ITALIAN_POLITICS = "Politica Italiana",
  INTERNATIONAL = "Internazionale",
  RASSEGNA_STAMPA_INTERNAZIONALE = "Rassegna Stampa Internazionale",
  RASSEGNA_STAMPA_NAZIONALE = "Rassegna Stampa Nazionale",
  ECONOMY_FINANCE = "Economia e Finanza",
  SCIENCE_TECH = "Scienza e Tecnologia",
  SPORTS = "Sport",
  METEO = "Meteo",
}

// Order of news categories for display and selection UI
export const ALL_NEWS_CATEGORIES: NewsCategory[] = [
  NewsCategory.BREAKING_NEWS,
  NewsCategory.NATIONAL_CHRONICLE,
  NewsCategory.ITALIAN_POLITICS,
  NewsCategory.INTERNATIONAL,
  NewsCategory.ECONOMY_FINANCE,
  NewsCategory.SPORTS,
  NewsCategory.METEO,
  NewsCategory.SCIENCE_TECH,
  NewsCategory.RASSEGNA_STAMPA_NAZIONALE,
  NewsCategory.RASSEGNA_STAMPA_INTERNAZIONALE,
];

export interface StructuredNewsSection {
  title: string;
  content: string;
}

export interface StructuredNewsOutput {
  sections: StructuredNewsSection[];
  rawText: string; // Keep raw text if needed for other purposes
}

export interface GroundingChunkWeb {
  uri: string;
  title:string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of grounding chunks could exist, e.g., 'retrievedContext'
}