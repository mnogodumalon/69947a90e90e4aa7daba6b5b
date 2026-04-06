import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichNotizen } from '@/lib/enrich';
import type { EnrichedNotizen } from '@/types/enriched';
import type { Kategorien } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconBell, IconBook, IconCircleCheck, IconCircle, IconClock, IconFolderOpen, IconStack2, IconPencil, IconPlus, IconSearch, IconNote, IconTag, IconTrash, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { NotizenDialog } from '@/components/dialogs/NotizenDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

// Priority display config
const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  sehr_hoch: { label: 'Sehr hoch', className: 'bg-red-100 text-red-700 border-red-200' },
  hoch: { label: 'Hoch', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  normal: { label: 'Normal', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  niedrig: { label: 'Niedrig', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

// Category color mapping
const FARBE_CLASSES: Record<string, { bg: string; border: string; dot: string }> = {
  rot: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  blau: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  gruen: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  gelb: { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  lila: { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  grau: { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
};
const DEFAULT_COLOR = { bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' };

export default function DashboardOverview() {
  const {
    kategorien, notizSchlagwoerterZuordnung, notizen, schlagwoerter, schnellerfassung,
    kategorienMap, notizenMap, schlagwoerterMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedNotizen = enrichNotizen(notizen, { kategorienMap });

  // --- State (ALL hooks before early returns) ---
  const [search, setSearch] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNote, setEditNote] = useState<EnrichedNotizen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedNotizen | null>(null);
  const [defaultKategorie, setDefaultKategorie] = useState<string | undefined>(undefined);

  // Compute tag lookup: note id -> tag names
  const noteTagsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const z of notizSchlagwoerterZuordnung) {
      const noteId = extractRecordId(z.fields.notiz);
      const tagId = extractRecordId(z.fields.schlagwort);
      if (!noteId) continue;
      const tagName = tagId ? (schlagwoerterMap.get(tagId)?.fields.schlagwortname ?? tagId) : '';
      if (!map[noteId]) map[noteId] = [];
      if (tagName) map[noteId].push(tagName);
    }
    return map;
  }, [notizSchlagwoerterZuordnung, schlagwoerterMap]);

  // Filtered notes
  const filtered = useMemo(() => {
    return enrichedNotizen.filter(n => {
      if (!showDone && n.fields.erledigt) return false;
      if (filterKategorie) {
        const katId = extractRecordId(n.fields.kategorie);
        if (katId !== filterKategorie) return false;
      }
      if (filterPriority && n.fields.prioritaet?.key !== filterPriority) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = n.fields.titel?.toLowerCase().includes(q);
        const inContent = n.fields.inhalt?.toLowerCase().includes(q);
        const inTags = (noteTagsMap[n.record_id] ?? []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inTags) return false;
      }
      return true;
    });
  }, [enrichedNotizen, showDone, filterKategorie, filterPriority, search, noteTagsMap]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: { kat: Kategorien | null; notes: EnrichedNotizen[] }[] = [];
    const seen = new Set<string | null>();
    for (const note of filtered) {
      const katId = extractRecordId(note.fields.kategorie) ?? null;
      if (!seen.has(katId)) {
        seen.add(katId);
        const kat = katId ? kategorienMap.get(katId) ?? null : null;
        groups.push({ kat, notes: [] });
      }
    }
    // fill notes into groups
    for (const note of filtered) {
      const katId = extractRecordId(note.fields.kategorie) ?? null;
      const group = groups.find(g => (g.kat?.record_id ?? null) === katId);
      group?.notes.push(note);
    }
    // Sort: high priority first within each group
    const priorityOrder: Record<string, number> = { sehr_hoch: 0, hoch: 1, normal: 2, niedrig: 3 };
    for (const g of groups) {
      g.notes.sort((a, b) => {
        const pa = priorityOrder[a.fields.prioritaet?.key ?? 'normal'] ?? 2;
        const pb = priorityOrder[b.fields.prioritaet?.key ?? 'normal'] ?? 2;
        return pa - pb;
      });
    }
    return groups;
  }, [filtered, kategorienMap]);

  // Stats
  const totalNotes = notizen.length;
  const doneNotes = notizen.filter(n => n.fields.erledigt).length;
  const highPriority = notizen.filter(n => n.fields.prioritaet?.key === 'sehr_hoch' || n.fields.prioritaet?.key === 'hoch').length;
  const withReminder = notizen.filter(n => n.fields.erinnerung).length;

  // Handlers
  const handleToggleDone = useCallback(async (note: EnrichedNotizen) => {
    await LivingAppsService.updateNotizenEntry(note.record_id, {
      erledigt: !note.fields.erledigt,
    });
    fetchAll();
  }, [fetchAll]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteNotizenEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  }, [deleteTarget, fetchAll]);

  const openCreate = useCallback((katId?: string) => {
    setEditNote(null);
    setDefaultKategorie(katId ? createRecordUrl(APP_IDS.KATEGORIEN, katId) : undefined);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((note: EnrichedNotizen) => {
    setEditNote(note);
    setDefaultKategorie(undefined);
    setDialogOpen(true);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meine Notizen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalNotes} Notizen · {doneNotes} erledigt</p>
        </div>
        <Button onClick={() => openCreate()} className="shrink-0 gap-1.5">
          <IconPlus size={16} stroke={1.5} className="shrink-0" />
          <span>Neue Notiz</span>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(totalNotes)}
          description="Alle Notizen"
          icon={<IconNote size={18} stroke={1.5} className="text-muted-foreground" />}
        />
        <StatCard
          title="Erledigt"
          value={String(doneNotes)}
          description={totalNotes > 0 ? `${Math.round((doneNotes / totalNotes) * 100)}% abgeschlossen` : 'Keine Notizen'}
          icon={<IconCircleCheck size={18} stroke={1.5} className="text-muted-foreground" />}
        />
        <StatCard
          title="Hohe Priorität"
          value={String(highPriority)}
          description="Hoch oder Sehr hoch"
          icon={<IconStack2 size={18} stroke={1.5} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Erinnerung"
          value={String(withReminder)}
          description="Erinnerungen gesetzt"
          icon={<IconBell size={18} stroke={1.5} className="text-muted-foreground" />}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <IconSearch size={15} stroke={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Notizen suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <IconX size={14} stroke={1.5} />
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterKategorie(null)}
            className={`mr-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterKategorie === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            Alle
          </button>
          {kategorien.map(kat => {
            const colorKey = kat.fields.farbe?.key ?? '';
            const color = FARBE_CLASSES[colorKey] ?? DEFAULT_COLOR;
            const active = filterKategorie === kat.record_id;
            return (
              <button
                key={kat.record_id}
                onClick={() => setFilterKategorie(active ? null : kat.record_id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${color.bg} ${color.border} text-foreground hover:border-primary/60`
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-primary-foreground' : color.dot}`} />
                {kat.fields.kategoriename}
              </button>
            );
          })}
        </div>

        {/* Priority filter */}
        <div className="flex gap-1.5 flex-wrap ml-2">
          {['sehr_hoch', 'hoch', 'normal', 'niedrig'].map(key => {
            const cfg = PRIORITY_CONFIG[key];
            const active = filterPriority === key;
            return (
              <button
                key={key}
                onClick={() => setFilterPriority(active ? null : key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary' : `${cfg.className} hover:border-primary/60`
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowDone(!showDone)}
            className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              showDone
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            Erledigte anzeigen
          </button>
        </div>
      </div>

      {/* Notes board — grouped by category */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <IconBook size={48} stroke={1.5} className="text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-foreground">Keine Notizen gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">Erstelle deine erste Notiz oder ändere die Filter.</p>
          </div>
          <Button onClick={() => openCreate()} variant="outline" size="sm" className="gap-1.5">
            <IconPlus size={15} stroke={1.5} />Neue Notiz
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ kat, notes }) => {
            const colorKey = kat?.fields.farbe?.key ?? '';
            const color = FARBE_CLASSES[colorKey] ?? DEFAULT_COLOR;
            const katId = kat?.record_id;
            return (
              <section key={katId ?? '__none__'}>
                {/* Group header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {kat ? (
                      <>
                        <span className={`w-3 h-3 rounded-full shrink-0 ${color.dot}`} />
                        <h2 className="text-base font-semibold text-foreground truncate">{kat.fields.kategoriename}</h2>
                        {kat.fields.beschreibung && (
                          <span className="hidden sm:inline text-xs text-muted-foreground truncate">{kat.fields.beschreibung}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <IconFolderOpen size={16} stroke={1.5} className="text-muted-foreground shrink-0" />
                        <h2 className="text-base font-semibold text-muted-foreground">Ohne Kategorie</h2>
                      </>
                    )}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">({notes.length})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 gap-1 text-xs h-7 px-2"
                    onClick={() => openCreate(katId)}
                  >
                    <IconPlus size={13} stroke={1.5} className="shrink-0" />
                    <span className="hidden sm:inline">Notiz</span>
                  </Button>
                </div>

                {/* Note cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {notes.map(note => (
                    <NoteCard
                      key={note.record_id}
                      note={note}
                      color={kat ? color : DEFAULT_COLOR}
                      tags={noteTagsMap[note.record_id] ?? []}
                      onEdit={() => openEdit(note)}
                      onDelete={() => setDeleteTarget(note)}
                      onToggleDone={() => handleToggleDone(note)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <NotizenDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditNote(null); }}
        onSubmit={async (fields) => {
          if (editNote) {
            await LivingAppsService.updateNotizenEntry(editNote.record_id, fields);
          } else {
            await LivingAppsService.createNotizenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editNote ? editNote.fields : defaultKategorie ? { kategorie: defaultKategorie } : undefined}
        kategorienList={kategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Notizen']}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Notiz löschen"
        description={`Möchtest du die Notiz "${deleteTarget?.fields.titel ?? ''}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ---- Note Card ----

interface NoteCardProps {
  note: EnrichedNotizen;
  color: { bg: string; border: string; dot: string };
  tags: string[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}

function NoteCard({ note, color, tags, onEdit, onDelete, onToggleDone }: NoteCardProps) {
  const isDone = !!note.fields.erledigt;
  const priKey = note.fields.prioritaet?.key;
  const priCfg = priKey ? PRIORITY_CONFIG[priKey] : null;
  const hasReminder = !!note.fields.erinnerung;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
        isDone ? 'opacity-60 bg-muted/40 border-border' : `${color.bg} ${color.border}`
      }`}
    >
      {/* Top accent stripe for very high priority */}
      {priKey === 'sehr_hoch' && !isDone && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl" />
      )}

      <div className="flex flex-col gap-2 p-4 pt-5 flex-1">
        {/* Title row */}
        <div className="flex items-start gap-2 min-w-0">
          <button
            onClick={onToggleDone}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
            title={isDone ? 'Als offen markieren' : 'Als erledigt markieren'}
          >
            {isDone
              ? <IconCircleCheck size={18} stroke={1.5} className="text-green-500" />
              : <IconCircle size={18} stroke={1.5} />
            }
          </button>
          <h3 className={`flex-1 min-w-0 font-semibold text-sm leading-snug ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {note.fields.titel || <span className="italic text-muted-foreground font-normal">Kein Titel</span>}
          </h3>
        </div>

        {/* Content preview */}
        {note.fields.inhalt && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pl-6">
            {note.fields.inhalt}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-6">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-background/70 border border-border text-muted-foreground">
                <IconTag size={9} stroke={1.5} className="shrink-0" />{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {priCfg && priKey !== 'normal' && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priCfg.className}`}>
              {priCfg.label}
            </span>
          )}
          {hasReminder && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <IconClock size={10} stroke={1.5} className="shrink-0" />
              {note.fields.erinnerung ? formatDate(note.fields.erinnerung.slice(0, 10)) : ''}
            </span>
          )}
          {note.fields.erstellungsdatum && !hasReminder && (
            <span className="text-[10px] text-muted-foreground">
              {formatDate(note.fields.erstellungsdatum)}
            </span>
          )}
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={13} stroke={1.5} className="shrink-0" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Löschen"
          >
            <IconTrash size={13} stroke={1.5} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Skeleton ----

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    </div>
  );
}

// ---- Error ----

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} stroke={1.5} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
