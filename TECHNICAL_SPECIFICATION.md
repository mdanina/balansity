# Техническое задание: Система оценки психического здоровья семьи (Little Otter / Balansity)

## 1. ОБЩЕЕ ОПИСАНИЕ ПРОЕКТА

### 1.1. Назначение
Веб-приложение для комплексной оценки психического здоровья детей и их семей. Система позволяет родителям проходить опросы о состоянии детей, собственном психическом здоровье и семейной динамике, получая детализированные отчеты с рекомендациями.

### 1.2. Целевая аудитория
- Родители детей от 2 до 12 лет
- Семьи, нуждающиеся в оценке психического здоровья
- Медицинские и образовательные учреждения

### 1.3. Основные функции
1. Регистрация и авторизация пользователей
2. Управление профилями членов семьи
3. Прохождение трех типов опросов:
   - Checkup (о ребенке) - 31 вопрос
   - Parent (о родителе) - 5 вопросов
   - Family (о семье) - 5 вопросов
4. Автоматический расчет результатов и генерация отчетов
5. Просмотр истории оценок и результатов

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК

### 2.1. Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **State Management**: 
  - React Context API (AuthContext, ProfileContext)
  - React Query 5.83.0 (для кеширования данных)
- **UI Framework**: 
  - Tailwind CSS 3.4.17
  - shadcn/ui (Radix UI компоненты)
- **Form Handling**: React Hook Form 7.61.1 + Zod 3.25.76
- **Notifications**: Sonner 1.7.4
- **Charts**: Recharts 2.15.4

