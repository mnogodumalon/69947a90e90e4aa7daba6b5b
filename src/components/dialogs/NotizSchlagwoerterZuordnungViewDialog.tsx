import type { NotizSchlagwoerterZuordnung, Notizen, Schlagwoerter } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';

interface NotizSchlagwoerterZuordnungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: NotizSchlagwoerterZuordnung | null;
  onEdit: (record: NotizSchlagwoerterZuordnung) => void;
  notizenList: Notizen[];
  schlagwoerterList: Schlagwoerter[];
}

export function NotizSchlagwoerterZuordnungViewDialog({ open, onClose, record, onEdit, notizenList, schlagwoerterList }: NotizSchlagwoerterZuordnungViewDialogProps) {
  function getNotizenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return notizenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  function getSchlagwoerterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schlagwoerterList.find(r => r.record_id === id)?.fields.schlagwortname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notiz-Schlagwörter-Zuordnung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notiz</Label>
            <p className="text-sm">{getNotizenDisplayName(record.fields.notiz)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schlagwort</Label>
            <p className="text-sm">{getSchlagwoerterDisplayName(record.fields.schlagwort)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}