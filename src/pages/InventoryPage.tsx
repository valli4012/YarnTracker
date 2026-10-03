import { useState } from 'react';
import { Box, Typography, Container, Chip, Stack, Button, Modal, TextField, IconButton, Fab, MenuItem, Select, InputLabel, FormControl, Card, CardContent, Divider, Badge } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { fabSx, getAvailableStock, modalStyle, type MaterialComponent, type Yarn, type Project } from '../shared';
import { useFeedback } from '../feedback';

export const InventoryPage = ({ yarns, setYarns, projects }: { yarns: Yarn[], setYarns: any, projects: Project[] }) => {
  const { confirm, toast } = useFeedback();
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);
  
  // МАТЕРИАЛЫ ТЕПЕРЬ ХРАНЯТ ПРОЦЕНТЫ КАК СТРОКИ ДЛЯ СВОБОДНОГО РЕДАКТИРОВАНИЯ
  interface TempMaterial {
    name: string;
    percentageStr: string; // Строка!
  }
  const [tempMaterials, setTempMaterials] = useState<TempMaterial[]>([{ name: '', percentageStr: '100' }]);

  // Состояния фильтров
  const [filterBrand, setFilterBrand] = useState('');
  const [filterColorCode, setFilterColorCode] = useState('');
  const [filterMaterialName, setFilterMaterialName] = useState('');
  const [filterNeedle, setFilterNeedle] = useState('');
  const [filterHook, setFilterHook] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- ЛОГИКА МАТЕРИАЛОВ (STRICT STRING HANDLING) ---
  const addMaterialRow = () => {
    setTempMaterials([...tempMaterials, { name: '', percentageStr: '' }]);
  };

  const removeMaterialRow = (index: number) => {
    if (tempMaterials.length === 1) return;
    setTempMaterials(tempMaterials.filter((_, i) => i !== index));
  };

  const updateMaterialRow = (index: number, field: 'name' | 'percentageStr', value: string) => {
    const newMats = [...tempMaterials];
    newMats[index][field] = value;
    setTempMaterials(newMats);
  };

  // Обработка фото
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast('Файл слишком большой — максимум 500 КБ'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoData(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setBrand(''); setColorName(''); setColorCode('');
    setWeightStr(''); setLengthStr(''); setStockStr('1');
    setNeedleSize(''); setHookSize(''); setGaugeSample('');
    setPhotoData(undefined); setPhotoPreview(null);
    setTempMaterials([{ name: '', percentageStr: '100' }]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenForm(true);
  };

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
    setPhotoPreview(yarn.photoData || null);
    
    // Конвертируем числа обратно в строки для формы
    const mats = yarn.materials.map(m => ({ name: m.name, percentageStr: String(m.percentage) }));
    setTempMaterials(mats.length > 0 ? mats : [{ name: '', percentageStr: '100' }]);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    resetForm();
  };

  const handleSubmitForm = async () => {
    if (!brand || !colorName) {
      toast('Заполните бренд и цвет');
      return;
    }
    
    const w = Number(weightStr);
    const l = Number(lengthStr);
    const s = Number(stockStr);

    if (isNaN(w) || isNaN(l) || isNaN(s)) {
       toast('Вес, метраж и количество — числа');
       return;
    }

    // Парсим материалы из строк в числа, очищая пустые
    const parsedMaterials: MaterialComponent[] = tempMaterials
      .filter(m => m.name.trim() !== '')
      .map(m => ({
        name: m.name.trim(),
        percentage: Math.min(Math.max(parseInt(m.percentageStr) || 0, 0), 100)
      }));

    const totalPercent = parsedMaterials.reduce((acc, m) => acc + m.percentage, 0);
    if (parsedMaterials.length > 0 && totalPercent !== 100) {
       if (!(await confirm({ title: 'Сумма состава не 100%', text: `Сейчас ${totalPercent}%. Сохранить как есть?`, ok: 'Сохранить' }))) return;
    }

    const newYarnData: Partial<Yarn> = {
      brand, colorName, colorCode,
      weight: w, length: l, stock: s,
      needleSize, hookSize, gaugeSample,
      materials: parsedMaterials,
      photoData: photoData
    };

    if (editingId !== null) {
      setYarns(yarns.map(y => y.id === editingId ? { ...y, ...newYarnData } : y));
    } else {
      const newItem: Yarn = {
        id: Date.now(),
        ...newYarnData as Omit<Yarn, 'id'>
      };
      setYarns([newItem, ...yarns]);
    }
    
    handleCloseForm();
  };

  const handleDelete = async (id: number) => {
    if (await confirm({ title: 'Удалить моток?', ok: 'Удалить', danger: true })) {
      setYarns(yarns.filter(y => y.id !== id));
      toast('Моток удалён');
    }
  };

  // --- ФИЛЬТРАЦИЯ ---
  const filteredYarns = yarns.filter(yarn => {
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      searchLower === '' || 
      yarn.brand.toLowerCase().includes(searchLower) || 
      yarn.colorName.toLowerCase().includes(searchLower);

    const matchesBrand = filterBrand === '' || yarn.brand === filterBrand;
    const matchesColorCode = filterColorCode === '' || yarn.colorCode.includes(filterColorCode);
    const matchesNeedle = filterNeedle === '' || yarn.needleSize.includes(filterNeedle);
    const matchesHook = filterHook === '' || yarn.hookSize.includes(filterHook);
    const matchesMaterial = filterMaterialName === '' || 
      yarn.materials.some(m => m.name.toLowerCase().includes(filterMaterialName.toLowerCase()));

    return matchesSearch && matchesBrand && matchesColorCode && matchesNeedle && matchesHook && matchesMaterial;
  });

  const uniqueBrands = Array.from(new Set(yarns.map(y => y.brand))).sort();
  const allMaterialNames = Array.from(new Set(yarns.flatMap(y => y.materials.map(m => m.name)).filter(Boolean))).sort();

  const activeFilters = [filterBrand, filterColorCode, filterMaterialName, filterNeedle, filterHook].filter(Boolean).length;

  return (
    <Container sx={{ mt: 2, pb: 10 }}> {/* pb: 10 чтобы контент не прятался под меню */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">Склад</Typography>
        <Fab color="primary" aria-label="Добавить моток" onClick={handleOpenCreate} sx={fabSx}>
            <AddIcon />
          </Fab>
      </Stack>
      
      <TextField 
        fullWidth 
        placeholder="Поиск..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />, endAdornment: (
          <IconButton aria-label="Фильтры" edge="end" onClick={() => setOpenFilters(true)}>
            <Badge color="primary" variant="dot" invisible={!activeFilters}><FilterListIcon /></Badge>
          </IconButton>) } }}
        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 7, bgcolor: 'var(--md-surface-container-high)', '& fieldset': { border: 'none' } } }}
      />

      {filteredYarns.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography variant="h6">Ничего не найдено</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
          {filteredYarns.map((yarn) => {
            const available = getAvailableStock(yarn.id, yarns, projects);
            const isLowStock = available <= 2;

            return (
              <Box key={yarn.id}>
                <Card>
                  
                  {/* Фото区 */}
                  <Box 
                    component={yarn.photoData ? 'img' : 'div'}
                    src={yarn.photoData}
                    alt={yarn.colorName}
                    sx={{ 
                      width: '100%', 
                      aspectRatio: '1 / 1', // Квадратное фото
                      objectFit: 'cover', 
                      bgcolor: 'var(--md-surface-container-high)',
                      borderBottom: '1px solid var(--md-outline-variant)'
                    }}
                  >
                    {!yarn.photoData && (
                       <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                         <Typography variant="body2">Нет фото</Typography>
                       </Box>
                    )}
                  </Box>

                  {/* Контент */}
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>{yarn.brand}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {yarn.colorName} {yarn.colorCode && `• #${yarn.colorCode}`}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${available}/${yarn.stock}`} 
                        size="small" 
                        color={isLowStock ? "warning" : "success"} 
                        variant="filled"
                        sx={{ fontWeight: 700, ml: 1 }}
                      />
                    </Stack>

                    <Divider sx={{ my: 1.5, borderColor: 'var(--md-outline-variant)' }} />

                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mb={1}>
                      {yarn.needleSize && <Chip icon={<span>🪡</span>} label={`Спицы: ${yarn.needleSize}`} size="small" variant="outlined" sx={{ borderColor: 'var(--md-outline-variant)' }} />}
                      {yarn.hookSize && <Chip icon={<span>🧶</span>} label={`Крючок: ${yarn.hookSize}`} size="small" variant="outlined" sx={{ borderColor: 'var(--md-outline-variant)' }} />}
                    </Stack>

                    {yarn.materials && yarn.materials.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Состав:</Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                          {yarn.materials.map((mat, idx) => (
                            <Chip key={idx} label={`${mat.name} ${mat.percentage}%`} size="small" sx={{ bgcolor: 'var(--md-surface-container-high)', fontSize: '0.7rem', height: 22 }} />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>

                  {/* Футер с действиями */}
                  <Box sx={{ borderTop: '1px solid var(--md-outline-variant)', px: 2, py: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                     <IconButton size="small" onClick={() => handleEdit(yarn)}>
                       <EditIcon fontSize="small" color="action"/>
                     </IconButton>
                     <IconButton size="small" onClick={() => handleDelete(yarn.id)}>
                       <DeleteIcon fontSize="small" color="error"/>
                     </IconButton>
                  </Box>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      <Modal open={openForm} onClose={handleCloseForm}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h5" fontWeight={700}>{editingId ? 'Редактировать' : 'Новый моток'}</Typography>
            <IconButton onClick={handleCloseForm}><CloseIcon /></IconButton>
          </Stack>

          <Box sx={{ mb: 3, textAlign: 'center' }}>
             <input accept="image/*" id="photo-upload" type="file" style={{ display: 'none' }} onChange={handlePhotoChange} />
             <label htmlFor="photo-upload">
               <Button variant="contained" component="span" startIcon={<AddIcon />} sx={{ mb: 1 }}>
                 {photoPreview ? 'Изменить фото' : 'Добавить фото'}
               </Button>
             </label>
             {photoPreview && (
               <Box component="img" src={photoPreview} sx={{ maxHeight: 150, mt: 1, borderRadius: 2, boxShadow: 2 }} />
             )}
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <Box><TextField fullWidth label="Бренд *" value={brand} onChange={(e) => setBrand(e.target.value)} /></Box>
            <Box><TextField fullWidth label="Цвет *" value={colorName} onChange={(e) => setColorName(e.target.value)} /></Box>
            <Box><TextField fullWidth label="№ Оттенка" value={colorCode} onChange={(e) => setColorCode(e.target.value)} /></Box>
            <Box><TextField fullWidth label="Вес (гр) *" type="number" value={weightStr} onChange={(e) => setWeightStr(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} /></Box>
            <Box><TextField fullWidth label="Метраж (м) *" type="number" value={lengthStr} onChange={(e) => setLengthStr(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} /></Box>
            <Box><TextField fullWidth label="Количество *" type="number" value={stockStr} onChange={(e) => setStockStr(e.target.value)} slotProps={{ htmlInput: { min: 0 } }} /></Box>
            <Box><TextField fullWidth label="Спицы (мм)" value={needleSize} onChange={(e) => setNeedleSize(e.target.value)} /></Box>
            <Box><TextField fullWidth label="Крючок (мм)" value={hookSize} onChange={(e) => setHookSize(e.target.value)} /></Box>
            <Box sx={{ gridColumn: '1 / -1' }}><TextField fullWidth label="Образец" value={gaugeSample} onChange={(e) => setGaugeSample(e.target.value)} multiline rows={2} /></Box>
          </Box>

          <Box mt={3} p={2} bgcolor="var(--md-surface-container-high)" borderRadius={2}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>Состав пряжи:</Typography>
            {tempMaterials.map((mat, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center" mb={1}>
                <TextField 
                  size="small" 
                  placeholder="Материал" 
                  value={mat.name} 
                  onChange={(e) => updateMaterialRow(index, 'name', e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <TextField 
                  size="small" 
                  type="number" 
                  placeholder="%" 
                  value={mat.percentageStr} 
                  onChange={(e) => updateMaterialRow(index, 'percentageStr', e.target.value)}
                  sx={{ width: 80 }}
                  slotProps={{ htmlInput: { min: 0, max: 100 } }}
                />
                <IconButton size="small" color="error" onClick={() => removeMaterialRow(index)} disabled={tempMaterials.length === 1}>
                  <DeleteIcon fontSize="small"/>
                </IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} size="small" onClick={addMaterialRow} sx={{ mt: 1 }}>
              Добавить компонент
            </Button>
          </Box>

          <Button fullWidth variant="contained" color="primary" sx={{ mt: 3, py: 1.5, fontSize: '1rem' }} onClick={handleSubmitForm}>
            Сохранить
          </Button>
        </Box>
      </Modal>

      {/* МОДАЛКА ФИЛЬТРОВ */}
      <Modal open={openFilters} onClose={() => setOpenFilters(false)}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Фильтры</Typography>
            <IconButton onClick={() => setOpenFilters(false)}><CloseIcon /></IconButton>
          </Stack>

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

          <TextField fullWidth margin="dense" label="Оттенок #" value={filterColorCode} onChange={(e) => setFilterColorCode(e.target.value)} />
          <TextField fullWidth margin="dense" label="Спицы мм" value={filterNeedle} onChange={(e) => setFilterNeedle(e.target.value)} />
          <TextField fullWidth margin="dense" label="Крючок мм" value={filterHook} onChange={(e) => setFilterHook(e.target.value)} />

          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="outlined" onClick={() => { setFilterBrand(''); setFilterColorCode(''); setFilterMaterialName(''); setFilterNeedle(''); setFilterHook(''); setSearchQuery(''); }}>Сброс</Button>
            <Button variant="contained" onClick={() => setOpenFilters(false)} sx={{ flexGrow: 1 }}>OK</Button>
          </Stack>
        </Box>
      </Modal>
    </Container>
  );
};
