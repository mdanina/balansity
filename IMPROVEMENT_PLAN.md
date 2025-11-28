# План доработок проекта

**Версия:** 1.0  
**Дата:** 2024  
**Общая оценка времени:** ~15-20 рабочих дней

---

## 📊 Обзор

План разделен на 4 фазы с приоритетами:
- 🔴 **Критично** - Безопасность и стабильность
- 🟡 **Важно** - Качество кода и производительность  
- 🟢 **Желательно** - Улучшения и оптимизация
- 🔵 **Долгосрочно** - Масштабируемость и тестирование

**⚠️ ВАЖНО:** План дополнен критическими проблемами производительности, найденными Клодом:
- N+1 запросы в Dashboard (экономия ~600ms)
- Катастрофическая производительность в ResultsReportNew (экономия ~1.3s)
- Отсутствие composite индексов для RLS
- Неоптимальные SQL функции
- React re-renders проблемы

## 💬 Оценка анализа Клода

**Вердикт:** Анализ Клода **отличный и очень точный** ✅

### Что делает его анализ особенно ценным:

1. **Конкретные метрики производительности:**
   - Указал точное время экономии (~600ms, ~1.3s)
   - Объяснил масштаб проблемы (N+1 запросы)

2. **Глубокая диагностика:**
   - Нашел проблемы на уровне SQL (scoring функции)
   - Обнаружил проблемы с индексами для RLS
   - Выявил проблемы React re-renders

3. **Практичные решения:**
   - Предложил конкретный код для исправления
   - Указал выигрыш от каждого исправления

4. **Приоритизация:**
   - Правильно выделил критичные проблемы
   - Разделил на категории по важности

### Что добавлено в план от Клода:

- ✅ **1.6** - Исправление N+1 в Dashboard (критично)
- ✅ **1.7** - Катастрофическая производительность ResultsReportNew (критично)
- ✅ **1.8** - Composite индексы для RLS (критично)
- ✅ **2.3** - Оптимизация SQL функций (критично)
- ✅ **2.3.1** - Батчевый UPDATE (важно)
- ✅ **2.3.2** - React Query кеширование (важно)
- ✅ **2.4** - Мемоизация с useCallback (важно)
- ✅ **2.5** - Оптимистичные UI updates (желательно)
- ✅ **2.6** - Bundle size оптимизация (желательно)

### Что уже было в плане:

- ✅ Система логирования (заменит console.log)
- ✅ Оптимизация запросов (частично пересекается)
- ✅ Мемоизация (но без useCallback - теперь добавлено)
- ✅ Обработка ошибок

### Рекомендация:

**Начать с критических проблем производительности от Клода!**
1. N+1 запросы (1.6) - **СРОЧНО**
2. ResultsReportNew (1.7) - **СРОЧНО**
3. Composite индексы (1.8) - **СРОЧНО**
4. SQL функции (2.3) - **ВАЖНО**

Эти исправления дадут **~2+ секунды экономии** времени загрузки! 🚀

---

## ⚠️ КРИТИЧЕСКИЕ ПРОБЛЕМЫ ПРОИЗВОДИТЕЛЬНОСТИ (от Клода)

**Оценка Клода очень точна!** Ниже добавлены эти проблемы в план с высоким приоритетом.

---

## ФАЗА 1: Критические исправления (3-4 дня)

### 🔴 1.1. Создание системы логирования

**Приоритет:** Критично  
**Время:** 2-3 часа  
**Файлы:** 
- Создать: `src/lib/logger.ts`
- Обновить: все файлы с console.log

**Задачи:**
- [ ] Создать утилиту logger
- [ ] Заменить все console.log на logger
- [ ] Настроить фильтрацию логов в production

**Пример кода:**

```typescript
// src/lib/logger.ts
const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

interface LogLevel {
  log: 'log';
  info: 'info';
  warn: 'warn';
  error: 'error';
}

class Logger {
  private shouldLog(level: keyof LogLevel): boolean {
    if (level === 'error') return true; // Всегда логируем ошибки
    return isDev && !isTest;
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log('[LOG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    console.error('[ERROR]', ...args);
    // TODO: Здесь можно добавить отправку в Sentry/другой сервис
  }
}

export const logger = new Logger();
```

**Замена в коде:**

```typescript
// Было:
console.log('User created:', user);

// Стало:
import { logger } from '@/lib/logger';
logger.log('User created:', user);
```

---

### 🔴 1.2. Исправление проверки переменных окружения

**Приоритет:** Критично  
**Время:** 30 минут  
**Файл:** `src/lib/supabase.ts`

**Задачи:**
- [ ] Добавить проверку с throw вместо warn
- [ ] Добавить валидацию формата URL

**Код:**

```typescript
// src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function validateEnv(): void {
  const errors: string[] = [];

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL не установлена');
  } else if (!supabaseUrl.startsWith('http')) {
    errors.push('VITE_SUPABASE_URL имеет неверный формат');
  }

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY не установлена');
  }

  if (errors.length > 0) {
    throw new Error(
      `Критические переменные окружения не настроены:\n${errors.join('\n')}`
    );
  }
}

// Вызываем валидацию сразу
validateEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

---

### 🔴 1.3. Рефакторинг проверки сессий

**Приоритет:** Критично  
**Время:** 1-2 часа  
**Файлы:**
- Создать: `src/lib/authUtils.ts`
- Обновить: `src/contexts/AuthContext.tsx`
- Обновить: `src/components/ProtectedRoute.tsx`

**Задачи:**
- [ ] Создать утилиту для проверки сессий
- [ ] Убрать дублирование кода

**Код:**

```typescript
// src/lib/authUtils.ts
import type { Session } from '@supabase/supabase-js';

