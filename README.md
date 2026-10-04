# Пряжник

## Запуск

Зависимости фронтенда ставятся в корне: `npm install`. Эта команда не собирает
нативные модули и не требует Visual Studio C++. После неё работают `dev`,
`dev:https`, `build`, `lint` и `typecheck`.

- `npm run dev` — обычный dev-сервер по http. Доступен и по IP машины в локальной сети.
- `npm run dev:https` — то же самое, но по https. Нужен, чтобы открывать приложение
  с телефона: по http на IP браузер не считает страницу secure context, поэтому
  недоступны микрофон, service worker и установка PWA.
- `npm run build` + `npm run preview:https` — собранная версия по https. Только так
  можно проверить настоящую установку PWA и офлайн-режим: в dev крутится отладочный
  service worker, который ничего не кеширует.
- `npm run lint`, `npm run typecheck` — проверки фронтенда. Серверные типы и тесты
  живут в `server/` и корневой `typecheck` не запускает.

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

Это сертификат компьютера, на котором идёт разработка. У домашнего сервера
свой центр в его папке `certs/ca`, и на этот компьютер его не ставят — см. раздел
ниже.

## Домашний сервер

Каркас для отдельной всегда включённой машины в домашней сети. `npm run dev`
по-прежнему держит склад и изделия в `localStorage`: экраны на сервер ещё не
переключены. Контейнер отдаёт собранную статику и `/api` с одного origin.

Fastify, `better-sqlite3` и `argon2` описаны в `server/package.json`, не в корне.
Образ ставит их сам (`npm ci` в `server/`) и там же собирает нативные модули.
На компьютер разработчика Visual Studio C++ для этого не нужна. Локально
серверные тесты: `npm install --prefix server`, затем `npm run test:server`.
Запуск собранного сервера из корня — `npm run start:server` (делегирует в `server/`).

Пряжник занимает свою папку и порт **8443**. Порты 80 и 443 не публикуются.
Чужой nginx, Caddy, их сертификаты и чужие контейнеры не трогаем. Сеть Compose
своя, имя проекта — `yarntracker`. Команды `down` / `stop` запускают только из
папки Пряжника.

На серверной машине нужны Docker Engine и плагин Compose. Телефон и сервер —
в одной домашней Wi-Fi. Адрес машины лучше закрепить в роутере (DHCP
reservation): иначе сертификат, выписанный на старый IP, перестанет подходить.

### Сертификат

Нужен [mkcert](https://github.com/FiloSottile/mkcert) — один бинарник под систему
сервера. Центр сертификации лежит в `certs/ca` внутри папки Пряжника.

На сервере `mkcert -install` не запускаем: команда записала бы центр в системное
хранилище машины. На компьютер разработчика этот корневой тоже не ставим.

Из папки Пряжника, подставив IP этой машины в сети:

```sh
mkdir -p certs
export CAROOT="$PWD/certs/ca"
mkcert -cert-file certs/cert.pem -key-file certs/key.pem localhost 192.168.1.42
```

Появятся `certs/cert.pem`, `certs/key.pem` и в `certs/ca` пара `rootCA.pem` /
`rootCA-key.pem`. Контейнер монтирует только `cert.pem` и `key.pem`, только на
чтение. Если этих двух файлов нет, процесс не стартует и пишет в лог, зачем они.

`rootCA-key.pem` — секрет центра. Его не копируют на телефон, не коммитят и не
кладут в чужие папки. На телефон уходит только `certs/ca/rootCA.pem`.

На Android, один раз: Настройки → Безопасность → Шифрование и учётные данные →
Установка сертификатов → Сертификат ЦС, выбрать `rootCA.pem`. Система предупредит,
что такой сертификат может проверять защищённые сайты, и попросит PIN или
отпечаток. Для этого центра предупреждение относится только к сайтам, которые
он сам подписал, то есть к Пряжнику на этом IP.

После этого Chrome открывает `https://192.168.1.42:8443` без красного экрана.
Проверка с самой серверной машины — `https://localhost:8443` (имя `localhost`
уже в сертификате). С компьютера разработчика адрес откроется с предупреждением:
корневой туда не ставится, для альфы это не нужно.

Если адрес машины сменился, сертификат перевыпускается той же командой mkcert
с тем же `CAROOT`, затем контейнер перезапускается. Корневой на телефоне заново
ставить не нужно.

### Запуск

Сначала сертификат, потом `.env` (имя и пароль одного пользователя), потом
контейнер:

```sh
cp .env.example .env
docker compose up -d --build
```

Каталог `./data` рядом с compose-файлом — все пользовательские данные
(`app.sqlite` и `files`). При обновлении его не удалять:

```sh
git pull
docker compose up -d --build
```

Пароль в базе хранится хешем. Повторный старт уже созданного пользователя из
`.env` не перезаписывает. Смена пароля и сброс сессий:

```sh
docker compose exec app node server/dist/reset-password.js 'новая-длинная-фраза'
```

`GET /api/health` отвечает `{ "ok": true }` только с сессией (cookie после
`POST /api/login`). Без cookie — 401: процесс жив, входа нет. Выход —
`POST /api/logout`. Кто вошёл — `GET /api/me`. Склад и изделия по-прежнему
только в браузере.

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
