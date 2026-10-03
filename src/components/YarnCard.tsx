import { Box, Card, CardActionArea, Typography } from '@mui/material';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import { getStockTone, STOCK_TONE_STYLE, type Yarn } from '../shared';
import { YarnThumb } from './YarnThumb';

const Spec = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, '& svg': { fontSize: 18, color: 'text.secondary' } }}>
    {icon}<Typography variant="body2" component="span">{children}</Typography>
  </Box>
);

// Размер в карточке уже подписан «мм» в форме. Если человек вписал единицы сам — не дублируем.
const toolText = (kind: string, value: string) => {
  const v = value.trim();
  return /мм|mm/i.test(v) ? `${kind} ${v}` : `${kind} ${v} мм`;
};

const ToolChip = ({ children }: { children: React.ReactNode }) => (
  <Box component="span" sx={{
    display: 'inline-block', maxWidth: '100%', px: 0.75, py: 0.125, borderRadius: '6px',
    border: '1px solid var(--md-outline-variant)', typography: 'caption', color: 'text.secondary',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  }}>{children}</Box>
);

interface Props { yarn: Yarn; available: number; onOpen: () => void }

// Карточка в списке: фото слева, справа всё главное. Нажатие открывает полную карточку (без редактирования).
export function YarnCard({ yarn, available, onOpen }: Props) {
  const tone = getStockTone(available);
  const composition = yarn.materials.filter(m => m.name).map(m => `${m.name} ${m.percentage}%`).join(' · ');
  const tools = [
    yarn.needleSize.trim() && toolText('спицы', yarn.needleSize),
    yarn.hookSize.trim() && toolText('крючок', yarn.hookSize),
  ].filter(Boolean);
  const stockText = tone === 'empty' && yarn.stock > 0 ? 'Всё в проектах' : tone === 'empty' ? 'Закончилась' : `Доступно ${available} из ${yarn.stock} шт.`;

  return (
    <Card>
      <CardActionArea onClick={onOpen} sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', gap: 2, p: 1.5 }}>
        <YarnThumb yarn={yarn} size={104} radius="14px" />

        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="overline" color="text.secondary" noWrap sx={{ lineHeight: '14px' }}>{yarn.brand}</Typography>
          <Typography variant="subtitle1" noWrap sx={{ lineHeight: '22px' }}>
            {yarn.colorName}
            {yarn.colorCode && <Typography component="span" variant="subtitle1" color="text.secondary"> · №{yarn.colorCode}</Typography>}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.25 }}>
            <Spec icon={<ScaleOutlinedIcon />}>{yarn.weight} г</Spec>
            <Spec icon={<StraightenOutlinedIcon />}>{yarn.length} м</Spec>
          </Box>

          <Box sx={{ mt: 0.5 }}>
            <Box component="span" sx={{ display: 'inline-block', px: 1.25, py: 0.25, borderRadius: 2, typography: 'caption', fontWeight: 500, ...STOCK_TONE_STYLE[tone] }}>
              {stockText}
            </Box>
          </Box>

          {/* Размер спиц и крючка не мешаем в строку состава: там он терялся. Отдельные плашки, только если размер указан. */}
          {tools.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tools.map(label => <ToolChip key={label}>{label}</ToolChip>)}
            </Box>
          )}

          {composition && (
            <Typography variant="caption" color="text.secondary"
              sx={{ mt: 'auto', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {composition}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
