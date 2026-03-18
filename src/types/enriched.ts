import type { NotizSchlagwoerterZuordnung, Notizen, Schnellerfassung } from './app';

export type EnrichedNotizSchlagwoerterZuordnung = NotizSchlagwoerterZuordnung & {
  notizName: string;
  schlagwortName: string;
};

export type EnrichedNotizen = Notizen & {
  kategorieName: string;
};

export type EnrichedSchnellerfassung = Schnellerfassung & {
  kategorie_schnellName: string;
};
