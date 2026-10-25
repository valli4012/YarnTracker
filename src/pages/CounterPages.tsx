import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import { RowCounter } from '../components/RowCounter';
import { NoteSheet } from '../components/NoteSheet';
import { useFeedback } from '../feedback';
import { useStoredState } from '../storage';
import { finishProjectState, STATUS_LABEL, STORAGE_KEY_STANDALONE_COUNTER, tonalSx, type Project, type Yarn } from '../shared';

interface Props { projects: Project[]; setProjects: (p: Project[]) => void; yarns: Yarn[]; setYarns: (y: Yarn[]) => void }

export const CounterPage = ({ projects, setProjects, yarns, setYarns }: Props) => {
  const params = useParams();
  const projectId = Number(params.id);
  const stageId = params.stageId == null ? null : Number(params.stageId);
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const [openNote, setOpenNote] = useState(false);
  const project = projects.find(p => p.id === projectId);
  const stage = stageId == null ? undefined : project?.stages.find(s => s.id === stageId);

  if (!project || (stageId != null && !stage)) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5">{project ? 'Этап не найден' : 'Изделие не найдено'}</Typography>
        <Button component={Link} to="/projects" sx={{ mt: 2 }}>К списку</Button>
      </Container>
    );
  }

  const update = (patch: Partial<Project>) => setProjects(projects.map(p => (p.id === projectId ? { ...p, ...patch } : p)));

  // Этапы считают ряды каждый у себя, у изделия без этапов счётчик один
  const updateRows = (d: number) => {
    if (stage) {
      update({ stages: project.stages.map(s => (s.id === stage.id ? { ...s, currentRows: Math.max(0, (s.currentRows ?? 0) + d) } : s)) });
    } else {
      update({ currentRows: Math.max(0, (project.currentRows ?? 0) + d) });
    }
  };

  const addNote = ({ title, text }: { title?: string; text: string }) => {
    update({ notes: [{ id: Date.now(), createdAt: Date.now(), title, text }, ...project.notes] });
    setOpenNote(false);
    toast('Заметка сохранена в изделии');
  };

  const finish = async () => {
    if (!(await confirm({ title: 'Завершить изделие?', text: 'Пряжа будет списана со склада.', ok: 'Завершить' }))) return;
    const next = finishProjectState(project, projects, yarns);
    setYarns(next.yarns);
    setProjects(next.projects);
    toast('Готово — пряжа списана со склада');
    navigate(`/projects/${projectId}`);
  };

  return (
    <RowCounter title={project.title} subtitle={stage ? `Этап: ${stage.title}` : STATUS_LABEL[project.status]}
      count={(stage ? stage.currentRows : project.currentRows) || 0}
      target={stage ? stage.targetRows : project.targetRows} onChange={updateRows}>
      {/* Заметка прямо во время вязания: сохраняется в это изделие */}
      <Button onClick={() => setOpenNote(true)} startIcon={<EditNoteIcon />}
        sx={{ width: '100%', maxWidth: 360, height: 56, borderRadius: '20px', fontSize: 16, ...tonalSx }}>
        Заметка
      </Button>

      
<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, width: '100%', mt: 1 }}>
  <Button
    component={Link}
    to={`/projects/${projectId}`}
    variant="contained"
    fullWidth
    sx={{ maxWidth: 360, height: 56, borderRadius: '20px', fontSize: 16 }}
  >
    Пауза
  </Button>
  <Button
    onClick={finish}
    color="inherit"
    sx={{ opacity: 0.7, fontSize: 14 }}
  >
    Завершить изделие
  </Button>
</Box>

      {openNote && <NoteSheet onClose={() => setOpenNote(false)} onSave={addNote} />}
    </RowCounter>
  );
};

export const StandaloneCounterPage = () => {
  const [count, setCount] = useStoredState<number>(STORAGE_KEY_STANDALONE_COUNTER, 0);
  const { confirm } = useFeedback();
  const reset = async () => {
    if (await confirm({ title: 'Сбросить счётчик?', text: 'Значение вернётся к нулю.', ok: 'Сбросить', danger: true })) setCount(0);
  };
  return (
    <RowCounter title="Свободный режим" subtitle="Не влияет на изделия и склад" count={count}
      onChange={d => setCount(c => Math.max(0, c + d))}>
      <Button color="error" startIcon={<RefreshIcon />} onClick={reset}>Сбросить</Button>
    </RowCounter>
  );
};
