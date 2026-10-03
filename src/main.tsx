import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import App from './App';
import './index.css';
import { buildTheme } from './theme';
import { FeedbackProvider } from './feedback';

// Вместо белого экрана показываем текст ошибки
class Boundary extends React.Component<{ children: React.ReactNode }, { err?: Error }> {
  state: { err?: Error } = {};
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    return this.state.err
      ? <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#B3261E' }}>{String(this.state.err.stack || this.state.err)}</pre>
      : this.props.children;
  }
}

function Root() {
  const dark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => buildTheme(dark ? 'dark' : 'light'), [dark]);

  // Цвет статус-бара подстраивается под тему
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.palette.background.default);
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FeedbackProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FeedbackProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Boundary><Root /></Boundary>
  </React.StrictMode>,
);
