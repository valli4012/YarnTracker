import { useState } from 'react';
import { Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TimerIcon from '@mui/icons-material/Timer';
import { modalStyle, rowsWord, type ProjectStage } from '../shared';

interface Props {
  stage?: ProjectStage; // не задан — создаём новый
  canKnit: boolean;
  onClose: () => void;
  onSave: (data: { title: string; targetRows?: number }) => void;
  onDelete: () => void;
  onKnit: () => void;
}

// Один лист и на добавление этапа, и на правку: поля те же.
// Монтируется только на время показа, поэтому поля всегда начинаются с актуальных значений.
export function StageSheet({ stage, canKnit, onClose, onSave, onDelete, onKnit }: Props) {
  const [title, setTitle] = useState(stage?.title ?? '');
  const [targetStr, setTargetStr] = useState(stage?.targetRows ? String(stage.targetRows) : '');

  const rows = stage?.currentRows ?? 0;
  const save = () => {
    const target = Math.floor(Number(targetStr));
    onSave({ title: title.trim(), targetRows: Number.isFinite(target) && target > 0 ? target : undefined });
  };

  return (
    <Modal open onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">{stage ? 'Этап' : 'Новый этап'}</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть"><CloseIcon /></IconButton>
        </Box>

        <TextField fullWidth margin="dense" label="Название *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField fullWidth margin="dense" type="number" label="Целевые ряды" value={targetStr}
          onChange={(e) => setTargetStr(e.target.value)} helperText="Необязательно. Если указать, готовность этапа посчитается по рядам."
          slotProps={{ htmlInput: { min: 0, inputMode: 'numeric' } }} />

        {stage && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 0.5 }}>
            Связано: {rows} {rowsWord(rows)}
          </Typography>
        )}

        <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }} disabled={title.trim() === ''} onClick={save}>
          Сохранить
        </Button>

        {stage && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {canKnit && (
              <Button fullWidth variant="outlined" size="large" startIcon={<TimerIcon />} sx={{ height: 52 }} onClick={onKnit}>
                Вязать этот этап
              </Button>
            )}
            <Button fullWidth color="error" size="large" sx={{ height: 52 }} onClick={onDelete}>Удалить этап</Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
