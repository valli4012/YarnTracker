import { TextField, type TextFieldProps } from '@mui/material';

type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type' | 'slotProps'> & {
  value: string;
  onChange: (value: string) => void;
  decimal?: boolean;
};

// Оставляем только цифры (и один разделитель для дробных), запятую приводим к точке
const sanitize = (raw: string, decimal: boolean) => {
  const digits = raw.replace(decimal ? /[^\d.,]/g : /\D/g, '').replace(/,/g, '.');
  const [whole, ...fraction] = digits.split('.');
  const joined = fraction.length > 0 ? `${whole || '0'}.${fraction.join('')}` : whole;
  return joined.replace(/^0+(?=\d)/, '');
};

// Числовое поле с текстовым значением: его можно стереть полностью.
// С type="number" пустой ввод превращался в «0», который было не убрать.
export const NumberField = ({ value, onChange, decimal = false, ...rest }: NumberFieldProps) => (
  <TextField
    {...rest}
    value={value}
    onChange={(e) => onChange(sanitize(e.target.value, decimal))}
    slotProps={{ htmlInput: { inputMode: decimal ? 'decimal' : 'numeric', autoComplete: 'off', enterKeyHint: 'done' } }}
  />
);
