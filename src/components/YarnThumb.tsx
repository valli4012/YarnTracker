import { Box, Typography, useTheme } from '@mui/material';
import type { Yarn } from '../shared';

// Стабильный оттенок из названия: у каждой пряжи без фото свой «цвет», по нему легко искать глазами
const hueOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

interface Props { yarn: Yarn; size?: number | string; radius?: number | string; ratio?: string; letterSize?: number }

export function YarnThumb({ yarn, size = 96, radius = '16px', ratio, letterSize }: Props) {
  const dark = useTheme().palette.mode === 'dark';
  const sx = {
    width: size, height: ratio ? 'auto' : size, aspectRatio: ratio, flexShrink: 0, borderRadius: radius, overflow: 'hidden',
    display: 'block',
  };

  if (yarn.photoData) {
    return <Box component="img" src={yarn.photoData} alt={yarn.colorName} loading="lazy" sx={{ ...sx, objectFit: 'cover' }} />;
  }

  const hue = hueOf(`${yarn.brand}${yarn.colorName}`);
  const letter = (yarn.brand || yarn.colorName || '?').trim().charAt(0).toUpperCase();
  return (
    <Box sx={{ ...sx, display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: dark ? `hsl(${hue} 28% 24%)` : `hsl(${hue} 62% 88%)`, color: dark ? `hsl(${hue} 60% 80%)` : `hsl(${hue} 45% 32%)` }}>
      <Typography component="span" sx={{ fontSize: letterSize ?? (typeof size === 'number' ? size * 0.42 : 56), fontWeight: 500, lineHeight: 1 }}>{letter}</Typography>
    </Box>
  );
}
