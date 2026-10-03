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

interface Props { yarn: Yarn; available: number; onOpen: () => void }

// Карточка в списке: фото слева, справа всё главное. Нажатие открывает полную карточку (без редактирования).
export function YarnCard({ yarn, available, onOpen }: Props) {
  const tone = getStockTone(available);
  const composition = yarn.materials.filter(m => m.name).map(m => `${m.name} ${m.percentage}%`).join(' · ');
  const tools = [yarn.needleSize && `спицы ${yarn.needleSize}`, yarn.hookSize && `крючок ${yarn.hookSize}`].filter(Boolean).join(' · ');
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

          {(composition || tools) && (
            <Typography variant="caption" color="text.secondary"
              sx={{ mt: 'auto', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {[composition, tools].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
