export interface FamilyQuestion {
  id: number;
  text: string;
  category: string;
  answerType: 'wellbeing' | 'relationship' | 'default';
}

export const familyQuestions: FamilyQuestion[] = [
  { id: 1, text: "How is your family doing?", category: "Family", answerType: 'wellbeing' },
  { id: 2, text: "In general, how often do you think that things between you and your partner are going well?", category: "Family", answerType: 'relationship' },
];

export const wellbeingOptions = [
  { value: 0, label: "Everything is fine" },
  { value: 1, label: "We are stressed but managing" },
  { value: 2, label: "We are very stressed" },
  { value: 3, label: "We won't be able to handle things soon" },
  { value: 4, label: "We are in crisis" },
];

export const relationshipOptions = [
  { value: 0, label: "All of the time" },
  { value: 1, label: "Most of the time" },
  { value: 2, label: "More often than not" },
  { value: 3, label: "Occasionally" },
  { value: 4, label: "Rarely" },
  { value: 5, label: "Never" },
  { value: 6, label: "Not applicable" },
];
