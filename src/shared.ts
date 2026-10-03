// FAB над нижней навигацией (80dp) с учётом выреза/жеста iPhone
export const fabSx = { position: 'fixed' as const, right: 16, bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', zIndex: 1100 };

// Tonal button M3: вторичная кнопка на экране счётчика
export const tonalSx = {
  bgcolor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)',
  '&:hover': { bgcolor: 'var(--md-secondary-container)', filter: 'brightness(.96)' },
  '&.Mui-disabled': { opacity: 0.38 },
};

// --- ТИПЫ ДАННЫХ ---
// Вспомогательный тип для компонента состава
export interface MaterialComponent {
  name: string; // Например: "Шерсть", "Акрил"
  percentage: number; // 0-100
}

export interface Yarn {
  id: number;
  brand: string;
  colorName: string;
  colorCode: string;
  weight: number;
  length: number;
  stock: number;
  
  // ЗАМЕНЯЕМ composition НА materials
  materials: MaterialComponent[]; 
  
  needleSize: string;
  hookSize: string;
  gaugeSample: string;
  photoData?: string;
}
export interface ProjectMaterial { yarnId: number; quantity: number; }
export interface Project {
  id: number;
  title: string;
  status: 'planned' | 'in_progress' | 'finished';
  materials: ProjectMaterial[];
  createdAt: number;
  currentRows?: number;
  targetRows?: number;
}

// --- КОНСТАНТЫ ХРАНЕНИЯ ---
export const STORAGE_KEY_YARNS = 'yarn_tracker_inventory_v2';
export const STORAGE_KEY_PROJECTS = 'yarn_tracker_projects_v2';
export const STORAGE_KEY_STANDALONE_COUNTER = 'yarn_tracker_standalone_counter'; // Новый ключ
export const STORAGE_KEY_VOICE_SPEAK = 'yarn_tracker_voice_speak'; // Озвучивать итог после голосовой команды

// Начальные данные
export const INITIAL_YARNS: Yarn[] = [
  { 
    id: 1, brand: 'Alize', colorName: 'Red Fire', colorCode: '2497', 
    weight: 50, length: 175, stock: 4,
    materials: [{ name: 'Acrylic', percentage: 100 }],
    needleSize: '4.0', hookSize: '3.5', gaugeSample: '', photoData: ''
  },
  { 
    id: 2, brand: 'Nako', colorName: 'Baby Lux', colorCode: '8901', 
    weight: 50, length: 180, stock: 12,
    materials: [
      { name: 'Wool', percentage: 50 }, 
      { name: 'Acrylic', percentage: 50 }
    ],
    needleSize: '3.5', hookSize: '3.0', gaugeSample: '', photoData: ''
  },
];

export const INITIAL_PROJECTS: Project[] = [];

// --- ГЛОБАЛЬНАЯ ФУНКЦИЯ РАСЧЕТА ДОСТУПНОСТИ ---
export const getAvailableStock = (yarnId: number, yarns: Yarn[], projects: Project[]): number => {
  const yarn = yarns.find(y => y.id === yarnId);
  if (!yarn) return 0;

  let reservedTotal = 0;
  projects.forEach(proj => {
    if (proj.status === 'planned' || proj.status === 'in_progress') {
      proj.materials.forEach(mat => {
        if (mat.yarnId === yarnId) {
          reservedTotal += mat.quantity;
        }
      });
    }
  });

  return Math.max(0, yarn.stock - reservedTotal);
};

// --- СТИЛИ МОДАЛЬНЫХ ОКОН ---
export const modalStyle = {
  position: 'absolute' as const,
  top: { xs: 'auto', sm: '50%' }, bottom: { xs: 0, sm: 'auto' },
  left: { xs: 0, sm: '50%' }, transform: { xs: 'none', sm: 'translate(-50%, -50%)' },
  width: { xs: '100%', sm: 560 },
  maxHeight: '90dvh', overflowY: 'auto' as const,
  bgcolor: 'var(--md-surface-container-high)',
  borderRadius: { xs: '28px 28px 0 0', sm: '28px' },
  p: 3, pb: 'calc(24px + env(safe-area-inset-bottom, 0px))',
  outline: 'none',
};