/**
 * Проверяет, валидна ли сессия (не истекла)
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  
  // Если expires_at не указан, считаем сессию валидной
  // (Supabase может обновлять токены автоматически)
  return !expiresAt || expiresAt >= now;
}

/**
 * Проверяет, истекла ли сессия
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at;
  
  return expiresAt ? expiresAt < now : false;
}
```

**Обновление AuthContext:**

```typescript
// src/contexts/AuthContext.tsx
import { isSessionValid, isSessionExpired } from '@/lib/authUtils';

// В useEffect:
if (session) {
  if (isSessionExpired(session)) {
    logger.warn('Session expired, clearing...');
    supabase.auth.signOut();
    setSession(null);
    setUser(null);
  } else {
    setSession(session);
    setUser(session.user ?? null);
  }
}
```

**Обновление ProtectedRoute:**

```typescript
// src/components/ProtectedRoute.tsx
import { isSessionValid } from '@/lib/authUtils';

if (!user || !isSessionValid(session)) {
  return <Navigate to="/login" replace />;
}
```

---

### 🔴 1.4. Замена alert() на toast

**Приоритет:** Критично  
**Время:** 15 минут  
**Файл:** `src/pages/Dashboard.tsx`

**Задачи:**
- [ ] Заменить alert на toast.error или toast.info

**Код:**

```typescript
// Было:
alert('Все дети уже прошли чекап!...');

// Стало:
import { toast } from 'sonner';

toast.info('Все дети уже прошли чекап! Вы можете посмотреть результаты в разделе "Ваша семья".');
```

---

### 🔴 1.5. Исправление дублирования и мертвого кода

**Приоритет:** Критично  
**Время:** 1 час  
**Файлы:**
- `src/lib/profileStorage.ts`
- `src/pages/Dashboard.tsx`

**Задачи:**
- [ ] Удалить мертвый код в profileStorage.ts (строка 162)
- [ ] Использовать calculateAge в Dashboard вместо дублирования

**Код:**

```typescript
// src/pages/Dashboard.tsx
import { calculateAge } from '@/lib/profileStorage';

// В компоненте:
const age = member.dob ? calculateAge(member.dob) : null;
```

**Исправление profileStorage.ts:**

```typescript
// Удалить строку 162: if (error) throw error;
// Ошибка уже обработана на строке 152
```

---

### 🔴 1.6. КРИТИЧНО: Исправление N+1 запросов в Dashboard ⚠️⚠️⚠️

**Приоритет:** Критично (от Клода)  
**Время:** 2-3 часа  
**Файлы:**
- `src/pages/Dashboard.tsx`
- `src/lib/assessmentStorage.ts`

**Проблема:** Для каждого профиля делается отдельный запрос к БД.
- 5 профилей = 5 запросов = ~750ms задержки
- Каждый запрос проходит через RLS с JOIN

**Задачи:**
- [ ] Создать функцию batch запроса для оценок
- [ ] Обновить Dashboard для использования batch запроса

**Код:** (уже есть в плане, но нужно добавить эту функцию первым делом)

```typescript
// src/lib/assessmentStorage.ts - ДОБАВИТЬ СРОЧНО

/**
 * Получить завершенные оценки для нескольких профилей одним запросом
 * КРИТИЧНО: Исправляет N+1 проблему
 */
export async function getCompletedAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Record<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю завершенную оценку
    const assessmentMap = data?.reduce((acc, assessment) => {
      // Если еще нет оценки для этого профиля, или эта новее - сохраняем
      if (!acc[assessment.profile_id] || 
          (!acc[assessment.profile_id].completed_at && assessment.completed_at) ||
          (acc[assessment.profile_id].completed_at && assessment.completed_at &&
           new Date(assessment.completed_at) > new Date(acc[assessment.profile_id].completed_at!))) {
        acc[assessment.profile_id] = assessment;
      }
      return acc;
    }, {} as Record<string, Assessment>) || {};

    // Возвращаем Map со всеми профилями (null для тех, у кого нет оценок)
    const result: Record<string, Assessment | null> = {};
    for (const profileId of profileIds) {
      result[profileId] = assessmentMap[profileId] || null;
    }

    return result;
  } catch (error) {
    logger.error('Error getting assessments for profiles:', error);
    throw error;
  }
}
```

**Обновление Dashboard.tsx:**

```typescript
// src/pages/Dashboard.tsx
import { getCompletedAssessmentsForProfiles } from '@/lib/assessmentStorage';

useEffect(() => {
  async function loadMembers() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profiles = await getProfiles();
      
      // ОДИН запрос вместо N запросов!
      const profileIds = profiles.map(p => p.id);
      const assessmentsMap = await getCompletedAssessmentsForProfiles(
        profileIds,
        'checkup'
      );
      
      const membersWithAssessments = profiles.map(profile => ({
        ...profile,
        checkupAssessment: assessmentsMap[profile.id] || null,
      }));
      
      setFamilyMembers(membersWithAssessments);
    } catch (error) {
      logger.error('Error loading family members:', error);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }
  loadMembers();
}, [user]);
```

**Выигрыш:** 1 запрос вместо N, ~600ms экономии для 5 профилей, ~1.5s для 10 профилей

---

### 🔴 1.7. КРИТИЧНО: Катастрофическая производительность в ResultsReportNew 🔥🔥🔥

**Приоритет:** Критично (от Клода)  
**Время:** 3-4 часа  
**Файл:** `src/pages/ResultsReportNew.tsx`

**Проблема:** Вложенные циклы с запросами к БД!
- O(N × M) сложность: N = профили, M = типы оценок
- Для 5 профилей = до 10 последовательных запросов
- Время загрузки: ~1.5 секунды только на эти запросы!

**Задачи:**
- [ ] Заменить все отдельные запросы на один batch запрос
- [ ] Убрать вложенные циклы

**Код:**

```typescript
// src/pages/ResultsReportNew.tsx
// ЗАМЕНИТЬ весь блок загрузки (примерно строки 109-150)

