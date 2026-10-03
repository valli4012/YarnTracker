import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, Chip, Container, Fab, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  fabSx, getAvailableStock, getProjectsUsingYarn, modalStyle, plural,
  type MaterialComponent, type Project, type Yarn,
} from '../shared';
import { useFeedback } from '../feedback';
import { compressImage } from '../image';
import { EmptyState } from '../components/EmptyState';
import { NumberField } from '../components/NumberField';
import { PageHeader } from '../components/PageHeader';
import { YarnCard } from '../components/YarnCard';
import { YarnDetail } from '../components/YarnDetail';

interface TempMaterial { name: string; percentageStr: string }

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.75 }}>{title}</Typography>
    {children}
  </Box>
);

export const InventoryPage = ({ yarns, setYarns, projects }: { yarns: Yarn[]; setYarns: any; projects: Project[] }) => {
  const { confirm, toast } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();

  // Открытая карточка хранится в истории браузера: системная кнопка «Назад» на телефоне закрывает её
  const detailId = (location.state as { yarnId?: number } | null)?.yarnId;
  const detailYarn = detailId != null ? yarns.find(y => y.id === detailId) : undefined;
  const openDetail = (id: number) => navigate(location.pathname, { state: { yarnId: id } });
  const closeDetail = () => navigate(-1);

  const [openForm, setOpenForm] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);

  // Состояния формы
  const [editingId, setEditingId] = useState<number | null>(null);
  const [brand, setBrand] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [weightStr, setWeightStr] = useState('');
  const [lengthStr, setLengthStr] = useState('');
  const [stockStr, setStockStr] = useState('1');
  const [needleSize, setNeedleSize] = useState('');
  const [hookSize, setHookSize] = useState('');
  const [gaugeSample, setGaugeSample] = useState('');
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);
  const [tempMaterials, setTempMaterials] = useState<TempMaterial[]>([{ name: '', percentageStr: '100' }]);

  // Фильтры
  const [filterBrand, setFilterBrand] = useState('');
  const [filterColorCode, setFilterColorCode] = useState('');
  const [filterMaterialName, setFilterMaterialName] = useState('');
  const [filterNeedle, setFilterNeedle] = useState('');
  const [filterHook, setFilterHook] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Состав ---
  const addMaterialRow = () => setTempMaterials([...tempMaterials, { name: '', percentageStr: '' }]);
  const removeMaterialRow = (index: number) => {
    if (tempMaterials.length === 1) return;
    setTempMaterials(tempMaterials.filter((_, i) => i !== index));
  };
  const updateMaterialRow = (index: number, field: keyof TempMaterial, value: string) =>
    setTempMaterials(tempMaterials.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  // --- Фото: уменьшаем до 900px, чтобы не упереться в лимит хранилища ---
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoData(await compressImage(file));
    } catch {
      toast('Не удалось загрузить фото');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setBrand(''); setColorName(''); setColorCode('');
    setWeightStr(''); setLengthStr(''); setStockStr('1');
    setNeedleSize(''); setHookSize(''); setGaugeSample('');
    setPhotoData(undefined);
    setTempMaterials([{ name: '', percentageStr: '100' }]);
  };

  const handleOpenCreate = () => { resetForm(); setOpenForm(true); };

  const handleEdit = (yarn: Yarn) => {
    setEditingId(yarn.id);
    setBrand(yarn.brand);
    setColorName(yarn.colorName);
    setColorCode(yarn.colorCode);
    setWeightStr(String(yarn.weight));
    setLengthStr(String(yarn.length));
    setStockStr(String(yarn.stock));
    setNeedleSize(yarn.needleSize);
    setHookSize(yarn.hookSize);
    setGaugeSample(yarn.gaugeSample);
    setPhotoData(yarn.photoData);
    const mats = yarn.materials.map(m => ({ name: m.name, percentageStr: String(m.percentage) }));
    setTempMaterials(mats.length > 0 ? mats : [{ name: '', percentageStr: '100' }]);
    setOpenForm(true);
  };

  const handleCloseForm = () => { setOpenForm(false); resetForm(); };

  const handleSubmitForm = async () => {
    if (!brand.trim() || !colorName.trim()) { toast('Заполните бренд и цвет'); return; }

    const w = Number(weightStr);
    const l = Number(lengthStr);
    const s = Number(stockStr);
    if (weightStr === '' || lengthStr === '' || stockStr === '' || [w, l, s].some(isNaN)) {
      toast('Укажите вес, метраж и количество'); return;
    }
    if (w <= 0 || l <= 0 || s < 0) { toast('Вес и метраж должны быть больше нуля'); return; }

    const parsedMaterials: MaterialComponent[] = tempMaterials
      .filter(m => m.name.trim() !== '')
      .map(m => ({ name: m.name.trim(), percentage: Math.min(Math.max(parseInt(m.percentageStr) || 0, 0), 100) }));

    const totalPercent = parsedMaterials.reduce((acc, m) => acc + m.percentage, 0);
    if (parsedMaterials.length > 0 && totalPercent !== 100) {
      if (!(await confirm({ title: 'Сумма состава не 100%', text: `Сейчас ${totalPercent}%. Сохранить как есть?`, ok: 'Сохранить' }))) return;
    }

    const data = {
      brand: brand.trim(), colorName: colorName.trim(), colorCode: colorCode.trim(),
      weight: w, length: l, stock: Math.floor(s),
      needleSize: needleSize.trim(), hookSize: hookSize.trim(), gaugeSample,
      materials: parsedMaterials, photoData,
    };

    if (editingId !== null) {
      setYarns(yarns.map(y => (y.id === editingId ? { ...y, ...data } : y)));
      toast('Изменения сохранены');
    } else {
      setYarns([{ id: Date.now(), ...data }, ...yarns]);
      toast('Моток добавлен');
    }
    handleCloseForm();
  };

  const handleDelete = async (yarn: Yarn) => {
    const used = getProjectsUsingYarn(yarn.id, projects).filter(x => x.project.status !== 'finished');
    const text = used.length ? `Эта пряжа указана в изделиях: ${used.map(x => x.project.title).join(', ')}.` : undefined;
    if (!(await confirm({ title: 'Удалить моток?', text, ok: 'Удалить', danger: true }))) return;
    if (detailId === yarn.id) closeDetail();
    setYarns(yarns.filter(y => y.id !== yarn.id));
    toast('Моток удалён');
  };

  // --- Фильтрация ---
  const q = searchQuery.toLowerCase().trim();
  const filteredYarns = yarns.filter(yarn =>
    (q === '' || yarn.brand.toLowerCase().includes(q) || yarn.colorName.toLowerCase().includes(q) || yarn.colorCode.toLowerCase().includes(q)) &&
    (filterBrand === '' || yarn.brand === filterBrand) &&
    (filterColorCode === '' || yarn.colorCode.includes(filterColorCode)) &&
    (filterNeedle === '' || yarn.needleSize.includes(filterNeedle)) &&
    (filterHook === '' || yarn.hookSize.includes(filterHook)) &&
    (filterMaterialName === '' || yarn.materials.some(m => m.name.toLowerCase().includes(filterMaterialName.toLowerCase()))),
  );

  const uniqueBrands = Array.from(new Set(yarns.map(y => y.brand))).sort();
  const allMaterialNames = Array.from(new Set(yarns.flatMap(y => y.materials.map(m => m.name)).filter(Boolean))).sort();

  const activeFilters = [
    filterBrand && { label: filterBrand, clear: () => setFilterBrand('') },
    filterMaterialName && { label: filterMaterialName, clear: () => setFilterMaterialName('') },
    filterColorCode && { label: `№${filterColorCode}`, clear: () => setFilterColorCode('') },
    filterNeedle && { label: `спицы ${filterNeedle}`, clear: () => setFilterNeedle('') },
    filterHook && { label: `крючок ${filterHook}`, clear: () => setFilterHook('') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const resetFilters = () => {
    setFilterBrand(''); setFilterColorCode(''); setFilterMaterialName(''); setFilterNeedle(''); setFilterHook(''); setSearchQuery('');
  };

  const totalSkeins = yarns.reduce((s, y) => s + y.stock, 0);
  const subtitle = yarns.length === 0
    ? 'Пока ничего нет'
    : `${yarns.length} ${plural(yarns.length, ['позиция', 'позиции', 'позиций'])} · ${totalSkeins} ${plural(totalSkeins, ['моток', 'мотка', 'мотков'])}`;

  return (
    <Container sx={{ pb: 12 }}>
      <PageHeader title="Склад" subtitle={subtitle} />

      {yarns.length > 0 && (
        <>
          <TextField
            fullWidth
            placeholder="Поиск по бренду, цвету, номеру"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{ input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton aria-label="Фильтры" edge="end" onClick={() => setOpenFilters(true)}>
                  <Badge color="primary" variant="dot" invisible={activeFilters.length === 0}><FilterListIcon /></Badge>
                </IconButton>
              ),
            } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 7, bgcolor: 'var(--md-surface-container-high)', '& fieldset': { border: 'none' } } }}
          />

          {activeFilters.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {activeFilters.map(f => (
                <Chip key={f.label} label={f.label} onDelete={f.clear} sx={{ bgcolor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }} />
              ))}
            </Box>
          )}
        </>
      )}

      <Box sx={{ mt: 2 }}>
        {yarns.length === 0 ? (
          <EmptyState icon={<Inventory2OutlinedIcon />} title="Склад пока пуст"
            text="Добавьте первый моток, и он появится здесь вместе с фото, составом и остатком."
            action={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Добавить моток</Button>} />
        ) : filteredYarns.length === 0 ? (
          <EmptyState icon={<SearchOffIcon />} title="Ничего не найдено" text="Попробуйте изменить запрос или сбросить фильтры."
            action={<Button variant="outlined" onClick={resetFilters}>Сбросить</Button>} />
        ) : (
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {filteredYarns.map(yarn => (
              <YarnCard key={yarn.id} yarn={yarn} available={getAvailableStock(yarn.id, yarns, projects)} onOpen={() => openDetail(yarn.id)} />
            ))}
          </Box>
        )}
      </Box>

      {yarns.length > 0 && (
        <Fab color="primary" aria-label="Добавить моток" onClick={handleOpenCreate} sx={fabSx}><AddIcon /></Fab>
      )}

      {/* ПОЛНАЯ КАРТОЧКА (ПРОСМОТР) */}
      <YarnDetail
        yarn={detailYarn}
        available={detailYarn ? getAvailableStock(detailYarn.id, yarns, projects) : 0}
        usedIn={detailYarn ? getProjectsUsingYarn(detailYarn.id, projects) : []}
        onClose={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* ФОРМА: ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ */}
      <Modal open={openForm} onClose={handleCloseForm}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{editingId !== null ? 'Редактировать моток' : 'Новый моток'}</Typography>
            <IconButton onClick={handleCloseForm} aria-label="Закрыть"><CloseIcon /></IconButton>
          </Box>

          <input accept="image/*" id="photo-upload" type="file" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <label htmlFor="photo-upload" style={{ display: 'block' }}>
            <Box sx={{ height: photoData ? 180 : 112, borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.5,
              bgcolor: 'var(--md-surface-container)', color: 'text.secondary',
              border: photoData ? 'none' : '2px dashed var(--md-outline-variant)' }}>
              {photoData
                ? <Box component="img" src={photoData} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <><AddPhotoAlternateOutlinedIcon /><Typography variant="body2">Добавить фото</Typography></>}
            </Box>
          </label>
          {photoData && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
              <Button size="small" component="label" htmlFor="photo-upload">Заменить</Button>
              <Button size="small" color="error" onClick={() => setPhotoData(undefined)}>Убрать</Button>
            </Box>
          )}

          <FormSection title="Основное">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <TextField fullWidth label="Бренд *" value={brand} onChange={(e) => setBrand(e.target.value)} />
              <TextField fullWidth label="Цвет *" value={colorName} onChange={(e) => setColorName(e.target.value)} />
              <TextField fullWidth label="№ оттенка" value={colorCode} onChange={(e) => setColorCode(e.target.value)} sx={{ gridColumn: '1 / -1' }} />
            </Box>
          </FormSection>

          <FormSection title="Моток">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr 1fr' }}>
              <NumberField fullWidth label="Вес, г *" placeholder="50" decimal value={weightStr} onChange={setWeightStr} />
              <NumberField fullWidth label="Метраж, м *" placeholder="175" decimal value={lengthStr} onChange={setLengthStr} />
              <NumberField fullWidth label="Шт. *" placeholder="1" value={stockStr} onChange={setStockStr} />
            </Box>
          </FormSection>

          <FormSection title="Рекомендации производителя">
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <TextField fullWidth label="Спицы, мм" value={needleSize} onChange={(e) => setNeedleSize(e.target.value)} />
              <TextField fullWidth label="Крючок, мм" value={hookSize} onChange={(e) => setHookSize(e.target.value)} />
              <TextField fullWidth label="Образец" value={gaugeSample} onChange={(e) => setGaugeSample(e.target.value)} multiline minRows={2} sx={{ gridColumn: '1 / -1' }} />
            </Box>
          </FormSection>

          <FormSection title="Состав">
            <Box sx={{ borderRadius: '20px', p: 2, bgcolor: 'var(--md-surface-container)' }}>
              {tempMaterials.map((mat, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <TextField size="small" placeholder="Материал" value={mat.name} onChange={(e) => updateMaterialRow(index, 'name', e.target.value)} sx={{ flex: 1 }} />
                  <NumberField size="small" placeholder="%" value={mat.percentageStr} onChange={(v) => updateMaterialRow(index, 'percentageStr', v)}
                    sx={{ width: 84 }} />
                  <IconButton size="small" color="error" aria-label="Убрать компонент" onClick={() => removeMaterialRow(index)} disabled={tempMaterials.length === 1}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} size="small" onClick={addMaterialRow}>Добавить компонент</Button>
            </Box>
          </FormSection>

          <Button fullWidth variant="contained" size="large" sx={{ mt: 3, height: 52 }} onClick={handleSubmitForm}>Сохранить</Button>
        </Box>
      </Modal>

      {/* ФИЛЬТРЫ */}
      <Modal open={openFilters} onClose={() => setOpenFilters(false)}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Фильтры</Typography>
            <IconButton onClick={() => setOpenFilters(false)} aria-label="Закрыть"><CloseIcon /></IconButton>
          </Box>

          <FormControl fullWidth margin="dense">
            <InputLabel>Бренд</InputLabel>
            <Select value={filterBrand} label="Бренд" onChange={(e) => setFilterBrand(e.target.value)}>
              <MenuItem value="">Все</MenuItem>
              {uniqueBrands.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Состав</InputLabel>
            <Select value={filterMaterialName} label="Состав" onChange={(e) => setFilterMaterialName(e.target.value)}>
              <MenuItem value="">Любой</MenuItem>
              {allMaterialNames.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField fullWidth margin="dense" label="№ оттенка" value={filterColorCode} onChange={(e) => setFilterColorCode(e.target.value)} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField fullWidth margin="dense" label="Спицы, мм" value={filterNeedle} onChange={(e) => setFilterNeedle(e.target.value)} />
            <TextField fullWidth margin="dense" label="Крючок, мм" value={filterHook} onChange={(e) => setFilterHook(e.target.value)} />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="outlined" onClick={resetFilters}>Сбросить</Button>
            <Button variant="contained" onClick={() => setOpenFilters(false)} sx={{ flex: 1 }}>
              Показать{filteredYarns.length !== yarns.length ? ` (${filteredYarns.length})` : ''}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};
