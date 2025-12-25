// Main Layout
export { AnalysisLayout, type Appointment } from './AnalysisLayout';

// Source Panel Components
export { SourcePanel } from './source-panel/SourcePanel';
export { TranscriptView } from './source-panel/TranscriptView';
export { NotesView } from './source-panel/NotesView';
export { FilesView } from './source-panel/FilesView';

// Output Panel Components
export { OutputPanel } from './output-panel/OutputPanel';
export { TemplateSelector as OutputTemplateSelector } from './output-panel/TemplateSelector';
export { GenerateButton } from './output-panel/GenerateButton';
export { SectionsList } from './output-panel/SectionsList';
export { SectionItem } from './output-panel/SectionItem';

// Legacy Components (for backward compatibility with AI-analysis page)
export { TemplateSelector } from './TemplateSelector';
export { TranscriptInput } from './TranscriptInput';
export { GenerationProgress } from './GenerationProgress';
export { ClinicalNoteOutput } from './ClinicalNoteOutput';