useEffect(() => {
  async function loadResults() {
    if (authLoading || !user) {
      return;
    }
    
    try {
      setLoading(true);
      
      // ОДИН запрос для всех профилей пользователя
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;
      if (!profiles) return;

      const parentProfile = profiles.find(p => p.type === 'parent');
      const partnerProfile = profiles.find(p => p.type === 'partner');
      const childProfiles = profiles.filter(p => p.type === 'child');

      setParentProfile(parentProfile || null);
      setPartnerProfile(partnerProfile || null);

      // ОДИН запрос для ВСЕХ завершенных оценок пользователя
      const { data: allAssessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*, profile_id')
        .in('profile_id', profiles.map(p => p.id))
        .eq('status', 'completed')
        .in('assessment_type', ['parent', 'family', 'checkup']);

      if (assessmentsError) throw assessmentsError;

      // Разделение по типам
      const parentAssess = allAssessments?.find(
        a => a.assessment_type === 'parent'
      ) || null;
      
      const familyAssess = allAssessments?.find(
        a => a.assessment_type === 'family'
      ) || null;

      // Чекапы детей
      const checkupAssessments = allAssessments?.filter(
        a => a.assessment_type === 'checkup'
      ) || [];

      const checkupsMap = new Map(
        checkupAssessments.map(a => [a.profile_id, a])
      );

      const childrenCheckups: ChildCheckupData[] = childProfiles.map(child => ({
        profile: child,
        checkup: checkupsMap.get(child.id) || null,
      }));

      setChildrenCheckups(childrenCheckups);
      setParentAssessment(parentAssess);
      setFamilyAssessment(familyAssess);
    } catch (error) {
      logger.error('Error loading results:', error);
      toast.error('Не удалось загрузить результаты. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }

  loadResults();
}, [authLoading, user]);

// УДАЛИТЬ старый код с вложенными циклами:
// ❌ for (const profile of profiles) {
// ❌   if (!parentAssessment) {
// ❌     const parentAssess = await getCompletedAssessment(...);
// ❌   }
// ❌ }
```

**Выигрыш:** 1 запрос вместо 10+, ~1.3 секунды экономии!

---

### 🔴 1.8. КРИТИЧНО: Добавление Composite индексов для RLS 🔴

**Приоритет:** Критично (от Клода)  
**Время:** 1-2 часа  
**Файл:** Создать `supabase/migrations/011_add_composite_indexes.sql`

**Проблема:** RLS политики делают JOIN, но нет составных индексов → медленные запросы

**Задачи:**
- [ ] Создать миграцию с composite индексами
- [ ] Применить миграцию

**Код:**

```sql
-- supabase/migrations/011_add_composite_indexes.sql

-- Индексы для оптимизации RLS политик
-- Ускоряют JOIN запросы в политиках безопасности

-- Для таблицы assessments: часто используется (id, profile_id) в JOIN
CREATE INDEX IF NOT EXISTS idx_assessments_id_profile_id 
  ON public.assessments(id, profile_id);

-- Для таблицы profiles: часто используется (id, user_id) в JOIN
CREATE INDEX IF NOT EXISTS idx_profiles_id_user_id 
  ON public.profiles(id, user_id);

-- Для таблицы answers: оптимизация scoring запросов
-- Partial index для неотрицательных значений (фильтрует пропущенные ответы)
CREATE INDEX IF NOT EXISTS idx_answers_assessment_value_type 
  ON public.answers(assessment_id, answer_type, value) 
  WHERE value >= 0;

-- Индекс для часто используемого фильтра по статусу и типу
CREATE INDEX IF NOT EXISTS idx_assessments_type_status_profile 
  ON public.assessments(assessment_type, status, profile_id)
  WHERE status = 'completed';

-- Комментарии
COMMENT ON INDEX idx_assessments_id_profile_id IS 
  'Оптимизирует RLS JOIN между assessments и profiles';
COMMENT ON INDEX idx_profiles_id_user_id IS 
  'Оптимизирует RLS проверки user_id в profiles';
COMMENT ON INDEX idx_answers_assessment_value_type IS 
  'Ускоряет scoring запросы для расчетов оценок';
```

**Выигрыш:** 2-5x ускорение RLS проверок и JOIN запросов

---

### 🟡 2.5. Оптимистичные UI updates

**Приоритет:** Желательно (от Клода)  
**Время:** 2-3 часа  
**Файлы:**
- `src/hooks/useAssessment.ts`

**Проблема:** При сохранении ответов пользователь ждет сети
- UI блокируется на время запроса
- Плохой UX при медленном интернете

**Задачи:**
- [ ] Реализовать оптимистичные обновления
- [ ] Добавить откат при ошибке

**Код:**

```typescript
// src/hooks/useAssessment.ts
const saveAnswerToDb = async (
  questionId: number,
  questionCode: string,
  category: string,
  value: number,
  answerType: string | undefined,
  stepNumber: number
) => {
  if (!assessmentId) {
    logger.warn('Assessment ID not available');
    return;
  }

  // ОПТИМИСТИЧНОЕ обновление UI сразу
  const previousValue = savedAnswers.get(questionId);
  const previousStep = currentStep;
  
  setSavedAnswers(prev => new Map(prev).set(questionId, value));
  setCurrentStep(stepNumber);

  try {
    const answerData: AnswerData = {
      questionId,
      questionCode,
      category,
      value,
      answerType,
      stepNumber,
    };

    await saveAnswer(assessmentId, answerData);
    await updateAssessmentStep(assessmentId, stepNumber);
    
    // Успех - состояние уже обновлено
  } catch (error) {
    // ОТКАТ при ошибке
    logger.error('Error saving answer:', error);
    
    setSavedAnswers(prev => {
      const newMap = new Map(prev);
      if (previousValue !== undefined) {
        newMap.set(questionId, previousValue);
      } else {
        newMap.delete(questionId);
      }
      return newMap;
    });
    
    setCurrentStep(previousStep);
    
    toast.error('Ошибка при сохранении ответа. Попробуйте еще раз.');
    throw error; // Пробрасываем для обработки в компоненте
  }
};
```

**Выигрыш:** Мгновенный отклик UI, лучший UX

---

## ФАЗА 2: Улучшение качества кода (5-7 дней)

### 🟡 2.1. Единая система обработки ошибок

**Приоритет:** Важно  
**Время:** 3-4 часа  
**Файлы:**
- Создать: `src/lib/errorHandler.ts`
- Создать: `src/types/errors.ts`
- Обновить: все файлы с обработкой ошибок

**Задачи:**
- [ ] Создать типы ошибок
- [ ] Создать утилиту для обработки ошибок
- [ ] Обновить ключевые места

**Код:**

```typescript
// src/types/errors.ts
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

```typescript
// src/lib/errorHandler.ts
import { logger } from './logger';
import { toast } from 'sonner';
import type { AppError, ApiError } from '@/types/errors';

/**
 * Извлекает понятное сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'Произошла неизвестная ошибка';
}

/**
 * Обрабатывает ошибку API с логированием и уведомлением пользователя
 */
export async function handleApiError<T>(
  operation: () => Promise<T>,
  userMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = getErrorMessage(error);
    
    logger.error('API Error:', error);
    
    // Показываем пользователю понятное сообщение
    toast.error(userMessage || message);
    
    // Пробрасываем ошибку дальше для обработки в компонентах
    throw error;
  }
}

/**
 * Обрабатывает ошибки Supabase
 */
export function handleSupabaseError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code?: string; message?: string };
    
    // Обработка специфичных кодов Supabase
    switch (supabaseError.code) {
      case 'PGRST116':
        return {
          message: 'Запись не найдена',
          code: 'NOT_FOUND',
        };
      case '23505': // Unique violation
        return {
          message: 'Запись с такими данными уже существует',
          code: 'DUPLICATE',
        };
      default:
        return {
          message: supabaseError.message || 'Ошибка базы данных',
          code: supabaseError.code,
        };
    }
  }
  
  return {
    message: getErrorMessage(error),
  };
}
```

**Использование:**

```typescript
// Было:
try {
  const profiles = await getProfiles();
  setProfiles(profiles);
} catch (error) {
  console.error('Error:', error);
  toast.error('Ошибка при загрузке профилей');
}

// Стало:
import { handleApiError } from '@/lib/errorHandler';

try {
  const profiles = await handleApiError(
    () => getProfiles(),
    'Не удалось загрузить профили. Попробуйте обновить страницу.'
  );
  setProfiles(profiles);
} catch (error) {
  // Ошибка уже обработана и показана пользователю
  // Можно выполнить дополнительные действия
}
```

---

### 🟡 2.2. Валидация форм с Zod

**Приоритет:** Важно  
**Время:** 4-6 часов  
**Файлы:**
- Создать: `src/lib/validation/schemas.ts`
- Обновить: `src/pages/Register.tsx`
- Обновить: `src/pages/Login.tsx`
- Обновить: `src/pages/Profile.tsx`

**Задачи:**
- [ ] Создать схемы валидации для всех форм
- [ ] Интегрировать с react-hook-form
- [ ] Добавить русские сообщения об ошибках

**Код:**

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const emailSchema = z.string().email('Некорректный email');

export const passwordSchema = z
  .string()
  .min(6, 'Пароль должен быть не менее 6 символов')
  .max(100, 'Пароль слишком длинный');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона');

export const profileSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().optional(),
  phone: phoneSchema.optional().or(z.literal('')),
  region: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
```

**Использование в Register.tsx:**

```typescript
// src/pages/Register.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error(error.message || 'Ошибка при регистрации');
    }
    // ...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>
      {/* ... */}
    </form>
  );
}
```

---

### 🟡 2.3. КРИТИЧНО: Оптимизация SQL функций (5 SELECT → 1)

**Приоритет:** Критично (от Клода)  
**Время:** 2-3 часа  
**Файл:** `supabase/migrations/012_optimize_scoring_functions.sql`

**Проблема:** Множественные SELECT для одной таблицы в scoring функциях
- 5 отдельных SELECT для одной таблицы answers
- Каждый SELECT проходит через индекс и кеш
- Неэффективное использование ресурсов

**Задачи:**
- [ ] Объединить множественные SELECT в один с CASE
- [ ] Оптимизировать функции calculate_parent_scores и calculate_family_scores

**Код:**

```sql
-- supabase/migrations/012_optimize_scoring_functions.sql

-- Оптимизация calculate_parent_scores
-- БЫЛО: 5 отдельных SELECT
-- СТАЛО: 1 SELECT с CASE

CREATE OR REPLACE FUNCTION calculate_parent_scores(assessment_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  wellbeing_value numeric;
  relationship_value numeric;
  arguments_value numeric;
  coparenting_together_value numeric;
  coparenting_arguments_value numeric;
  -- ... другие переменные
BEGIN
  -- ОДИН запрос вместо 5!
  SELECT 
    MAX(CASE WHEN question_id = 1 AND answer_type = 'wellbeing' THEN value END)::numeric,
    MAX(CASE WHEN question_id = 2 AND answer_type = 'relationship' AND value < 6 THEN value END)::numeric,
    MAX(CASE WHEN question_id = 3 AND answer_type = 'frequency' AND value < 6 THEN value END)::numeric,
    MAX(CASE WHEN question_id = 4 AND answer_type = 'frequency' AND value < 6 THEN value END)::numeric,
    MAX(CASE WHEN question_id = 5 AND answer_type = 'frequency' AND value < 6 THEN value END)::numeric
    -- Добавить все остальные CASE для других вопросов
  INTO 
    wellbeing_value,
    relationship_value,
    arguments_value,
    coparenting_together_value,
    coparenting_arguments_value
  FROM public.answers
  WHERE assessment_id = assessment_uuid
    AND question_id BETWEEN 1 AND 25  -- или ваш диапазон
    AND value >= 0;

  -- Остальная логика расчетов...
  
  RETURN jsonb_build_object(
    'wellbeing', wellbeing_value,
    'relationship', relationship_value,
    -- ...
  );
END;
$$;

-- Аналогично оптимизировать calculate_family_scores
```

**Выигрыш:** 5x меньше запросов, лучшее использование кеша, ~200-300ms экономии

---

### 🟡 2.3.1. Батчевый UPDATE в миграции 010

**Приоритет:** Важно (от Клода)  
**Время:** 1 час  
**Файл:** `supabase/migrations/010_recalculate_existing_assessments.sql`

**Проблема:** UPDATE вызывает функцию для каждой строки
- Не set-based операция
- Может блокировать таблицу
- Риск deadlock

**Задачи:**
- [ ] Переписать на батчевый UPDATE с SKIP LOCKED

**Код:**

```sql
-- Обновленная версия 010_recalculate_existing_assessments.sql

DO $$
DECLARE
  batch_size INT := 100;
  updated_rows INT;
  total_updated INT := 0;
BEGIN
  LOOP
    -- Батчевая обработка с блокировкой только нужных строк
    WITH batch AS (
      SELECT id 
      FROM public.assessments
      WHERE assessment_type = 'parent' 
        AND status = 'completed'
        AND (results_summary IS NULL 
             OR results_summary = '{"status": "completed"}'::jsonb
             OR jsonb_typeof(results_summary) = 'null')
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED  -- Пропускаем заблокированные строки
    )
    UPDATE public.assessments a
    SET 
      results_summary = calculate_parent_scores(a.id),
      updated_at = now()
    FROM batch b
    WHERE a.id = b.id;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    total_updated := total_updated + updated_rows;
    
    EXIT WHEN updated_rows = 0;
    
    -- Небольшая пауза между батчами
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Обновлено % строк', total_updated;
END $$;

-- Аналогично для family assessments
DO $$
DECLARE
  batch_size INT := 100;
  updated_rows INT;
  total_updated INT := 0;
BEGIN
  LOOP
    WITH batch AS (
      SELECT id 
      FROM public.assessments
      WHERE assessment_type = 'family' 
        AND status = 'completed'
        AND (results_summary IS NULL 
             OR results_summary = '{"status": "completed"}'::jsonb
             OR jsonb_typeof(results_summary) = 'null')
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.assessments a
    SET 
      results_summary = calculate_family_scores(a.id),
      updated_at = now()
    FROM batch b
    WHERE a.id = b.id;

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    total_updated := total_updated + updated_rows;
    
    EXIT WHEN updated_rows = 0;
    
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Обновлено % строк', total_updated;
END $$;
```

**Выигрыш:** Нет блокировок таблицы, безопасная обработка больших объемов данных

---

### 🟡 2.3.2. КРИТИЧНО: Использование React Query для кеширования ⚠️

**Приоритет:** Важно (от Клода)  
**Время:** 3-4 часа  
**Файлы:**
- `src/pages/Dashboard.tsx`
- `src/pages/ResultsReportNew.tsx`
- Создать: `src/hooks/useProfiles.ts`
- Создать: `src/hooks/useAssessments.ts`

**Проблема:** Каждый переход на страницу → новые запросы к БД
- Нет кеширования данных
- Повторные запросы даже если данные не изменились
- Медленная работа при частой навигации

**Задачи:**
- [ ] Создать хуки с React Query
- [ ] Настроить кеширование для профилей и оценок
- [ ] Обновить компоненты для использования хуков

**Код:**

```typescript
// src/hooks/useProfiles.ts
import { useQuery } from '@tanstack/react-query';
import { getProfiles } from '@/lib/profileStorage';
import { useAuth } from '@/contexts/AuthContext';

export function useProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles', user?.id],
    queryFn: getProfiles,
    enabled: !!user, // Запрос только если пользователь авторизован
    staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
    cacheTime: 10 * 60 * 1000, // 10 минут - данные в кеше
    retry: 2, // Повторить при ошибке 2 раза
  });
}
```

```typescript
// src/hooks/useAssessments.ts
import { useQuery } from '@tanstack/react-query';
import { getCompletedAssessmentsForProfiles } from '@/lib/assessmentStorage';

