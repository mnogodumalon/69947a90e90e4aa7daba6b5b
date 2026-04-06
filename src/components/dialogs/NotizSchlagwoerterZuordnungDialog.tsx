import { useState, useEffect } from 'react';
import type { NotizSchlagwoerterZuordnung, Notizen, Schlagwoerter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface NotizSchlagwoerterZuordnungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: NotizSchlagwoerterZuordnung['fields']) => Promise<void>;
  defaultValues?: NotizSchlagwoerterZuordnung['fields'];
  notizenList: Notizen[];
  schlagwoerterList: Schlagwoerter[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function NotizSchlagwoerterZuordnungDialog({ open, onClose, onSubmit, defaultValues, notizenList, schlagwoerterList, enablePhotoScan: _enablePhotoScan = true, enablePhotoLocation: _enablePhotoLocation = true }: NotizSchlagwoerterZuordnungDialogProps) {
  const [fields, setFields] = useState<Partial<NotizSchlagwoerterZuordnung['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'notiz_schlagwoerter_zuordnung');
      await onSubmit(clean as NotizSchlagwoerterZuordnung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const DIALOG_INTENT = defaultValues ? 'Notiz-Schlagwörter-Zuordnung bearbeiten' : 'Notiz-Schlagwörter-Zuordnung hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notiz">Notiz</Label>
            <Select
              value={extractRecordId(fields.notiz) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, notiz: v === 'none' ? undefined : createRecordUrl(APP_IDS.NOTIZEN, v) }))}
            >
              <SelectTrigger id="notiz"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {notizenList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.titel ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schlagwort">Schlagwort</Label>
            <Select
              value={extractRecordId(fields.schlagwort) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, schlagwort: v === 'none' ? undefined : createRecordUrl(APP_IDS.SCHLAGWOERTER, v) }))}
            >
              <SelectTrigger id="schlagwort"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {schlagwoerterList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.schlagwortname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}