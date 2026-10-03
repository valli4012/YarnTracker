import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export const EmptyState = ({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) => (
  <Box sx={{ textAlign: 'center', py: 8, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
      bgcolor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', '& svg': { fontSize: 44 } }}>{icon}</Box>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>{text}</Typography>
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);
