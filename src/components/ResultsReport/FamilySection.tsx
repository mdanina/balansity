import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { Database } from "@/lib/supabase";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

const familyWorries = [
  "Разделение/развод",
  "Семейный стресс",
  "Отношения с партнером",
  "Психическое здоровье партнера",
  "Воспитание",
  "Семейный конфликт",
];

interface FamilySectionProps {
  parentProfile: Profile | null;
  partnerProfile: Profile | null;
  familyAssessment: Assessment | null;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function FamilySection({ parentProfile, partnerProfile, familyAssessment, openSections, toggleSection }: FamilySectionProps) {
  if (!familyAssessment) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-foreground/70">
            Семейная оценка не завершена. Пройдите опрос о семье, чтобы увидеть результаты здесь.
          </p>
        </div>
      </div>
    );
  }

  // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профилей
  const assessmentWorryTags = familyAssessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
  const familyWorryTags = assessmentWorryTags?.family || 
                         partnerProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || 
                         parentProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || [];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
      <p className="text-foreground/70 mb-4">
        Результаты семейной оценки {familyAssessment.completed_at 
          ? new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')
          : ''}
      </p>
      
      {/* Worries Section - о семье */}
      {familyWorryTags.length > 0 && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Беспокойства о семье</h3>
          </div>
          <p className="mb-4 text-foreground/70">
            Беспокойства, которыми вы поделились о семье
          </p>
          <div className="flex flex-wrap gap-2">
            {familyWorryTags.map((worry, index) => (
              <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                {worry}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {familyAssessment.results_summary ? (
        (() => {
          const familyResults = familyAssessment.results_summary as FamilyResults;
          return (
            <div className="space-y-6">
              {familyResults.family_stress && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Семейный стресс</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.family_stress.status)}`}>
                      {getStatusText(familyResults.family_stress.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.family_stress.status === 'concerning' ? 'bg-coral' :
                          familyResults.family_stress.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.family_stress.score, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.family_stress.status === 'concerning' 
                            ? 'Ваша семья в настоящее время <strong>испытывает высокий уровень стресса.</strong> Это может влиять на всех членов семьи и вашу способность справляться с ежедневными задачами.'
                            : familyResults.family_stress.status === 'borderline'
                            ? 'Ваша семья может <strong>испытывать некоторый уровень стресса.</strong> Важно обратить внимание на то, как это влияет на семейную динамику.'
                            : 'Ваша семья в настоящее время <strong>справляется с ежедневным жизненным стрессом.</strong> Продолжайте поддерживать открытое общение и заботу друг о друге.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-stress-do']} onOpenChange={() => toggleSection('family-stress-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-stress-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <ul className="list-inside space-y-3 text-foreground">
                          <li>
                            <strong>Установите границы.</strong> Определите, что важно для вашей семьи, и научитесь говорить "нет" дополнительным обязательствам.
                          </li>
                          <li>
                            <strong>Проводите время вместе.</strong> Регулярное время для семьи без отвлекающих факторов может помочь укрепить связи.
                          </li>
                          <li>
                            <strong>Обратитесь за поддержкой.</strong> В Balansity мы можем помочь вашей семье найти способы справиться со стрессом и улучшить семейную динамику.
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
              
              {familyResults.partner_relationship && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Отношения с партнером</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.partner_relationship.status)}`}>
                      {getStatusText(familyResults.partner_relationship.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.partner_relationship.status === 'concerning' ? 'bg-coral' :
                          familyResults.partner_relationship.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.partner_relationship.score, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.partner_relationship.status === 'concerning' 
                            ? 'Вы сообщили, что в настоящее время испытываете <strong>конфликт или трудности в отношениях с вашим партнером.</strong> Это может влиять на всю семью.'
                            : familyResults.partner_relationship.status === 'borderline'
                            ? 'В ваших отношениях с партнером <strong>могут быть некоторые трудности.</strong> Важно обратить внимание на эти аспекты.'
                            : 'Ваши отношения с партнером <strong>выглядят стабильными.</strong> Продолжайте поддерживать открытое общение и заботу друг о друге.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-partner-do']} onOpenChange={() => toggleSection('family-partner-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-partner-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <ul className="list-inside space-y-3 text-foreground">
                          <li>
                            <strong>Общайтесь открыто.</strong> Выделяйте время для честных разговоров о потребностях и чувствах каждого партнера.
                          </li>
                          <li>
                            <strong>Ищите компромиссы.</strong> Работайте вместе над решениями, которые учитывают потребности обоих партнеров.
                          </li>
                          <li>
                            <strong>Рассмотрите парную терапию.</strong> В Balansity мы можем помочь вам улучшить общение и укрепить ваши отношения.
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}
              
              {familyResults.coparenting && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">Совместное воспитание</h3>
                  <div className="mb-6">
                    <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.coparenting.status)}`}>
                      {getStatusText(familyResults.coparenting.status)}
                    </span>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                      <div 
                        className={`h-full ${
                          familyResults.coparenting.status === 'concerning' ? 'bg-coral' :
                          familyResults.coparenting.status === 'borderline' ? 'bg-yellow-400' :
                          'bg-secondary'
                        }`}
                        style={{ width: `${getProgressPercentage(familyResults.coparenting.score, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-accent" />
                          <span className="font-medium text-foreground">Что это значит?</span>
                        </div>
                        {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <p className="text-foreground">
                          {familyResults.coparenting.status === 'concerning' 
                            ? 'Вы указали, что <strong>сложно работать вместе с вашим со-родителем(ями)</strong> для воспитания вашего ребенка(детей), и это может привести к конфликту.'
                            : familyResults.coparenting.status === 'borderline'
                            ? 'В совместном воспитании <strong>могут быть некоторые трудности.</strong> Важно обратить внимание на эти аспекты.'
                            : 'Вы <strong>эффективно работаете вместе</strong> с вашим со-родителем(ями) для воспитания вашего ребенка(детей). Продолжайте поддерживать открытое общение и сотрудничество.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible open={openSections['family-coparenting-do']} onOpenChange={() => toggleSection('family-coparenting-do')}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-sky-blue" />
                          <span className="font-medium text-foreground">Что я могу сделать?</span>
                        </div>
                        {openSections['family-coparenting-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                        <ul className="list-inside space-y-3 text-foreground">
                          <li>
                            <strong>Установите общие правила.</strong> Работайте вместе над созданием согласованных правил и ожиданий для вашего ребенка.
                          </li>
                          <li>
                            <strong>Поддерживайте открытое общение.</strong> Регулярно обсуждайте вопросы воспитания и стремитесь к компромиссам.
                          </li>
                          <li>
                            <strong>Рассмотрите поддержку специалиста.</strong> В Balansity мы можем помочь вам улучшить совместное воспитание и создать более сплоченную семейную команду.
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
            Семейная оценка завершена, но результаты еще не рассчитаны.
          </p>
        </div>
      )}
    </div>
  );
}




