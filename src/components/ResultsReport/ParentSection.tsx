import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { Database } from "@/lib/supabase";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  total?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

const personalWorries = [
  "Выгорание",
  "Тревожность",
  "Пониженное настроение",
  "Трудности с концентрацией внимания",
  "Общий стресс",
];

interface ParentSectionProps {
  parentProfile: Profile | null;
  parentAssessment: Assessment | null;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function ParentSection({ parentProfile, parentAssessment, openSections, toggleSection }: ParentSectionProps) {
  if (!parentAssessment) {
    return null;
  }

  // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профиля
  const assessmentWorryTags = parentAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
  const personalWorryTags = assessmentWorryTags?.personal || parentProfile?.worry_tags?.filter(w => personalWorries.includes(w)) || [];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>
      
      {/* Worries Section - о себе */}
      {personalWorryTags.length > 0 && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Беспокойства о себе</h3>
          </div>
          <p className="mb-4 text-foreground/70">
            Беспокойства, которыми вы поделились о себе
          </p>
          <div className="flex flex-wrap gap-2">
            {personalWorryTags.map((worry, index) => (
              <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                {worry}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {parentAssessment.results_summary ? (
        (() => {
          const parentResults = parentAssessment.results_summary as ParentResults;
          return (
            <div className="space-y-6">
              <p className="text-foreground/70 mb-4">
                Результаты родительской оценки {parentAssessment.completed_at 
                  ? new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')
                  : ''}
              </p>

              {parentResults.anxiety && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Тревожность</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.anxiety.status)}`}>
                      {getStatusText(parentResults.anxiety.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          parentResults.anxiety.status === 'concerning' ? 'bg-coral' :
                          parentResults.anxiety.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(parentResults.anxiety.score, 6)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['parent-anxiety-mean']} onOpenChange={() => toggleSection('parent-anxiety-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['parent-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {parentResults.anxiety.status === 'concerning' 
                            ? 'Эти результаты показывают, что вы <strong>испытываете значительные симптомы тревожности.</strong> Это может влиять на вашу способность заботиться о себе и вашей семье.'
                            : parentResults.anxiety.status === 'borderline'
                            ? 'Эти результаты показывают, что вы <strong>можете испытывать некоторые симптомы тревожности.</strong> Важно обратить внимание на свое эмоциональное благополучие.'
                            : 'Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Один из способов поддерживать эмоциональный баланс - найти способы снизить стресс и создать радость в вашей жизни.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['parent-anxiety-do']} onOpenChange={() => toggleSection('parent-anxiety-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['parent-anxiety-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <ul className="list-inside space-y-3 text-foreground">
                          <li>
                            <strong>Заботьтесь о себе.</strong> Найдите время для отдыха, физической активности и занятий, которые приносят вам радость.
                          </li>
                          <li>
                            <strong>Обратитесь за поддержкой.</strong> Поговорите с друзьями, семьей или специалистом о своих переживаниях.
                          </li>
                          <li>
                            <strong>Рассмотрите профессиональную помощь.</strong> В Balansity мы можем помочь вам справиться с тревожностью и улучшить ваше эмоциональное благополучие.
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
              
              {parentResults.depression && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Депрессия</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.depression.status)}`}>
                      {getStatusText(parentResults.depression.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          parentResults.depression.status === 'concerning' ? 'bg-coral' :
                          parentResults.depression.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(parentResults.depression.score, 6)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['parent-depression-mean']} onOpenChange={() => toggleSection('parent-depression-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['parent-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {parentResults.depression.status === 'concerning' 
                            ? 'Эти результаты показывают, что вы <strong>испытываете высокие депрессивные симптомы.</strong> Это может влиять на вашу способность заботиться о себе и вашей семье.'
                            : parentResults.depression.status === 'borderline'
                            ? 'Эти результаты показывают, что вы <strong>можете испытывать некоторые депрессивные симптомы.</strong> Важно обратить внимание на свое эмоциональное благополучие.'
                            : 'Эти результаты показывают, что вы <strong>не испытываете высоких депрессивных симптомов.</strong> Продолжайте заботиться о себе и своем эмоциональном благополучии.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['parent-depression-do']} onOpenChange={() => toggleSection('parent-depression-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['parent-depression-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <ul className="list-inside space-y-3 text-foreground">
                          <li>
                            <strong>Не оставайтесь один на один с проблемой.</strong> Обратитесь к близким людям или специалисту за поддержкой.
                          </li>
                          <li>
                            <strong>Заботьтесь о физическом здоровье.</strong> Регулярная физическая активность, достаточный сон и здоровое питание могут помочь улучшить настроение.
                          </li>
                          <li>
                            <strong>Рассмотрите профессиональную помощь.</strong> В Balansity мы можем помочь вам справиться с депрессивными симптомами и улучшить ваше эмоциональное благополучие.
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-foreground">
            Родительская оценка завершена, но результаты еще не рассчитаны.
          </p>
        </div>
      )}
    </div>
  );
}







