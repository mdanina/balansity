export interface ParentQuestion {
  id: number;
  text: string;
  category: string;
  answerType: 'sex' | 'frequency' | 'default';
}

export const parentQuestions: ParentQuestion[] = [
  { id: 1, text: "Sex designated at birth", category: "You", answerType: 'sex' },
  { id: 2, text: "Feeling nervous, anxious, or on edge", category: "You", answerType: 'frequency' },
  { id: 3, text: "Not being able to stop or control worrying", category: "You", answerType: 'frequency' },
  { id: 4, text: "Little interest or pleasure in doing things", category: "You", answerType: 'frequency' },
  { id: 5, text: "Feeling down, depressed, or hopeless", category: "You", answerType: 'frequency' },
];

export const sexOptions = [
  { value: 0, label: "Female" },
  { value: 1, label: "Male" },
  { value: 2, label: "Other" },
  { value: 3, label: "Prefer not say" },
];

export const frequencyOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];
