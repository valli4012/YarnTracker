import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, LinearProgress, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import { getProjectProgress, PROGRESS_HELP, type Project } from '../shared';

interface Props { project: Project; help?: boolean }

// Прогресс изделия: подпись и полоска. Когда считать нечем, полоски нет —
// вместо неё объяснение по кнопке-вопросику (её показываем только в карточке).
export function ProjectProgressBar({ project, help = false }: Props) {
  const [openHelp, setOpenHelp] = useState(false);
  const progress = getProjectProgress(project);
  const unknown = progress.kind === 'none';

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 24 }}>
        <Typography variant="body2" color="text.secondary">{progress.label}</Typography>
        {unknown && help && (
          <IconButton size="small" aria-label="Почему прогресс не рассчитывается" onClick={() => setOpenHelp(true)}
            sx={{ color: 'text.secondary', p: 0.5 }}>
            <HelpOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {!unknown && <LinearProgress variant="determinate" value={progress.value} sx={{ mt: 1 }} />}

      <Dialog open={openHelp} onClose={() => setOpenHelp(false)}>
        <DialogTitle>Прогресс не рассчитывается</DialogTitle>
        <DialogContent><DialogContentText>{PROGRESS_HELP}</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setOpenHelp(false)}>Понятно</Button></DialogActions>
      </Dialog>
    </>
  );
}
