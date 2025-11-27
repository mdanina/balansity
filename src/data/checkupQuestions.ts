export interface Question {
  id: number;
  text: string;
  category: string;
  answerType?: 'default' | 'impact';
}

export const checkupQuestions: Question[] = [
  { id: 1, text: "Мой ребенок часто грустный, подавленный или плачет", category: "Al" },
  { id: 2, text: "У моего ребенка много беспокойств или он часто выглядит обеспокоенным", category: "Al" },
  { id: 3, text: "У моего ребенка часто болит живот, голова или другие боли", category: "Al" },
  { id: 4, text: "Мой ребенок нервный или цепляется в новых ситуациях", category: "Al" },
  { id: 5, text: "У моего ребенка много страхов", category: "Al" },
  { id: 6, text: "Мой ребенок часто теряет самообладание / устраивает истерики", category: "Al" },
  { id: 7, text: "Мой ребенок обычно хорошо себя ведет, делает то, что просят взрослые", category: "Al" },
  { id: 8, text: "Мой ребенок часто дерется с другими детьми или обижает их", category: "Al" },
  { id: 9, text: "Мой ребенок часто лжет или обманывает", category: "Al" },
  { id: 10, text: "Мой ребенок ворует из дома, школы или в другом месте", category: "Al" },
  { id: 11, text: "Мой ребенок не может усидеть на месте, слишком активный", category: "Al" },
  { id: 12, text: "Мой ребенок постоянно ерзает или крутится", category: "Al" },
  { id: 13, text: "Мой ребенок легко отвлекается, трудно удержать внимание", category: "Al" },
  { id: 14, text: "Мой ребенок думает, прежде чем действовать", category: "Al" },
  { id: 15, text: "Мой ребенок доводит дело до конца, хорошо концентрируется", category: "Al" },
  { id: 16, text: "У моего ребенка хорошие отношения с другими детьми", category: "Al" },
  { id: 17, text: "Мой ребенок добр к младшим детям", category: "Al" },
  { id: 18, text: "Мой ребенок часто спорит со взрослыми", category: "Al" },
  { id: 19, text: "Мой ребенок может быть злым и мстительным", category: "Al" },
  { id: 20, text: "Мой ребенок помогает, если кто-то ранен, расстроен или болен", category: "Al" },
  { id: 21, text: "My child is liked by other children", category: "Al" },
  { id: 22, text: "Distress/upset your child?", category: "Al", answerType: 'impact' },
  { id: 23, text: "Interfere with home life", category: "Al", answerType: 'impact' },
  { id: 24, text: "Interfere with friendships", category: "Al", answerType: 'impact' },
  { id: 25, text: "Interfere with your child's learning/schooling", category: "Al", answerType: 'impact' },
  { id: 26, text: "Interfere with your child participating in activities", category: "Al", answerType: 'impact' },
  { id: 27, text: "Limit your family's participation in everyday activities or routines", category: "Al", answerType: 'impact' },
  { id: 28, text: "Negatively impacts your other children", category: "Al", answerType: 'impact' },
  { id: 29, text: "Negatively impacts your mental health", category: "Al", answerType: 'impact' },
  { id: 30, text: "Negatively impacts your partner's mental health", category: "Al", answerType: 'impact' },
  { id: 31, text: "Negatively impacts your relationship with your partner", category: "Al", answerType: 'impact' },
];

export const answerOptions = [
  { value: 0, label: "Совсем нет", labelEn: "Not at all" },
  { value: 1, label: "Немного", labelEn: "A little" },
  { value: 2, label: "Иногда", labelEn: "Sometimes" },
  { value: 3, label: "Часто", labelEn: "Often" },
  { value: 4, label: "Большую часть времени", labelEn: "Most of the time" },
];

export const impactAnswerOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Only a little" },
  { value: 2, label: "A medium amount" },
  { value: 3, label: "A great deal" },
];
