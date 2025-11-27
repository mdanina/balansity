export interface ParentQuestion {
  id: number;
  text: string;
  category: string;
  answerType: 'sex' | 'frequency' | 'default';
}

export const parentQuestions: ParentQuestion[] = [
  { id: 1, text: "Пол, присвоенный при рождении", category: "You", answerType: 'sex' },
  { id: 2, text: "Чувство нервозности, тревоги или беспокойства", category: "You", answerType: 'frequency' },
  { id: 3, text: "Невозможность остановить или контролировать беспокойство", category: "You", answerType: 'frequency' },
  { id: 4, text: "Малый интерес или удовольствие от занятий", category: "You", answerType: 'frequency' },
  { id: 5, text: "Чувство подавленности, депрессии или безнадежности", category: "You", answerType: 'frequency' },
];

export const sexOptions = [
  { value: 0, label: "Женский" },
  { value: 1, label: "Мужской" },
  { value: 2, label: "Другое" },
  { value: 3, label: "Предпочитаю не говорить" },
];

export const frequencyOptions = [
  { value: 0, label: "Совсем нет" },
  { value: 1, label: "Несколько дней" },
  { value: 2, label: "Больше половины дней" },
  { value: 3, label: "Почти каждый день" },
];
