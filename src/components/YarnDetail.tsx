import { forwardRef, type ReactElement, type Ref } from 'react';
import { Box, Chip, Dialog, Fab, IconButton, Slide, Typography } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { STATUS_LABEL, type Project, type Yarn } from '../shared';
import { DetailRow, Section } from './detail';
import { YarnThumb } from './YarnThumb';

const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SEGMENT_COLORS = ['var(--md-primary)', 'var(--md-tertiary)', 'var(--md-secondary)', 'var(--md-outline)'];

const Tile = ({ value, label, accent }: { value: number; label: string; accent?: boolean }) => (
  <Box sx={{ flex: 1, borderRadius: '16px', py: 1.5, px: 1, textAlign: 'center',
    bgcolor: accent ? 'var(--md-primary-container)' : 'var(--md-surface-container-high)',
    color: accent ? 'var(--md-on-primary-container)' : 'text.primary' }}>
    <Typography sx={{ fontSize: 28, lineHeight: '36px', fontWeight: 500 }}>{value}</Typography>
    <Typography variant="caption" sx={{ opacity: 0.8 }}>{label}</Typography>
  </Box>
);

interface Props {
  yarn: Yarn | undefined;
  available: number;
  usedIn: { project: Project; quantity: number }[];
  onClose: () => void;
  onEdit: (yarn: Yarn) => void;
  onDelete: (yarn: Yarn) => void;
}

// Полная карточка пряжи: только просмотр. Изменение и удаление — отдельными кнопками.
export function YarnDetail({ yarn, available, usedIn, onClose, onEdit, onDelete }: Props) {
  const mats = yarn?.materials.filter(m => m.name) ?? [];
  const matTotal = mats.reduce((s, m) => s + m.percentage, 0) || 1;
  const reserved = yarn ? Math.max(0, yarn.stock - available) : 0;

  return (
    <Dialog fullScreen open={!!yarn} onClose={onClose} slots={{ transition: SlideUp }}
      slotProps={{ paper: { sx: { bgcolor: 'background.default', borderRadius: 0 } } }}>
      {yarn && (
        <>
          {/* верхняя панель */}
          <Box sx={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 1, px: 1, minHeight: 64,
            pt: 'env(safe-area-inset-top, 0px)', bgcolor: 'background.default' }}>
            <IconButton onClick={onClose} aria-label="Назад"><ArrowBackIcon /></IconButton>
            <Typography variant="h6" noWrap sx={{ flex: 1 }}>{yarn.brand}</Typography>
            <IconButton onClick={() => onDelete(yarn)} aria-label="Удалить моток" color="error"><DeleteOutlinedIcon /></IconButton>
          </Box>

          <Box sx={{ maxWidth: 640, width: '100%', mx: 'auto', px: 2, pb: 'calc(104px + env(safe-area-inset-bottom, 0px))' }}>
            <YarnThumb yarn={yarn} size="100%" ratio="4 / 3" radius="28px" letterSize={96} />

            <Box sx={{ mt: 2.5, px: 0.5 }}>
              <Typography variant="h5" component="h2">{yarn.colorName}</Typography>
              {yarn.colorCode && <Typography variant="body1" color="text.secondary">Оттенок №{yarn.colorCode}</Typography>}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2.5 }}>
              <Tile value={yarn.stock} label="всего" />
              <Tile value={reserved} label="в проектах" />
              <Tile value={available} label="доступно" accent />
            </Box>

            <Section title="Характеристики">
              <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', px: 2 }}>
                <DetailRow label="Вес мотка" value={`${yarn.weight} г`} />
                <DetailRow label="Метраж мотка" value={`${yarn.length} м`} />
                <DetailRow label="Метров на складе" value={`${yarn.length * yarn.stock} м`} />
                {yarn.needleSize && <DetailRow label="Спицы" value={`${yarn.needleSize} мм`} />}
                {yarn.hookSize && <DetailRow label="Крючок" value={`${yarn.hookSize} мм`} />}
              </Box>
            </Section>

            {mats.length > 0 && (
              <Section title="Состав">
                <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', p: 2 }}>
                  <Box sx={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: '2px' }}>
                    {mats.map((m, i) => (
                      <Box key={i} sx={{ flex: m.percentage / matTotal, bgcolor: SEGMENT_COLORS[i % SEGMENT_COLORS.length], minWidth: m.percentage > 0 ? 4 : 0 }} />
                    ))}
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {mats.map((m, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                        <Typography variant="body1" sx={{ flex: 1 }}>{m.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{m.percentage}%</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Section>
            )}

            {yarn.gaugeSample && (
              <Section title="Образец">
                <Typography variant="body1" sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', p: 2, whiteSpace: 'pre-wrap', userSelect: 'text' }}>
                  {yarn.gaugeSample}
                </Typography>
              </Section>
            )}

            <Section title="Используется в изделиях">
              {usedIn.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>Пока не используется ни в одном изделии.</Typography>
              ) : (
                <Box sx={{ borderRadius: '20px', bgcolor: 'var(--md-surface-container)', px: 2 }}>
                  {usedIn.map(({ project, quantity }) => (
                    <Box key={project.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:not(:last-of-type)': { borderBottom: '1px solid var(--md-outline-variant)' } }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" noWrap>{project.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{quantity} мотк.</Typography>
                      </Box>
                      <Chip size="small" label={STATUS_LABEL[project.status]} />
                    </Box>
                  ))}
                </Box>
              )}
            </Section>
          </Box>

          <Fab variant="extended" onClick={() => onEdit(yarn)} aria-label="Изменить"
            sx={{ position: 'fixed', right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <EditIcon />Изменить
          </Fab>
        </>
      )}
    </Dialog>
  );
}
