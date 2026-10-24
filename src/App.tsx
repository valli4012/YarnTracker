import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Alert, Box, BottomNavigation, BottomNavigationAction, Button, Paper, TextField, Typography } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import TimerIcon from '@mui/icons-material/Timer';
import { useStoredState } from './storage';
import { INITIAL_PROJECTS, INITIAL_YARNS, NAV_PILL_RADIUS, NAV_SIDE_INSET, STORAGE_KEY_PROJECTS, STORAGE_KEY_YARNS, navClearance, navDockBottom, sanitizeProjects, sanitizeYarns, type Project, type Yarn } from './shared';
import { InventoryPage } from './pages/InventoryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { CounterPage, StandaloneCounterPage } from './pages/CounterPages';

function AppShell({ yarns, setYarns, projects, setProjects }: {
  yarns: Yarn[]; setYarns: (y: Yarn[]) => void;
  projects: Project[]; setProjects: (p: Project[]) => void;
}) {
  const { pathname } = useLocation();
  const tab = pathname.startsWith('/projects') ? 1 : pathname.startsWith('/counter') ? 2 : 0;
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', pb: navClearance }}>
      <Routes>
        <Route path="/" element={<InventoryPage yarns={yarns} setYarns={setYarns} projects={projects} />} />
        <Route path="/projects" element={<ProjectsPage projects={projects} setProjects={setProjects} yarns={yarns} />} />
        <Route path="/projects/:id" element={<ProjectDetailPage projects={projects} setProjects={setProjects} yarns={yarns} setYarns={setYarns} />} />
        <Route path="/counter" element={<StandaloneCounterPage />} />
        <Route path="/counter/:id" element={<CounterPage projects={projects} setProjects={setProjects} yarns={yarns} setYarns={setYarns} />} />
        <Route path="/counter/:id/:stageId" element={<CounterPage projects={projects} setProjects={setProjects} yarns={yarns} setYarns={setYarns} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Paper component="nav" elevation={3}
        sx={{ position: 'fixed', zIndex: 1000, overflow: 'hidden',
          borderRadius: `${NAV_PILL_RADIUS}px`,
          left: `max(${NAV_SIDE_INSET}px, env(safe-area-inset-left, 0px))`,
          right: `max(${NAV_SIDE_INSET}px, env(safe-area-inset-right, 0px))`,
          bottom: navDockBottom, bgcolor: 'var(--md-surface-container)' }}>
        <BottomNavigation showLabels value={tab}>
          <BottomNavigationAction label="Склад" icon={<InventoryIcon />} component={Link} to="/" />
          <BottomNavigationAction label="Изделия" icon={<CheckroomIcon />} component={Link} to="/projects" />
          <BottomNavigationAction label="Ряды" icon={<TimerIcon />} component={Link} to="/counter" />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

function LocalApp() {
  const [yarns, setYarns] = useStoredState<Yarn[]>(STORAGE_KEY_YARNS, INITIAL_YARNS, sanitizeYarns);
  const [projects, setProjects] = useStoredState<Project[]>(STORAGE_KEY_PROJECTS, INITIAL_PROJECTS, sanitizeProjects);
  return <AppShell yarns={yarns} setYarns={setYarns} projects={projects} setProjects={setProjects} />;
}

function ServerApp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/me', { credentials: 'same-origin' }).then(async response => {
      if (!response.ok) return null;
      return response.json() as Promise<{ username: string }>;
    }).then(async user => {
      if (!active) return;
      if (!user) { setLoading(false); return; }
      const response = await fetch('/api/state', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Не удалось загрузить данные с сервера');
      const state = await response.json() as { yarns: unknown; projects: unknown };
      if (!active) return;
      setYarns(sanitizeYarns(state.yarns));
      setProjects(sanitizeProjects(state.projects));
      setSignedIn(true);
      setLoading(false);
    }).catch(() => {
      if (active) { setError('Не удалось связаться с сервером. Проверь соединение и попробуй обновить страницу.'); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Неверный логин или пароль' : 'Не удалось войти');
      const stateResponse = await fetch('/api/state', { credentials: 'same-origin' });
      if (!stateResponse.ok) throw new Error('Вход выполнен, но данные загрузить не удалось');
      const state = await stateResponse.json() as { yarns: unknown; projects: unknown };
      setYarns(sanitizeYarns(state.yarns));
      setProjects(sanitizeProjects(state.projects));
      setSignedIn(true);
      setRevision(v => v + 1);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!signedIn || loading) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch('/api/state', {
          method: 'PUT', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ yarns, projects }),
        });
        if (!response.ok) throw new Error('Сервер не сохранил изменения');
        setError('');
      } catch {
        setError('Не удалось сохранить изменения на сервере. Не закрывай страницу и проверь соединение.');
      } finally { setSaving(false); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [signedIn, loading, yarns, projects, revision]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Подключаемся к Пряжнику…</Typography></Box>;
  if (!signedIn) return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
      <Box component="form" onSubmit={signIn} sx={{ width: '100%', maxWidth: 380, display: 'grid', gap: 2 }}>
        <Typography variant="h4">Пряжник</Typography>
        <Typography color="text.secondary">Войди, чтобы открыть склад и изделия.</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Логин" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
        <TextField label="Пароль" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        <Button type="submit" variant="contained" disabled={loading}>Войти</Button>
      </Box>
    </Box>
  );
  return <>{error && <Alert severity="warning" onClose={() => setError('')} sx={{ position: 'fixed', top: 8, left: 8, right: 8, zIndex: 2000 }}>{error}</Alert>}
    {saving && <Typography sx={{ position: 'fixed', top: 8, right: 12, zIndex: 1500, fontSize: 12 }}>Сохранение…</Typography>}
    <AppShell yarns={yarns} setYarns={setYarns} projects={projects} setProjects={setProjects} />
  </>;
}

export default function App() {
  return import.meta.env.VITE_DATA === 'server' ? <ServerApp /> : <LocalApp />;
}
