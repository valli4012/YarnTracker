import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar } from '@mui/material';
import { aboveNav } from './shared';

interface ConfirmOpts { title: string; text?: string; ok?: string; danger?: boolean }
interface ToastAction { label: string; onClick: () => void }
interface Ctx { confirm: (o: ConfirmOpts) => Promise<boolean>; toast: (message: string, action?: ToastAction) => void }

const FeedbackCtx = createContext<Ctx>(null!);
export const useFeedback = () => useContext(FeedbackCtx);

// Диалоги и снэкбары M3 вместо alert/confirm
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [snack, setSnack] = useState<{ message: string; action?: ToastAction } | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>(resolve => setDlg({ ...o, resolve })), []);
  const toast = useCallback((message: string, action?: ToastAction) => setSnack({ message, action }), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  const runAction = () => { snack?.action?.onClick(); setSnack(null); };
  const above = aboveNav; // над navigation bar

  return (
    <FeedbackCtx.Provider value={{ confirm, toast }}>
      {children}
      <Dialog open={!!dlg} onClose={() => close(false)}>
        <DialogTitle>{dlg?.title}</DialogTitle>
        {dlg?.text && <DialogContent><DialogContentText sx={{ whiteSpace: 'pre-line' }}>{dlg.text}</DialogContentText></DialogContent>}
        <DialogActions>
          <Button onClick={() => close(false)}>Отмена</Button>
          <Button color={dlg?.danger ? 'error' : 'primary'} onClick={() => close(true)}>{dlg?.ok ?? 'OK'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)} message={snack?.message}
        action={snack?.action ? <Button color="inherit" size="small" onClick={runAction}>{snack.action.label}</Button> : undefined}
        sx={{ bottom: { xs: above, sm: above } }} />
    </FeedbackCtx.Provider>
  );
}