export function useAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
) {
  return useQuery({
    queryKey: ['assessments', profileIds.sort().join(','), assessmentType],
    queryFn: () => getCompletedAssessmentsForProfiles(profileIds, assessmentType),
    enabled: profileIds.length > 0, // Запрос только если есть профили
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}
```

```typescript
// src/pages/Dashboard.tsx
import { useProfiles } from '@/hooks/useProfiles';
import { useAssessmentsForProfiles } from '@/hooks/useAssessments';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useProfiles();
  
  const profileIds = useMemo(() => profiles.map(p => p.id), [profiles]);
  const { 
    data: assessmentsMap = {}, 
    isLoading: assessmentsLoading 
  } = useAssessmentsForProfiles(profileIds, 'checkup');

  const familyMembers = useMemo(() => {
    return profiles.map(profile => ({
      ...profile,
      checkupAssessment: assessmentsMap[profile.id] || null,
    }));
  }, [profiles, assessmentsMap]);

  const loading = profilesLoading || assessmentsLoading;

  // Обработка ошибок
  useEffect(() => {
    if (profilesError) {
      logger.error('Error loading profiles:', profilesError);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    }
  }, [profilesError]);

  // Остальная логика...
}
```

**Выигрыш:** Мгновенная загрузка при повторных посещениях, меньше нагрузки на БД

---

---

**Приоритет:** Важно  
**Время:** 2-3 часа  
**Файлы:**
- `src/pages/Dashboard.tsx`
- Создать: `src/lib/assessmentStorage.ts` (дополнить)

**Задачи:**
- [ ] Создать функцию для batch запросов оценок
- [ ] Оптимизировать загрузку данных в Dashboard

**Код:**

```typescript
// src/lib/assessmentStorage.ts - добавить функцию

/**
 * Получить завершенные оценки для нескольких профилей одним запросом
 */
export async function getCompletedAssessmentsForProfiles(
  profileIds: string[],
  assessmentType: 'checkup' | 'parent' | 'family'
): Promise<Map<string, Assessment | null>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .in('profile_id', profileIds)
      .eq('assessment_type', assessmentType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    // Группируем по profile_id, берем последнюю завершенную оценку для каждого профиля
    const assessmentMap = new Map<string, Assessment>();
    const seenProfiles = new Set<string>();

    // Сортируем и берем первое для каждого профиля
    for (const assessment of data || []) {
      if (!seenProfiles.has(assessment.profile_id)) {
        assessmentMap.set(assessment.profile_id, assessment);
        seenProfiles.add(assessment.profile_id);
      }
    }

    // Заполняем null для профилей без оценок
    const result = new Map<string, Assessment | null>();
    for (const profileId of profileIds) {
      result.set(profileId, assessmentMap.get(profileId) || null);
    }

    return result;
  } catch (error) {
    logger.error('Error getting assessments for profiles:', error);
    throw error;
  }
}
```

**Обновление Dashboard.tsx:**

```typescript
// src/pages/Dashboard.tsx
import { getCompletedAssessmentsForProfiles } from '@/lib/assessmentStorage';

