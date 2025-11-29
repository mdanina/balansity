-- Добавляем поле worry_tags в таблицу assessments для сохранения тегов на момент прохождения чекапа
-- Это позволит фиксировать теги в отчете до следующего чекапа

alter table public.assessments
add column if not exists worry_tags jsonb;

comment on column public.assessments.worry_tags is 
'Теги беспокойств (worry tags) на момент прохождения чекапа. 
Структура: {
  "child": ["тег1", "тег2"],
  "personal": ["тег1"],
  "family": ["тег1", "тег2"]
}';

-- Создаем индекс для быстрого поиска
create index if not exists idx_assessments_worry_tags on public.assessments using gin (worry_tags);

