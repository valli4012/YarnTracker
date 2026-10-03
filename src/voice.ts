import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// --- РАЗБОР РУССКИХ ЧИСЛИТЕЛЬНЫХ ---
// Распознаватель отдаёт числа то цифрами («плюс 5»), то словами («плюс пять») — поддерживаем оба варианта.
const WORD_NUMBERS: Record<string, number> = {
  ноль: 0, нуль: 0,
  один: 1, одна: 1, одно: 1, одну: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5,
  шесть: 6, семь: 7, восемь: 8, девять: 9,
  десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14,
  пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19,
  двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50,
  шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
  шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
};

// \b в JS не работает с кириллицей, поэтому сравниваем отдельные слова, а не ищем по всей фразе.
// Знаки «+5» / «−5» распознаватель иногда ставит вместо слов — разворачиваем их обратно в слова.
const words = (text: string) =>
  text.toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\+/g, ' плюс ')
    .replace(/[-−–]\s*(\d)/g, ' минус $1')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim().split(' ').filter(Boolean);

// «сто двадцать три» → 123, «25» → 25, нет числа → null
const parseNumber = (tokens: string[]): number | null => {
  let total: number | null = null;
  for (const token of tokens) {
    const value = /^\d{1,4}$/.test(token) ? Number(token) : WORD_NUMBERS[token];
    if (value === undefined) continue;
    total = (total ?? 0) + value;
  }
  return total;
};

// «ноль» намеренно не считается сбросом: иначе озвученный итог «0» вернулся бы в микрофон как команда
const isReset = (w: string) => w.startsWith('сброс') || w.startsWith('обнул');
const isPlus = (w: string) =>
  w === 'плюс' || w.startsWith('прибав') || w.startsWith('добав') || w.startsWith('провяз') ||
  w === 'дальше' || w === 'далее' || w === 'следующий' || w === 'еще' || w === 'вперед';
const isMinus = (w: string) =>
  w === 'минус' || w.startsWith('убав') || w.startsWith('отним') || w.startsWith('отмен') || w.startsWith('удал') ||
  w === 'вычти' || w === 'назад' || w === 'ошибка' || w === 'лишний';
const isRow = (w: string) =>
  w === 'ряд' || w === 'ряды' || w === 'рядов' || w === 'ряду' ||
  w.startsWith('установ') || w.startsWith('постав') || w === 'задай' || w === 'значение' || w === 'сделай';

export type VoiceCommand =
  | { kind: 'add'; value: number }  // относительное изменение, value может быть отрицательным
  | { kind: 'set'; value: number }  // абсолютное значение
  | { kind: 'reset' };

// Подсказка пользователю и одновременно живая документация по командам
export const VOICE_COMMANDS_HINT = [
  '«Ряд», «плюс один» — прибавить ряд',
  '«Плюс пять», «плюс 5» — прибавить пять',
  '«Минус один», «минус два» — убавить',
  '«Ряд двадцать» — поставить 20',
  '«Сброс» — обнулить',
];

export function parseVoiceCommand(text: string): VoiceCommand | null {
  const tokens = words(text);
  if (!tokens.length) return null;
  if (tokens.some(isReset)) return { kind: 'reset' };

  const number = parseNumber(tokens);
  const minus = tokens.some(isMinus);
  const plus = tokens.some(isPlus);

  if (number !== null) {
    if (minus) return { kind: 'add', value: -number };
    if (plus) return { kind: 'add', value: number };
    if (tokens.some(isRow)) return { kind: 'set', value: number };
    return null; // голое число не трогаем: слишком легко поймать случайную фразу или собственное озвучивание
  }
  if (minus) return { kind: 'add', value: -1 };
  if (plus || tokens.some(isRow)) return { kind: 'add', value: 1 };
  return null;
}