useEffect(() => {
  async function loadMembers() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profiles = await getProfiles();
      
      // Один запрос для всех оценок
      const childProfiles = profiles.filter(p => p.type === 'child');
      const childProfileIds = childProfiles.map(p => p.id);
      
      const assessmentsMap = await getCompletedAssessmentsForProfiles(
        childProfileIds,
        'checkup'
      );
      
      const membersWithAssessments = profiles.map(profile => ({
        ...profile,
        checkupAssessment: assessmentsMap.get(profile.id) || null,
      }));
      
      setFamilyMembers(membersWithAssessments);
    } catch (error) {
      logger.error('Error loading family members:', error);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }
  loadMembers();
}, [user]);
```

---

### 🟡 2.4. КРИТИЧНО: Добавление мемоизации (React re-renders) ⚠️

**Приоритет:** Важно (от Клода)  
**Время:** 3-4 часа  
**Файлы:**
- `src/pages/Dashboard.tsx`
- `src/pages/ResultsReportNew.tsx`
- `src/hooks/useAssessment.ts`

**Проблема:** Отсутствие мемоизации приводит к ненужным ре-рендерам
- useEffect пересоздает функции при каждом рендере
- Функции передаются в дочерние компоненты → они ре-рендерятся
- Вычисления выполняются при каждом рендере

**Задачи:**
- [ ] Использовать useMemo для вычисляемых значений
- [ ] Использовать useCallback для функций
- [ ] Использовать React.memo для компонентов где нужно

**Код:**

```typescript
// src/pages/Dashboard.tsx
import { useMemo, useCallback } from 'react';

