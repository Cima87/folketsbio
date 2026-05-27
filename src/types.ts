export type Category = 'news' | 'releases' | 'festivals' | 'curated';

export interface FilmNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  date: string;
  importance: string; // why it fits independent cinema programming
  directors?: string;
  cast?: string;
  genres?: string[];
  festival?: string; // e.g., Cannes, Sundance
}

export interface ImageTask {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  createdAt: string;
  stage?: string;
  error?: string;
}

export interface CinemaProfile {
  name: string;
  location: string;
  screens: number;
  seatingCapacity: number;
  focusArea: string; // e.g., Avant-Garde, European Cinema, Local Indies
}
