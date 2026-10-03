import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from '@mui/material';

interface ConfirmOpts { title: string; text?: string; ok?: string; danger?: boolean }
interface Ctx { confirm: (o: ConfirmOpts) => Promise<boolean>; toast: (message: string) => void }

const FeedbackCtx = createContext<Ctx>(null!);
export const useFeedback = () => useContext(FeedbackCtx);

// Диалоги и снэкбары M3 вместо alert/confirm
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [msg, setMsg] = useState('');
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>(resolve => setDlg({ ...o, resolve })), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  const above = 'calc(96px + env(safe-area-inset-bottom, 0px))'; // над навигацией

  return (
    <FeedbackCtx.Provider value={{ confirm, toast: setMsg }}>
      {children}
      <Dialog open={!!dlg} onClose={() => close(false)}>
        <DialogTitle>{dlg?.title}</DialogTitle>
        {dlg?.text && <DialogContent><DialogContentText sx={{ whiteSpace: 'pre-line' }}>{dlg.text}</DialogContentText></DialogContent>}
        <DialogActions>
          <Button onClick={() => close(false)}>Отмена</Button>
          <Button color={dlg?.danger ? 'error' : 'primary'} onClick={() => close(true)}>{dlg?.ok ?? 'OK'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!msg} autoHideDuration={3500} onClose={() => setMsg('')} message={msg}
        sx={{ bottom: { xs: above, sm: above } }} />
    </FeedbackCtx.Provider>
  );
}