export default function Dashboard() {
  // Мемоизация вычисления возраста и дат
  const membersWithAge = useMemo(() => {
    return familyMembers.map(member => ({
      ...member,
      age: member.dob ? calculateAge(member.dob) : null,
      checkupDate: member.checkupAssessment?.completed_at 
        ? new Date(member.checkupAssessment.completed_at).toLocaleDateString('ru-RU')
        : null,
      hasCompletedCheckup: member.checkupAssessment?.status === 'completed',
    }));
  }, [familyMembers]);

  // Мемоизация обработчика - КРИТИЧНО!
  const loadMembers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profiles = await getProfiles();
      
      const profileIds = profiles.map(p => p.id);
      const assessmentsMap = await getCompletedAssessmentsForProfiles(
        profileIds,
        'checkup'
      );
      
      const membersWithAssessments = profiles.map(profile => ({
        ...profile,
        checkupAssessment: assessmentsMap[profile.id] || null,
      }));
      
      setFamilyMembers(membersWithAssessments);
    } catch (error) {
      logger.error('Error loading family members:', error);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]); // Зависимость от мемоизированной функции

  // Мемоизация обработчика клика
  const handleCheckupClick = useCallback(() => {
    const children = familyMembers.filter(m => m.type === 'child');
    
    if (children.length === 0) {
      navigate("/family-members");
      return;
    }
    
    const childrenWithoutCheckup = children.filter(child => 
      !child.checkupAssessment || child.checkupAssessment.status !== 'completed'
    );
    
    if (childrenWithoutCheckup.length === 0) {
      toast.info('Все дети уже прошли чекап! Вы можете посмотреть результаты в разделе "Ваша семья".');
      return;
    }
    
    const firstChild = childrenWithoutCheckup[0];
    setCurrentProfileId(firstChild.id);
    setCurrentProfile(firstChild);
    navigate(`/checkup-intro/${firstChild.id}`);
  }, [familyMembers, navigate, setCurrentProfileId, setCurrentProfile]);
}
```

```typescript
// src/pages/ResultsReportNew.tsx

// КРИТИЧНО: Мемоизация toggleSection
const toggleSection = useCallback((section: string) => {
  setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
}, []); // Пустой массив зависимостей - функция стабильна

// Мемоизация вычислений
const selectedChildCheckup = useMemo(() => {
  return selectedProfileId 
    ? childrenCheckups.find(c => c.profile.id === selectedProfileId)
    : childrenCheckups[0];
}, [selectedProfileId, childrenCheckups]);
```

**Выигрыш:** Значительно меньше ненужных ре-рендеров, более плавный UI

---

### 🟡 2.6. Bundle size оптимизация 📦

**Приоритет:** Желательно (от Клода)  
**Время:** 4-6 часов  
**Файлы:**
- `src/App.tsx`
- `package.json`
- `vite.config.ts`

**Проблема:** 
- 23 Radix UI пакета, но используется ~10
- recharts ~150KB для простых графиков
- Нет code splitting для страниц
- Импорты иконок неоптимальны

**Задачи:**
- [ ] Добавить lazy loading для страниц
- [ ] Оптимизировать импорты иконок
- [ ] Рассмотреть альтернативу recharts (если возможно)

**Код:**

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy loading для тяжелых страниц
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResultsReportNew = lazy(() => import('./pages/ResultsReportNew'));
const CheckupQuestions = lazy(() => import('./pages/CheckupQuestions'));
const FamilyQuestions = lazy(() => import('./pages/FamilyQuestions'));
const ParentQuestions = lazy(() => import('./pages/ParentQuestions'));

// Компонент загрузки
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                {/* Легкие страницы загружаем сразу */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Тяжелые страницы с lazy loading */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Dashboard />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/results-report/:profileId?" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <ResultsReportNew />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                {/* ... остальные тяжелые страницы */}
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

**Оптимизация иконок:**

```typescript
// ❌ Плохо - импортирует весь модуль
import { User, CheckCircle2, Clock, Settings } from 'lucide-react';

