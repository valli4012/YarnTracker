import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Chip, Container, Divider, Fab, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Modal, Select, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import { fabSx, getAvailableStock, modalStyle, STATUS_LABEL, type Project, type ProjectMaterial, type Yarn } from '../shared';
import { useFeedback } from '../feedback';
import { EmptyState } from '../components/EmptyState';
import { NumberField } from '../components/NumberField';
import { PageHeader } from '../components/PageHeader';
import { YarnThumb } from '../components/YarnThumb';

const STATUS_STYLE: Record<Project['status'], { bgcolor: string; color: string }> = {
  planned: { bgcolor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' },
  in_progress: { bgcolor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' },
  finished: { bgcolor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' },
};

export const ProjectsPage = ({ projects, setProjects, yarns }: { projects: Project[]; setProjects: any; yarns: Yarn[] }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const [targetRowsStr, setTargetRowsStr] = useState('');

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Project['status']>('planned');
  const [selectedYarnId, setSelectedYarnId] = useState<number | ''>('');
  const [materialQtyStr, setMaterialQtyStr] = useState('1');
  const [tempMaterials, setTempMaterials] = useState<ProjectMaterial[]>([]);

  const materialQty = Math.floor(Number(materialQtyStr));
  const canAddMaterial = Boolean(selectedYarnId) && Number.isFinite(materialQty) && materialQty > 0;

  const handleOpen = () => {
    setTitle(''); setStatus('planned'); setSelectedYarnId(''); setMaterialQtyStr('1'); setTempMaterials([]); setTargetRowsStr('');
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const addMaterialToList = () => {
    if (!selectedYarnId || !canAddMaterial) return;
    const existsIndex = tempMaterials.findIndex(m => m.yarnId === selectedYarnId);
    if (existsIndex >= 0) {
      setTempMaterials(tempMaterials.map((m, i) => (i === existsIndex ? { ...m, quantity: m.quantity + materialQty } : m)));
    } else {
      setTempMaterials([...tempMaterials, { yarnId: Number(selectedYarnId), quantity: materialQty }]);
    }
    setSelectedYarnId('');
    setMaterialQtyStr('1');
  };

  const removeMaterialFromList = (index: number) => setTempMaterials(tempMaterials.filter((_, i) => i !== index));

  const getYarnName = (id: number) => {
    const y = yarns.find(item => item.id === id);
    return y ? `${y.brand} — ${y.colorName}` : 'Неизвестная пряжа';
  };

  const createProject = () => {
    if (!title.trim()) { toast('Введите название'); return; }
    if (tempMaterials.length === 0) { toast('Добавьте хотя бы один моток'); return; }

    for (const mat of tempMaterials) {
      const currentAvailable = getAvailableStock(mat.yarnId, yarns, projects);
      if (mat.quantity > currentAvailable) {
        toast(`Не хватает «${getYarnName(mat.yarnId)}»: нужно ${mat.quantity}, доступно ${currentAvailable}`);
        return;
      }
    }

    const newProject: Project = {
      id: Date.now(),
      title: title.trim(),
      status,
      materials: tempMaterials,
      createdAt: Date.now(),
      currentRows: 0,
      targetRows: Number(targetRowsStr) > 0 ? Math.floor(Number(targetRowsStr)) : undefined,
    };
    setProjects([newProject, ...projects]);
    handleClose();
  };

  const startKnitting = (projectId: number) => {
    setProjects(projects.map(p => (p.id === projectId ? { ...p, status: 'in_progress' } : p)));
    navigate(`/counter/${projectId}`);
  };

  const count = (s: Project['status']) => projects.filter(p => p.status === s).length;
  const subtitle = projects.length === 0
    ? 'Пока ничего нет'
    : [
        count('in_progress') && `${count('in_progress')} в работе`,
        count('planned') && `${count('planned')} в планах`,
        count('finished') && `${count('finished')} готово`,
      ].filter(Boolean).join(' · ');

  return (
    <Container sx={{ pb: 12 }}>
      <PageHeader title="Изделия" subtitle={subtitle} />

      {projects.length === 0 ? (
        <EmptyState icon={<CheckroomOutlinedIcon />} title="Изделий пока нет"
          text="Создайте изделие, выберите пряжу со склада, и она будет зарезервирована под проект."
          action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Новое изделие</Button>} />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
          {projects.map(proj => {
            const rows = proj.currentRows ?? 0;
            return (
              <Card key={proj.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, opacity: proj.status === 'finished' ? 0.85 : 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{proj.title}</Typography>
                  <Chip size="small" label={STATUS_LABEL[proj.status]} sx={{ ...STATUS_STYLE[proj.status], flexShrink: 0 }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {proj.materials.map((mat, idx) => {
                    const y = yarns.find(item => item.id === mat.yarnId);
                    return (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {y && <YarnThumb yarn={y} size={36} radius="10px" />}
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>{getYarnName(mat.yarnId)}</Typography>
                        <Typography variant="body2" color="text.secondary">× {mat.quantity}</Typography>
                      </Box>
                    );
                  })}
                </Box>

                {rows > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ряды: {rows}{proj.targetRows ? ` из ${proj.targetRows}` : ''}
                    </Typography>
                    {proj.targetRows ? <LinearProgress variant="determinate" value={Math.min(100, (rows / proj.targetRows) * 100)} sx={{ mt: 0.5 }} /> : null}
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {proj.status !== 'finished' && (
                    <Button variant="contained" startIcon={<TimerIcon />} onClick={() => startKnitting(proj.id)}>Вязать</Button>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <IconButton color="error" aria-label="Удалить изделие"
                    onClick={async () => {
                      if (await confirm({ title: `Удалить «${proj.title}»?`, ok: 'Удалить', danger: true })) {
                        setProjects(projects.filter(p => p.id !== proj.id));
                      }
                    }}>
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {projects.length > 0 && <Fab color="primary" aria-label="Новое изделие" onClick={handleOpen} sx={fabSx}><AddIcon /></Fab>}

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Новое изделие</Typography>
            <IconButton onClick={handleClose} aria-label="Закрыть"><CloseIcon /></IconButton>
          </Box>

          <TextField fullWidth margin="dense" label="Название" value={title} onChange={(e) => setTitle(e.target.value)} />

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Статус</InputLabel>
              <Select value={status} label="Статус" onChange={(e) => setStatus(e.target.value as Project['status'])}>
                <MenuItem value="planned">Планируется</MenuItem>
                <MenuItem value="in_progress">В работе</MenuItem>
                <MenuItem value="finished">Готово</MenuItem>
              </Select>
            </FormControl>
            <NumberField fullWidth margin="dense" label="Всего рядов" placeholder="необязательно"
              value={targetRowsStr} onChange={setTargetRowsStr} />
          </Box>

          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" color="text.secondary">Пряжа для изделия</Typography>

          <FormControl fullWidth margin="dense">
            <InputLabel>Выбрать со склада</InputLabel>
            <Select value={selectedYarnId} label="Выбрать со склада" onChange={(e) => setSelectedYarnId(Number(e.target.value))}>
              {yarns.map(y => (
                <MenuItem key={y.id} value={y.id}>
                  {y.brand} — {y.colorName} (доступно: {getAvailableStock(y.id, yarns, projects)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <NumberField label="Кол-во" placeholder="1" value={materialQtyStr} onChange={setMaterialQtyStr} sx={{ width: 110 }} />
            <Button variant="outlined" onClick={addMaterialToList} disabled={!canAddMaterial}>Добавить</Button>
          </Box>

          {tempMaterials.length > 0 && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: '16px', bgcolor: 'var(--md-surface-container)' }}>
              {tempMaterials.map((m, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 0 }} noWrap>{getYarnName(m.yarnId)} × {m.quantity}</Typography>
                  <IconButton size="small" aria-label="Убрать" onClick={() => removeMaterialFromList(idx)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }} onClick={createProject}>Создать изделие</Button>
        </Box>
      </Modal>
    </Container>
  );
};
