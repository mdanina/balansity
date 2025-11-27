import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import leafDecoration from "@/assets/leaf-decoration.png";
import { ChevronLeft, ChevronRight, Download, MessageCircle, Lightbulb, Minus, Plus, Save } from "lucide-react";

export default function ResultsReportNew() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Header with decoration */}
        <div className="relative mb-12">
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute left-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute right-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Ваши результаты
            </h1>
            <p className="text-lg text-muted-foreground">
              Суббота, 8 ноября • Заполнено Даниной, Марией
            </p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Итоги</h2>
          <p className="text-muted-foreground mb-8">
            Эти результаты основаны на опросе из <span className="font-medium">39 вопросов</span>, который вы заполнили о своей семье.
          </p>

          {/* Cards Carousel */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Alice Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-purple-100 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">Alice</h3>
                  <p className="text-sm text-muted-foreground">11 лет</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Тревожно</span>
                    <p className="text-sm text-muted-foreground">Эмоции</p>
                    <p className="text-sm text-muted-foreground">Поведение</p>
                    <p className="text-sm text-muted-foreground">Социальное</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Типично</span>
                    <p className="text-sm text-muted-foreground">Активность</p>
                  </div>
                </div>
              </div>

              {/* You Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-teal-100 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">Вы</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Тревожно</span>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Типично</span>
                    <p className="text-sm text-muted-foreground">Тревожность</p>
                    <p className="text-sm text-muted-foreground">Депрессия</p>
                  </div>
                </div>
              </div>

              {/* Family Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-blue-100 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">Семья</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Тревожно</span>
                    <p className="text-sm text-muted-foreground">Я и мой партнер</p>
                    <p className="text-sm text-muted-foreground">Совместное воспитание</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Типично</span>
                    <p className="text-sm text-muted-foreground">Семейный стресс</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alice's Mental Health */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье Alice</h2>
          
          {/* Worries Section */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Беспокойства</h3>
            </div>
            <p className="mb-4 text-muted-foreground">Беспокойства, которыми вы поделились об Alice</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                Фокус и внимание
              </span>
            </div>
          </div>

          {/* Emotional Challenges */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Эмоциональные трудности</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                Тревожно
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[85%] bg-red-500"></div>
              </div>
            </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-emotional-mean']} onOpenChange={() => toggleSection('alice-emotional-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-emotional-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Эмоциональные трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Это означает, что ваш ребенок подвержен повышенному риску тревожного расстройства или депрессии. Чем раньше мы поможем детям, тем быстрее они смогут вернуться на правильный путь и процветать!
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-emotional-do']} onOpenChange={() => toggleSection('alice-emotional-do')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-emotional-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Позвольте вашему ребенку испытывать свои чувства без осуждения.</strong> Когда вы минимизируете чувства вашего ребенка, вы (непреднамеренно) посылаете сообщение, что вы не комфортны с эмоциями вашего ребенка.
                    </li>
                    <li>
                      <strong>Поощряйте вашего ребенка к самосостраданию.</strong> Если вы слышите, как они говорят о себе негативно, переформулируйте, чтобы сосредоточиться на усилиях, а не на достижениях.
                    </li>
                    <li>
                      <strong>Пожалуйста, рассмотрите возможность оценки ментального здоровья.</strong> Little Otter имеет отличные научно обоснованные методы лечения, помогающие детям с эмоциональными трудностями. Мы здесь для вашей семьи.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Behavioral Challenges */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Поведенческие трудности</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                Тревожно
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[82%] bg-red-500"></div>
              </div>
            </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-behavioral-mean']} onOpenChange={() => toggleSection('alice-behavioral-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-behavioral-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Поведенческие трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Поведенческие трудности обычно являются внешним выражением внутренних эмоциональных переживаний ребенка. Поэтому поведенческие трудности распространены при многих типах проблем, включая тревожность, депрессию и СДВГ.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-behavioral-do']} onOpenChange={() => toggleSection('alice-behavioral-do')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-behavioral-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Установите четкие ожидания о том, как вы хотите, чтобы ваш ребенок вел себя.</strong> Сосредоточьтесь на том, чтобы говорить ребенку, что он может делать, и тратьте меньше времени на то, чтобы говорить ему все, что он не может делать. Чем конкретнее, тем лучше!
                    </li>
                    <li>
                      <strong>Сохраняйте спокойствие.</strong> Когда взрослые способны сохранять самообладание, они передают ощущение спокойствия и контроля своему ребенку. Мы должны регулировать свои собственные чувства и поведение, чтобы помочь нашим детям регулировать их чувства и поведение.
                    </li>
                    <li>
                      <strong>Обратитесь за поддержкой.</strong> В Little Otter мы смотрим на общую картину. Специалист Little Otter поможет выяснить первопричину поведенческих трудностей вашего ребенка и разработать персонализированный план ухода.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Activity Challenges */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Трудности с активностью</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Типично
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[60%] bg-primary"></div>
              </div>
            </div>

            <Collapsible open={openSections['alice-activity-mean']} onOpenChange={() => toggleSection('alice-activity-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['alice-activity-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Уровень активности вашего ребенка и способность концентрироваться находятся <strong>в пределах типичного диапазона для детей того же возраста.</strong> Это, вероятно, указывает на то, что ваш ребенок не подвержен значительному риску синдрома дефицита внимания и гиперактивности (СДВГ). Если вы беспокоитесь об уровне активности вашего ребенка или отвлекаемости, оценка может исключить опасения по поводу СДВГ.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Social Challenges */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Социальные трудности</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                Тревожно
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[85%] bg-red-500"></div>
              </div>
            </div>

            <Collapsible open={openSections['alice-social-mean']} onOpenChange={() => toggleSection('alice-social-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['alice-social-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  У вашего ребенка <strong>больше трудностей в отношениях с другими детьми, чем у многих детей того же возраста.</strong> Социальные навыки трудны для некоторых детей. Важно попытаться понять, почему у вашего ребенка возникают трудности со сверстниками. Проблемы ментального здоровья вашего ребенка могут мешать отношениям.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Impact Section */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Влияние</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Alice</span>
                  <span className="text-sm text-red-600">• Влияет</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[80%] bg-red-500"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Вы</span>
                  <span className="text-sm text-red-600">• Влияет</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-red-500"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Семья</span>
                  <span className="text-sm text-primary">• Не влияет</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[15%] bg-primary"></div>
                </div>
              </div>
            </div>

            <Collapsible open={openSections['impact-mean']} onOpenChange={() => toggleSection('impact-mean')} className="mt-6">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['impact-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Когда мы говорим о ментальном здоровье, речь идет не о симптомах; речь идет о вашей жизни. Ментальное здоровье вашего ребенка влияет на его жизнь, вашу жизнь и жизнь вашей семьи!
                </p>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={openSections['impact-do']} onOpenChange={() => toggleSection('impact-do')} className="mt-3">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-foreground">Что я могу сделать?</span>
                </div>
                {openSections['impact-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  В Little Otter мы поддерживаем вашего ребенка и вашу семью, чтобы снизить влияние трудностей и укрепить сильные стороны. Проще говоря, мы здесь, чтобы помочь вам и вашей семье процветать!
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Alice's Recap */}
          <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-blue-400 to-blue-300">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-bold text-white">Итоги Alice</h3>
              <div className="h-16 w-16 rounded-full bg-white/20"></div>
            </div>
            <div className="space-y-4 bg-white p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Эмоции</span>
                  <span className="text-sm text-red-600">• Тревожно</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-red-500"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Поведение</span>
                  <span className="text-sm text-red-600">• Тревожно</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[82%] bg-red-500"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Активность</span>
                  <span className="text-sm text-primary">• Типично</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[60%] bg-primary"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Социальное</span>
                  <span className="text-sm text-red-600">• Тревожно</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Mental Health */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>

          {/* Anxiety */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Тревожность</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Типично
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[50%] bg-primary"></div>
              </div>
            </div>

            <Collapsible open={openSections['you-anxiety-mean']} onOpenChange={() => toggleSection('you-anxiety-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['you-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Один из способов поддерживать эмоциональный баланс - найти способы снизить стресс и создать радость в вашей жизни.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Depression */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Депрессия</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Типично
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[45%] bg-primary"></div>
              </div>
            </div>

            <Collapsible open={openSections['you-depression-mean']} onOpenChange={() => toggleSection('you-depression-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['you-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Эти результаты показывают, что вы <strong>не испытываете высоких депрессивных симптомов.</strong>
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Your Recap */}
          <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-bold text-white">Ваши итоги</h3>
              <div className="h-16 w-16 rounded-full bg-white/20"></div>
            </div>
            <div className="space-y-4 bg-white p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Тревожность</span>
                  <span className="text-sm text-primary">• Типично</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[50%] bg-primary"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Депрессия</span>
                  <span className="text-sm text-primary">• Типично</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[45%] bg-primary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Family's Mental Health */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>

          {/* Worries */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Беспокойства</h3>
            </div>
            <p className="mb-4 text-muted-foreground">Беспокойства, которыми вы поделились о вашей семье</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                Ментальное здоровье партнера
              </span>
            </div>
          </div>

          {/* Family Stress */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Семейный стресс</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Типично
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[40%] bg-primary"></div>
              </div>
            </div>

            <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Ваша семья в настоящее время справляется с ежедневным жизненным стрессом.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Partner Relationship */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Отношения с партнером</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                Тревожно
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[90%] bg-red-500"></div>
              </div>
            </div>

            <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Вы сообщили, что в настоящее время испытываете <strong>конфликт или трудности в отношениях с вашим партнером.</strong>
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Co-Parenting */}
          <div className="mb-8 border-l-4 border-muted pl-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">●</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Совместное воспитание</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                Тревожно
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[85%] bg-red-500"></div>
              </div>
            </div>

            <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Вы указали, что <strong>сложно работать вместе с вашим со-родителем(ями)</strong> для воспитания вашего ребенка(детей), и это может привести к конфликту.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Your Family's Recap */}
          <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-400">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-bold text-white">Итоги вашей семьи</h3>
              <div className="h-16 w-16 rounded-full bg-white/20"></div>
            </div>
            <div className="space-y-4 bg-white p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Семейный стресс</span>
                  <span className="text-sm text-primary">• Типично</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[40%] bg-primary"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Я и мой партнер</span>
                  <span className="text-sm text-red-600">• Тревожно</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[90%] bg-red-500"></div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-foreground">Совместное воспитание</span>
                  <span className="text-sm text-red-600">• Тревожно</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Saved Notice */}
        <div className="mb-8 rounded-lg border border-border bg-muted/20 p-6">
          <div className="flex items-center gap-3">
            <Save className="h-6 w-6 text-primary" />
            <p className="text-foreground">
              Этот отчет сохранен в вашей{" "}
              <a href="#" className="font-medium text-primary underline hover:no-underline">
                Истории отчетов
              </a>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="w-full max-w-md"
          >
            Перейти к вашей истории отчетов
          </Button>
        </div>
      </div>
    </div>
  );
}
