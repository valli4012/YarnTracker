import { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, CircularProgress, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { isStageDone, rowsOfWord, rowsWord, type ProjectStage } from '../shared';
import { useFeedback } from '../feedback';
import { Section } from './detail';
import { StageSheet } from './StageSheet';

interface Props {
  stages: ProjectStage[];
  onChange: (stages: ProjectStage[]) => void;
  canKnit: boolean;
  onKnit: (stageId: number) => void;
}

const iconBoxSx = { width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };

// Готовность этапа с целевыми рядами считается из рядов, поэтому её не трогают пальцем —
// показываем кольцо прогресса, а галочку-переключатель даём только этапам без цели.
const StageState = ({ stage, onToggle }: { stage: ProjectStage; onToggle: () => void }) => {
  const done = isStageDone(stage);
  if (!stage.targetRows) {
    return (
      <Checkbox checked={done} onChange={onToggle} sx={{ ...iconBoxSx }}
        slotProps={{ input: { 'aria-label': `Этап «${stage.title}» готов` } }} />
    );
  }
  const rows = stage.currentRows ?? 0;
  return (
    <Box sx={iconBoxSx} role="img" aria-label={done ? 'Этап готов' : `Связано ${rows} из ${stage.targetRows}`}>
      {done
        ? <CheckCircleIcon color="primary" />
        : <CircularProgress variant="determinate" size={24} thickness={5} value={Math.min(100, (rows / stage.targetRows) * 100)} />}
    </Box>
  );
};

export function StagesSection({ stages, onChange, canKnit, onKnit }: Props) {
  const { confirm } = useFeedback();
  const [sheetId, setSheetId] = useState<number | 'new' | null>(null);
  const editing = typeof sheetId === 'number' ? stages.find(s => s.id === sheetId) : undefined;

  const save = ({ title, targetRows }: { title: string; targetRows?: number }) => {
    onChange(editing
      ? stages.map(s => (s.id === editing.id ? { ...s, title, targetRows } : s))
      : [...stages, { id: Date.now(), title, targetRows, done: false }]);
    setSheetId(null);
  };

  const remove = async () => {
    if (!editing) return;
    if (!(await confirm({ title: `Удалить этап «${editing.title}»?`, ok: 'Удалить', danger: true }))) return;
    onChange(stages.filter(s => s.id !== editing.id));
    setSheetId(null);
  };

  // Порядок этапов чисто визуальный: вязать можно любой из них в любое время
  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= stages.length) return;
    const next = [...stages];
    [next[index], next[to]] = [next[to], next[index]];
    navigator.vibrate?.(10);
    onChange(next);
  };

  const caption = (s: ProjectStage) => {
    const rows = s.currentRows ?? 0;
    if (s.targetRows) return `${rows} из ${s.targetRows} ${rowsOfWord(s.targetRows)}`;
    return rows > 0 ? `${rows} ${rowsWord(rows)}` : 'без цели по рядам';
  };

  return (
    <Section title="Этапы" action={<Button size="small" startIcon={<AddIcon />} onClick={() => setSheetId('new')}>Добавить</Button>}>
      {stages.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          Этапов нет — изделие можно вязать и так, счётчик будет один на всё изделие.
        </Typography>
      ) : (
        <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', px: 1 }}>
          {stages.map((stage, i) => (
            <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 56,
              '&:not(:last-of-type)': { borderBottom: '1px solid var(--md-outline-variant)' } }}>
              <StageState stage={stage} onToggle={() => onChange(stages.map(s => (s.id === stage.id ? { ...s, done: !s.done } : s)))} />

              <ButtonBase onClick={() => setSheetId(stage.id)} aria-label={`Изменить этап «${stage.title}»`}
                sx={{ flex: 1, minWidth: 0, display: 'block', textAlign: 'left', borderRadius: '12px', px: 0.5, py: 1 }}>
                <Typography variant="body1" noWrap sx={{ textDecoration: isStageDone(stage) ? 'line-through' : 'none' }}>{stage.title}</Typography>
                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }} noWrap>{caption(stage)}</Typography>
              </ButtonBase>

              <IconButton aria-label={`Переместить «${stage.title}» выше`} disabled={i === 0} onClick={() => move(i, -1)} sx={iconBoxSx}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label={`Переместить «${stage.title}» ниже`} disabled={i === stages.length - 1} onClick={() => move(i, 1)} sx={iconBoxSx}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {sheetId !== null && (
        <StageSheet stage={editing} canKnit={canKnit} onClose={() => setSheetId(null)}
          onSave={save} onDelete={remove} onKnit={() => editing && onKnit(editing.id)} />
      )}
    </Section>
  );
}
