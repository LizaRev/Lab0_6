## Lab06

## Технології

* TypeScript
* JavaScript
* React + React DOM
* Vite
* Node.js
* WebSocket
* Zod
* JSON / Binary protocol
* HTML Canvas
* npm workspaces


## M1 — Toolchain and shared

На першому етапі я налаштувала TypeScript для всього проєкту.

Було створено спільний `tsconfig.base.json` зі строгими налаштуваннями:

* `strict`
* `noUncheckedIndexedAccess`
* `verbatimModuleSyntax`
* `module: NodeNext` / `ESNext`
* `noEmit`

Для `client`, `server` та `shared` створено окремі `tsconfig.json`.

Я перевела `shared/` з JavaScript на TypeScript, поступово замінюючи `.js` файли на `.ts`.

Також було додано:

* `Vector2` з `readonly x` та `readonly y`;
* discriminated union для типів сутностей;
* branded types `EntityId`, `Tick` та `Seq`;
* типізований seeded PRNG;
* явні типи параметрів і результатів `World.step`;
* перевірку відсутності `any`.

Для перевірки того, що після переходу на TypeScript поведінка симуляції не змінилася, створено determinism test. При однаковому seed симуляція дає однаковий результат.

## M2 — Protocol

На другому етапі я типізувала протокол обміну повідомленнями.

Для JSON-повідомлень використано Zod-схеми, на основі яких автоматично отримуються TypeScript-типи.

Для перевірки повідомлень реалізовано `parseClientMessage()`. Некоректні дані не повинні ламати сервер: повідомлення перевіряється, а помилка обробляється окремо.

Також реалізовано binary codec:

```text
encode(msg: Snapshot): ArrayBuffer
decode(buf: ArrayBuffer): Snapshot
```

Binary codec містить перевірки діапазонів значень та version guard.

Для роботи з JSON і binary форматами використовується спільний `Codec` interface з двома реалізаціями.

У `switch` за `type` або `kind` використовується `never` для перевірки повноти обробки всіх можливих варіантів.

Старий hand-written validator з попередньої лабораторної більше не використовується.

## M3 — Server and client under strict TypeScript

На третьому етапі я перевела `server/` і `client/` на TypeScript.

Для сервера використовується `tsx`, а клієнт збирається через Vite.

Було додано окремий `typecheck`:

```bash
npm run typecheck
```

Він перевіряє TypeScript-код без створення JavaScript-файлів.

Для сервера було реалізовано типізований `Room` EventEmitter, а на клієнті — типізований `Bus<GameEvents>`.

Конфігурація сервера перевіряється через Zod та має значення за замовчуванням.

Також я перевірила обробку `catch (e)`, щоб значення помилки не використовувалося як відомий тип без перевірки.

У результаті:

* TypeScript не має помилок;
* використовується менше п'яти `as` casts;
* клієнт успішно збирається;
* серверні тести проходять.

## M4 — React + TypeScript

У M4 я перенесла **Lobby** та **HUD** на React + TypeScript.

Було створено:

* `client/src/components/Lobby.tsx`
* `client/src/components/Hud.tsx`
* `client/src/hud-types.ts`

Також старий UI було підключено до React через адаптери:

* `client/src/lobby-ui.ts`
* `client/src/hud.ts`

Canvas, game loop, simulation та мережеву логіку я залишила без React. Тобто React використовується тільки для UI і не змінює основну логіку гри.

### Що дав React

React спростив роботу зі станом Lobby та HUD. UI тепер поділений на окремі компоненти, а оновлення елементів відбувається через state замість ручного створення та зміни DOM.

### Що це коштувало

Для React були додані `react`, `react-dom` та відповідні TypeScript-типи. Також знадобилося налаштувати JSX у `tsconfig.json`. У результаті build став трохи складнішим, але структура UI стала зрозумілішою.

## What TypeScript found

Під час міграції на TypeScript стало необхідно явно перевіряти дані, які можуть бути `null` або `undefined`.

Також TypeScript змусив явно описати типи даних, які приходять через події та мережеві повідомлення, замість того щоб використовувати їх як довільні JavaScript-об'єкти.

Окремо були типізовані props React-компонентів, тому помилки у переданих даних можна виявити ще під час перевірки коду.

## Three interesting types

### EntityId

`EntityId` є branded type на основі `number`. Це дозволяє відрізняти ID сутності від звичайного числа та інших branded numeric types.

### Tick

`Tick` також базується на `number`, але використовується саме для номера такту симуляції. Це допомагає не плутати номер такту з іншими числовими значеннями.

### Discriminated union

Типи сутностей описуються через поле `kind`, наприклад `ship`, `bullet` або інші типи. За значенням `kind` TypeScript може визначити, які поля доступні конкретній сутності.

Для JavaScript це було б просто поле звичайного об'єкта, а TypeScript дозволяє перевірити правильність такого використання ще до запуску програми.

## Перевірка

Для перевірки проєкту використовуються:

```bash
npm run typecheck
```

та:

```bash
npm run build --workspace client
```

Після переходу на TypeScript гра запускається, Lobby підключається до кімнати, HUD відображається, а основна логіка гри продовжує працювати без змін.
