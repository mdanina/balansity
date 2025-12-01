import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, Lightbulb, Minus, Plus } from "lucide-react";
import type { ChildCheckupData } from "@/hooks/useResultsData";
import { getStatusText, getStatusColor, getProgressPercentage } from "@/utils/resultsCalculations";

// Категории worry tags (должны совпадать с Worries.tsx)
const childWorries = [
  "Фокус и внимание",
  "Грусть и плач",
  "Тревоги и беспокойства",
  "Питание",
  "Сон и режим",
  "Туалет",
  "Сенсорная чувствительность",
  "Гнев и агрессия",
  "Импульсивность",
  "Травма",
  "Горе и потеря",
  "Буллинг",
  "Самооценка",
  "Школа/детский сад",
  "Удары, укусы или пинки",
  "Гендерная или сексуальная идентичность",
  "Сотрудничество",
];

interface ChildCheckupSectionProps {
  childData: ChildCheckupData;
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
}

export function ChildCheckupSection({ childData, openSections, toggleSection }: ChildCheckupSectionProps) {
  const childProfile = childData.profile;
  const childResults = childData.results;
  
  // Генерируем уникальные ключи для секций на основе ID ребенка
  const sectionPrefix = `child-${childProfile.id}`;
  
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">
        Ментальное здоровье {childProfile.first_name}
      </h2>
      
      {/* Worries Section - только о ребенке */}
      {(() => {
        // Используем теги из assessment (зафиксированные на момент чекапа), если есть, иначе из профиля
        const assessmentWorryTags = childData.assessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
        const childWorryTags = assessmentWorryTags?.child || childProfile.worry_tags?.filter(w => childWorries.includes(w)) || [];
        if (childWorryTags.length === 0) return null;
        
        return (
          <div className="mb-8 border-l-4 border-lavender pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
                <span className="text-sm font-medium text-white">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Беспокойства о {childProfile.first_name}</h3>
            </div>
            <p className="mb-4 text-foreground/70">
              Беспокойства, которыми вы поделились о {childProfile.first_name}
            </p>
            <div className="flex flex-wrap gap-2">
              {childWorryTags.map((worry, index) => (
                <span key={index} className="rounded-full bg-coral/20 px-4 py-2 text-sm font-medium text-coral">
                  {worry}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Emotional Challenges */}
      {childResults.emotional && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Эмоциональные трудности</h3>
          </div>

          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.emotional.status)}`}>
              {getStatusText(childResults.emotional.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div 
                className={`h-full ${
                  childResults.emotional.status === 'concerning' ? 'bg-coral' :
                  childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <Collapsible open={openSections[`${sectionPrefix}-emotional-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-emotional-mean`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections[`${sectionPrefix}-emotional-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <p className="text-foreground">
                  Эмоциональные трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Это означает, что ваш ребенок подвержен повышенному риску тревожного расстройства или депрессии. Чем раньше мы поможем детям, тем быстрее они смогут вернуться на правильный путь и процветать!
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={openSections[`${sectionPrefix}-emotional-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-emotional-do`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-sky-blue" />
                  <span className="font-medium text-foreground">Что я могу сделать?</span>
                </div>
                {openSections[`${sectionPrefix}-emotional-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Позвольте вашему ребенку испытывать свои чувства без осуждения.</strong> Когда вы минимизируете чувства вашего ребенка, вы (непреднамеренно) посылаете сообщение, что вы не комфортны с эмоциями вашего ребенка.
                  </li>
                  <li>
                    <strong>Поощряйте вашего ребенка к самосостраданию.</strong> Если вы слышите, как они говорят о себе негативно, переформулируйте, чтобы сосредоточиться на усилиях, а не на достижениях.
                  </li>
                  <li>
                    <strong>Пожалуйста, рассмотрите возможность оценки ментального здоровья.</strong> Balansity имеет отличные научно обоснованные методы лечения, помогающие детям с эмоциональными трудностями. Мы здесь для вашей семьи.
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Behavioral Challenges */}
      {childResults.conduct && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Поведенческие трудности</h3>
          </div>

          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.conduct.status)}`}>
              {getStatusText(childResults.conduct.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div 
                className={`h-full ${
                  childResults.conduct.status === 'concerning' ? 'bg-coral' :
                  childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <Collapsible open={openSections[`${sectionPrefix}-behavioral-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-behavioral-mean`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections[`${sectionPrefix}-behavioral-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <p className="text-foreground">
                  Поведенческие трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Поведенческие трудности обычно являются внешним выражением внутренних эмоциональных переживаний ребенка. Поэтому поведенческие трудности распространены при многих типах проблем, включая тревожность, депрессию и СДВГ.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={openSections[`${sectionPrefix}-behavioral-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-behavioral-do`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-sky-blue" />
                  <span className="font-medium text-foreground">Что я могу сделать?</span>
                </div>
                {openSections[`${sectionPrefix}-behavioral-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Установите четкие ожидания о том, как вы хотите, чтобы ваш ребенок вел себя.</strong> Сосредоточьтесь на том, чтобы говорить ребенку, что он может делать, и тратьте меньше времени на то, чтобы говорить ему все, что он не может делать. Чем конкретнее, тем лучше!
                  </li>
                  <li>
                    <strong>Сохраняйте спокойствие.</strong> Когда взрослые способны сохранять самообладание, они передают ощущение спокойствия и контроля своему ребенку. Мы должны регулировать свои собственные чувства и поведение, чтобы помочь нашим детям регулировать их чувства и поведение.
                  </li>
                  <li>
                    <strong>Обратитесь за поддержкой.</strong> В Balansity мы смотрим на общую картину. Специалист Balansity поможет выяснить первопричину поведенческих трудностей вашего ребенка и разработать персонализированный план ухода.
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Activity Challenges */}
      {childResults.hyperactivity && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Трудности с активностью</h3>
          </div>

          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.hyperactivity.status)}`}>
              {getStatusText(childResults.hyperactivity.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div 
                className={`h-full ${
                  childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                  childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <Collapsible open={openSections[`${sectionPrefix}-activity-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-activity-mean`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections[`${sectionPrefix}-activity-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <p className="text-foreground">
                  Уровень активности вашего ребенка и способность концентрироваться находятся <strong>в пределах типичного диапазона для детей того же возраста.</strong> Это, вероятно, указывает на то, что ваш ребенок не подвержен значительному риску синдрома дефицита внимания и гиперактивности (СДВГ). Если вы беспокоитесь об уровне активности вашего ребенка или отвлекаемости, оценка может исключить опасения по поводу СДВГ.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={openSections[`${sectionPrefix}-activity-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-activity-do`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-sky-blue" />
                  <span className="font-medium text-foreground">Что я могу сделать?</span>
                </div>
                {openSections[`${sectionPrefix}-activity-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <p className="text-foreground">
                  Если у вас есть вопросы или беспокойства об уровне активности или концентрации вашего ребенка, рекомендуется проконсультироваться со специалистом. В Balansity мы можем помочь определить, нужна ли дополнительная оценка или поддержка.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Social Challenges */}
      {childResults.peer_problems && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Социальные трудности</h3>
          </div>

          <div className="mb-6">
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.peer_problems.status)}`}>
              {getStatusText(childResults.peer_problems.status)}
            </span>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
              <div 
                className={`h-full ${
                  childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                  childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                  'bg-secondary'
                }`}
                style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <Collapsible open={openSections[`${sectionPrefix}-social-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-social-mean`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections[`${sectionPrefix}-social-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <p className="text-foreground">
                  У вашего ребенка <strong>больше трудностей в отношениях с другими детьми, чем у многих детей того же возраста.</strong> Социальные навыки трудны для некоторых детей. Важно попытаться понять, почему у вашего ребенка возникают трудности со сверстниками. Проблемы ментального здоровья вашего ребенка могут мешать отношениям.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={openSections[`${sectionPrefix}-social-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-social-do`)}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-sky-blue" />
                  <span className="font-medium text-foreground">Что я могу сделать?</span>
                </div>
                {openSections[`${sectionPrefix}-social-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Поощряйте социальные взаимодействия.</strong> Создавайте возможности для вашего ребенка играть и общаться с другими детьми в безопасной и поддерживающей обстановке.
                  </li>
                  <li>
                    <strong>Учите социальным навыкам.</strong> Объясняйте и моделируйте способы общения, делиться, по очереди и решать конфликты.
                  </li>
                  <li>
                    <strong>Обратитесь за поддержкой.</strong> Специалисты Balansity могут помочь вашему ребенку развить социальные навыки и справиться с трудностями в отношениях со сверстниками.
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Impact Section - Три субдомена влияния */}
      {(childResults.impact_child || childResults.impact_parent || childResults.impact_family || childResults.impact) && (
        <div className="mb-8 border-l-4 border-lavender pl-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender">
              <span className="text-sm font-medium text-white">●</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Влияние</h3>
          </div>

          <div className="space-y-4">
            {/* Влияние на ребёнка */}
            {childResults.impact_child && (
              <div>
                <h4 className="text-lg font-bold text-foreground mb-4">Влияние на ребёнка</h4>
                <div className="mb-6">
                  <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_child.status)}`}>
                    {getStatusText(childResults.impact_child.status)}
                  </span>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.impact_child.status === 'concerning' ? 'bg-coral' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.impact_child.score, 3)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Влияние на родителя */}
            {childResults.impact_parent && (
              <div>
                <h4 className="text-lg font-bold text-foreground mb-4">Влияние на родителя</h4>
                <div className="mb-6">
                  <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_parent.status)}`}>
                    {getStatusText(childResults.impact_parent.status)}
                  </span>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.impact_parent.status === 'concerning' ? 'bg-coral' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.impact_parent.score, 6)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Влияние на семью */}
            {childResults.impact_family && (
              <div>
                <h4 className="text-lg font-bold text-foreground mb-4">Влияние на семью</h4>
                <div className="mb-6">
                  <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.impact_family.status)}`}>
                    {getStatusText(childResults.impact_family.status)}
                  </span>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.impact_family.status === 'concerning' ? 'bg-coral' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.impact_family.score, 18)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Обратная совместимость: старый формат impact */}
            {childResults.impact && !childResults.impact_child && !childResults.impact_parent && !childResults.impact_family && (
              <div>
                <h4 className="text-lg font-bold text-foreground mb-4">{childProfile.first_name}</h4>
                <div className="mb-6">
                  <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                    childResults.impact.status === 'high_impact' ? 'text-white bg-coral' :
                    childResults.impact.status === 'medium_impact' ? 'text-white bg-yellow-500' :
                    'text-white bg-secondary'
                  }`}>
                    {childResults.impact.status === 'high_impact' ? 'Высокое влияние' :
                     childResults.impact.status === 'medium_impact' ? 'Среднее влияние' :
                     'Низкое влияние'}
                  </span>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/50">
                    <div 
                      className={`h-full ${
                        childResults.impact.status === 'high_impact' ? 'bg-coral' :
                        childResults.impact.status === 'medium_impact' ? 'bg-yellow-400' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.impact.score, 2)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Collapsible open={openSections[`${sectionPrefix}-impact-mean`]} onOpenChange={() => toggleSection(`${sectionPrefix}-impact-mean`)} className="mt-6">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent/10 p-4 text-left hover:bg-accent/20">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-accent" />
                <span className="font-medium text-foreground">Что это значит?</span>
              </div>
              {openSections[`${sectionPrefix}-impact-mean`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
              <p className="text-foreground">
                Когда мы говорим о ментальном здоровье, речь идет не о симптомах; речь идет о вашей жизни. Ментальное здоровье вашего ребенка влияет на его жизнь, вашу жизнь и жизнь вашей семьи!
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections[`${sectionPrefix}-impact-do`]} onOpenChange={() => toggleSection(`${sectionPrefix}-impact-do`)} className="mt-3">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-sky-blue/10 p-4 text-left hover:bg-sky-blue/20">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-sky-blue" />
                <span className="font-medium text-foreground">Что я могу сделать?</span>
              </div>
              {openSections[`${sectionPrefix}-impact-do`] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg bg-white border border-border p-4">
              <p className="text-foreground">
                В Balansity мы поддерживаем вашего ребенка и вашу семью, чтобы снизить влияние трудностей и укрепить сильные стороны. Проще говоря, мы здесь, чтобы помочь вам и вашей семье процветать!
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Child's Recap */}
      <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-sky-blue/80 to-sky-blue/60">
        <div className="flex items-center justify-between p-6">
          <h3 className="text-2xl font-bold text-white">Итоги {childProfile.first_name}</h3>
          <div className="h-16 w-16 rounded-full bg-white/20"></div>
        </div>
        <div className="space-y-4 bg-white p-6">
          {childResults.emotional && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Эмоции</span>
                <span className={`text-sm ${
                  childResults.emotional.status === 'concerning' ? 'text-coral' :
                  childResults.emotional.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.emotional.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div 
                  className={`h-full ${
                    childResults.emotional.status === 'concerning' ? 'bg-coral' :
                    childResults.emotional.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.emotional.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.conduct && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Поведение</span>
                <span className={`text-sm ${
                  childResults.conduct.status === 'concerning' ? 'text-coral' :
                  childResults.conduct.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.conduct.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div 
                  className={`h-full ${
                    childResults.conduct.status === 'concerning' ? 'bg-coral' :
                    childResults.conduct.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.conduct.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.hyperactivity && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Активность</span>
                <span className={`text-sm ${
                  childResults.hyperactivity.status === 'concerning' ? 'text-coral' :
                  childResults.hyperactivity.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.hyperactivity.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div 
                  className={`h-full ${
                    childResults.hyperactivity.status === 'concerning' ? 'bg-coral' :
                    childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 20)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.peer_problems && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Социальное</span>
                <span className={`text-sm ${
                  childResults.peer_problems.status === 'concerning' ? 'text-coral' :
                  childResults.peer_problems.status === 'borderline' ? 'text-yellow-500' :
                  'text-secondary'
                }`}>
                  • {getStatusText(childResults.peer_problems.status)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                <div 
                  className={`h-full ${
                    childResults.peer_problems.status === 'concerning' ? 'bg-coral' :
                    childResults.peer_problems.status === 'borderline' ? 'bg-yellow-400' :
                    'bg-secondary'
                  }`}
                  style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 24)}%` }}
                ></div>
              </div>
            </div>
          )}

          {childResults.total_difficulties !== undefined && (
            <div className="mt-4 pt-4 border-t">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground">Общие трудности</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



