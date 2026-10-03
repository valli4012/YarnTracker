import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardActionArea, Container, Divider, Fab, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Modal, Select, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { fabSx, getAvailableStock, getProjectProgress, modalStyle, type Project, type ProjectMaterial, type ProjectStage, type Yarn } from '../shared';
import { DEFAULT_PROJECT_ACCENT, DEFAULT_PROJECT_ICON, type ProjectAccent, type ProjectIcon } from '../projectAppearance';
import { useFeedback } from '../feedback';
import { EmptyState } from '../components/EmptyState';
import { NumberField } from '../components/NumberField';
import { PageHeader } from '../components/PageHeader';
import { ProjectLookPicker } from '../components/ProjectLookPicker';
import { ProjectMark } from '../components/ProjectMark';
import { StagesSection } from '../components/StagesSection';

export const ProjectsPage = ({ projects, setProjects, yarns }: { projects: Project[]; setProjects: any; yarns: Yarn[] }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useFeedback();
  const [targetRowsStr, setTargetRowsStr] = useState('');

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<ProjectIcon>(DEFAULT_PROJECT_ICON);
  const [accent, setAccent] = useState<ProjectAccent>(DEFAULT_PROJECT_ACCENT);
  const [status, setStatus] = useState<Project['status']>('planned');
  const [selectedYarnId, setSelectedYarnId] = useState<number | ''>('');
  const [materialQtyStr, setMaterialQtyStr] = useState('1');
  const [tempMaterials, setTempMaterials] = useState<ProjectMaterial[]>([]);
  const [draftStages, setDraftStages] = useState<ProjectStage[]>([]);

  const materialQty = Math.floor(Number(materialQtyStr));
  const canAddMaterial = Boolean(selectedYarnId) && Number.isFinite(materialQty) && materialQty > 0;

  const handleOpen = () => {
    setTitle(''); setIcon(DEFAULT_PROJECT_ICON); setAccent(DEFAULT_PROJECT_ACCENT);
    setStatus('planned'); setSelectedYarnId(''); setMaterialQtyStr('1'); setTempMaterials([]); setTargetRowsStr(''); setDraftStages([]);
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
      icon,
      accent,
      materials: tempMaterials,
      createdAt: Date.now(),
      currentRows: 0,
      targetRows: Number(targetRowsStr) > 0 ? Math.floor(Number(targetRowsStr)) : undefined,
      stages: draftStages,
      notes: [],
    };
    setProjects([newProject, ...projects]);
    handleClose();
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
            const progress = getProjectProgress(proj);
            return (
              <Card key={proj.id} sx={{ opacity: proj.status === 'finished' ? 0.85 : 1 }}>
                <CardActionArea onClick={() => navigate(`/projects/${proj.id}`)} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ProjectMark icon={proj.icon} accent={proj.accent} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{proj.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{progress.label}</Typography>
                    <LinearProgress variant="determinate" value={progress.value} sx={{ mt: 1 }} />
                  </Box>
                </CardActionArea>
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
          <Box sx={{ mt: 1.5, mb: 1 }}>
            <ProjectLookPicker icon={icon} accent={accent} onIcon={setIcon} onAccent={setAccent} />
          </Box>

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

          <StagesSection compact stages={draftStages} onChange={setDraftStages} />

          <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }} onClick={createProject}>Создать изделие</Button>
        </Box>
      </Modal>
    </Container>
  );
};
