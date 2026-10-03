import { useEffect, type ReactNode } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { tonalSx } from '../shared';
import { VoiceCounter } from './VoiceCounter';

interface Props { title: string; subtitle?: string; count: number; target?: number; onChange: (delta: number) => void; children?: ReactNode }

// Общий экран счётчика: и для изделия, и для свободного режима
export function RowCounter({ title, subtitle, count, target, onChange, children }: Props) {
  // Экран не гаснет, пока считаешь ряды
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, []);

  const step = (d: number) => { navigator.vibrate?.(15); onChange(d); };

  return (
    <Box sx={{ minHeight: 'calc(100dvh - 160px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, sm: 3 }, py: 2, px: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h1">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>

      <Box sx={{ width: '100%', maxWidth: 360, py: 4, borderRadius: '28px', bgcolor: 'var(--md-surface-container)', textAlign: 'center' }}>
        <Typography color="primary" sx={{ fontSize: 112, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</Typography>
        <Typography variant="overline" color="text.secondary">рядов{target ? ` из ${target}` : ''}</Typography>
        {target ? <LinearProgress variant="determinate" value={Math.min(100, (count / target) * 100)} sx={{ mx: 4, mt: 2 }} /> : null}
      </Box>

      <Box sx={{ width: '100%', maxWidth: 360, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => step(1)}
          sx={{ gridColumn: '1 / -1', height: 88, borderRadius: '28px', fontSize: 22 }}>Ряд</Button>
        <Button disabled={count <= 0} onClick={() => step(-1)} aria-label="Убрать ряд" sx={{ height: 56, borderRadius: '20px', ...tonalSx }}><RemoveIcon /></Button>
        <Button onClick={() => step(5)} sx={{ height: 56, borderRadius: '20px', ...tonalSx }}>+5</Button>
      </Box>

      <VoiceCounter count={count} onChange={onChange} />
      {children}
    </Box>
  );
}