// ==========================================
// ЭКРАН СКЛАДА (FIXED PERCENTS + UNIFIED DESIGN)

export const STATUS_LABEL = { planned: 'План', in_progress: 'В работе', finished: 'Готово' } as const;

// --- ОЧИСТКА ДАННЫХ ИЗ localStorage ---
// Данные из старых версий альфы могут не иметь новых полей (например, materials). Без этого страница склада падала при рендере.
const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);

export const sanitizeYarns = (raw: unknown): Yarn[] => {
  if (!Array.isArray(raw)) return INITIAL_YARNS;
  return raw.filter(y => y && typeof y === 'object').map((y: any, i): Yarn => ({
    id: num(y.id, Date.now() + i),
    brand: str(y.brand),
    colorName: str(y.colorName ?? y.color),
    colorCode: str(y.colorCode),
    weight: num(y.weight),
    length: num(y.length),
    stock: num(y.stock ?? y.quantity),
    materials: Array.isArray(y.materials)
      ? y.materials.filter((m: any) => m && typeof m === 'object').map((m: any) => ({ name: str(m.name), percentage: num(m.percentage) }))
      : [],
    needleSize: str(y.needleSize),
    hookSize: str(y.hookSize),
    gaugeSample: str(y.gaugeSample),
    photoData: typeof y.photoData === 'string' ? y.photoData : undefined,
  }));
};

export const sanitizeProjects = (raw: unknown): Project[] => {
  if (!Array.isArray(raw)) return INITIAL_PROJECTS;
  const statuses = ['planned', 'in_progress', 'finished'];
  return raw.filter(p => p && typeof p === 'object').map((p: any, i): Project => ({
    id: num(p.id, Date.now() + i),
    title: str(p.title),
    status: statuses.includes(p.status) ? p.status : 'planned',
    materials: Array.isArray(p.materials)
      ? p.materials.filter((m: any) => m && typeof m === 'object').map((m: any) => ({ yarnId: num(m.yarnId), quantity: num(m.quantity) }))
      : [],
    createdAt: num(p.createdAt, Date.now()),
    currentRows: p.currentRows == null ? undefined : num(p.currentRows),
    targetRows: p.targetRows == null ? undefined : num(p.targetRows),
  }));
};

// --- ВСПОМОГАТЕЛЬНОЕ ДЛЯ КАРТОЧЕК ---
export const plural = (n: number, forms: [string, string, string]) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return a > 10 && a < 20 ? forms[2] : b > 1 && b < 5 ? forms[1] : b === 1 ? forms[0] : forms[2];
};

// Сколько мотков зарезервировано в изделиях (запланированных и в работе)
export const getReservedStock = (yarnId: number, projects: Project[]): number =>
  projects
    .filter(p => p.status !== 'finished')
    .reduce((sum, p) => sum + p.materials.filter(m => m.yarnId === yarnId).reduce((s, m) => s + m.quantity, 0), 0);

// Изделия, где используется эта пряжа
export const getProjectsUsingYarn = (yarnId: number, projects: Project[]) =>
  projects
    .map(p => ({ project: p, quantity: p.materials.filter(m => m.yarnId === yarnId).reduce((s, m) => s + m.quantity, 0) }))
    .filter(x => x.quantity > 0);

export type StockTone = 'ok' | 'low' | 'empty';
export const getStockTone = (available: number): StockTone => (available <= 0 ? 'empty' : available <= 2 ? 'low' : 'ok');

export const STOCK_TONE_STYLE: Record<StockTone, { bgcolor: string; color: string }> = {
  ok: { bgcolor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' },
  low: { bgcolor: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' },
  empty: { bgcolor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' },
};
