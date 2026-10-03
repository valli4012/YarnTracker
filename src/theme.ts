import { createTheme } from '@mui/material/styles';
import { dark, light, type Tokens } from './palette';

const kebab = (s: string) => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());

export const buildTheme = (mode: 'light' | 'dark') => {
  const c: Tokens = mode === 'light' ? light : dark;

  // Все токены схемы доступны в стилях как var(--md-surface-container-high), var(--md-primary-container) и т.д.
  const cssVars = Object.fromEntries(Object.entries(c).map(([k, v]) => [`--md-${kebab(k)}`, v]));

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, contrastText: c.onPrimary },
      secondary: { main: c.secondary, contrastText: c.onSecondary },
      warning: { main: c.tertiary, contrastText: c.onTertiary },
      error: { main: c.error, contrastText: c.onError },
      background: { default: c.surface, paper: c.surfaceContainerLow },
      text: { primary: c.onSurface, secondary: c.onSurfaceVariant },
      divider: c.outlineVariant,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Roboto, system-ui, sans-serif',
      h4: { fontSize: 32, lineHeight: '40px', fontWeight: 400 },
      h5: { fontSize: 28, lineHeight: '36px', fontWeight: 400 },
      h6: { fontSize: 22, lineHeight: '28px', fontWeight: 400 },
      subtitle1: { fontSize: 16, lineHeight: '24px', fontWeight: 500, letterSpacing: 0.15 },
      subtitle2: { fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: 0.1 },
      body1: { fontSize: 16, lineHeight: '24px', letterSpacing: 0.5 },
      body2: { fontSize: 14, lineHeight: '20px', letterSpacing: 0.25 },
      caption: { fontSize: 12, lineHeight: '16px', letterSpacing: 0.4 },
      overline: { fontSize: 11, lineHeight: '16px', fontWeight: 500, letterSpacing: 0.8 },
      button: { fontSize: 14, fontWeight: 500, letterSpacing: 0.1, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: { styleOverrides: {
        ':root': cssVars,
        body: { WebkitTapHighlightColor: 'transparent' },
        'button, a, [role=button]': { touchAction: 'manipulation' }, // без зума по двойному тапу
      } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { borderRadius: 100, minHeight: 40, padding: '10px 24px' },
        text: { padding: '10px 12px' },
        outlined: { borderColor: c.outline },
      } },
      MuiFab: { styleOverrides: { root: {
        borderRadius: 16, backgroundColor: c.primaryContainer, color: c.onPrimaryContainer,
        boxShadow: '0 2px 6px 2px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.3)',
        '&:hover': { backgroundColor: c.primaryContainer, filter: 'brightness(.97)' },
        '&.MuiFab-extended': { height: 56, padding: '0 20px', gap: 8, borderRadius: 16 },
      } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 20, backgroundColor: c.surfaceContainer, boxShadow: 'none', overflow: 'hidden' } } },
      MuiCardActionArea: { styleOverrides: { root: { '&:hover .MuiCardActionArea-focusHighlight': { opacity: 0.06 } } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500,
        '&.MuiChip-colorDefault.MuiChip-filled': { backgroundColor: c.surfaceContainerHigh, color: c.onSurfaceVariant },
        '&.MuiChip-outlined': { borderColor: c.outlineVariant } } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 28, backgroundColor: c.surfaceContainerHigh } } },
      MuiLinearProgress: { styleOverrides: {
        root: { borderRadius: 4, height: 6, backgroundColor: c.secondaryContainer },
      } },
      // Navigation bar M3: 80dp, «пилюля» 64×32 под активной иконкой
      MuiBottomNavigation: { styleOverrides: { root: { height: 80, backgroundColor: 'transparent' } } },
      MuiBottomNavigationAction: { styleOverrides: {
        root: { minWidth: 64, maxWidth: 'none', paddingTop: 16, paddingBottom: 16, position: 'relative', color: c.onSurfaceVariant,
          '&::before': { content: '""', position: 'absolute', top: 12, left: '50%', width: 64, height: 32, marginLeft: -32,
            borderRadius: 16, backgroundColor: c.secondaryContainer, transform: 'scaleX(0)', transition: 'transform .2s ease' },
          '& .MuiSvgIcon-root': { position: 'relative', zIndex: 1 },
          '&.Mui-selected': { color: c.onSurface, '&::before': { transform: 'scaleX(1)' },
            '& .MuiSvgIcon-root': { color: c.onSecondaryContainer } } },
        label: { fontSize: 12, fontWeight: 500, marginTop: 8, '&.Mui-selected': { fontSize: 12 } },
      } },
    },
  });
};
