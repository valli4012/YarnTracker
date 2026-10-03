import { useState } from 'react';
import { Box, Button, IconButton, Link, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { ProjectNote } from '../shared';
import { useFeedback } from '../feedback';
import { Section } from './detail';
import { NoteSheet } from './NoteSheet';

interface Props { notes: ProjectNote[]; onChange: (notes: ProjectNote[]) => void }

// Ссылки живут внутри текста заметки, поэтому разбираем текст при отображении
const LINK_SPLIT = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const isLink = (s: string) => /^(https?:\/\/|www\.)/i.test(s);
const href = (s: string) => (s.startsWith('www.') ? `https://${s}` : s);

const LONG_NOTE = 320;

const dateText = (ts: number) =>
  new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

const NoteBody = ({ text, clamped }: { text: string; clamped: boolean }) => (
  <Typography variant="body1" component="div" sx={{
    whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text',
    ...(clamped ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : null),
  }}>
    {text.split(LINK_SPLIT).map((part, i) => (isLink(part)
      ? <Link key={i} href={href(part)} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: 'break-all' }}>{part}</Link>
      : part))}
  </Typography>
);

export function NotesSection({ notes, onChange }: Props) {
  const { confirm } = useFeedback();
  const [sheetId, setSheetId] = useState<number | 'new' | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const editing = typeof sheetId === 'number' ? notes.find(n => n.id === sheetId) : undefined;

  const save = ({ title, text }: { title?: string; text: string }) => {
    onChange(editing
      ? notes.map(n => (n.id === editing.id ? { ...n, title, text } : n))
      : [{ id: Date.now(), createdAt: Date.now(), title, text }, ...notes]);
    setSheetId(null);
  };

  const remove = async () => {
    if (!editing) return;
    if (!(await confirm({ title: 'Удалить заметку?', ok: 'Удалить', danger: true }))) return;
    onChange(notes.filter(n => n.id !== editing.id));
    setSheetId(null);
  };

  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Section title="Заметки" action={<Button size="small" startIcon={<AddIcon />} onClick={() => setSheetId('new')}>Добавить</Button>}>
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          Заметок пока нет. Здесь удобно держать схему, расчёты и ссылки на описание.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sorted.map(note => {
            const clamped = note.text.length > LONG_NOTE && !expanded.includes(note.id);
            return (
              <Box key={note.id} sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {note.title && <Typography variant="subtitle1" sx={{ wordBreak: 'break-word' }}>{note.title}</Typography>}
                    <Typography variant="caption" color="text.secondary">{dateText(note.createdAt)}</Typography>
                  </Box>
                  <IconButton aria-label="Изменить заметку" onClick={() => setSheetId(note.id)} sx={{ mt: -0.5, mr: -0.5 }}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>

                <NoteBody text={note.text} clamped={clamped} />

                {note.text.length > LONG_NOTE && (
                  <Button size="small" sx={{ mt: 0.5, ml: -1.5 }}
                    onClick={() => setExpanded(clamped ? [...expanded, note.id] : expanded.filter(id => id !== note.id))}>
                    {clamped ? 'Показать полностью' : 'Свернуть'}
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {sheetId !== null && <NoteSheet note={editing} onClose={() => setSheetId(null)} onSave={save} onDelete={remove} />}
    </Section>
  );
}
