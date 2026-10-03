import { createTheme } from '@mui/material/styles';

// Токены Material 3 (baseline). Чтобы сменить палитру под «пряжу»: сгенерируйте схему
// в Material Theme Builder (m3.material.io/theme-builder) и подставьте значения сюда.
const light = { primary: '#6750A4', onPrimary: '#FFFFFF', primaryContainer: '#EADDFF', onPrimaryContainer: '#21005D',
  secondary: '#625B71', onSecondary: '#FFFFFF', secondaryContainer: '#E8DEF8', onSecondaryContainer: '#1D192B',
  error: '#B3261E', onError: '#FFFFFF', surface: '#FEF7FF', onSurface: '#1D1B20', onSurfaceVariant: '#49454F',
  outline: '#79747E', outlineVariant: '#CAC4D0', scLow: '#F7F2FA', sc: '#F3EDF7', scHigh: '#ECE6F0' };
const dark = { primary: '#D0BCFF', onPrimary: '#381E72', primaryContainer: '#4F378B', onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC', onSecondary: '#332D41', secondaryContainer: '#4A4458', onSecondaryContainer: '#E8DEF8',
  error: '#F2B8B5', onError: '#601410', surface: '#141218', onSurface: '#E6E0E9', onSurfaceVariant: '#CAC4D0',
  outline: '#938F99', outlineVariant: '#49454F', scLow: '#1D1B20', sc: '#211F26', scHigh: '#2B2930' };

export const buildTheme = (mode: 'light' | 'dark') => {
  const c = mode === 'light' ? light : dark;
  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, contrastText: c.onPrimary },
      secondary: { main: c.secondary, contrastText: c.onSecondary },
      error: { main: c.error, contrastText: c.onError },
      background: { default: c.surface, paper: c.scLow },
      text: { primary: c.onSurface, secondary: c.onSurfaceVariant },
      divider: c.outlineVariant,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Roboto, system-ui, sans-serif',
      h5: { fontSize: 24, lineHeight: '32px', fontWeight: 400 },
      h6: { fontSize: 22, lineHeight: '28px', fontWeight: 400 },
      subtitle1: { fontSize: 16, lineHeight: '24px', fontWeight: 500, letterSpacing: 0.15 },
      subtitle2: { fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: 0.1 },
      body1: { fontSize: 16, lineHeight: '24px', letterSpacing: 0.5 },
      body2: { fontSize: 14, lineHeight: '20px', letterSpacing: 0.25 },
      caption: { fontSize: 12, lineHeight: '16px', letterSpacing: 0.4 },
      button: { fontSize: 14, fontWeight: 500, letterSpacing: 0.1, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: { styleOverrides: {
        ':root': { '--md-surface-container-low': c.scLow, '--md-surface-container': c.sc,
          '--md-surface-container-high': c.scHigh, '--md-outline-variant': c.outlineVariant,
          '--md-secondary-container': c.secondaryContainer, '--md-on-secondary-container': c.onSecondaryContainer },
        body: { WebkitTapHighlightColor: 'transparent' },
        'button, a, [role=button]': { touchAction: 'manipulation' }, // без зума по двойному тапу
      } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
        root: { borderRadius: 100, minHeight: 40, padding: '10px 24px' },
        text: { padding: '10px 12px' },
        outlined: { borderColor: c.outline },
      } },
      MuiFab: { styleOverrides: { root: { borderRadius: 16, backgroundColor: c.primaryContainer, color: c.onPrimaryContainer,
        boxShadow: '0 1px 3px 1px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.3)',
        '&:hover': { backgroundColor: c.primaryContainer, filter: 'brightness(.96)' } } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12, backgroundColor: c.sc, boxShadow: 'none', overflow: 'hidden' } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 500,
        '&.MuiChip-colorDefault.MuiChip-filled': { backgroundColor: c.scHigh, color: c.onSurfaceVariant },
        '&.MuiChip-outlined': { borderColor: c.outlineVariant } } } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 28, backgroundColor: c.scHigh } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 4 } } },
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
