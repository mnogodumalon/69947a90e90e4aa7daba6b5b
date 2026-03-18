import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kategorien, NotizSchlagwoerterZuordnung, Notizen, Schlagwoerter, Schnellerfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [kategorien, setKategorien] = useState<Kategorien[]>([]);
  const [notizSchlagwoerterZuordnung, setNotizSchlagwoerterZuordnung] = useState<NotizSchlagwoerterZuordnung[]>([]);
  const [notizen, setNotizen] = useState<Notizen[]>([]);
  const [schlagwoerter, setSchlagwoerter] = useState<Schlagwoerter[]>([]);
  const [schnellerfassung, setSchnellerfassung] = useState<Schnellerfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [kategorienData, notizSchlagwoerterZuordnungData, notizenData, schlagwoerterData, schnellerfassungData] = await Promise.all([
        LivingAppsService.getKategorien(),
        LivingAppsService.getNotizSchlagwoerterZuordnung(),
        LivingAppsService.getNotizen(),
        LivingAppsService.getSchlagwoerter(),
        LivingAppsService.getSchnellerfassung(),
      ]);
      setKategorien(kategorienData);
      setNotizSchlagwoerterZuordnung(notizSchlagwoerterZuordnungData);
      setNotizen(notizenData);
      setSchlagwoerter(schlagwoerterData);
      setSchnellerfassung(schnellerfassungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const kategorienMap = useMemo(() => {
    const m = new Map<string, Kategorien>();
    kategorien.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kategorien]);

  const notizenMap = useMemo(() => {
    const m = new Map<string, Notizen>();
    notizen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [notizen]);

  const schlagwoerterMap = useMemo(() => {
    const m = new Map<string, Schlagwoerter>();
    schlagwoerter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schlagwoerter]);

  return { kategorien, setKategorien, notizSchlagwoerterZuordnung, setNotizSchlagwoerterZuordnung, notizen, setNotizen, schlagwoerter, setSchlagwoerter, schnellerfassung, setSchnellerfassung, loading, error, fetchAll, kategorienMap, notizenMap, schlagwoerterMap };
}