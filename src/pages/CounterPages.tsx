import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { RowCounter } from '../components/RowCounter';
import { useFeedback } from '../feedback';
import { useStoredState } from '../storage';
import { STATUS_LABEL, STORAGE_KEY_STANDALONE_COUNTER, type Project, type Yarn } from '../shared';

interface Props { projects: Project[]; setProjects: (p: Project[]) => void; yarns: Yarn[]; setYarns: (y: Yarn[]) => void }

export const CounterPage = ({ projects, setProjects, yarns, setYarns }: Props) => {
  const projectId = Number(useParams().id);
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5">Изделие не найдено</Typography>
        <Button component={Link} to="/projects" sx={{ mt: 2 }}>К списку</Button>
      </Container>
    );
  }

  const updateRows = (d: number) =>
    setProjects(projects.map(p => p.id === projectId ? { ...p, currentRows: Math.max(0, (p.currentRows || 0) + d) } : p));

  const finish = async () => {
    if (!(await confirm({ title: 'Завершить изделие?', text: 'Пряжа будет списана со склада.', ok: 'Завершить' }))) return;
    const used = new Map(project.materials.map(m => [m.yarnId, m.quantity]));
    setYarns(yarns.map(y => used.has(y.id) ? { ...y, stock: Math.max(0, y.stock - used.get(y.id)!) } : y));
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'finished' as const } : p));
    toast('Готово — пряжа списана со склада');
    navigate('/projects');
  };

  return (
    <RowCounter title={project.title} subtitle={STATUS_LABEL[project.status]} count={project.currentRows || 0}
      target={project.targetRows} onChange={updateRows}>
      <Stack direction="row" spacing={1}>
        <Button component={Link} to="/projects">К списку</Button>
        <Button color="error" onClick={finish}>Завершить</Button>
      </Stack>
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
