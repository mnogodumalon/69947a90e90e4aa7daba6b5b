import type { EnrichedNotizSchlagwoerterZuordnung, EnrichedNotizen, EnrichedSchnellerfassung } from '@/types/enriched';
import type { Kategorien, NotizSchlagwoerterZuordnung, Notizen, Schlagwoerter, Schnellerfassung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface NotizSchlagwoerterZuordnungMaps {
  notizenMap: Map<string, Notizen>;
  schlagwoerterMap: Map<string, Schlagwoerter>;
}

export function enrichNotizSchlagwoerterZuordnung(
  notizSchlagwoerterZuordnung: NotizSchlagwoerterZuordnung[],
  maps: NotizSchlagwoerterZuordnungMaps
): EnrichedNotizSchlagwoerterZuordnung[] {
  return notizSchlagwoerterZuordnung.map(r => ({
    ...r,
    notizName: resolveDisplay(r.fields.notiz, maps.notizenMap, 'titel'),
    schlagwortName: resolveDisplay(r.fields.schlagwort, maps.schlagwoerterMap, 'schlagwortname'),
  }));
}

interface NotizenMaps {
  kategorienMap: Map<string, Kategorien>;
}

export function enrichNotizen(
  notizen: Notizen[],
  maps: NotizenMaps
): EnrichedNotizen[] {
  return notizen.map(r => ({
    ...r,
    kategorieName: resolveDisplay(r.fields.kategorie, maps.kategorienMap, 'kategoriename'),
  }));
}

interface SchnellerfassungMaps {
  kategorienMap: Map<string, Kategorien>;
}

export function enrichSchnellerfassung(
  schnellerfassung: Schnellerfassung[],
  maps: SchnellerfassungMaps
): EnrichedSchnellerfassung[] {
  return schnellerfassung.map(r => ({
    ...r,
    kategorie_schnellName: resolveDisplay(r.fields.kategorie_schnell, maps.kategorienMap, 'kategoriename'),
  }));
}
