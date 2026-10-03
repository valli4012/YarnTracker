import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

// Заголовок раздела в духе M3 «Large top app bar»: крупное название и пояснение под ним
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, pt: 'calc(24px + env(safe-area-inset-top, 0px))', pb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1" noWrap>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}
