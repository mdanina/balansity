# Changelog

Все значимые изменения в проекте документируются в этом файле.

## [2025-01-XX] - Code Review Fixes

### Критические исправления

#### TypeScript Strict Mode
- **Включен strict mode** в `tsconfig.json` и `tsconfig.app.json`
- Добавлены строгие проверки типов для предотвращения runtime ошибок
- Файлы: `tsconfig.json`, `tsconfig.app.json`

#### Исправление Race Conditions
- **ResultsReportNew.tsx**: Добавлена cleanup функция в useEffect для предотвращения setState на размонтированном компоненте
- **CheckupQuestions.tsx**: Добавлена cleanup функция для загрузки профиля
- **FamilyMembers.tsx**: Проверена и подтверждена корректная работа cleanup функции
- Все async операции теперь защищены флагом `cancelled`

#### Параллелизация запросов
- **ResultsReportNew.tsx**: Заменены последовательные `await` на `Promise.all()` для параллельной загрузки parent и family оценок
- Улучшена производительность загрузки данных

### Рефакторинг

#### Разбиение большого компонента
- **Создан `src/hooks/useResultsData.ts`**: Хук для загрузки данных результатов с cleanup функцией
- **Создан `src/utils/resultsCalculations.ts`**: Утилиты для вычислений (getStatusText, getStatusColor, getProgressPercentage)
- **Создан `src/components/ResultsReport/SummaryCards.tsx`**: Компонент для отображения карусели карточек с кратким резюме
- **ResultsReportNew.tsx**: Подготовлен к дальнейшему рефакторингу (создана инфраструктура для разбиения)

### Замена console.log на logger

- **FamilyMembers.tsx**: Все `console.log` и `console.error` заменены на `logger.log` и `logger.error`
- **CheckupQuestions.tsx**: Все `console.error` заменены на `logger.error`
- **Worries.tsx**: Все `console.log` и `console.error` заменены на `logger.log` и `logger.error`
- Логирование теперь использует централизованную систему `@/lib/logger`, которая автоматически отключает логи в production

### Оптимизация производительности

#### Оптимизация инвалидации кеша React Query
- **useAppointments.ts**: Заменены множественные `invalidateQueries` на групповую инвалидацию через `predicate`
- **usePackages.ts**: Заменены множественные `invalidateQueries` на групповую инвалидацию через `predicate`
- Уменьшено количество операций инвалидации кеша

#### Мемоизация
- **CheckupQuestions.tsx**: Добавлен `useMemo` для вычисления `progress` и `currentAnswerOptions`
- Предотвращены лишние пересчеты при каждом рендере

### Технические детали

#### Новые файлы
- `src/hooks/useResultsData.ts` - хук для загрузки данных результатов
- `src/utils/resultsCalculations.ts` - утилиты для вычислений
- `src/components/ResultsReport/SummaryCards.tsx` - компонент карусели карточек

#### Измененные файлы
- `tsconfig.json` - включен strict mode
- `src/pages/ResultsReportNew.tsx` - исправлены race conditions, добавлена параллелизация
- `src/pages/CheckupQuestions.tsx` - исправлены race conditions, добавлена мемоизация, заменен console на logger
- `src/pages/FamilyMembers.tsx` - заменен console на logger
- `src/pages/Worries.tsx` - заменен console на logger
- `src/hooks/useAppointments.ts` - оптимизирована инвалидация кеша
- `src/hooks/usePackages.ts` - оптимизирована инвалидация кеша

### Следующие шаги

- [ ] Завершить рефакторинг ResultsReportNew.tsx: создать компоненты ChildCheckupSection, ParentSection, FamilySection
- [ ] Заменить оставшиеся console.log в других файлах (Dashboard.tsx, Payment.tsx, и др.)
- [ ] Добавить unit тесты для новых утилит и хуков

---

## Формат версий

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект следует [Semantic Versioning](https://semver.org/lang/ru/).

