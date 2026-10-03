import { Box, ButtonBase, IconButton, Modal, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { isStageDone, modalStyle, rowsOfWord, rowsWord, type ProjectStage } from '../shared';

interface Props { open: boolean; stages: ProjectStage[]; onClose: () => void; onPick: (stageId: number) => void }

// Если у изделия есть этапы, перед счётчиком спрашиваем, что именно вяжем
export function StagePicker({ open, stages, onClose, onPick }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Что вяжем?</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть"><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          {stages.map(stage => {
            const rows = stage.currentRows ?? 0;
            const done = isStageDone(stage);
            return (
              <ButtonBase key={stage.id} onClick={() => onPick(stage.id)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64, px: 2, py: 1.5, borderRadius: '20px',
                  textAlign: 'left', bgcolor: 'var(--md-surface-container)' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" noWrap>{stage.title}</Typography>
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                    {stage.targetRows ? `${rows} из ${stage.targetRows} ${rowsOfWord(stage.targetRows)}` : `${rows} ${rowsWord(rows)}`}
                  </Typography>
                </Box>
                {done && <CheckCircleIcon color="primary" fontSize="small" />}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>
    </Modal>
  );
}