// ✅ Хорошо - tree-shaking работает автоматически с lucide-react
// Но можно явно указать путь для гарантии
import User from 'lucide-react/dist/esm/icons/user';
```

**Альтернатива recharts (опционально):**

Если графики простые, можно использовать более легкую библиотеку:
- Chart.js (~50KB) 
- Victory (~80KB)
- Или собственные SVG компоненты

**Выигрыш:** ~200-300KB меньше bundle, быстрее первоначальная загрузка

---

### 🟡 2.7. Типизация RPC результатов

**Приоритет:** Важно  
**Время:** 3-4 часа  
**Файлы:**
- Создать: `src/types/assessments.ts`
- Обновить: `src/lib/assessmentStorage.ts`
- Обновить: `src/lib/supabase.ts`

**Задачи:**
- [ ] Создать типы для результатов оценок
- [ ] Обновить функции для использования типов

**Код:**

```typescript
// src/types/assessments.ts

export type AssessmentScore = 'typical' | 'concerning' | 'clinical';

export interface CheckupScores {
  emotional: AssessmentScore;
  conduct: AssessmentScore;
  hyperactivity: AssessmentScore;
  peer_problems: AssessmentScore;
  prosocial: AssessmentScore;
  total_difficulties: AssessmentScore;
}

export interface ParentScores {
  emotional_wellbeing: AssessmentScore;
  communication: AssessmentScore;
  boundaries: AssessmentScore;
  consistency: AssessmentScore;
  // ... другие категории
}

export interface FamilyScores {
  family_functioning: AssessmentScore;
  support_systems: AssessmentScore;
  stress_management: AssessmentScore;
  // ... другие категории
}

export interface AssessmentResults {
  assessment_type: 'checkup' | 'parent' | 'family';
  scores: CheckupScores | ParentScores | FamilyScores;
  recommendations?: string[];
  summary?: string;
  completed_at: string;
}
```

**Обновление assessmentStorage.ts:**

```typescript
// src/lib/assessmentStorage.ts
import type { AssessmentResults, CheckupScores } from '@/types/assessments';

export async function completeAssessment(
  assessmentId: string
): Promise<AssessmentResults> {
  try {
    const { data, error } = await supabase.rpc('complete_assessment', {
      assessment_uuid: assessmentId,
    });

    if (error) throw error;

    // Валидация и типизация результата
    return data as AssessmentResults;
  } catch (error) {
    logger.error('Error completing assessment:', error);
    throw error;
  }
}
```

---

### 🟡 2.8. Исправление setTimeout в Register.tsx

**Приоритет:** Важно  
**Время:** 1-2 часа  
**Файл:** `src/pages/Register.tsx`

**Задачи:**
- [ ] Убрать setTimeout
- [ ] Улучшить обработку ошибок регистрации

**Код:**

```typescript
// src/pages/Register.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const result = await signUp(email, password);
    const { data, error } = result;

    // Если пользователь создан, даже если есть ошибка (например, email confirmation)
    if (data?.user) {
      toast.success('Регистрация успешна! Заполните ваш профиль.');
      navigate('/profile');
      return;
    }

    // Если ошибка и пользователь не создан
    if (error) {
      // Проверяем, не является ли ошибка связанной с email confirmation
      const isEmailError = 
        error.message?.toLowerCase().includes('email') ||
        error.message?.toLowerCase().includes('confirmation');

      if (isEmailError) {
        // Пытаемся войти сразу - возможно пользователь уже существует
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInResult.data?.user) {
          toast.success('Регистрация успешна! Заполните ваш профиль.');
          navigate('/profile');
          return;
        }
      }

      toast.error(error.message || 'Ошибка при регистрации');
    } else {
      toast.error('Не удалось создать пользователя');
    }
  } catch (err: unknown) {
    logger.error('Registration exception:', err);
    toast.error('Неожиданная ошибка при регистрации');
  } finally {
    setLoading(false);
  }
};
```

---

## ФАЗА 3: Тестирование и документация (3-5 дней)

### 🟢 3.1. Настройка тестирования

**Приоритет:** Желательно  
**Время:** 1 день  
**Файлы:**
- Создать: `vitest.config.ts`
- Создать: `src/__tests__/`

**Задачи:**
- [ ] Установить Vitest и зависимости
- [ ] Настроить конфигурацию
- [ ] Написать первые тесты

**Установка:**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Конфигурация:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Пример тестов:**

```typescript
// src/__tests__/lib/authUtils.test.ts
import { describe, it, expect } from 'vitest';
import { isSessionValid } from '@/lib/authUtils';
import type { Session } from '@supabase/supabase-js';

