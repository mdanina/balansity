import { useMemo } from "react";
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

  // Мемоизируем вычисление worry tags (вынесено из JSX для оптимизации)
  const childWorryTags = useMemo(() => {
    const assessmentWorryTags = childData.assessment?.worry_tags as { child?: string[]; personal?: string[]; family?: string[] } | null;
    return assessmentWorryTags?.child || childProfile.worry_tags?.filter(w => childWorries.includes(w)) || [];
  }, [childData.assessment?.worry_tags, childProfile.worry_tags]);

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-foreground mb-8">
        Ментальное здоровье {childProfile.first_name}
      </h2>

      {/* Worries Section - только о ребенке */}
      {childWorryTags.length > 0 && (
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
      )}

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
                  {childResults.emotional.status === 'concerning'
                    ? <>Эмоциональные трудности вашего ребенка <strong>значительно выше, чем у большинства детей того же возраста.</strong> Это указывает на повышенный риск развития тревожного расстройства или депрессии. Ребенок может часто испытывать беспокойство, страхи, грусть или подавленность. Важно обратить на это внимание — чем раньше мы поможем детям, тем быстрее они смогут почувствовать себя лучше.</>
                    : childResults.emotional.status === 'borderline'
                    ? <>Эмоциональные трудности вашего ребенка <strong>несколько выше среднего уровня для детей этого возраста.</strong> Это пограничный результат, который означает, что ребенок может периодически испытывать беспокойство, тревогу или сниженное настроение. Стоит обратить внимание на эмоциональное состояние ребенка и поддержать его.</>
                    : <>Эмоциональное состояние вашего ребенка <strong>находится в пределах нормы для детей этого возраста.</strong> Это означает, что ребенок в целом справляется со своими эмоциями и не проявляет признаков повышенной тревожности или подавленности. Продолжайте поддерживать открытое общение о чувствах.</>}
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
                {childResults.emotional.status === 'concerning' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Обратитесь к специалисту.</strong> При таком уровне эмоциональных трудностей рекомендуется консультация детского психолога или психотерапевта. В Balansity мы можем помочь подобрать подходящего специалиста.
                    </li>
                    <li>
                      <strong>Создайте безопасное пространство для выражения чувств.</strong> Позвольте ребенку говорить о своих переживаниях без осуждения. Покажите, что вы рядом и готовы выслушать.
                    </li>
                    <li>
                      <strong>Следите за режимом дня.</strong> Регулярный сон, питание и физическая активность помогают стабилизировать эмоциональное состояние.
                    </li>
                  </ul>
                ) : childResults.emotional.status === 'borderline' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Уделяйте больше времени разговорам о чувствах.</strong> Спрашивайте ребенка, как прошел его день, что его порадовало или расстроило. Это поможет ему лучше понимать свои эмоции.
                    </li>
                    <li>
                      <strong>Обучайте способам справляться с переживаниями.</strong> Дыхательные упражнения, рисование, физическая активность — найдите то, что помогает вашему ребенку успокоиться.
                    </li>
                    <li>
                      <strong>Наблюдайте за динамикой.</strong> Если вы заметите ухудшение состояния, не откладывайте обращение к специалисту.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Продолжайте поддерживать эмоциональную связь.</strong> Регулярно разговаривайте с ребенком о его чувствах и переживаниях — это укрепляет доверие.
                    </li>
                    <li>
                      <strong>Моделируйте здоровое отношение к эмоциям.</strong> Показывайте на своем примере, как можно справляться с трудными чувствами.
                    </li>
                    <li>
                      <strong>Отмечайте успехи.</strong> Хвалите ребенка, когда он справляется с трудными ситуациями, это укрепляет его уверенность в себе.
                    </li>
                  </ul>
                )}
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
                  {childResults.conduct.status === 'concerning'
                    ? <>Поведенческие трудности вашего ребенка <strong>значительно выше, чем у большинства детей того же возраста.</strong> Это может проявляться в частых вспышках гнева, непослушании, агрессии или нарушении правил. Такое поведение часто является внешним выражением внутренних эмоциональных переживаний и может быть связано с тревожностью, стрессом или другими трудностями.</>
                    : childResults.conduct.status === 'borderline'
                    ? <>Поведенческие трудности вашего ребенка <strong>несколько выше среднего уровня.</strong> Ребенок может иногда проявлять непослушание, раздражительность или трудности с соблюдением правил. Это пограничный результат, который требует внимания, но не является критическим.</>
                    : <>Поведение вашего ребенка <strong>находится в пределах нормы для детей этого возраста.</strong> Ребенок в целом следует правилам, справляется с фрустрацией и умеет контролировать свои импульсы на уровне, соответствующем возрасту.</>}
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
                {childResults.conduct.status === 'concerning' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Обратитесь к специалисту.</strong> При значительных поведенческих трудностях важно понять их причину. Специалист Balansity поможет разобраться в ситуации и разработать план поддержки.
                    </li>
                    <li>
                      <strong>Сохраняйте спокойствие в сложных ситуациях.</strong> Ваше спокойствие помогает ребенку регулировать свои эмоции. Избегайте криков и наказаний в момент вспышки.
                    </li>
                    <li>
                      <strong>Устанавливайте четкие и последовательные правила.</strong> Ребенку важно понимать границы и ожидания. Формулируйте правила позитивно: что делать, а не что не делать.
                    </li>
                  </ul>
                ) : childResults.conduct.status === 'borderline' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Обратите внимание на триггеры.</strong> Постарайтесь понять, в каких ситуациях ребенку сложнее всего контролировать поведение, и помогите ему подготовиться к ним.
                    </li>
                    <li>
                      <strong>Хвалите желаемое поведение.</strong> Положительное подкрепление работает лучше, чем наказания. Замечайте и отмечайте, когда ребенок ведет себя хорошо.
                    </li>
                    <li>
                      <strong>Учите альтернативным способам выражения чувств.</strong> Помогите ребенку находить слова для своих эмоций вместо того, чтобы выражать их через поведение.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Продолжайте поддерживать позитивную дисциплину.</strong> Четкие правила в сочетании с теплом и поддержкой помогают ребенку развивать самоконтроль.
                    </li>
                    <li>
                      <strong>Поощряйте самостоятельность.</strong> Давайте ребенку возможность принимать решения в соответствии с возрастом — это развивает ответственность.
                    </li>
                    <li>
                      <strong>Будьте примером.</strong> Дети учатся справляться с трудностями, наблюдая за взрослыми. Показывайте, как вы сами регулируете эмоции.
                    </li>
                  </ul>
                )}
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
                  {childResults.hyperactivity.status === 'concerning'
                    ? <>Уровень активности и трудности с концентрацией вашего ребенка <strong>значительно выше, чем у большинства детей того же возраста.</strong> Это может указывать на повышенный риск синдрома дефицита внимания и гиперактивности (СДВГ). Ребенку может быть сложно усидеть на месте, дождаться своей очереди или сосредоточиться на задачах.</>
                    : childResults.hyperactivity.status === 'borderline'
                    ? <>Уровень активности и способность концентрироваться вашего ребенка <strong>несколько выше среднего.</strong> Это пограничный результат — ребенок может быть более подвижным или отвлекаемым, чем сверстники, но это не обязательно указывает на СДВГ. Стоит понаблюдать за ситуацией.</>
                    : <>Уровень активности и способность концентрироваться вашего ребенка <strong>находятся в пределах нормы для детей этого возраста.</strong> Ребенок способен сосредоточиться на задачах и контролировать свою активность на уровне, соответствующем возрасту.</>}
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
                {childResults.hyperactivity.status === 'concerning' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Рекомендуется консультация специалиста.</strong> Для точной оценки и исключения или подтверждения СДВГ важно пройти диагностику. В Balansity мы можем направить вас к нужному специалисту.
                    </li>
                    <li>
                      <strong>Структурируйте среду.</strong> Четкий распорядок дня, минимум отвлекающих факторов и разбивка задач на небольшие шаги помогают ребенку справляться.
                    </li>
                    <li>
                      <strong>Обеспечьте физическую активность.</strong> Регулярные физические упражнения помогают направить энергию в позитивное русло и улучшают концентрацию.
                    </li>
                  </ul>
                ) : childResults.hyperactivity.status === 'borderline' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Наблюдайте за ситуацией.</strong> Отслеживайте, в каких условиях ребенку легче сосредоточиться, а в каких сложнее. Это поможет понять паттерны.
                    </li>
                    <li>
                      <strong>Используйте таймеры и визуальные подсказки.</strong> Они помогают ребенку организовать время и понимать, сколько осталось до конца задания.
                    </li>
                    <li>
                      <strong>Делайте перерывы.</strong> Короткие паузы между заданиями помогают ребенку перезагрузиться и лучше концентрироваться.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Поддерживайте здоровый режим.</strong> Достаточный сон, сбалансированное питание и регулярная физическая активность способствуют хорошей концентрации.
                    </li>
                    <li>
                      <strong>Развивайте навыки планирования.</strong> Помогайте ребенку учиться организовывать свои дела — это пригодится в школе и жизни.
                    </li>
                    <li>
                      <strong>Поощряйте увлечения.</strong> Занятия, которые увлекают ребенка, развивают способность к длительной концентрации.
                    </li>
                  </ul>
                )}
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
                  {childResults.peer_problems.status === 'concerning'
                    ? <>У вашего ребенка <strong>значительно больше трудностей в отношениях со сверстниками, чем у большинства детей того же возраста.</strong> Ребенок может чувствовать себя одиноким, испытывать сложности в общении или становиться объектом насмешек. Социальные трудности могут быть связаны с тревожностью, низкой самооценкой или другими эмоциональными проблемами.</>
                    : childResults.peer_problems.status === 'borderline'
                    ? <>У вашего ребенка <strong>несколько больше трудностей в отношениях со сверстниками, чем обычно.</strong> Это пограничный результат — ребенок может иногда чувствовать себя не в своей тарелке в компании других детей или испытывать небольшие сложности в общении.</>
                    : <>Социальные навыки вашего ребенка <strong>находятся в пределах нормы для детей этого возраста.</strong> Ребенок в целом хорошо ладит со сверстниками, умеет заводить друзей и поддерживать отношения.</>}
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
                {childResults.peer_problems.status === 'concerning' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Обратитесь к специалисту.</strong> Трудности в общении могут быть симптомом других проблем. Специалист Balansity поможет понять причины и разработать план поддержки.
                    </li>
                    <li>
                      <strong>Создавайте безопасные возможности для общения.</strong> Маленькие группы, знакомая обстановка, структурированные активности помогут ребенку чувствовать себя увереннее.
                    </li>
                    <li>
                      <strong>Работайте над самооценкой.</strong> Помогите ребенку увидеть свои сильные стороны и ценить себя независимо от мнения других.
                    </li>
                  </ul>
                ) : childResults.peer_problems.status === 'borderline' ? (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Помогите найти подходящий круг общения.</strong> Ребенку может быть легче общаться с детьми со схожими интересами — в кружках, секциях или клубах по интересам.
                    </li>
                    <li>
                      <strong>Обсуждайте социальные ситуации.</strong> Разбирайте с ребенком сложные ситуации, которые возникают с друзьями, и вместе ищите решения.
                    </li>
                    <li>
                      <strong>Развивайте навыки общения через игру.</strong> Ролевые игры и совместные занятия помогают практиковать социальные навыки в безопасной обстановке.
                    </li>
                  </ul>
                ) : (
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Поддерживайте дружеские связи.</strong> Помогайте ребенку поддерживать контакт с друзьями, организуйте совместные активности.
                    </li>
                    <li>
                      <strong>Учите разрешать конфликты.</strong> Даже при хороших социальных навыках конфликты неизбежны. Помогайте ребенку находить конструктивные решения.
                    </li>
                    <li>
                      <strong>Расширяйте социальный опыт.</strong> Новые ситуации и знакомства помогают развивать гибкость в общении.
                    </li>
                  </ul>
                )}
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
                {(childResults.impact_child?.status === 'concerning' ||
                  childResults.impact_parent?.status === 'concerning' ||
                  childResults.impact_family?.status === 'concerning' ||
                  childResults.impact?.status === 'high_impact')
                  ? <>Трудности вашего ребенка <strong>оказывают значительное влияние на повседневную жизнь.</strong> Это может проявляться в сложностях с учебой, отношениями с друзьями, семейной жизнью или вашим собственным самочувствием как родителя. Когда влияние столь существенно, важно получить профессиональную поддержку.</>
                  : childResults.impact?.status === 'medium_impact'
                  ? <>Трудности вашего ребенка <strong>оказывают умеренное влияние на повседневную жизнь.</strong> Это может периодически создавать сложности в учебе, общении или семейных отношениях. Ситуация требует внимания, но еще не достигла критического уровня.</>
                  : <>Трудности вашего ребенка <strong>не оказывают значительного влияния на повседневную жизнь.</strong> Ребенок в целом справляется с повседневными задачами, и текущие сложности не мешают его развитию и благополучию семьи.</>}
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
              {(childResults.impact_child?.status === 'concerning' ||
                childResults.impact_parent?.status === 'concerning' ||
                childResults.impact_family?.status === 'concerning' ||
                childResults.impact?.status === 'high_impact') ? (
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Обратитесь за профессиональной помощью.</strong> При значительном влиянии на жизнь важно получить комплексную поддержку. Специалисты Balansity помогут разработать план действий.
                  </li>
                  <li>
                    <strong>Позаботьтесь о себе.</strong> Когда трудности ребенка влияют на всю семью, важно, чтобы и вы как родитель получали поддержку и отдых.
                  </li>
                  <li>
                    <strong>Сообщите в школу/детский сад.</strong> Педагоги могут адаптировать подход к ребенку, если будут знать о его трудностях.
                  </li>
                </ul>
              ) : childResults.impact?.status === 'medium_impact' ? (
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Отслеживайте динамику.</strong> Наблюдайте, не усиливается ли влияние трудностей на жизнь ребенка и семьи со временем.
                  </li>
                  <li>
                    <strong>Работайте над конкретными областями.</strong> Определите, где влияние ощущается сильнее всего, и сосредоточьте усилия там.
                  </li>
                  <li>
                    <strong>Рассмотрите консультацию специалиста.</strong> Профессиональная оценка поможет предотвратить усугубление ситуации.
                  </li>
                </ul>
              ) : (
                <ul className="list-inside space-y-3 text-foreground">
                  <li>
                    <strong>Продолжайте наблюдать.</strong> Даже при низком влиянии полезно отслеживать состояние ребенка и замечать изменения.
                  </li>
                  <li>
                    <strong>Укрепляйте сильные стороны.</strong> Поддерживайте то, что у ребенка получается хорошо — это создает ресурс для преодоления трудностей.
                  </li>
                  <li>
                    <strong>Сохраняйте открытый диалог.</strong> Пусть ребенок знает, что может обратиться к вам, если что-то его беспокоит.
                  </li>
                </ul>
              )}
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










