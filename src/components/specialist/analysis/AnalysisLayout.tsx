/**
 * 2-колоночный layout для AI-анализа сессии
 * Перенесено из PsiPilot для Balansity
 */

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { SourcePanel } from './source-panel/SourcePanel';
import { OutputPanel } from './output-panel/OutputPanel';
import type { GeneratedClinicalNote } from '@/types/ai.types';

export interface Appointment {
  id: string;
  user_id: string;
  profile_id: string | null;
  appointment_type_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  transcript: string | null;
  transcript_status: string | null;
  summary: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  specialist_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AnalysisLayoutProps {
  appointmentId: string;
  appointment: Appointment;
  clinicalNotes: GeneratedClinicalNote[];
  onNotesUpdate: () => void;
}

/**
 * 2-колоночный layout для AI-анализа сессии
 * Левая колонка: источники (транскрипт, заметки, файлы)
 * Правая колонка: результат (секции, редактор)
 */
export function AnalysisLayout({
  appointmentId,
  appointment,
  clinicalNotes,
  onNotesUpdate,
}: AnalysisLayoutProps) {
  return (
    <div className="flex-1 overflow-hidden h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Левая колонка - Источники */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <SourcePanel appointmentId={appointmentId} appointment={appointment} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Правая колонка - Результат */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <OutputPanel
            appointmentId={appointmentId}
            appointment={appointment}
            clinicalNotes={clinicalNotes}
            onNotesUpdate={onNotesUpdate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