describe('isSessionValid', () => {
  it('возвращает false для null сессии', () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it('возвращает true для валидной сессии', () => {
    const session: Session = {
      // ... mock session с будущим expires_at
    } as Session;
    expect(isSessionValid(session)).toBe(true);
  });

  it('возвращает false для истекшей сессии', () => {
    const session: Session = {
      expires_at: Math.floor(Date.now() / 1000) - 100,
    } as Session;
    expect(isSessionValid(session)).toBe(false);
  });
});
```

---

### 🟢 3.2. Создание README.md

**Приоритет:** Желательно  
**Время:** 2-3 часа  
**Файл:** `README.md`

**Задачи:**
- [ ] Описать проект
- [ ] Инструкции по установке
- [ ] Инструкции по запуску
- [ ] Описание архитектуры

**Структура README:**

```markdown
# Little Otter / Balansity

Платформа для оценки психического здоровья семьи.

## Технологии

- React 18 + TypeScript
- Vite
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + shadcn/ui
- React Router
- React Query

## Установка

\`\`\`bash
npm install
\`\`\`

## Настройка

1. Скопируйте \`.env.example\` в \`.env\`
2. Заполните переменные окружения:
   - \`VITE_SUPABASE_URL\`
   - \`VITE_SUPABASE_ANON_KEY\`

## Запуск

\`\`\`bash
# Разработка
npm run dev

# Сборка
npm run build

# Предпросмотр сборки
npm run preview
\`\`\`

## Архитектура

\`\`\`
src/
├── components/    # Переиспользуемые компоненты
├── contexts/      # React контексты (Auth, Profile)
├── hooks/         # Кастомные хуки
├── lib/           # Утилиты и API клиенты
├── pages/         # Страницы приложения
└── types/         # TypeScript типы
\`\`\`

## Миграции базы данных

Миграции находятся в \`supabase/migrations/\`.

Применить миграции:
\`\`\`bash
supabase migration up
\`\`\`
```

---

### 🟢 3.3. Добавление Error Boundaries

**Приоритет:** Желательно  
**Время:** 2-3 часа  
**Файлы:**
- Создать: `src/components/ErrorBoundary.tsx`
- Обновить: `src/App.tsx`

**Код:**

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Отправить в Sentry или другой сервис
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-muted-foreground">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            )}
            <Button onClick={this.handleReset}>Вернуться на главную</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Использование в App.tsx:**

```typescript
// src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  </ErrorBoundary>
);
```

---

## ФАЗА 4: Улучшения TypeScript (постепенно, 5-7 дней)

### 🔵 4.1. Включение строгой типизации

**Приоритет:** Долгосрочно  
**Время:** 3-5 дней (постепенно)  
**Файл:** `tsconfig.json`

**Стратегия:**
1. Включить одну проверку
2. Исправить все ошибки
3. Перейти к следующей

**План:**

```json
// Шаг 1: Включить noUnusedLocals
{
  "noUnusedLocals": true
}
// Исправить все ошибки

// Шаг 2: Включить noUnusedParameters
{
  "noUnusedParameters": true
}
// Исправить все ошибки

// Шаг 3: Включить strictNullChecks
{
  "strictNullChecks": true
}
// Исправить все ошибки (это может занять время)

// Шаг 4: Включить noImplicitAny (последний шаг)
{
  "noImplicitAny": true
}
// Исправить все ошибки
```

**Для каждого шага:**
- [ ] Включить проверку
- [ ] Запустить `npm run build`
- [ ] Исправить все ошибки TypeScript
- [ ] Убедиться, что все работает

---

### 🔵 4.2. Замена всех `any` на конкретные типы

**Приоритет:** Долгосрочно  
**Время:** 2-3 дня  
**Файлы:** Все файлы с `any`

**Задачи:**
- [ ] Найти все использования `any` (уже есть в отчете)
- [ ] Заменить на конкретные типы
- [ ] Использовать `unknown` с type guards где необходимо

**Примеры:**

```typescript
// Было:
catch (err: any) {
  console.error(err.message);
}

// Стало:
catch (err: unknown) {
  if (err instanceof Error) {
    logger.error(err.message);
  } else {
    logger.error('Unknown error:', err);
  }
}
```

---

## Чек-лист выполнения

### Фаза 1 (Критично)
- [ ] 1.1. Создание системы логирования
- [ ] 1.2. Исправление проверки переменных окружения
- [ ] 1.3. Рефакторинг проверки сессий
- [ ] 1.4. Замена alert() на toast
- [ ] 1.5. Исправление дублирования и мертвого кода

### Фаза 2 (Важно)
- [ ] 2.1. Единая система обработки ошибок
- [ ] 2.2. Валидация форм с Zod
- [ ] 2.3. Оптимизация SQL функций (5 SELECT → 1)
- [ ] 2.3.1. Батчевый UPDATE в миграции 010
- [ ] 2.3.2. Использование React Query для кеширования
- [ ] 2.4. Добавление мемоизации (useCallback, useMemo)
- [ ] 2.5. Оптимистичные UI updates
- [ ] 2.6. Bundle size оптимизация
- [ ] 2.7. Типизация RPC результатов
- [ ] 2.8. Исправление setTimeout

### Фаза 3 (Желательно)
- [ ] 3.1. Настройка тестирования
- [ ] 3.2. Создание README.md
- [ ] 3.3. Добавление Error Boundaries

### Фаза 4 (Долгосрочно)
- [ ] 4.1. Включение строгой типизации (пошагово)
- [ ] 4.2. Замена всех `any`

---

## Оценка времени

| Фаза | Время | Приоритет |
|------|-------|-----------|
| Фаза 1 | 4-5 дней | 🔴 Критично (добавлены проблемы от Клода) |
| Фаза 2 | 7-9 дней | 🟡 Важно (расширен план) |
| Фаза 3 | 3-5 дней | 🟢 Желательно |
| Фаза 4 | 5-7 дней | 🔵 Долгосрочно |
| **Итого** | **19-26 дней** | |

---

## Приоритизация для быстрого старта

Если нужно начать быстро, выполните в таком порядке:

1. **День 1:** 1.1, 1.2, 1.3 (логирование, env, сессии)
2. **День 2:** 1.4, 1.5, 2.1 (alert, дублирование, ошибки)
3. **День 3:** 2.3, 2.4 (оптимизация БД, мемоизация)
4. **День 4:** 2.2 (валидация форм)
5. **День 5:** 2.5, 2.6 (типы RPC, setTimeout)

После этого проект будет в хорошем состоянии. Остальное можно делать постепенно.

---

## Дополнительные рекомендации

### Мониторинг ошибок
Рассмотреть интеграцию Sentry или аналогичного сервиса:
```typescript
// src/lib/logger.ts - расширить
import * as Sentry from "@sentry/react";

class Logger {
  error(...args: unknown[]): void {
    console.error('[ERROR]', ...args);
    if (import.meta.env.PROD) {
      Sentry.captureException(args[0]);
    }
  }
}
```

### Code splitting
Добавить lazy loading для страниц:
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<div>Загрузка...</div>}>
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Suspense>
```

### CI/CD
Настроить автоматическую проверку:
- Линтинг
- Типы
- Тесты
- Сборка

---

**Последнее обновление:** 2024

