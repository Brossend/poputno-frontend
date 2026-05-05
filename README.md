# Poputno Frontend

Frontend для сервиса планирования поездок на `Nuxt 4`.

Приложение включает:

- лендинг и авторизацию
- личный кабинет с поездками
- редактор поездки с картой на `Leaflet`
- поиск мест и построение маршрута

## Стек

- `Nuxt 4`
- `Vue 3`
- `Pinia`
- `Tailwind CSS`
- `Leaflet`

## Требования

Для локального запуска нужны:

- `Node.js` 20+
- `npm` 10+

Проверка версий:

```bash
node -v
npm -v
```

## Локальное развертывание

### 1. Клонировать проект

```bash
git clone <repo-url>
cd poputno-frontend
```

### 2. Установить зависимости

```bash
npm install
```

Если в `PowerShell` выполнение `npm` заблокировано политикой исполнения, используйте:

```powershell
npm.cmd install
```

### 3. Настроить API для локальной разработки

По умолчанию frontend использует `public.apiBaseUrl` из `nuxt.config.ts`. Для локальной разработки его лучше переопределять через переменную окружения `NUXT_PUBLIC_API_BASE_URL`.

Создайте файл `.env` в корне проекта:

```env
NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Важно:

- frontend будет отправлять запросы в `${NUXT_PUBLIC_API_BASE_URL}/api/v1`
- если backend локально запущен на другом порту или домене, укажите его здесь
- для авторизации через cookies backend должен быть настроен на работу с вашим локальным frontend-origin

### 4. Запустить dev-сервер

```bash
npm run dev
```

Если нужно, через `PowerShell` можно запускать так:

```powershell
npm.cmd run dev
```

После запуска приложение обычно доступно по адресу:

```text
http://localhost:3000
```

## Полезные команды

Запуск typecheck:

```bash
npm run typecheck
```

Production build:

```bash
npm run build
```

Локальный preview production-сборки:

```bash
npm run preview
```

Генерация статической версии:

```bash
npm run generate
```

## Типовой сценарий локальной разработки

1. Запустить backend локально.
2. Создать `.env` с `NUXT_PUBLIC_API_BASE_URL`.
3. Выполнить `npm install`.
4. Запустить `npm run dev`.
5. Открыть `http://localhost:3000`.

## Структура проекта

```text
assets/        стили и статические ассеты
components/    UI-компоненты
composables/   переиспользуемая логика
layouts/       layout'ы Nuxt
middleware/    route middleware
pages/         страницы приложения
stores/        Pinia stores
types/         TypeScript-типы
utils/         вспомогательные утилиты
```

## Как frontend работает с API

- базовый URL берётся из `runtimeConfig.public.apiBaseUrl`
- запросы идут через `composables/useApiClient.ts`
- фактический префикс API: `/api/v1`
- `credentials: include` уже включён, поэтому cookies отправляются автоматически

Пример:

- `NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
- frontend будет ходить в `http://127.0.0.1:8000/api/v1`

## Возможные проблемы при локальном запуске

### `npm` не запускается в PowerShell

Используйте `npm.cmd`:

```powershell
npm.cmd run dev
```

### Frontend открывается, но API-запросы падают

Проверьте:

- запущен ли backend
- верно ли указан `NUXT_PUBLIC_API_BASE_URL`
- отвечает ли backend по пути `/api/v1`
- разрешены ли CORS/cookie-настройки для `http://localhost:3000`

### Карта или маршрут работают не полностью

Часть функций маршрутизации может зависеть от backend. При локальной разработке frontend также использует локальные fallback-механизмы и публичный OSM routing, если серверный маршрут недоступен.

