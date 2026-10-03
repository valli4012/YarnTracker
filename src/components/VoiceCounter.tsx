import { useCallback } from 'react';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicNoneIcon from '@mui/icons-material/MicNone';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useFeedback } from '../feedback';
import { useStoredState } from '../storage';
import { STORAGE_KEY_VOICE_SPEAK, tonalSx } from '../shared';
import { speakRows, speechSupported, useVoiceCommands, VOICE_COMMANDS_HINT, type VoiceCommand } from '../voice';

// Включённый микрофон заливаем primary-container: заметно, но не спорит с главной кнопкой «Ряд»
const listeningSx = {
  bgcolor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)',
  '&:hover': { bgcolor: 'var(--md-primary-container)', filter: 'brightness(.97)' },
};

// Пульсация иконки, пока идёт запись
const micSx = {
  animation: 'voicePulse 1.4s ease-in-out infinite',
  '@keyframes voicePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

interface Props { count: number; onChange: (delta: number) => void }

// Голосовое управление счётчиком: кнопки продолжают работать как раньше, команды идут через тот же onChange
export function VoiceCounter({ count, onChange }: Props) {
  const { toast } = useFeedback();
  const [speak, setSpeak] = useStoredState<boolean>(STORAGE_KEY_VOICE_SPEAK, true);
  const canSpeak = speechSupported();

  const apply = useCallback((command: VoiceCommand) => {
    const raw = command.kind === 'reset' ? 0 : command.kind === 'set' ? command.value : count + command.value;
    const next = Math.max(0, raw);
    if (next !== count) {
      navigator.vibrate?.(15);
      onChange(next - count);
      // Сброс голосом не спрашивает подтверждения (руки заняты), поэтому даём отмену в снэкбаре
      if (command.kind === 'reset') toast('Счётчик сброшен', { label: 'Вернуть', onClick: () => onChange(count) });
    }
    if (speak && canSpeak) speakRows(next);
  }, [canSpeak, count, onChange, speak, toast]);

  const { status, message, heard, toggle, available } = useVoiceCommands({ onCommand: apply });
  const listening = status === 'listening';

  const toggleSpeak = () => {
    navigator.vibrate?.(15);
    const on = !speak;
    setSpeak(on);
    if (on) speakRows(count); // сразу слышно, что озвучивание включилось
    else window.speechSynthesis.cancel();
  };

  const hint = message || (listening ? heard || 'Скажите «ряд» или «плюс два»' : '');

  return (
    <Box sx={{ width: '100%', maxWidth: 360 }}>
      <Stack direction="row" spacing={1.5}>
        <Button
          onClick={() => { navigator.vibrate?.(15); toggle(); }}
          disabled={!available}
          aria-pressed={listening}
          startIcon={listening ? <MicIcon sx={micSx} /> : <MicNoneIcon />}
          sx={{ flex: 1, height: 56, borderRadius: '20px', fontSize: 16, ...tonalSx, ...(listening ? listeningSx : null) }}
        >
          {listening ? 'Слушаю…' : 'Голосом'}
        </Button>
        {canSpeak && (
          <Button
            onClick={toggleSpeak}
            aria-pressed={speak}
            aria-label={speak ? 'Выключить озвучивание' : 'Озвучивать число рядов'}
            sx={{ width: 56, minWidth: 56, height: 56, borderRadius: '20px', ...tonalSx, opacity: speak ? 1 : 0.6 }}
          >
            {speak ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </Button>
        )}
      </Stack>

      <Typography
        aria-live="polite"
        variant="caption"
        component="p"
        align="center"
        color={status === 'denied' || status === 'error' ? 'error' : 'text.secondary'}
        sx={{ minHeight: 20, mt: 1 }}
      >
        {hint}
      </Typography>

      <Collapse in={listening}>
        <Stack sx={{ mt: 0.5, p: 1.5, borderRadius: '16px', bgcolor: 'var(--md-surface-container)' }}>
          {VOICE_COMMANDS_HINT.map(line => (
            <Typography key={line} variant="caption" color="text.secondary">{line}</Typography>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
