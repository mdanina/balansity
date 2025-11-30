import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Heart, 
  Brain, 
  Users, 
  Clock, 
  CheckCircle2,
  Phone,
  Video,
  FileText
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const testimonials = [
    {
      text: "Наш консультант был добрым и мягким. Это помогло нашему ребенку достичь нового уровня роста и исцеления.",
      author: "Мама ребенка, завершившего курс лечения"
    },
    {
      text: "Мой сын процветает, и мне нравится возможность оставаться на связи через приложение, видеть его прогресс, план, встречи и легкий доступ к его терапевту!",
      author: "Родитель 8-летнего ребенка, проходящего лечение"
    },
    {
      text: "Они прекрасно о нас заботились. Balansity - отличный вариант для тех, кто не может выйти из дома, кому нужна проверка состояния ребенка и кто хочет знать, как поддержать своего ребенка в трудные времена.",
      author: "Опекун 9-летнего и 6-летнего ребенка, завершивших курс"
    },
    {
      text: "Все клиницисты, с которыми я работала в течение последних 2 лет, были потрясающими и действительно изменили ситуацию для моей семьи. Я нашла Balansity изменившим жизнь для моей семьи. Оба моих ребенка смогли получить качественную помощь в области психического здоровья в комфорте нашего дома, и у них обоих все отлично.",
      author: "Мама 13-летнего и 11-летнего ребенка, проходящих лечение"
    },
    {
      text: "Мои опасения и причины, по которым мы изначально искали терапию, были связаны с социальными проблемами и тревогой моего сына. Он сразу же установил крепкие отношения со своим терапевтом. Вы можете видеть, как ваши дети раскрываются и расцветают, и видеть развитие в реальном времени. Это успокаивает и обнадеживает, что он выйдет из этого.",
      author: "Родитель ребенка, проходящего лечение"
    },
    {
      text: "Времена трудные для этих детей. Они проходят через то, через что мне не приходилось проходить как родителю. Терапевты Balansity дают им навыки для навигации. Это действительно прекрасно наблюдать.",
      author: "Мама ребенка, проходящего лечение"
    },
    {
      text: "Вы всегда хотите думать, что можете справиться с вещами как семья. Но мы не всегда знаем, что лучше для наших детей. Терапевты и врачи Balansity могут видеть то, что мы, как родители, не можем видеть.",
      author: "Опекун ребенка, проходящего лечение"
    },
    {
      text: "Я так довольна результатами, которые мы получили от Balansity. Воспитание сложно, но кажется, что я могу просто появиться и сказать, что мне нужна помощь, и они точно знают, что делать.",
      author: "Мама ребенка, проходящего лечение"
    },
    {
      text: "Balansity - это играющий по-другому. Это решение, которое нам было нужно, и мы обнаружили, что оно работает для нашей семьи. Это было эффективно и тщательно. Мой сын смог развить навыки, чтобы помочь своей тревоге, и ему действительно было весело. Это так важно в раннем возрасте для детей иметь здоровые отношения с терапией.",
      author: "Родитель ребенка, проходящего лечение"
    },
    {
      text: "Другие виртуальные платформы терапии не такие. Этот сервис настолько удобен и эффективен. Мой сын ходил в школьный кабинет консультирования для посещения сессий, поэтому он получал необходимую помощь, когда это было удобно для нашей семьи.",
      author: "Опекун ребенка, проходящего лечение"
    }
  ];

  const ageGroups = [
    { 
      age: "0-2", 
      title: "Дети 0-2", 
      description: "Почувствуйте уверенность в уходе за вашим малышом.",
      detailedDescription: "Ранние годы жизни критически важны для развития. Наши специалисты помогают родителям понять эмоциональные потребности младенцев и малышей, создавая прочную основу для здорового развития."
    },
    { 
      age: "3-7", 
      title: "Дети 3-7", 
      description: "Дайте вашим детям то, что им нужно для процветания.",
      detailedDescription: "Дошкольный и ранний школьный возраст - время больших изменений. Мы помогаем детям развивать эмоциональную регуляцию, социальные навыки и справляться с вызовами роста."
    },
    { 
      age: "8-12", 
      title: "Дети 8-12", 
      description: "Помогите вашим детям жить самыми счастливыми и здоровыми жизнями.",
      detailedDescription: "Среднее детство приносит новые социальные и академические вызовы. Наша команда помогает детям развивать устойчивость, управлять стрессом и строить здоровые отношения."
    },
    { 
      age: "13-18", 
      title: "Подростки 13-18", 
      description: "Поддержите психическое здоровье вашего подростка. Независимо от того, с чем он сталкивается.",
      detailedDescription: "Подростковый возраст - это время значительных изменений. Мы помогаем подросткам навигировать через социальные давления, академический стресс и формирование идентичности."
    },
    { 
      age: "Родители", 
      title: "Родители", 
      description: "Поддержка вашего психического здоровья, не только как родителя и партнера, но и как человека.",
      detailedDescription: "Родительство может быть сложным. Мы поддерживаем родителей в их собственном психическом здоровье, помогая им быть лучшими родителями и партнерами, которыми они могут быть."
    },
    { 
      age: "Планирование, ожидание и послеродовой период", 
      title: "Планирование, ожидание и послеродовой период", 
      description: "Помогаем вам вырастить здоровую семью.",
      detailedDescription: "От планирования беременности до послеродового периода - мы поддерживаем вас на каждом этапе пути к родительству, помогая справляться с эмоциональными вызовами этого важного времени."
    },
  ];

  const conditions = [
    "Депрессия", "Тревога", "Травма и ПТСР", "СДВГ", "Самоповреждение",
    "Поведенческие проблемы", "ОКР", "Перинатальное и послеродовое психическое здоровье",
    "Супружеские конфликты", "Семейные отношения", "Сенсорная чувствительность",
    "Проблемы совместного воспитания", "Конфликты между братьями и сестрами",
    "Проблемы в отношениях", "Отношения родитель-ребенок", "Проблемы воспитания",
    "Коммуникация", "ЛГБТК+ идентичность", "Буллинг", "Управление стрессом"
  ];

  const services = [
    {
      icon: Heart,
      title: "Терапия",
      description: "Индивидуальная терапия для детей и их родителей. Семейная терапия и консультирование пар. Все с независимо лицензированными специалистами в области психического здоровья."
    },
    {
      icon: Brain,
      title: "Психиатрия",
      description: "Консультации и управление медикаментами для детей и родителей с психиатрами, обученными лечению как детей, так и взрослых."
    },
    {
      icon: Users,
      title: "Коучинг для родителей",
      description: "Коучинг и поддержка, ориентированные на родителей, с лицензированным специалистом, чтобы помочь вам со всеми проблемами воспитания."
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Время до начала лечения",
      description: "Начните нашу оценку психического здоровья семьи немедленно. Запишитесь на встречу в течение 24 часов. Никогда не в очереди."
    },
    {
      icon: Users,
      title: "Команда специалистов",
      description: "Клиницисты под руководством и обучением всемирно известных экспертов в области детского психического здоровья. Все клиницисты являются сотрудниками Balansity."
    },
    {
      icon: Video,
      title: "Виртуальная модель",
      description: "Видео и телефонные звонки отовсюду. Лучшие клиницисты для потребностей вашей семьи, по расписанию вашей семьи."
    },
    {
      icon: FileText,
      title: "Прозрачность",
      description: "Отчеты на основе результатов и прогресс, который вы можете видеть. Доступ к заметкам клиницистов и результатам оценки в приложении Balansity."
    },
    {
      icon: CheckCircle2,
      title: "Подход к лечению",
      description: "Доказательная помощь для всей семьи, адаптированная к уникальным потребностям каждой семьи."
    },
    {
      icon: Phone,
      title: "Здесь для вас 24/7",
      description: "Служба поддержки клиентов, когда она вам нужна. Отправляйте сообщения своему специалисту в любое время. Ресурсы под рукой."
    }
  ];

  const faqs = [
    {
      question: "Какие проблемы/вызовы вы решаете?",
      answer: "Наши специалисты имеют опыт работы с широким спектром проблем. Неполный список проблем, с которыми мы можем помочь: тревога, депрессия, травма, расстройства пищевого поведения, СДВГ, поведенческие проблемы, ОКР, горе/потеря. Однако в настоящее время мы не проводим оценку расстройств аутистического спектра."
    },
    {
      question: "Сколько стоят услуги?",
      answer: "Вводный звонок: Бесплатно\n\nТерапия\nОценка: 3500₽\nСессия терапии: 2000₽ за сессию\n\nСпециалист для родителей\nОценка: 2000₽\nСессия специалиста для родителей: 2000₽ за сессию\n\nПсихиатрия\nПервичная оценка психиатра: 5000₽\nСессия психиатра: 2500₽ за сессию\n\n*Доступны скидки при покупке пакетов, варианты будут обсуждаться с вашим координатором по уходу"
    },
    {
      question: "Принимаете ли вы страховку?",
      answer: "Мы работаем над расширением партнерств со страховыми компаниями. Все сессии терапии подходят для оплаты через HSA/FSA. Сессии специалиста для родителей будут зависеть от индивидуального страхового плана. По всем остальным вопросам о вашем покрытии свяжитесь с нами."
    },
    {
      question: "Как записаться на прием?",
      answer: "Если вы хотите поговорить с лицензированным специалистом и начать лечение, пожалуйста, запишитесь на вводную сессию через ваш аккаунт Balansity."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      
      <main>
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden bg-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl">
                Психическое здоровье для всей вашей семьи
              </h1>
              <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
                Семьи чувствуют себя лучше, когда работают вместе — так же должна работать и их медицинская помощь.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/service")}
                  className="h-14 px-8 text-base"
                >
                  Получить поддержку
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/service")}
                  className="h-14 px-8 text-base"
                >
                  Пройти оценку
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Accepted Insurance Plans Section */}
        <section id="pricing" className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="mb-4 font-serif text-2xl font-bold text-foreground md:text-3xl">
                Принимаемые страховые планы
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                Мы вас поддерживаем
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                Узнайте больше о покрытии в сети и вариантах оплаты вне сети.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">АльфаСтрахование</div>
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">Ингосстрах</div>
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">Росгосстрах</div>
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">СОГАЗ</div>
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">РЕСО-Гарантия</div>
                <div className="px-4 py-3 bg-card rounded-lg border text-sm font-medium text-center">ВТБ Страхование</div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 items-center">
                <div className="px-6 py-3 bg-card rounded-lg border text-sm font-medium">HSA/FSA</div>
                <div className="px-6 py-3 bg-card rounded-lg border text-sm font-medium">Гибкие варианты оплаты</div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section id="families" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Кому мы помогаем
              </h2>
              <p className="text-lg text-muted-foreground">
                Для каждой семьи — и каждого члена семьи
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ageGroups.map((group) => (
                <Card key={group.age} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-serif">{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <p className="text-sm text-muted-foreground mb-4">{group.detailedDescription}</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/#families")} className="w-full">
                      Узнать больше
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="conditions" className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Что мы лечим
              </h2>
              <p className="text-lg text-muted-foreground">
                Персонализированная помощь, адаптированная к потребностям вашей семьи
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {conditions.map((condition) => (
                <div
                  key={condition}
                  className="rounded-lg border bg-card p-4 text-center text-sm font-medium hover:bg-accent transition-colors"
                >
                  {condition}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-primary py-20 text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
                Отзывы
              </h2>
              <p className="text-lg opacity-90">
                Нам доверяют более 25 000 семей
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-primary-foreground/10 border-primary-foreground/20">
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <p className="text-xs opacity-80">{testimonial.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Наши результаты
              </h2>
              <p className="text-lg text-muted-foreground">
                Измеримые результаты, которые чувствует вся ваша семья
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                После 12 сессий семьи чувствуют разницу.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 text-5xl font-bold text-primary">80%</div>
                <p className="text-lg text-muted-foreground">
                  80% детей показывают клинически значимое улучшение за 12 сессий
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-5xl font-bold text-primary">3 из 4</div>
                <p className="text-lg text-muted-foreground">
                  3 из 4 родителей имеют клинически значимое снижение тревоги и депрессии
                </p>
              </div>
              <div className="text-center">
                <div className="mb-4 text-5xl font-bold text-primary">61%</div>
                <p className="text-lg text-muted-foreground">
                  61% семей сообщают о значительном снижении стресса
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Как это работает
              </h2>
              <p className="text-lg text-muted-foreground">
                Чего ожидать, когда вы начинаете лечение с Balansity
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mx-auto">
                    1
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold">Расскажите нам, что происходит</h3>
                  <p className="text-muted-foreground">
                    Помогите нам понять ваши потребности, ответив на вопросы о вашей семье.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mx-auto">
                    2
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold">Начните лечение немедленно</h3>
                  <p className="text-muted-foreground">
                    Запишитесь на 30-минутный вводный звонок в течение 24 часов после запроса. Получите подбор лучших специалистов в области психического здоровья.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mx-auto">
                    3
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold">Отслеживайте прогресс, видите результаты</h3>
                  <p className="text-muted-foreground">
                    Персонализированные планы лечения, результаты оценки, отчеты о прогрессе и заметки клиницистов. Все в приложении Balansity.
                  </p>
                </div>
              </div>
              <div className="mt-12 text-center">
                <Button size="lg" onClick={() => navigate("/service")} className="h-14 px-8">
                  Получить поддержку
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Наши услуги
              </h2>
              <p className="text-lg text-muted-foreground">
                Комплексная помощь, которая работает
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Icon className="mb-4 h-12 w-12 text-primary" />
                      <CardTitle className="font-serif">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{service.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Balansity Section */}
        <section id="why" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Почему Balansity
              </h2>
              <p className="text-lg text-muted-foreground">
                Что делает Balansity особенным
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Icon className="mb-4 h-10 w-10 text-primary" />
                      <CardTitle className="font-serif text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{benefit.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section id="about" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                  Наша экспертиза
                </h2>
                <p className="text-lg text-muted-foreground">
                  Лидер в области детского психического здоровья
                </p>
              </div>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl mb-4">
                    Доктор Хелен Эггер - Основатель и главный медицинский и научный директор
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base text-muted-foreground">
                    Доктор Хелен Эггер - соучредитель и главный медицинский и научный директор Balansity. 
                    Она детский психиатр, которая была лидером в области детского психического здоровья 
                    более 30 лет. Ранее она была главой отделения детской и подростковой психиатрии в 
                    Duke Medicine и председателем кафедры детской и подростковой психиатрии и директором 
                    NYU Child Study Center в NYU Langone Health.
                  </p>
                  <p className="text-base text-muted-foreground">
                    Доктор Эггер также является всемирно признанным исследователем в области раннего 
                    детского психического здоровья. Её исследования установили стандарт для измерения 
                    психического здоровья детей и являются основой оценки психического здоровья семьи 
                    Balansity и модели помощи, основанной на измерениях, для всей семьи.
                  </p>
                  <div className="pt-4">
                    <Button variant="outline" onClick={() => navigate("/#about")}>
                      Узнать больше
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                Часто задаваемые вопросы
              </h2>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
              Не ждите, чтобы получить помощь, в которой нуждается ваша семья
            </h2>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/service")}
                className="h-14 px-8"
              >
                Получить поддержку
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/service")}
                className="h-14 px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Пройти оценку
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

