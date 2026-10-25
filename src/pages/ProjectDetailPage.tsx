import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Chip, Container, Fab, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import {
  fabSx, finishProjectState, getProjectRows, rowsWord, STATUS_LABEL, STATUS_STYLE,
  type Project, type ProjectNote, type ProjectStage, type Yarn,
} from '../shared';
import { useFeedback } from '../feedback';
import { DetailRow, Section } from '../components/detail';
import { NotesSection } from '../components/NotesSection';
import { EditProjectDialog } from './EditProjectDialog';
import { ProjectLookPicker } from '../components/ProjectLookPicker';
import { ProjectMark } from '../components/ProjectMark';
import { ProjectProgressBar } from '../components/ProjectProgressBar';
import { StagePicker } from '../components/StagePicker';
import { StagesSection } from '../components/StagesSection';
import { YarnThumb } from '../components/YarnThumb';

interface Props { projects: Project[]; setProjects: (p: Project[]) => void; yarns: Yarn[]; setYarns: (y: Yarn[]) => void }

const dateText = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

// Подробный экран изделия: всё, что раньше теснилось на плитке списка
export const ProjectDetailPage = ({ projects, setProjects, yarns, setYarns }: Props) => {
  const projectId = Number(useParams().id);
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const [pickStage, setPickStage] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5">Изделие не найдено</Typography>
        <Button component={Link} to="/projects" sx={{ mt: 2 }}>К списку</Button>
      </Container>
    );
  }

  const rows = getProjectRows(project);
  const getYarnName = (id: number) => {
    const y = yarns.find(item => item.id === id);
    return y ? `${y.brand} — ${y.colorName}` : 'Неизвестная пряжа';
  };

  const update = (patch: Partial<Project>) =>
    setProjects(projects.map(p => (p.id === projectId ? { ...p, ...patch } : p)));

  // Вязать можно любой этап в любое время: порядок этапов ни на что не влияет
  const knit = (stageId?: number) => {
    update({ status: 'in_progress' });
    navigate(stageId == null ? `/counter/${projectId}` : `/counter/${projectId}/${stageId}`);
  };

  const startKnitting = () => (project.stages.length > 0 ? setPickStage(true) : knit());

  const finish = async () => {
    if (!(await confirm({ title: 'Завершить изделие?', text: 'Пряжа будет списана со склада.', ok: 'Завершить' }))) return;
    const next = finishProjectState(project, projects, yarns);
    setYarns(next.yarns);
    setProjects(next.projects);
    toast('Готово — пряжа списана со склада');
  };

  const remove = async () => {
    if (!(await confirm({ title: `Удалить «${project.title}»?`, ok: 'Удалить', danger: true }))) return;
    setProjects(projects.filter(p => p.id !== projectId));
    navigate('/projects', { replace: true });
  };

  return (
    <>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 1, px: 1, minHeight: 64,
        pt: 'env(safe-area-inset-top, 0px)', bgcolor: 'background.default' }}>
        <IconButton component={Link} to="/projects" aria-label="Назад"><ArrowBackIcon /></IconButton>
        <Typography variant="h6" noWrap sx={{ flex: 1 }}>{project.title}</Typography>
<IconButton onClick={() => setEditOpen(true)} aria-label="Редактировать изделие">
  <EditOutlinedIcon />
</IconButton>
<IconButton onClick={remove} aria-label="Удалить изделие" color="error">
  <DeleteOutlinedIcon />
</IconButton>
</Box>
      <Box sx={{ maxWidth: 640, width: '100%', mx: 'auto', px: 2, pb: 14 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 0.5 }}>
          <ProjectMark icon={project.icon} accent={project.accent} size={64} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>{project.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip size="small" label={STATUS_LABEL[project.status]} sx={STATUS_STYLE[project.status]} />
              <Typography variant="body2" color="text.secondary">создано {dateText(project.createdAt)}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2.5, p: 2, borderRadius: '20px', bgcolor: 'var(--md-surface-container)' }}>
          <ProjectProgressBar project={project} help />
        </Box>

        <Section title="Внешний вид">
          <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', p: 2 }}>
            <ProjectLookPicker icon={project.icon} accent={project.accent}
              onIcon={(icon) => update({ icon })} onAccent={(accent) => update({ accent })} />
          </Box>
        </Section>

        <StagesSection stages={project.stages} canKnit={project.status !== 'finished'}
          onChange={(stages: ProjectStage[]) => update({ stages })}
          onKnit={(stageId: number) => knit(stageId)} />

        <Section title="Пряжа">
          {project.materials.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>Пряжа не выбрана.</Typography>
          ) : (
            <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', px: 2 }}>
              {project.materials.map((mat, idx) => {
                const y = yarns.find(item => item.id === mat.yarnId);
                return (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5,
                    '&:not(:last-of-type)': { borderBottom: '1px solid var(--md-outline-variant)' } }}>
                    {y && <YarnThumb yarn={y} size={40} radius="12px" />}
                    <Typography variant="body1" sx={{ flex: 1, minWidth: 0 }} noWrap>{getYarnName(mat.yarnId)}</Typography>
                    <Typography variant="body1" color="text.secondary">× {mat.quantity}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Section>

        <Section title="Ряды">
          <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', px: 2 }}>
            <DetailRow label="Связано" value={`${rows} ${rowsWord(rows)}`} />
            {project.stages.length > 0 && (project.currentRows ?? 0) > 0 && (
              <DetailRow label="В том числе до этапов" value={`${project.currentRows} ${rowsWord(project.currentRows ?? 0)}`} />
            )}
            {project.targetRows ? <DetailRow label="Цель" value={`${project.targetRows} ${rowsWord(project.targetRows)}`} /> : null}
          </Box>
        </Section>

        <NotesSection notes={project.notes} onChange={(notes: ProjectNote[]) => update({ notes })} />

        {project.status !== 'finished' && (
          <Button fullWidth variant="outlined" color="error" sx={{ mt: 3, height: 52 }} onClick={finish}>
            Завершить и списать пряжу
          </Button>
        )}
      </Box>

      {project.status !== 'finished' && (
        <Fab variant="extended" onClick={startKnitting} aria-label="Вязать" sx={fabSx}>
          <TimerIcon />Вязать
        </Fab>
      )}

      <StagePicker open={pickStage} stages={project.stages} onClose={() => setPickStage(false)}
        onPick={(stageId) => { setPickStage(false); knit(stageId); }} />
        <EditProjectDialog
       open={editOpen}
       project={project}
       projects={projects}
       yarns={yarns}
       onClose={() => setEditOpen(false)}
       onSave={(patch) => update(patch)}
      />
    </>
  );
};