// --- ОЗВУЧИВАНИЕ ИТОГА ---
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Произносим только само число: его разбор команд игнорирует, поэтому эхо из динамика не крутит счётчик.
export function speakRows(count: number) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel(); // быстрые команды не должны копиться в очереди
  const utterance = new SpeechSynthesisUtterance(String(count));
  utterance.lang = 'ru-RU';
  utterance.rate = 1.1;
  synth.speak(utterance);
}

// --- РАСПОЗНАВАНИЕ РЕЧИ ---
// lib.dom знает события и результаты распознавания, но не сам SpeechRecognition — описываем минимум, который используем.
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getRecognitionCtor = (): SpeechRecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export type VoiceStatus = 'unsupported' | 'idle' | 'listening' | 'denied' | 'error';

const ERROR_MESSAGE: Record<string, string> = {
  'audio-capture': 'Микрофон не найден',
  network: 'Сервису распознавания нужен интернет',
  'language-not-supported': 'Браузер не распознаёт русскую речь',
};

interface VoiceOptions { onCommand: (command: VoiceCommand, transcript: string) => void }

export function useVoiceCommands({ onCommand }: VoiceOptions) {
  // SpeechRecognition есть только в Chromium и Safari, да и там работает лишь в защищённом контексте (https/localhost)
  const unavailable = useMemo(() => {
    if (!window.isSecureContext) return 'Голосовой ввод работает только по https';
    if (!getRecognitionCtor()) return 'Браузер не поддерживает голосовой ввод — считайте кнопками';
    return null;
  }, []);

  const [status, setStatus] = useState<VoiceStatus>(unavailable ? 'unsupported' : 'idle');
  const [message, setMessage] = useState(unavailable ?? '');
  const [heard, setHeard] = useState('');

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const wanted = useRef(false);
  const handler = useRef(onCommand);
  useEffect(() => { handler.current = onCommand; }, [onCommand]);

  const start = useCallback(function start() {
    const Recognition = getRecognitionCtor();
    if (!Recognition || recognition.current) return;

    wanted.current = true;
    const rec = new Recognition();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 3; // команда нередко оказывается не в первой гипотезе
    rec.onstart = () => { setStatus('listening'); setMessage(''); };
    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result.isFinal) continue;
        let recognized = false;
        for (let a = 0; a < result.length && !recognized; a++) {
          const transcript = result[a].transcript.trim();
          const command = parseVoiceCommand(transcript);
          if (!command) continue;
          recognized = true;
          setHeard(transcript);
          handler.current(command, transcript);
        }
        if (!recognized) setHeard(`не поняла: «${result[0].transcript.trim()}»`);
      }
    };
    rec.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return; // обычная тишина: перезапустимся в onend
      wanted.current = false;
      const denied = e.error === 'not-allowed' || e.error === 'service-not-allowed';
      setStatus(denied ? 'denied' : 'error');
      setMessage(denied ? 'Нет доступа к микрофону — разрешите его в настройках браузера' : ERROR_MESSAGE[e.error] ?? 'Распознавание прервалось');
    };
    rec.onend = () => {
      recognition.current = null;
      // Chrome сам закрывает сессию после пары секунд тишины — поднимаем её снова, пока микрофон включён
      if (wanted.current) start();
      else setStatus(s => (s === 'listening' ? 'idle' : s));
    };

    try {
      rec.start();
      recognition.current = rec;
    } catch {
      wanted.current = false;
      setStatus('error');
      setMessage('Не удалось включить микрофон');
    }
  }, []);

  const stop = useCallback(() => {
    wanted.current = false;
    recognition.current?.abort();
    recognition.current = null;
    setStatus(s => (s === 'listening' ? 'idle' : s));
    setHeard('');
  }, []);

  const toggle = useCallback(() => {
    if (wanted.current) stop();
    else start();
  }, [start, stop]);

  useEffect(() => stop, [stop]); // микрофон не остаётся висеть при уходе с экрана

  return { status, message, heard, toggle, available: !unavailable };
}
