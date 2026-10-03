import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, List, ListItem, Chip, Stack, Button, Modal, TextField, IconButton, Fab, MenuItem, Select, InputLabel, FormControl, Card, CardContent, Divider, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import TimerIcon from '@mui/icons-material/Timer';
import { fabSx, getAvailableStock, modalStyle, STATUS_LABEL, type Yarn, type ProjectMaterial, type Project } from '../shared';
import { useFeedback } from '../feedback';

export const ProjectsPage = ({ projects, setProjects, yarns }: { projects: Project[], setProjects: any, yarns: Yarn[] }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const [targetRowsStr, setTargetRowsStr] = useState('');
  
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'planned' | 'in_progress' | 'finished'>('planned');
  const [selectedYarnId, setSelectedYarnId] = useState<number | ''>('');
  const [materialQty, setMaterialQty] = useState<number>(1);
  const [tempMaterials, setTempMaterials] = useState<ProjectMaterial[]>([]);

  const handleOpen = () => {
    setTitle(''); setStatus('planned'); setSelectedYarnId(''); setMaterialQty(1); setTempMaterials([]); setTargetRowsStr('');
    setOpen(true);
  };
  
  const handleClose = () => setOpen(false);

  const addMaterialToList = () => {
    if (!selectedYarnId || materialQty <= 0) return;
    
    const existsIndex = tempMaterials.findIndex(m => m.yarnId === selectedYarnId);
    let newTemp = [...tempMaterials];
    
    if (existsIndex >= 0) {
      newTemp[existsIndex].quantity += materialQty;
    } else {
      newTemp.push({ yarnId: Number(selectedYarnId), quantity: materialQty });
    }
    
    setTempMaterials(newTemp);
    setSelectedYarnId(''); 
    setMaterialQty(1);
  };

  const removeMaterialFromList = (index: number) => {
    const newTemp = tempMaterials.filter((_, i) => i !== index);
    setTempMaterials(newTemp);
  };

  const createProject = () => {
    if (!title) { toast('Введите название'); return; }
    if (tempMaterials.length === 0) { toast('Добавьте хотя бы один моток'); return; }

    for (let mat of tempMaterials) {
      const currentAvailable = getAvailableStock(mat.yarnId, yarns, projects);
      
      if (mat.quantity > currentAvailable) {
        const yarnName = getYarnName(mat.yarnId);
        toast(`Не хватает «${yarnName}»: нужно ${mat.quantity}, доступно ${currentAvailable}`);
        return;
      }
    }

    const newProject: Project = {
      id: Date.now(),
      title,
      status,
      materials: tempMaterials,
      createdAt: Date.now(),
      currentRows: 0,
      targetRows: Number(targetRowsStr) > 0 ? Math.floor(Number(targetRowsStr)) : undefined,
    };

    setProjects([newProject, ...projects]);
    handleClose();
  };

  const getYarnName = (id: number) => {
    const y = yarns.find(item => item.id === id);
    return y ? `${y.brand} - ${y.colorName}` : "Неизвестная пряжа";
  };

  const startKnitting = (projectId: number) => {
    setProjects(projects.map(p => p.id === projectId ? {...p, status: 'in_progress'} : p));
    navigate(`/counter/${projectId}`);
  };

  return (
    <Container sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">Изделия</Typography>
        <Fab color="primary" aria-label="Новое изделие" onClick={handleOpen} sx={fabSx}><AddIcon /></Fab>
      </Stack>

      {projects.length === 0 && <Typography color="text.secondary">Нет активных проектов.</Typography>}

      <List>
        {projects.map((proj) => (
          <ListItem key={proj.id} disablePadding>
            <Card sx={{ width: '100%', mb: 2, bgcolor: proj.status === 'finished' ? 'var(--md-surface-container-high)' : 'background.paper' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{proj.title}</Typography>
                  <Chip 
                    label={STATUS_LABEL[proj.status]} 
                    color={proj.status === 'finished' ? 'success' : proj.status === 'in_progress' ? 'warning' : 'default'} 
                    size="small"
                  />
                </Stack>
                
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">Материалы:</Typography>
                  <Stack spacing={0.5} mt={0.5}>
                    {proj.materials.map((mat, idx) => (
                      <Typography key={idx} variant="body2">
                        • {getYarnName(mat.yarnId)} — {mat.quantity} мотк.
                      </Typography>
                    ))}
                  </Stack>
                </Box>

                {(proj.currentRows ?? 0) > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">Ряды: {proj.currentRows}{proj.targetRows ? ` из ${proj.targetRows}` : ''}</Typography>
                    {proj.targetRows ? <LinearProgress variant="determinate" value={Math.min(100, ((proj.currentRows ?? 0) / proj.targetRows) * 100)} sx={{ mt: 1 }} /> : null}
                  </Box>
                )}

                <Stack direction="row" spacing={1} mt={2}>
                  {proj.status !== 'finished' && (
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<TimerIcon />}
                      onClick={() => startKnitting(proj.id)}
                    >
                      Вязать
                    </Button>
                  )}
                  <Button 
                    variant="outlined" 
                    size="small" 
                    color="error"
                    onClick={async () => {
                       if (await confirm({ title: `Удалить «${proj.title}»?`, ok: 'Удалить', danger: true })) {
                         setProjects(projects.filter(p => p.id !== proj.id));
                       }
                    }}
                  >
                    Удалить
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Новое изделие</Typography>
            <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
          </Stack>

          <TextField fullWidth margin="dense" label="Название проекта" value={title} onChange={(e) => setTitle(e.target.value)} />
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Статус</InputLabel>
            <Select value={status} label="Статус" onChange={(e) => setStatus(e.target.value as any)}>
              <MenuItem value="planned">Планируется</MenuItem>
              <MenuItem value="in_progress">В работе</MenuItem>
              <MenuItem value="finished">Готово</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth margin="dense" type="number" label="Всего рядов (необязательно)" value={targetRowsStr} onChange={(e) => setTargetRowsStr(e.target.value)} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Добавить материалы:</Typography>
          
          <FormControl fullWidth margin="dense">
            <InputLabel>Выбрать пряжу со склада</InputLabel>
            <Select 
              value={selectedYarnId} 
              label="Выбрать пряжу" 
              onChange={(e) => setSelectedYarnId(Number(e.target.value))}
            >
              {yarns.map(y => {
                 const avail = getAvailableStock(y.id, yarns, projects);
                 return (
                  <MenuItem key={y.id} value={y.id}>
                    {y.brand} - {y.colorName} (доступно: {avail})
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} alignItems="center" mt={1}>
            <TextField 
              type="number" 
              label="Кол-во" 
              value={materialQty} 
              onChange={(e) => setMaterialQty(Number(e.target.value))}
              sx={{ width: 100 }}
            />
            <Button variant="outlined" onClick={addMaterialToList} disabled={!selectedYarnId}>
              Добавить в список
            </Button>
          </Stack>

          {tempMaterials.length > 0 && (
            <Box mt={2} p={1} bgcolor="var(--md-surface-container-high)" borderRadius={1}>
              {tempMaterials.map((m, idx) => (
                <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{getYarnName(m.yarnId)} x{m.quantity}</Typography>
                  <IconButton size="small" onClick={() => removeMaterialFromList(idx)}><DeleteIcon fontSize="small"/></IconButton>
                </Stack>
              ))}
            </Box>
          )}

          <Button fullWidth variant="contained" color="secondary" sx={{ mt: 3 }} onClick={createProject}>
            Создать проект
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};
