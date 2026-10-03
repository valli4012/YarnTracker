import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TimerIcon from '@mui/icons-material/Timer';
import { useStoredState } from './storage';
import { INITIAL_PROJECTS, INITIAL_YARNS, STORAGE_KEY_PROJECTS, STORAGE_KEY_YARNS, sanitizeProjects, sanitizeYarns, type Project, type Yarn } from './shared';
import { InventoryPage } from './pages/InventoryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CounterPage, StandaloneCounterPage } from './pages/CounterPages';

export default function App() {
  const { pathname } = useLocation();
  const [yarns, setYarns] = useStoredState<Yarn[]>(STORAGE_KEY_YARNS, INITIAL_YARNS, sanitizeYarns);
  const [projects, setProjects] = useStoredState<Project[]>(STORAGE_KEY_PROJECTS, INITIAL_PROJECTS, sanitizeProjects);
  const tab = pathname.startsWith('/projects') ? 1 : pathname.startsWith('/counter') ? 2 : 0;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', pb: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <Routes>
        <Route path="/" element={<InventoryPage yarns={yarns} setYarns={setYarns} projects={projects} />} />
        <Route path="/projects" element={<ProjectsPage projects={projects} setProjects={setProjects} yarns={yarns} />} />
        <Route path="/counter" element={<StandaloneCounterPage />} />
        <Route path="/counter/:id" element={<CounterPage projects={projects} setProjects={setProjects} yarns={yarns} setYarns={setYarns} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Paper component="nav" elevation={0}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderRadius: 0,
          bgcolor: 'var(--md-surface-container)', pb: 'env(safe-area-inset-bottom, 0px)' }}>
        <BottomNavigation showLabels value={tab}>
          <BottomNavigationAction label="Склад" icon={<InventoryIcon />} component={Link} to="/" />
          <BottomNavigationAction label="Изделия" icon={<CheckroomIcon />} component={Link} to="/projects" />
          <BottomNavigationAction label="Ряды" icon={<TimerIcon />} component={Link} to="/counter" />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
