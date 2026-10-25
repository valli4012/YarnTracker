import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { modalStyle, type ProjectNote } from '../shared';

interface Props {
  note?: ProjectNote;
  onClose: () => void;
  onSave: (data: { title?: string; text: string; imageIds: number[] }) => void;
  onDelete?: () => void;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function NoteSheet({ note, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [text, setText] = useState(note?.text ?? '');
  const [imageIds, setImageIds] = useState<number[]>(note?.imageIds ?? []);
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const previewUrls = useRef(new Set<string>());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const serverMode = import.meta.env.VITE_DATA === 'server';

  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const chooseFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const picked = Array.from(selected);
    const invalid = picked.find(file => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE || file.size === 0);
    if (invalid) {
      setError(invalid.size > MAX_IMAGE_SIZE
        ? 'Каждое фото должно быть не больше 10 МБ.'
        : 'Поддерживаются изображения JPG, PNG и WebP.');
      return;
    }
    if (imageIds.length + files.length + picked.length > MAX_IMAGES) {
      setError('В одной заметке можно сохранить не больше 5 фото.');
      return;
    }
    setError('');
    const pending = picked.map(file => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return { file, preview };
    });
    setFiles(current => [...current, ...pending]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const uploadedIds: number[] = [];
      for (const pending of files) {
        const file = pending.file;
        const response = await fetch('/api/files', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': file.type },
          body: file,
        });
        if (!response.ok) throw new Error(
          response.status === 401 ? 'Сессия закончилась. Войди на сервер снова.' : 'Не удалось загрузить фото. Проверь соединение и попробуй ещё раз.',
        );
        const result = await response.json() as { id: number };
        uploadedIds.push(result.id);
      }
      onSave({
        title: title.trim() === '' ? undefined : title.trim(),
        text: text.trim(),
        imageIds: [...imageIds, ...uploadedIds],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить фото.');
    } finally {
      setSaving(false);
    }
  };

  const removeExisting = (id: number) => setImageIds(current => current.filter(item => item !== id));
  const removePending = (index: number) => {
    const item = files[index];
    if (item) {
      URL.revokeObjectURL(item.preview);
      previewUrls.current.delete(item.preview);
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Modal open onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">{note ? 'Заметка' : 'Новая заметка'}</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть" disabled={saving}><CloseIcon /></IconButton>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>{error}</Alert>}
        <TextField fullWidth margin="dense" label="Заголовок" value={title} onChange={e => setTitle(e.target.value)} />
        <TextField fullWidth margin="dense" label="Текст *" value={text} onChange={e => setText(e.target.value)}
          multiline minRows={5} placeholder="Что важно не забыть. Ссылки можно вставлять прямо в текст." />

        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={e => chooseFiles(e.target.files)}
        />
        <Button fullWidth disabled={!serverMode || saving || imageIds.length + files.length >= MAX_IMAGES}
          startIcon={<AddPhotoAlternateOutlinedIcon />}
          onClick={() => inputRef.current?.click()}
          sx={{ mt: 1.5, height: 52, borderRadius: '20px', border: '2px dashed var(--md-outline-variant)' }}>
          {!serverMode ? 'Фото доступны в серверной версии' : 'Добавить фото'}
        </Button>

        {(imageIds.length > 0 || files.length > 0) && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mt: 1.5 }}>
            {imageIds.map(id => (
              <Box key={id} sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: '12px', bgcolor: 'var(--md-surface-container)' }}>
                <Box component="img" src={`/api/files/${id}`} alt="Фото заметки"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton aria-label="Убрать фото" size="small" disabled={saving}
                  onClick={() => removeExisting(id)}
                  sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,.65)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {files.map((item, index) => (
              <Box key={item.preview} sx={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: '12px', bgcolor: 'var(--md-surface-container)' }}>
                <Box component="img" src={item.preview} alt="Новое фото" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton aria-label="Убрать новое фото" size="small" disabled={saving}
                  onClick={() => removePending(index)}
                  sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,.65)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.8)' } }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }}
          disabled={text.trim() === '' || saving} onClick={save}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>

        {note && onDelete && (
          <Button fullWidth color="error" size="large" sx={{ mt: 1, height: 52 }} onClick={onDelete} disabled={saving}>Удалить заметку</Button>
        )}
      </Box>
    </Modal>
  );
}
