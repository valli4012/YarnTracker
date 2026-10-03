import { Box, useTheme } from '@mui/material';
import { accentColors, type ProjectAccent, type ProjectIcon } from '../projectAppearance';
import { PROJECT_ICON_COMPONENT } from './projectIcons';

// Цветная плашка со значком: на плитке списка и в шапке карточки изделия.
export function ProjectMark({ icon, accent, size = 56 }: { icon: ProjectIcon; accent: ProjectAccent; size?: number }) {
  const mode = useTheme().palette.mode === 'dark' ? 'dark' : 'light';
  const { bg, fg } = accentColors(accent, mode);
  const Icon = PROJECT_ICON_COMPONENT[icon];

  return (
    <Box aria-hidden sx={{
      width: size, height: size, flexShrink: 0, borderRadius: size >= 64 ? '20px' : '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: bg, color: fg,
    }}>
      <Icon sx={{ fontSize: Math.round(size * 0.58) }} />
    </Box>
  );
}
