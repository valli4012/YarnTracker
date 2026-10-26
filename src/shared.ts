import {
  DEFAULT_PROJECT_ACCENT, DEFAULT_PROJECT_ICON, isProjectAccent, isProjectIcon,
  type ProjectAccent, type ProjectIcon,
} from './projectAppearance';

// Плавающий островок почти на всю ширину: поля 16px, радиус — половина высоты.
// Safe area прибавляется к нижнему отступу, островок не прилипает к индикатору Home.
export const NAV_BAR_HEIGHT = 88;
export const NAV_FLOAT_INSET = 16;
export const NAV_SIDE_INSET = 16;
export const NAV_PILL_RADIUS = NAV_BAR_HEIGHT / 2;
export const navDockBottom = `calc(${NAV_FLOAT_INSET}px + env(safe-area-inset-bottom, 0px))`;
export const navClearance = `calc(${NAV_BAR_HEIGHT + NAV_FLOAT_INSET * 2}px + env(safe-area-inset-bottom, 0px))`;
// FAB и снэкбар на 16px выше верхнего края островка.
export const aboveNav = navClearance;

export const fabSx = { position: 'fixed' as const, right: 16, bottom: aboveNav, zIndex: 1100 };

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

// Этап изделия: «рукава», «туловище», «манжеты». Название обязательно, целевые ряды — нет.
// Счётчик рядов у каждого этапа свой; done нужен только этапам без целевых рядов.
export interface ProjectStage {
  id: number;
  title: string;
  targetRows?: number;
  currentRows?: number;
  done: boolean;
}

// Отдельная запись-заметка к изделию. Ссылки живут прямо в тексте.
export interface ProjectNote {
  id: number;
  createdAt: number;
  title?: string;
  text: string;
  imageIds?: number[];
}

export interface Project {
  id: number;
  title: string;
  status: 'planned' | 'in_progress' | 'finished';
  materials: ProjectMaterial[];
  createdAt: number;
  currentRows?: number;
  targetRows?: number;
  stages: ProjectStage[];
  notes: ProjectNote[];
  icon: ProjectIcon;
  accent: ProjectAccent;
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

export const STATUS_STYLE: Record<Project['status'], { bgcolor: string; color: string }> = {
  planned: { bgcolor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' },
  in_progress: { bgcolor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' },
  finished: { bgcolor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' },
};

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

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';

// Этапы и заметки появились позже изделий: у записей из хранилища этих полей нет, и это нормально — получают пустой массив.
const sanitizeStages = (raw: unknown): ProjectStage[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((s, i): ProjectStage => ({
      id: num(s.id, Date.now() + i),
      title: str(s.title).trim(),
      targetRows: s.targetRows == null || s.targetRows === '' ? undefined : num(s.targetRows),
      currentRows: s.currentRows == null ? undefined : num(s.currentRows),
      done: s.done === true,
    }))
    .filter(s => s.title !== ''); // этап без названия показывать нечем
};

const sanitizeNotes = (raw: unknown): ProjectNote[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((n, i): ProjectNote => ({
      id: num(n.id, Date.now() + i),
      createdAt: num(n.createdAt, Date.now()),
      title: str(n.title).trim() === '' ? undefined : str(n.title).trim(),
      text: str(n.text),
      imageIds: Array.isArray(n.imageIds) ? n.imageIds.filter((id: unknown): id is number => Number.isSafeInteger(id) && (id as number) > 0) : [],
    }))
    .filter(n => n.text.trim() !== ''); // пустых заметок не бывает
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
    stages: sanitizeStages(p.stages),
    notes: sanitizeNotes(p.notes),
    // Поля появились позже изделий. Чужое или пустое значение не роняет запись — остаётся нейтральный вид.
    icon: isProjectIcon(p.icon) ? p.icon : DEFAULT_PROJECT_ICON,
    accent: isProjectAccent(p.accent) ? p.accent : DEFAULT_PROJECT_ACCENT,
  }));
};

// --- ВСПОМОГАТЕЛЬНОЕ ДЛЯ КАРТОЧЕК ---
export const plural = (n: number, forms: [string, string, string]) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return a > 10 && a < 20 ? forms[2] : b > 1 && b < 5 ? forms[1] : b === 1 ? forms[0] : forms[2];
};

export const rowsWord = (n: number) => plural(n, ['ряд', 'ряда', 'рядов']); // 1 ряд, 2 ряда, 5 рядов
// После «из» существительное идёт в родительном падеже: «из 1 ряда», но «из 2 рядов»
export const rowsOfWord = (n: number) => plural(n, ['ряда', 'рядов', 'рядов']);
export const stagesOfWord = (n: number) => plural(n, ['этапа', 'этапов', 'этапов']);

// Этап с целевыми рядами готов, когда ряды связаны; без цели — только по ручной отметке,
// чтобы у готовности не было двух источников правды.
export const isStageDone = (s: ProjectStage) => (s.targetRows ? (s.currentRows ?? 0) >= s.targetRows : s.done);

// Если у изделия есть этапы, вяжут всегда этап, поэтому ряды этапов идут в общий счёт.
// Свой счётчик изделия при этом не теряется: ряды, связанные до появления этапов, остаются.
export const getProjectRows = (p: Project) =>
  (p.currentRows ?? 0) + p.stages.reduce((sum, s) => sum + (s.currentRows ?? 0), 0);

export interface ProjectProgress { kind: 'finished' | 'rows' | 'stages' | 'none'; value: number; label: string }

// Прогресс изделия одним местом: плитка в списке и карточка показывают одно и то же.
// Приоритет: целевые ряды → готовые этапы → считать нечем.
export const getProjectProgress = (p: Project): ProjectProgress => {
  if (p.status === 'finished') return { kind: 'finished', value: 100, label: 'Готово' };

  if (p.targetRows) {
    const rows = getProjectRows(p);
    return {
      kind: 'rows',
      value: Math.min(100, Math.round((rows / p.targetRows) * 100)),
      label: `${rows} из ${p.targetRows} ${rowsOfWord(p.targetRows)}`,
    };
  }

  if (p.stages.length > 0) {
    const done = p.stages.filter(isStageDone).length;
    return {
      kind: 'stages',
      value: Math.round((done / p.stages.length) * 100),
      label: `${done} из ${p.stages.length} ${stagesOfWord(p.stages.length)} готово`,
    };
  }

  return { kind: 'none', value: 0, label: 'Прогресс не рассчитывается' };
};

export const PROGRESS_HELP = 'Прогресс считается, только если у изделия указано целевое количество рядов или добавлены этапы. Укажите цель по рядам — полоска пойдёт по связанным рядам. Добавьте этапы — по количеству готовых этапов.';

// Завершение изделия: пряжа списывается со склада. Нужно и на счётчике, и в карточке.
export const finishProjectState = (project: Project, projects: Project[], yarns: Yarn[]) => {
  const used = new Map(project.materials.map(m => [m.yarnId, m.quantity]));
  return {
    projects: projects.map(p => (p.id === project.id ? { ...p, status: 'finished' as const } : p)),
    yarns: yarns.map(y => (used.has(y.id) ? { ...y, stock: Math.max(0, y.stock - used.get(y.id)!) } : y)),
  };
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