### 2.2. Backend & Database
- **BaaS**: Supabase 2.86.0
- **Database**: PostgreSQL (через Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (для будущих файлов)

### 2.3. Development Tools
- **Linter**: ESLint 9.32.0
- **Package Manager**: npm (или bun)
- **Version Control**: Git

---

## 3. СТРУКТУРА ПРОЕКТА

### 3.1. Директории и файлы

```
project-root/
├── public/                    # Статические файлы
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/               # Изображения и медиа
│   │   ├── logo-otters.png
│   │   ├── otter-*.png       # Различные изображения выдр
│   │   └── ...
│   ├── components/           # React компоненты
│   │   ├── ui/              # shadcn/ui компоненты (48 файлов)
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── StepIndicator.tsx
│   │   └── TestimonialSection.tsx
│   ├── contexts/            # React Context провайдеры
│   │   ├── AuthContext.tsx
│   │   └── ProfileContext.tsx
│   ├── data/                # Данные вопросов
│   │   ├── checkupQuestions.ts
│   │   ├── familyQuestions.ts
│   │   └── parentQuestions.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAssessment.ts
│   │   ├── useAssessments.ts
│   │   └── useProfiles.ts
│   ├── lib/                 # Утилиты и библиотеки
│   │   ├── assessmentStorage.ts
│   │   ├── authUtils.ts
│   │   ├── errorHandler.ts
│   │   ├── familyStorage.ts
│   │   ├── logger.ts
│   │   ├── profileStorage.ts
│   │   ├── supabase.ts
│   │   ├── userStorage.ts
│   │   ├── utils.ts
│   │   └── validation/
│   │       └── schemas.ts
│   ├── pages/               # Страницы приложения
│   │   ├── Index.tsx        # Главная страница
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Welcome.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── RegionSelect.tsx
│   │   ├── FamilySetup.tsx
│   │   ├── FamilyMembers.tsx
│   │   ├── AddFamilyMember.tsx
│   │   ├── EditFamilyMember.tsx
│   │   ├── Worries.tsx
│   │   ├── CheckupIntro.tsx
│   │   ├── Checkup.tsx
│   │   ├── CheckupQuestions.tsx
│   │   ├── CheckupInterlude.tsx
│   │   ├── CheckupResults.tsx
│   │   ├── ParentIntro.tsx
│   │   ├── ParentQuestions.tsx
│   │   ├── FamilyIntro.tsx
│   │   ├── FamilyQuestions.tsx
│   │   ├── ResultsReport.tsx
│   │   ├── ResultsReportNew.tsx
│   │   ├── Success.tsx
│   │   ├── ComingSoon.tsx
│   │   └── NotFound.tsx
│   ├── types/               # TypeScript типы
│   │   └── errors.ts
│   ├── App.tsx              # Главный компонент
│   ├── App.css
│   ├── main.tsx             # Точка входа
│   ├── index.css            # Глобальные стили
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/          # SQL миграции
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_scoring_functions.sql
│   │   ├── 004_email_config.sql
│   │   ├── 005_disable_email_confirmation.sql
│   │   ├── 007_fix_reverse_scoring_and_thresholds.sql
│   │   ├── 008_fix_answer_type_null.sql
│   │   ├── 009_add_parent_family_scoring.sql
│   │   ├── 010_recalculate_existing_assessments.sql
│   │   ├── 011_add_composite_indexes.sql
│   │   ├── 013_fix_scoring_according_to_scheme.sql
│   │   └── 014_recalculate_all_assessments.sql
│   ├── env.local.example
│   └── README.md
├── .env.example             # Пример переменных окружения
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json          # Конфигурация shadcn/ui
├── eslint.config.js
└── index.html
```

---

## 4. БАЗА ДАННЫХ

### 4.1. Схема базы данных

#### 4.1.1. Таблица `users`
Расширение `auth.users` из Supabase Auth.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  region TEXT,                    -- "Москва", "Санкт-Петербург" и т.д.
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_region ON public.users(region);
```

**Триггер**: Автоматическое создание записи в `public.users` при регистрации через `handle_new_user()`.

#### 4.1.2. Таблица `profiles`
Профили членов семьи.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('parent', 'child', 'partner', 'sibling', 'caregiver', 'other')),
  first_name TEXT NOT NULL,
  last_name TEXT,
  
  -- Для детей (важно для норм SDQ):
  dob DATE,                      -- Date of birth
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  pronouns TEXT,                 -- 'he', 'she', 'they', 'other'
  
  -- "Worry Domains" (теги проблем):
  worry_tags TEXT[],             -- Массив строк: ['anxiety', 'sleep', 'tantrums']
  
  -- Дополнительная информация
  referral TEXT,                 -- Откуда направлен
  seeking_care TEXT CHECK (seeking_care IN ('yes', 'no')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_type ON public.profiles(type);
CREATE INDEX idx_profiles_dob ON public.profiles(dob);
CREATE INDEX idx_profiles_composite ON public.profiles(id, user_id);
```

#### 4.1.3. Таблица `assessments`
Сессии диагностики.

```sql
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('checkup', 'parent', 'family')),
  
  status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  current_step INT DEFAULT 1,
  total_steps INT,
  
  -- МОНЕТИЗАЦИЯ (Paywall):
  is_paid BOOLEAN DEFAULT false,
  payment_id TEXT,
  
  -- Кэшированные результаты (JSONB):
  results_summary JSONB,
  
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_assessments_profile_id ON public.assessments(profile_id);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessments_type ON public.assessments(assessment_type);
CREATE INDEX idx_assessments_is_paid ON public.assessments(is_paid);
CREATE INDEX idx_assessments_composite ON public.assessments(id, profile_id);
```

#### 4.1.4. Таблица `answers`
Сырые ответы на вопросы.

```sql
CREATE TABLE public.answers (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  
  question_code TEXT NOT NULL,   -- 'checkup_01', 'checkup_22', 'parent_01'
  question_id INT NOT NULL,       -- Числовой ID вопроса
  category TEXT,                 -- 'О ребенке', 'О влиянии', 'О вас', 'О семье'
  
  value INT NOT NULL,            -- Ответ: 0, 1, 2, 3, 4 (или -1 для пропущенных)
  answer_type TEXT,              -- 'default', 'impact', 'frequency', 'wellbeing', 'relationship', 'sex'
  
  step_number INT,               -- Порядковый номер вопроса в сессии
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(assessment_id, question_id)
);

-- Индексы
CREATE INDEX idx_answers_assessment_id ON public.answers(assessment_id);
CREATE INDEX idx_answers_question_code ON public.answers(question_code);
CREATE INDEX idx_answers_category ON public.answers(category);
```

### 4.2. Row Level Security (RLS)

Все таблицы защищены RLS политиками:
- Пользователь может видеть/редактировать только свои данные
- Политики используют JOIN через `profiles` для проверки принадлежности данных

### 4.3. Функции базы данных

#### 4.3.1. `get_active_assessment(p_profile_id UUID, p_assessment_type TEXT)`
- Ищет активную оценку (`status = 'in_progress'`)
- Если не найдена, создает новую
- Возвращает UUID оценки

#### 4.3.2. `complete_assessment(assessment_uuid UUID)`
- Вызывает соответствующую функцию расчета результатов
- Обновляет статус на `completed`
- Сохраняет результаты в `results_summary`
- Устанавливает `completed_at`

#### 4.3.3. `calculate_checkup_scores(assessment_uuid UUID)`
Рассчитывает результаты для Checkup оценки:

**Субдомены:**
1. **Эмоциональные проблемы** (вопросы 2-6):
   - Порог: ≥ 7 → `concerning`, иначе `typical`
   
2. **Поведенческие проблемы** (вопросы 7-11):
   - Вопрос 7 - обратный (reverse scoring применен на фронтенде)
   - Порог: ≥ 4 → `concerning`, иначе `typical`
   
3. **Гиперактивность и внимание** (вопросы 12-16):
   - Вопросы 15, 16 - обратные
   - Порог: ≥ 7 → `concerning`, иначе `typical`
   
4. **Проблемы со сверстниками** (вопросы 17-21):
   - Вопросы 20, 21 - обратные
   - Порог: ≥ 4 → `concerning`, иначе `typical`

**Домен влияния:**
- **Влияние на ребёнка** (вопрос 23): Порог ≥ 2
- **Влияние на родителя** (вопросы 30, 31): Порог ≥ 3
- **Влияние на семью** (вопросы 24-29): Порог ≥ 6

**Обратный подсчет (reverse scoring):**
- Применяется на фронтенде перед сохранением
- Формула: `4 - value` (0→4, 1→3, 2→2, 3→1, 4→0)

#### 4.3.4. `calculate_parent_scores(assessment_uuid UUID)`
Рассчитывает результаты для Parent оценки:

**Субдомены:**
1. **Тревожность (GAD-2)** (вопросы 2-3):
   - Максимальный балл: 6
   - Порог: ≥ 3 → `concerning`, иначе `typical`
   
2. **Депрессия (PHQ-2)** (вопросы 4-5):
   - Максимальный балл: 6
   - Порог: ≥ 3 → `concerning`, иначе `typical`

3. **Общий балл** (сумма тревожности и депрессии):
   - Максимальный балл: 12
   - Порог: ≥ 6 → `concerning`, иначе `typical`

#### 4.3.5. `calculate_family_scores(assessment_uuid UUID)`
Рассчитывает результаты для Family оценки:

**Субдомены:**
1. **Семейный стресс** (вопрос 1):
   - Шкала: 0-4 (0 = "Все в порядке", 4 = "Мы в кризисе")
   - Порог: ≥ 3 → `concerning`, иначе `typical`

2. **Отношения с партнером** (вопросы 2-3):
   - Вопрос 2 - обратный (reverse scoring применен на фронтенде)
   - Вопрос 3 - прямой (частота ссор)
   - Порог: ≥ 6 → `concerning`, иначе `typical`

3. **Совместное воспитание** (вопросы 4-5):
   - Вопрос 4 - обратный (reverse scoring применен на фронтенде)
   - Вопрос 5 - прямой (частота споров)
   - Порог: ≥ 6 → `concerning`, иначе `typical`

---

## 5. СТРУКТУРА ВОПРОСОВ

### 5.1. Checkup Questions (31 вопрос)

**Категория "О ребенке" (вопросы 1-21):**
- Тип ответа: `default`
- Варианты: "Совсем нет" (0), "Немного" (1), "Иногда" (2), "Часто" (3), "Большую часть времени" (4)
- Обратные вопросы (reverse scoring): 7, 14, 15, 16, 17, 20, 21

**Категория "О влиянии" (вопросы 22-31):**
- Тип ответа: `impact`
- Варианты: "Совсем нет" (0), "Только немного" (1), "В средней степени" (2), "Очень сильно" (3)

**Промежуточный экран (Interlude):**
- Показывается после вопроса 21
- Переход на вопросы о влиянии

### 5.2. Parent Questions (5 вопросов)

1. **Пол, присвоенный при рождении** (`sex`):
   - Варианты: "Женский" (0), "Мужской" (1), "Другое" (2), "Предпочитаю не говорить" (3)

2-5. **Вопросы о тревожности и депрессии** (`frequency`):
   - Варианты: "Совсем нет" (0), "Несколько дней" (1), "Больше половины дней" (2), "Почти каждый день" (3)

### 5.3. Family Questions (5 вопросов)

1. **Как дела у вашей семьи?** (`wellbeing`):
   - Варианты: "Все в порядке" (0) → "Мы в кризисе" (4)

2. **Отношения с партнером** (`relationship`, обратный):
   - Варианты: "Все время" (0) → "Никогда" (5), "Не применимо" (6)

3. **Частота ссор** (`frequency`):
   - Варианты: "Все время" (0) → "Никогда" (5), "Не применимо" (6)

4. **Совместное воспитание** (`frequency`, обратный):
   - Варианты: "Все время" (0) → "Никогда" (5), "Не применимо" (6)

5. **Споры о воспитании** (`frequency`):
   - Варианты: "Все время" (0) → "Никогда" (5), "Не применимо" (6)

---

## 6. МАРШРУТИЗАЦИЯ

### 6.1. Публичные маршруты
- `/` - Главная страница
- `/login` - Вход
- `/register` - Регистрация
- `/welcome` - Приветственная страница
- `/coming-soon` - Страница "Скоро"

### 6.2. Защищенные маршруты (требуют авторизации)
- `/success` - Страница успешной регистрации
- `/profile` - Профиль пользователя
- `/region` - Выбор региона
- `/family-setup` - Настройка семьи
- `/family-members` - Список членов семьи
- `/add-family-member` - Добавление члена семьи
- `/edit-family-member/:id` - Редактирование члена семьи
- `/worries/:profileId?` - Выбор беспокойств
- `/checkup-intro/:profileId?` - Введение в Checkup
- `/checkup` - Checkup (устаревший)
- `/checkup-questions/:profileId?` - Вопросы Checkup
- `/checkup-interlude/:profileId?` - Промежуточный экран
- `/checkup-results` - Результаты Checkup (устаревший)
- `/parent-intro` - Введение в Parent опрос
- `/parent-questions/:profileId?` - Вопросы Parent
- `/family-intro` - Введение в Family опрос
- `/family-questions/:profileId?` - Вопросы Family
- `/results-report/:profileId?` - Отчет о результатах
- `/dashboard` - Главная панель пользователя

### 6.3. Lazy Loading
Тяжелые страницы загружаются асинхронно:
- RegionSelect, Success, Profile, FamilySetup, FamilyMembers
- AddFamilyMember, EditFamilyMember, Worries
- CheckupIntro, Checkup, CheckupQuestions, CheckupInterlude
- ParentIntro, ParentQuestions, FamilyIntro, FamilyQuestions
- CheckupResults, ResultsReport, ResultsReportNew, Dashboard

---

## 7. АВТОРИЗАЦИЯ И БЕЗОПАСНОСТЬ

### 7.1. Supabase Auth
- Email/Password аутентификация
- Автоматическое создание записи в `public.users` при регистрации
- Подтверждение email отключено (`GOTRUE_MAILER_AUTOCONFIRM=true`)
- Сессии с автоматическим обновлением токенов

### 7.2. Защита маршрутов
- Компонент `ProtectedRoute` проверяет авторизацию
- Проверка валидности сессии через `isSessionValid()`
- Редирект на `/login` при отсутствии авторизации

### 7.3. Row Level Security (RLS)
- Все таблицы защищены RLS политиками
- Пользователь видит только свои данные
- Политики проверяют принадлежность через `auth.uid()`

### 7.4. Валидация данных
- Zod схемы для валидации форм
- Валидация на клиенте и сервере
- Типизация TypeScript для безопасности типов

---

## 8. ЛОГИКА РАБОТЫ С ОЦЕНКАМИ

### 8.1. Создание оценки
1. Пользователь начинает опрос
2. Вызывается `get_active_assessment()`:
   - Ищет активную оценку (`status = 'in_progress'`)
   - Если найдена - восстанавливает прогресс
   - Если не найдена - создает новую

### 8.2. Сохранение ответов
1. Пользователь отвечает на вопрос
2. Применяется reverse scoring (если вопрос обратный)
3. Ответ сохраняется через `saveAnswer()`:
   - Используется `upsert` для обновления существующего ответа
   - Обновляется `current_step` в оценке
4. Оптимистичное обновление UI (с откатом при ошибке)

### 8.3. Завершение оценки
1. После последнего вопроса вызывается `complete()`
2. Вызывается `complete_assessment()`:
   - Определяется тип оценки
   - Вызывается соответствующая функция расчета
   - Результаты сохраняются в `results_summary`
   - Статус меняется на `completed`

### 8.4. Восстановление прогресса
- При загрузке страницы проверяется `current_step`
- Загружаются сохраненные ответы
- Восстанавливается позиция в опросе
- Для обратных вопросов применяется обратное преобразование для отображения

---

## 9. ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ

### 9.1. Структура отчета
1. **Итоги** - краткая сводка по всем оценкам
2. **Ментальное здоровье детей** - детальные результаты для каждого ребенка
3. **Ваше ментальное здоровье** - результаты Parent оценки
4. **Ментальное здоровье семьи** - результаты Family оценки

### 9.2. Визуализация
- Прогресс-бары для каждого субдомена
- Цветовая индикация статусов:
  - `concerning` / `high_impact` - красный
  - `borderline` / `medium_impact` - желтый
  - `typical` / `low_impact` - синий/зеленый
- Collapsible секции с объяснениями и рекомендациями

### 9.3. Worry Tags
- Отображаются теги беспокойств, выбранные при создании профиля
- Разделение по категориям: о ребенке, о себе, о семье

---

## 10. НАСТРОЙКА ОКРУЖЕНИЯ

### 10.1. Переменные окружения

Создать файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 10.2. Установка зависимостей

```bash
npm install
# или
bun install
```

### 10.3. Настройка Supabase

1. Создать проект в Supabase
2. Применить миграции в порядке:
   - 001_initial_schema.sql
   - 002_rls_policies.sql
   - 003_scoring_functions.sql
   - 004_email_config.sql
   - 005_disable_email_confirmation.sql
   - 007_fix_reverse_scoring_and_thresholds.sql
   - 008_fix_answer_type_null.sql
   - 009_add_parent_family_scoring.sql
   - 010_recalculate_existing_assessments.sql
   - 011_add_composite_indexes.sql
   - 013_fix_scoring_according_to_scheme.sql
   - 014_recalculate_all_assessments.sql

3. Настроить email (опционально):
   - В файле `.env` на сервере Supabase установить `GOTRUE_MAILER_AUTOCONFIRM=true`
   - Настроить SMTP для отправки писем (если нужно)

### 10.4. Запуск проекта

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

---

## 11. ОСОБЕННОСТИ РЕАЛИЗАЦИИ

### 11.1. Оптимизация производительности
- Lazy loading для тяжелых компонентов
- React Query для кеширования данных
- Оптимистичное обновление UI
- Batch запросы для избежания N+1 проблемы

### 11.2. Обработка ошибок
- ErrorBoundary для перехвата ошибок React
- Try-catch блоки в асинхронных функциях
- Логирование через `logger.ts`
- Toast уведомления для пользователя

### 11.3. Reverse Scoring
- Применяется на фронтенде перед сохранением
- Формула: `4 - value` для вопросов с `isReverse: true`
- При восстановлении ответов применяется обратное преобразование для отображения

### 11.4. Пропущенные вопросы
- Значение `-1` означает пропущенный вопрос
- Пропущенные вопросы не учитываются в расчетах
- Условие: `value >= 0` в SQL запросах

### 11.5. Множественные дети
- Система автоматически переходит к следующему ребенку после завершения Checkup
- Каждый ребенок имеет свою оценку Checkup
- Parent и Family оценки привязаны к профилю родителя

---

## 12. ТИПЫ ДАННЫХ

### 12.1. Profile Types
- `parent` - Родитель
- `child` - Ребенок
- `partner` - Партнер
- `sibling` - Брат/сестра
- `caregiver` - Опекун
- `other` - Другое

### 12.2. Assessment Types
- `checkup` - Оценка ребенка (31 вопрос)
- `parent` - Оценка родителя (5 вопросов)
- `family` - Оценка семьи (5 вопросов)

### 12.3. Assessment Status
- `in_progress` - В процессе
- `completed` - Завершена
- `abandoned` - Прервана

### 12.4. Answer Types
- `default` - Стандартные ответы (0-4)
- `impact` - Вопросы о влиянии (0-3)
- `frequency` - Частота (0-3 или 0-6)
- `wellbeing` - Благополучие (0-4)
- `relationship` - Отношения (0-6)
- `sex` - Пол (0-3)

### 12.5. Result Status
- `concerning` - Требует внимания
- `borderline` - Погранично (только для некоторых субдоменов)
- `typical` - Типично (норма)
- `high_impact` - Высокое влияние (legacy)
- `medium_impact` - Среднее влияние (legacy)
- `low_impact` - Низкое влияние (legacy)

---

## 13. WORRY TAGS (БЕСПОКОЙСТВА)

### 13.1. О ребенке
- Фокус и внимание
- Грусть и плач
- Тревоги и беспокойства
- Питание
- Сон и режим
- Туалет
- Сенсорная чувствительность
- Гнев и агрессия
- Импульсивность
- Травма
- Горе и потеря
- Буллинг
- Самооценка
- Школа/детский сад
- Удары, укусы или пинки
- Гендерная или сексуальная идентичность
- Сотрудничество

### 13.2. О себе (родитель)
- Выгорание
- Тревожность
- Пониженное настроение
- Трудности с концентрацией внимания
- Общий стресс

### 13.3. О семье
- Разделение/развод
- Семейный стресс
- Отношения с партнером
- Психическое здоровье партнера
- Воспитание
- Семейный конфликт

---

## 14. ПОРЯДОК ПРОХОЖДЕНИЯ ОПРОСОВ

### 14.1. Типичный флоу
1. Регистрация/Вход
2. Выбор региона
3. Настройка семьи (добавление членов)
4. Выбор беспокойств (Worries) для каждого члена
5. Checkup для каждого ребенка:
   - Вопросы 1-21 (о ребенке)
   - Interlude (промежуточный экран)
   - Вопросы 22-31 (о влиянии)
6. Parent опрос (о родителе)
7. Family опрос (о семье)
8. Просмотр результатов

### 14.2. Автоматические переходы
- После завершения Checkup для одного ребенка → автоматический переход к следующему
- После завершения всех Checkup → переход к Parent опросу
- После завершения Parent → переход к Family опросу
- После завершения всех опросов → переход к результатам

---

## 15. UI/UX ОСОБЕННОСТИ

### 15.1. Дизайн
- Современный минималистичный дизайн
- Использование изображений выдр (otter) как брендинг
- Цветовая схема: teal/purple/pink
- Адаптивный дизайн (mobile-first)

### 15.2. Компоненты
- shadcn/ui компоненты для консистентности
- Кастомные компоненты для специфичных функций
- Toast уведомления для обратной связи
- Progress bars для визуализации прогресса

### 15.3. Анимации
- Плавные переходы между вопросами
- Hover эффекты на интерактивных элементах
- Loading состояния

---

## 16. ТЕСТИРОВАНИЕ И ОТЛАДКА

### 16.1. Логирование
- Централизованный логгер (`logger.ts`)
- Разные уровни: log, warn, error
- В dev режиме вывод в консоль

### 16.2. Обработка ошибок
- ErrorBoundary для перехвата ошибок React
- Try-catch в асинхронных функциях
- Понятные сообщения об ошибках для пользователя

### 16.3. Валидация
- Zod схемы для валидации форм
- Проверка на фронтенде и бэкенде
- Сообщения об ошибках валидации

---

## 17. РАЗВЕРТЫВАНИЕ

### 17.1. Build
```bash
npm run build
```

Создает оптимизированную сборку в `dist/`

### 17.2. Переменные окружения для продакшена
Убедиться, что установлены:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 17.3. Хостинг
- Статические файлы можно разместить на любом хостинге
- Рекомендуется: Vercel, Netlify, Cloudflare Pages
- Или собственный сервер с nginx

---

## 18. БУДУЩИЕ УЛУЧШЕНИЯ

### 18.1. Планируемые функции
- Монетизация (paywall для полных отчетов)
- История отчетов
- Экспорт отчетов в PDF
- Email уведомления
- Многоязычность
- Мобильное приложение

### 18.2. Технические улучшения
- Unit тесты
- E2E тесты
- CI/CD pipeline
- Мониторинг и аналитика
- Оптимизация производительности

---

## 19. ВАЖНЫЕ ЗАМЕЧАНИЯ

### 19.1. Reverse Scoring
- **КРИТИЧНО**: Reverse scoring применяется на фронтенде ПЕРЕД сохранением
- В базе данных хранятся уже преобразованные значения
- При восстановлении ответов для отображения применяется обратное преобразование

### 19.2. Пороговые значения
- Пороги могут быть скорректированы на основе клинических данных
- Текущие пороги основаны на научных исследованиях (SDQ, PHQ-2, GAD-2)

### 19.3. Пропущенные вопросы
- Значение `-1` означает пропущенный вопрос
- Пропущенные вопросы исключаются из расчетов (`value >= 0`)

### 19.4. Множественные оценки
- Для каждого профиля может быть только одна активная оценка каждого типа
- При создании новой оценки старая активная оценка не удаляется, но новая становится активной

---

## 20. КОНТАКТЫ И ПОДДЕРЖКА

### 20.1. Документация
- Supabase: https://supabase.com/docs
- React: https://react.dev
- React Router: https://reactrouter.com
- shadcn/ui: https://ui.shadcn.com

### 20.2. Полезные команды
```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка проекта
npm run build

# Линтинг
npm run lint

# Просмотр сборки
npm run preview
```

---

## ЗАКЛЮЧЕНИЕ

Данное техническое задание содержит полную информацию о структуре, логике и реализации проекта. Следуя этому документу, любой разработчик сможет воспроизвести проект в точности.

**Важно**: При внесении изменений обновляйте этот документ для поддержания актуальности.

---

*Документ создан: 2024*
*Версия: 1.0*




