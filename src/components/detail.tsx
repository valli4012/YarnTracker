import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

// Блок подробного экрана: подпись, необязательное действие справа и содержимое
export const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <Box component="section" sx={{ mt: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1, px: 0.5 }}>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      {action}
    </Box>
    {children}
  </Box>
);

// Строка «подпись — значение» внутри блока
export const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.5, '&:not(:last-of-type)': { borderBottom: '1px solid var(--md-outline-variant)' } }}>
    <Typography variant="body1" color="text.secondary">{label}</Typography>
    <Typography variant="body1" component="div" sx={{ textAlign: 'right' }}>{value}</Typography>
  </Box>
);
