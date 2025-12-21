export interface Question {
  id: number;
  text: string;
  category: string;
  answerType?: 'default' | 'impact';
  isReverse?: boolean; // Для обратных вопросов (reverse scoring)
}

export const checkupQuestions: Question[] = [
  { id: 1, text: "Мой ребенок часто грустный, подавленный или плачет", category: "О ребенке", answerType: 'default' },
  { id: 2, text: "У моего ребенка много беспокойств или он часто выглядит обеспокоенным", category: "О ребенке", answerType: 'default' },
  { id: 3, text: "У моего ребенка часто болит живот, голова или другие боли", category: "О ребенке", answerType: 'default' },
  { id: 4, text: "Мой ребенок нервничает в новых ситуациях", category: "О ребенке", answerType: 'default' },
  { id: 5, text: "У моего ребенка много страхов", category: "О ребенке", answerType: 'default' },
  { id: 6, text: "Мой ребенок часто теряет самообладание / устраивает истерики", category: "О ребенке", answerType: 'default' },
  { id: 7, text: "Мой ребенок обычно хорошо себя ведет, делает то, что просят взрослые", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 8, text: "Мой ребенок часто дерется с другими детьми или обижает их", category: "О ребенке", answerType: 'default' },
  { id: 9, text: "Мой ребенок часто лжет или обманывает", category: "О ребенке", answerType: 'default' },
  { id: 10, text: "Мой ребенок ворует из дома, школы или в другом месте", category: "О ребенке", answerType: 'default' },
  { id: 11, text: "Мой ребенок не может усидеть на месте, слишком активный", category: "О ребенке", answerType: 'default' },
  { id: 12, text: "Мой ребенок постоянно ерзает или крутится", category: "О ребенке", answerType: 'default' },
  { id: 13, text: "Мой ребенок легко отвлекается, ему трудно удержать внимание", category: "О ребенке", answerType: 'default' },
  { id: 14, text: "Мой ребенок думает, прежде чем действовать", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 15, text: "Мой ребенок доводит дело до конца, хорошо концентрируется", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 16, text: "У моего ребенка хорошие отношения с другими детьми", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 17, text: "Мой ребенок добр к младшим детям", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 18, text: "Мой ребенок часто спорит со взрослыми", category: "О ребенке", answerType: 'default' },
  { id: 19, text: "Мой ребенок может быть злым и мстительным", category: "О ребенке", answerType: 'default' },
  { id: 20, text: "Мой ребенок помогает, если кто-то ранен, расстроен или болен", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 21, text: "Моего ребенка любят другие дети", category: "О ребенке", answerType: 'default', isReverse: true },
  { id: 22, text: "Дискомфорт, расстраивают его", category: "О влиянии", answerType: 'impact' },
  { id: 23, text: "Мешают ли домашней жизни", category: "О влиянии", answerType: 'impact' },
  { id: 24, text: "Мешают ли дружбе", category: "О влиянии", answerType: 'impact' },
  { id: 25, text: "Мешают ли обучению/школе вашего ребенка", category: "О влиянии", answerType: 'impact' },
  { id: 26, text: "Мешают ли вашему ребенку участвовать в мероприятиях", category: "О влиянии", answerType: 'impact' },
  { id: 27, text: "Ограничивают ли участие вашей семьи в повседневных делах или рутине", category: "О влиянии", answerType: 'impact' },
  { id: 28, text: "Негативно влияют на ваших других детей", category: "О влиянии", answerType: 'impact' },
  { id: 29, text: "Негативно влияют на ваше психическое здоровье", category: "О влиянии", answerType: 'impact' },
  { id: 30, text: "Негативно влияют на психическое здоровье вашего партнера", category: "О влиянии", answerType: 'impact' },
  { id: 31, text: "Негативно влияют на ваши отношения с партнером", category: "О влиянии", answerType: 'impact' },
];

export const answerOptions = [
  { value: 0, label: "Совсем нет" },
  { value: 1, label: "Немного" },
  { value: 2, label: "Иногда" },
  { value: 3, label: "Часто" },
  { value: 4, label: "Большую часть времени" },
];

export const impactAnswerOptions = [
  { value: 0, label: "Совсем нет" },
  { value: 1, label: "Только немного" },
  { value: 2, label: "В средней степени" },
  { value: 3, label: "Очень сильно" },
];
