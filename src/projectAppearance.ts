// Внешний вид изделия: иконка и цвет акцента.
// В @mui/icons-material нет силуэтов вязаных вещей (свитер, шапка, носки…), только вешалка,
// поэтому сами значки живут рядом, а здесь — идентификаторы, подписи и палитра.
// Старые изделия в localStorage этих полей не имеют: для них нейтральные значения.

export const PROJECT_ICON_IDS = [
  'garment', 'sweater', 'vest', 'hat', 'scarf', 'shawl', 'socks', 'mittens', 'blanket', 'toy',
] as const;
export type ProjectIcon = (typeof PROJECT_ICON_IDS)[number];

export const PROJECT_ACCENT_IDS = [
  'neutral', 'raspberry', 'coral', 'terracotta', 'honey', 'olive', 'teal', 'sky', 'ink', 'plum',
] as const;
export type ProjectAccent = (typeof PROJECT_ACCENT_IDS)[number];

export const DEFAULT_PROJECT_ICON: ProjectIcon = 'garment';
export const DEFAULT_PROJECT_ACCENT: ProjectAccent = 'neutral';

const iconSet = new Set<string>(PROJECT_ICON_IDS);
const accentSet = new Set<string>(PROJECT_ACCENT_IDS);

export const isProjectIcon = (v: unknown): v is ProjectIcon => typeof v === 'string' && iconSet.has(v);
export const isProjectAccent = (v: unknown): v is ProjectAccent => typeof v === 'string' && accentSet.has(v);

export const PROJECT_ICON_LABEL: Record<ProjectIcon, string> = {
  garment: 'Изделие',
  sweater: 'Свитер',
  vest: 'Жилет',
  hat: 'Шапка',
  scarf: 'Шарф',
  shawl: 'Шаль',
  socks: 'Носки',
  mittens: 'Варежки',
  blanket: 'Плед',
  toy: 'Игрушка',
};

export const PROJECT_ACCENT_LABEL: Record<ProjectAccent, string> = {
  neutral: 'Нейтральный',
  raspberry: 'Малина',
  coral: 'Коралл',
  terracotta: 'Терракота',
  honey: 'Мёд',
  olive: 'Олива',
  teal: 'Бирюза',
  sky: 'Небо',
  ink: 'Чернила',
  plum: 'Слива',
};

// Фон плашки и цвет значка. Светлая и тёмная тема отдельные: плитка списка и так розовая/тёмная,
// и акцент должен читаться на ней, а не сливаться.
export const PROJECT_ACCENT_COLORS: Record<ProjectAccent, { light: { bg: string; fg: string }; dark: { bg: string; fg: string } }> = {
  neutral: { light: { bg: '#D9C2BE', fg: '#4A302C' }, dark: { bg: '#5C4541', fg: '#F6E4E0' } },
  raspberry: { light: { bg: '#F0A8BC', fg: '#6D1230' }, dark: { bg: '#8A3050', fg: '#FFD5E0' } },
  coral: { light: { bg: '#F6B5A2', fg: '#6E2A18' }, dark: { bg: '#8A4634', fg: '#FFD8CC' } },
  terracotta: { light: { bg: '#E8B48A', fg: '#6A3412' }, dark: { bg: '#8A5428', fg: '#FFE0C2' } },
  honey: { light: { bg: '#F0D18A', fg: '#6A4A08' }, dark: { bg: '#7A5A16', fg: '#FFE8B8' } },
  olive: { light: { bg: '#C9D4A4', fg: '#3C4A16' }, dark: { bg: '#4A5624', fg: '#E4F0C4' } },
  teal: { light: { bg: '#A9D6CC', fg: '#0E4A42' }, dark: { bg: '#1E5C54', fg: '#C8F3EA' } },
  sky: { light: { bg: '#B7D4F2', fg: '#163A64' }, dark: { bg: '#1E4A72', fg: '#D4E8FF' } },
  ink: { light: { bg: '#C4C0E8', fg: '#2C2A62' }, dark: { bg: '#3A3878', fg: '#E0DEFF' } },
  plum: { light: { bg: '#E0B6D4', fg: '#5A2450' }, dark: { bg: '#6A3460', fg: '#FFD8F0' } },
};

export const accentColors = (accent: ProjectAccent, mode: 'light' | 'dark') => PROJECT_ACCENT_COLORS[accent][mode];
