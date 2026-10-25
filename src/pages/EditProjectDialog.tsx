
import { useEffect, useState } from 'react';
import {
  Box, Button, Divider, FormControl, IconButton, InputLabel,
  MenuItem, Modal, Select, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getAvailableStock, modalStyle,
  type Project, type ProjectMaterial, type Yarn,
} from '../shared';
import { useFeedback } from '../feedback';
import { NumberField } from '../components/NumberField';

interface Props {
  open: boolean;
  project: Project;
  projects: Project[];
  yarns: Yarn[];
  onClose: () => void;
  onSave: (patch: Partial<Project>) => void;
}

export const EditProjectDialog = ({
  open, project, projects, yarns, onClose, onSave,
}: Props) => {
  const { toast } = useFeedback();
  const [title, setTitle] = useState(project.title);
  const [status, setStatus] = useState<Project['status']>(project.status);
  const [targetRowsStr, setTargetRowsStr] = useState(
    project.targetRows ? String(project.targetRows) : '',
  );
  const [materials, setMaterials] = useState<ProjectMaterial[]>(project.materials.map(m => ({ ...m })));
  const [selectedYarnId, setSelectedYarnId] = useState<number | ''>('');
  const [quantityStr, setQuantityStr] = useState('1');

  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setStatus(project.status);
    setTargetRowsStr(project.targetRows ? String(project.targetRows) : '');
    setMaterials(project.materials.map(m => ({ ...m })));
    setSelectedYarnId('');
    setQuantityStr('1');
  }, [open, project]);

  const isFinished = project.status === 'finished';
  const otherProjects = projects.filter(p => p.id !== project.id);
  const getYarnName = (id: number) => {
    const yarn = yarns.find(y => y.id === id);
    return yarn ? `${yarn.brand} — ${yarn.colorName}` : 'Неизвестная пряжа';
  };

  const addMaterial = () => {
    const quantity = Math.floor(Number(quantityStr));
    if (!selectedYarnId || !Number.isFinite(quantity) || quantity < 1) {
      toast('Укажи пряжу и количество не меньше 1');
      return;
    }

    const available = getAvailableStock(Number(selectedYarnId), yarns, otherProjects);
    const existing = materials.find(m => m.yarnId === selectedYarnId);
    const requested = (existing?.quantity ?? 0) + quantity;

    if (requested > available) {
      toast(`Доступно мотков: ${available}`);
      return;
    }

    setMaterials(existing
      ? materials.map(m => m.yarnId === selectedYarnId
          ? { ...m, quantity: m.quantity + quantity }
          : m)
      : [...materials, { yarnId: Number(selectedYarnId), quantity }]);

    setSelectedYarnId('');
    setQuantityStr('1');
  };

  const save = () => {
    if (!title.trim()) {
      toast('Введи название изделия');
      return;
    }

    const target = Number(targetRowsStr);
    if (targetRowsStr.trim() && (!Number.isFinite(target) || target < 1)) {
      toast('Количество рядов должно быть больше нуля');
      return;
    }

    if (!isFinished) {
      if (materials.length === 0) {
        toast('Добавь хотя бы один моток пряжи');
        return;
      }

      for (const material of materials) {
        const available = getAvailableStock(material.yarnId, yarns, otherProjects);
        if (material.quantity > available) {
          toast(`Для «${getYarnName(material.yarnId)}» доступно мотков: ${available}`);
          return;
        }
      }
    }

    onSave({
      title: title.trim(),
      targetRows: targetRowsStr.trim() ? Math.floor(target) : undefined,
      ...(isFinished ? {} : { status, materials }),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...modalStyle, maxWidth: 520 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Редактировать изделие</Typography>
          <IconButton onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth margin="dense" label="Название"
          value={title} onChange={e => setTitle(e.target.value)}
        />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mt: 1 }}>
          <FormControl fullWidth margin="dense" disabled={isFinished}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={status}
              label="Статус"
              onChange={e => setStatus(e.target.value as Project['status'])}
            >
              <MenuItem value="planned">Планируется</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
            </Select>
          </FormControl>

          <NumberField
            fullWidth margin="dense" label="Цель, рядов"
            placeholder="Необязательно"
            value={targetRowsStr} onChange={setTargetRowsStr}
            disabled={isFinished}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Пряжа для изделия</Typography>

        {isFinished ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Изделие уже завершено. Состав пряжи нельзя менять, так как она уже списана со склада.
          </Typography>
        ) : (
          <>
            {materials.map((material, index) => (
              <Box key={material.yarnId} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                  {getYarnName(material.yarnId)}
                </Typography>
                <NumberField
                  label="Мотки" value={String(material.quantity)}
                  onChange={value => {
                    const quantity = Number(value);
                    setMaterials(current => current.map((m, i) =>
                      i === index && Number.isInteger(quantity) && quantity > 0
                        ? { ...m, quantity }
                        : m,
                    ));
                  }}
                  sx={{ width: 95 }}
                />
                <IconButton
                  aria-label="Удалить пряжу"
                  onClick={() => setMaterials(current => current.filter((_, i) => i !== index))}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
              <InputLabel>Добавить пряжу</InputLabel>
              <Select
                value={selectedYarnId}
                label="Добавить пряжу"
                onChange={e => setSelectedYarnId(Number(e.target.value))}
              >
                {yarns.map(yarn => (
                  <MenuItem key={yarn.id} value={yarn.id}>
                    {getYarnName(yarn.id)} (доступно: {getAvailableStock(yarn.id, yarns, otherProjects)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <NumberField
                label="Мотки" value={quantityStr}
                onChange={setQuantityStr} sx={{ width: 100 }}
              />
              <Button
                variant="outlined"
                onClick={addMaterial}
                disabled={!selectedYarnId || Number(quantityStr) < 1}
              >
                Добавить
              </Button>
            </Box>
          </>
        )}

        <Button
          fullWidth variant="contained" size="large"
          sx={{ mt: 3, height: 52 }} onClick={save}
        >
          Сохранить
        </Button>
      </Box>
    </Modal>
  );
};

