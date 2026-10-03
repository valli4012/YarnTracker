import { useState } from 'react';
import { Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { modalStyle, type ProjectNote } from '../shared';

interface Props {
  note?: ProjectNote; // не задана — создаём новую
  onClose: () => void;
  onSave: (data: { title?: string; text: string }) => void;
  onDelete?: () => void;
}

// Одна заметка: необязательный заголовок и обязательный текст. Ссылки пишутся прямо в тексте.
// Монтируется только на время показа, поэтому поля всегда начинаются с актуальных значений.
export function NoteSheet({ note, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [text, setText] = useState(note?.text ?? '');

  const save = () => onSave({ title: title.trim() === '' ? undefined : title.trim(), text: text.trim() });

  return (
    <Modal open onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">{note ? 'Заметка' : 'Новая заметка'}</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть"><CloseIcon /></IconButton>
        </Box>

        <TextField fullWidth margin="dense" label="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField fullWidth margin="dense" label="Текст *" value={text} onChange={(e) => setText(e.target.value)}
          multiline minRows={5} placeholder="Что важно не забыть. Ссылки можно вставлять прямо в текст." />

        {/* Фото с телефона появятся вместе с сервером и базой — пока место под кнопку занято заглушкой */}
        <Button fullWidth disabled startIcon={<AddPhotoAlternateOutlinedIcon />}
          sx={{ mt: 1.5, height: 52, borderRadius: '20px', border: '2px dashed var(--md-outline-variant)' }}>
          Фото — пока в разработке
        </Button>

        <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }} disabled={text.trim() === ''} onClick={save}>
          Сохранить
        </Button>

        {note && onDelete && (
          <Button fullWidth color="error" size="large" sx={{ mt: 1, height: 52 }} onClick={onDelete}>Удалить заметку</Button>
        )}
      </Box>
    </Modal>
  );
}
