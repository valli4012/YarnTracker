import { Box, IconButton, Typography, useTheme } from '@mui/material';
import {
  accentColors, PROJECT_ACCENT_IDS, PROJECT_ACCENT_LABEL, PROJECT_ICON_IDS, PROJECT_ICON_LABEL,
  type ProjectAccent, type ProjectIcon,
} from '../projectAppearance';
import { PROJECT_ICON_COMPONENT } from './projectIcons';

interface Props {
  icon: ProjectIcon;
  accent: ProjectAccent;
  onIcon: (icon: ProjectIcon) => void;
  onAccent: (accent: ProjectAccent) => void;
}

const choiceSx = {
  width: 48, height: 48, borderRadius: '14px', border: '2px solid', p: 0,
};

// Выбор иконки и цвета. Один и тот же блок в форме создания и в карточке,
// чтобы правки этих экранов оставались точечными.
export function ProjectLookPicker({ icon, accent, onIcon, onAccent }: Props) {
  const mode = useTheme().palette.mode === 'dark' ? 'dark' : 'light';
  const selected = accentColors(accent, mode);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.75 }}>
        Иконка · {PROJECT_ICON_LABEL[icon]}
      </Typography>
      <Box role="group" aria-label="Иконка изделия" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {PROJECT_ICON_IDS.map(id => {
          const Icon = PROJECT_ICON_COMPONENT[id];
          const on = id === icon;
          return (
            <IconButton key={id} aria-label={PROJECT_ICON_LABEL[id]} aria-pressed={on} onClick={() => onIcon(id)}
              sx={{
                ...choiceSx,
                borderColor: on ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                bgcolor: on ? selected.bg : 'transparent',
                color: on ? selected.fg : 'text.primary',
              }}>
              <Icon />
            </IconButton>
          );
        })}
      </Box>

      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1.5, mb: 0.75 }}>
        Цвет · {PROJECT_ACCENT_LABEL[accent]}
      </Typography>
      <Box role="group" aria-label="Цвет изделия" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
        {PROJECT_ACCENT_IDS.map(id => {
          const on = id === accent;
          const { bg } = accentColors(id, mode);
          return (
            <IconButton key={id} aria-label={PROJECT_ACCENT_LABEL[id]} aria-pressed={on} onClick={() => onAccent(id)}
              sx={{ width: 48, height: 48, p: 0, borderRadius: '50%', border: '2px solid', borderColor: on ? 'var(--md-primary)' : 'transparent' }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: bg, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
            </IconButton>
          );
        })}
      </Box>
    </Box>
  );
}
