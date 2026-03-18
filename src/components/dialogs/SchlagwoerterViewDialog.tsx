import type { Schlagwoerter } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';

interface SchlagwoerterViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schlagwoerter | null;
  onEdit: (record: Schlagwoerter) => void;
}

export function SchlagwoerterViewDialog({ open, onClose, record, onEdit }: SchlagwoerterViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schlagwörter anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Schlagwort</Label>
            <p className="text-sm">{record.fields.schlagwortname ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}