# Инструкция по интеграции Supabase

## ✅ Что было создано

### 1. SQL Миграции (`supabase/migrations/`)

- **001_initial_schema.sql** - Создание всех таблиц (users, profiles, assessments, answers)
- **002_rls_policies.sql** - Настройка Row Level Security для защиты данных
- **003_scoring_functions.sql** - Функции для подсчета баллов SDQ и завершения оценок

### 2. TypeScript утилиты (`src/lib/`)

- **supabase.ts** - Клиент Supabase с типами
- **profileStorage.ts** - Работа с профилями (CRUD операции)
- **assessmentStorage.ts** - Работа с оценками и ответами

### 3. Функциональность

✅ **Сохранение ответов** - Каждый ответ сохраняется в БД  
✅ **Восстановление прогресса** - Можно продолжить с места остановки  
✅ **Подсчет баллов** - Автоматический расчет результатов  
✅ **Paywall** - Поддержка монетизации через поле `is_paid`  
✅ **Безопасность** - RLS политики защищают данные пользователей  

---

## 🚀 Следующие шаги

### 1. Установить Supabase клиент

```bash
npm install @supabase/supabase-js
```

### 2. Настроить переменные окружения

Создайте `.env.local`:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Применить миграции в Supabase

1. Откройте Supabase Dashboard → SQL Editor
2. Выполните миграции по порядку (001, 002, 003)

### 4. Обновить компоненты

Нужно обновить компоненты вопросов для использования новых утилит:

- `CheckupQuestions.tsx` - использовать `assessmentStorage.ts`
- `ParentQuestions.tsx` - использовать `assessmentStorage.ts`
- `FamilyQuestions.tsx` - использовать `assessmentStorage.ts`
- `FamilyMembers.tsx` - использовать `profileStorage.ts` вместо `familyStorage.ts`

---

## 📝 Пример использования

### Сохранение ответа на вопрос

```typescript
import { saveAnswer, updateAssessmentStep } from '@/lib/assessmentStorage';

// При ответе на вопрос
await saveAnswer(assessmentId, {
  questionId: currentQuestion.id,
  questionCode: `checkup_${currentQuestion.id}`,
  category: currentQuestion.category,
  value: selectedValue,
  answerType: currentQuestion.answerType,
  stepNumber: currentQuestionIndex + 1
});

// Обновить прогресс
await updateAssessmentStep(assessmentId, currentQuestionIndex + 1);
```

### Восстановление прогресса

```typescript
import { getActiveAssessment, getAnswers } from '@/lib/assessmentStorage';

// При загрузке страницы
const assessment = await getActiveAssessment(profileId, 'checkup');
if (assessment) {
  // Продолжить с assessment.current_step
  setCurrentQuestionIndex(assessment.current_step - 1);
  
  // Загрузить сохраненные ответы
  const savedAnswers = await getAnswers(assessment.id);
  // Восстановить состояние
}
```

### Завершение оценки

```typescript
import { completeAssessment } from '@/lib/assessmentStorage';

// После последнего вопроса
const results = await completeAssessment(assessmentId);
// results содержит рассчитанные баллы
```

---

## 🔄 Миграция с localStorage

Текущий код использует `localStorage` через `familyStorage.ts`. 

**План миграции:**
1. Сохранить `familyStorage.ts` как fallback
2. Обновить компоненты для использования `profileStorage.ts`
3. Добавить проверку: если пользователь не авторизован → использовать localStorage
4. После авторизации → мигрировать данные из localStorage в Supabase

---

## ⚠️ Важные замечания

1. **Авторизация обязательна** - RLS политики требуют `auth.uid()`
2. **Обработка ошибок** - Добавьте try-catch во все вызовы Supabase
3. **Оптимистичные обновления** - Для лучшего UX обновляйте UI до подтверждения от сервера
4. **Кэширование** - Используйте React Query для кэширования данных

---

## 📚 Дополнительные ресурсы

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)








