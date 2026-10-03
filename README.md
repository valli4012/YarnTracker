# Пряжник

## Запуск

- `npm run dev` — обычный dev-сервер по http. Доступен и по IP машины в локальной сети.
- `npm run dev:https` — то же самое, но по https. Нужен, чтобы открывать приложение
  с телефона: по http на IP браузер не считает страницу secure context, поэтому
  недоступны микрофон, service worker и установка PWA.
- `npm run build` + `npm run preview:https` — собранная версия по https. Только так
  можно проверить настоящую установку PWA и офлайн-режим: в dev крутится отладочный
  service worker, который ничего не кеширует.
- `npm run lint`, `npm run typecheck` — проверки.

По умолчанию `dev:https` использует самоподписанный сертификат от
`@vitejs/plugin-basic-ssl`. Браузер покажет предупреждение, через него можно
пройти — приложение и микрофон будут работать, но Chrome откажется
регистрировать service worker на origin с ошибкой сертификата
(`SecurityError: An SSL certificate error occurred when fetching the script`),
а значит не будет ни офлайн-режима, ни полноценной установки на Android.

Чтобы работал ещё и service worker, положите доверенный сертификат от
[mkcert](https://github.com/FiloSottile/mkcert) в `certs/cert.pem` и
`certs/key.pem` — `dev:https` и `preview:https` подхватят его вместо
самоподписанного. Папка `certs/` в `.gitignore`.

```sh
mkcert -install                                   # один раз: локальный доверенный CA
mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 192.168.1.5
```

IP во второй команде — адрес компьютера в домашней сети. Чтобы телефон тоже
доверял сертификату, корневой сертификат mkcert (`mkcert -CAROOT`) нужно
установить на телефон.

## Иконки

Все иконки домашнего экрана лежат в `public/` и должны остаться **непрозрачными
PNG**: iOS заливает прозрачные области чёрным, а SVG в качестве иконки ярлыка не
принимает вовсе.

| файл | где используется |
| --- | --- |
| `icon-192.png`, `icon-512.png` | манифест, `purpose: any` |
| `icon-maskable-192.png`, `icon-maskable-512.png` | манифест, `purpose: maskable` — рисунок внутри безопасной зоны 80% |
| `apple-touch-icon.png` (180×180) | ярлык на iOS |
| `favicon.ico`, `favicon-96.png` | вкладка браузера и ярлык-закладка на Android |

Пути иконок в манифесте собираются из `base` в `vite.config.ts`. Проверять их
нужно глазами по сети: на несуществующий `/icon-*.png` и dev-сервер, и `preview`
отдают `index.html` со статусом 200, а не 404, поэтому опечатка в пути молча
превращается в пустую иконку.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
