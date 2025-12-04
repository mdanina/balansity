import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResultIcon } from "@/components/landing/ResultIcon";
import { ServiceIcon } from "@/components/landing/ServiceIcons";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { 
  Clock, 
  CheckCircle2,
  Phone,
  Video,
  FileText
} from "lucide-react";
import "@/components/landing/Landing.css";
import familyImage from "@/assets/illustration-of-a-caucasian-family---father--mothe (2).png";
import familyImageAlt from "@/assets/illustration-of-a-caucasian-family---father--mothe (1).png";
import familySetupImage from "@/assets/family-setup.png";
import motherFatherImage from "@/assets/flat-cartoon-illustration-of-a-mother-and-father-h.png";
import flatMinimalCartoonImage from "@/assets/illustration-in-flat-minimal-cartoon-style-showing.png";
import parentsStandingImage from "@/assets/flat-cartoon-style-illustration-of-parents-standin.png";
import happyCaucasianCoImage from "@/assets/cartoon-style-illustration-of-a-happy-caucasian-co.png";
import youngCaucasianCo2Image from "@/assets/cartoon-style-illustration-of-a-young-caucasian-co (2).png";
import expertImage from "@/assets/friendly-and-clean-face-of-an-adult-person--gender.png";
import otterRelaxed from "@/assets/otter-relaxed.png";
import b7d9b091Image from "@/assets/b7d9b091-406e-44ad-a80c-6349c93ba1e3.png";
import chatgptImage4Dec from "@/assets/ChatGPT Image 4 дек. 2025 г., 15_38_13.png";
import chatgptImage4Dec2 from "@/assets/ChatGPT Image 4 дек. 2025 г., 15_41_26.png";
import youngCaucasianCoImage from "@/assets/cartoon-style-illustration-of-a-young-caucasian-co.png";

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
      image: youngCaucasianCoImage
    },
    { 
      age: "3-7", 
      title: "Дети 3-7", 
      description: "Дайте вашим детям то, что им нужно для процветания.",
      image: motherFatherImage
    },
    { 
      age: "8-12", 
      title: "Дети 8-12", 
      description: "Помогите вашим детям жить самыми счастливыми и здоровыми жизнями.",
      image: flatMinimalCartoonImage
    },
    { 
      age: "13-18", 
      title: "Подростки", 
      description: "Поддержите психическое здоровье вашего подростка. Независимо от того, с чем он сталкивается.",
      image: parentsStandingImage
    },
    { 
      age: "Родители", 
      title: "Родители", 
      description: "Поддержка вашего психического здоровья, не только как родителя и партнера, но и как человека.",
      image: happyCaucasianCoImage
    },
    { 
      age: "Планирование, ожидание и послеродовой период", 
      title: "Планирование, ожидание и послеродовой период", 
      description: "Помогаем вам вырастить здоровую семью.",
      image: youngCaucasianCo2Image
    },
  ];

  const conditions = [
    "Депрессия", "Тревога", "Травма и ПТСР", "СДВГ", "Самоповреждение",
    "Поведенческие проблемы", "ОКР", "Перинатальное и послеродовое психическое здоровье",
    "Супружеские конфликты", "Семейные отношения", "Сенсорная чувствительность",
    "Проблемы совместного воспитания", "Конфликты между братьями и сестрами",
    "Проблемы в отношениях", "Отношения родитель-ребенок", "Проблемы воспитания",
    "Коммуникация", "Идентичность", "Буллинг", "Управление стрессом"
  ];

  const services = [
    {
      iconType: "therapy" as const,
      title: "Детский психолог",
      description: "Индивидуальная психологическая помощь для детей и подростков. Работа с эмоциональными трудностями, поведенческими проблемами, тревогой, депрессией и другими психологическими вызовами. Специалисты используют доказательные методы терапии, адаптированные под возраст и потребности ребенка."
    },
    {
      iconType: "psychiatry" as const,
      title: "Психиатр",
      description: "Первичные консультации и ведение медикаментозного лечения для детей и родителей. Психиатры, обученные работе как с детьми, так и со взрослыми, проводят комплексную оценку и разрабатывают индивидуальный план лечения при необходимости."
    },
    {
      iconType: "neuropsychology" as const,
      title: "Нейропсихолог",
      description: "Диагностика и коррекция когнитивных функций у детей. Оценка внимания, памяти, мышления, речи и других высших психических функций. Разработка индивидуальных программ развития и реабилитации после травм или нарушений развития."
    },
    {
      iconType: "neurology" as const,
      title: "Невролог",
      description: "Консультации детского невролога для диагностики и лечения неврологических нарушений. Работа с головными болями, нарушениями сна, тиками, задержками речевого и моторного развития, последствиями травм и другими неврологическими проблемами."
    },
    {
      iconType: "family" as const,
      title: "Семейный психолог",
      description: "Семейная терапия для улучшения отношений внутри семьи. Работа с конфликтами между родителями и детьми, проблемами в отношениях партнеров, вопросами совместного воспитания. Помощь в создании здоровой семейной динамики и налаживании коммуникации."
    },
    {
      iconType: "speech" as const,
      title: "Логопед",
      description: "Коррекция нарушений речи и коммуникации у детей. Работа с задержками речевого развития, дислалией, дизартрией, заиканием, нарушениями чтения и письма. Развитие артикуляции, фонематического слуха и коммуникативных навыков."
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Время до начала лечения",
      description: "Начните нашу оценку психического здоровья семьи немедленно. Запишитесь на встречу в течение 24 часов. Никогда не в очереди."
    },
    {
      icon: CheckCircle2,
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
        <section id="hero" className="landing-hero-new bg-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 items-center max-w-7xl mx-auto">
              {/* Left side - Text content */}
              <div>
                <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                  Психологическое благополучие для{" "}
                  <span className="italic text-5xl md:text-6xl lg:text-7xl">всей семьи</span>
                </h1>
                <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                  Семьи чувствуют себя лучше, когда работают вместе — так же должна работать и их психологическая помощь.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={() => navigate("/service")}
                    className="landing-cta-primary-new h-14 px-8 text-base"
                  >
                    Получить поддержку
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => navigate("/service")}
                    className="landing-cta-secondary-new h-14 px-8 text-base"
                  >
                    Пройти оценку
                  </Button>
                </div>
              </div>

              {/* Right side - Image */}
              <div className="relative">
                <div className="landing-hero-image-wrapper">
                  <img 
                    src={familyImage} 
                    alt="Семья" 
                    className="landing-hero-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve Section */}
        <section id="families" className="bg-muted py-12 landing-who-we-serve relative overflow-hidden">
          {/* Decorative wave shape */}
          <svg className="landing-wave-bottom" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M -200 200 L 1400 200 L 1200 0 Q 1000 150 800 100 Q 600 150 400 100 Q 200 150 0 100 L 0 0 Z" fill="hsl(35, 25%, 92%)" opacity="0.95"/>
          </svg>
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-12 text-left">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                КОМУ МЫ ПОМОГАЕМ
              </h2>
              <h3 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Для каждой семьи — и каждого члена семьи
              </h3>
              <p className="text-lg text-muted-foreground">
                Комплексная помощь в области психологического благополучия для всей семьи, адаптированная к вашим потребностям.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ageGroups.map((group) => (
                <Card key={group.age} className="hover:shadow-lg transition-shadow flex flex-row items-center p-8">
                  <img 
                    src={group.image} 
                    alt={group.title}
                    className="landing-age-group-image flex-shrink-0"
                  />
                  <div className="flex-1 ml-6">
                    <CardTitle className="font-serif text-xl mb-3">{group.title}</CardTitle>
                    <CardDescription className="mb-4 text-base">{group.description}</CardDescription>
                    <a 
                      href="/#families"
                      className="text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                      Узнать больше
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What We Treat Section */}
        <section id="conditions" className="py-12" style={{ backgroundColor: 'hsl(35, 25%, 92%)' }}>
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                С ЧЕМ МЫ РАБОТАЕМ
              </h2>
              <h3 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Персонализированная помощь для вас и ваших детей
              </h3>
            </div>
            <div className="landing-conditions-grid-staggered">
              {conditions.map((condition) => (
                <div
                  key={condition}
                  className="landing-condition-tag text-center text-sm font-medium"
                >
                  {condition}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 landing-testimonials-section relative overflow-hidden" style={{ backgroundColor: 'hsl(35, 25%, 92%)' }}>
          {/* Decorative wave shape */}
          <svg className="landing-testimonials-wave" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 0 200 L 1200 200 L 1200 0 Q 1000 150 800 100 Q 600 150 400 100 Q 200 150 0 100 L 0 0 Z" fill="hsl(30, 14%, 98.5%)" opacity="0.9"/>
          </svg>
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Нам доверяют более 25 000 семей
              </h2>
            </div>
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>

        {/* Results Section */}
        <section id="results" className="py-12" style={{ backgroundColor: 'hsl(30, 14%, 98.5%)' }}>
          <div className="container mx-auto px-4">
            <div className="mb-12 text-left max-w-4xl">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                НАШИ РЕЗУЛЬТАТЫ
              </h2>
              <h3 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Измеримые результаты, которые чувствует вся ваша семья
              </h3>
              <p className="text-lg text-muted-foreground">
                После 12 сессий семьи чувствуют разницу.
              </p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <div>
                <div className="mb-6">
                  <img 
                    src={b7d9b091Image} 
                    alt="Результаты" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="mb-4 text-5xl font-bold text-foreground">80%</div>
                <p className="text-base text-muted-foreground">
                  80% детей показывают клинически значимое улучшение за 12 сессий
                </p>
              </div>
              <div>
                <div className="mb-6">
                  <img 
                    src={chatgptImage4Dec} 
                    alt="Результаты" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="mb-4 text-5xl font-bold text-foreground">3 из 4</div>
                <p className="text-base text-muted-foreground">
                  3 из 4 родителей имеют клинически значимое снижение тревоги и депрессии
                </p>
              </div>
              <div>
                <div className="mb-6">
                  <img 
                    src={chatgptImage4Dec2} 
                    alt="Результаты" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="mb-4 text-5xl font-bold text-foreground">61%</div>
                <p className="text-base text-muted-foreground">
                  61% семей сообщают о значительном снижении стресса
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                КАК ЭТО РАБОТАЕТ
              </h2>
              <h3 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Чего ожидать, когда вы начинаете работу с Balansity
              </h3>
              <p className="mb-8 text-lg text-muted-foreground">
                Получите доступ к помощи высочайшего качества, немедленно.
              </p>
              <Button size="lg" onClick={() => navigate("/service")} className="landing-cta-primary-new h-14 px-8">
                Получить поддержку
              </Button>
            </div>
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                {/* Left side - Steps */}
                <div>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                        1
                      </div>
                      <div>
                        <h3 className="mb-2 font-serif text-xl font-semibold">Расскажите нам, что происходит</h3>
                        <p className="text-muted-foreground">
                          Помогите нам понять ваши потребности, ответив на вопросы о вашей семье.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                        2
                      </div>
                      <div>
                        <h3 className="mb-2 font-serif text-xl font-semibold">Начните работу с нами без промедлений</h3>
                        <p className="text-muted-foreground">
                          Запишитесь на 30-минутный вводный звонок в течение 24 часов после запроса. Получите подбор лучших специалистов в области психического здоровья.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                        3
                      </div>
                      <div>
                        <h3 className="mb-2 font-serif text-xl font-semibold">Отслеживайте объективный прогресс</h3>
                        <p className="text-muted-foreground">
                          Персонализированные планы, результаты тестирования, отчеты о прогрессе и заметки специалистов. Все в личном кабинете Balansity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Image */}
                <div className="relative">
                  <div className="landing-how-it-works-image relative">
                    <img 
                      src={familyImageAlt} 
                      alt="Семья" 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-12">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-left">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                НАШИ УСЛУГИ
              </h2>
              <h3 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Комплексная помощь, которая работает
              </h3>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4 h-12 w-12">
                      <ServiceIcon type={service.iconType} className="h-full w-full" />
                    </div>
                    <CardTitle className="font-serif text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Balansity Section */}
        <section id="why" className="bg-muted pt-12 pb-0">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-left max-w-6xl">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                ПОЧЕМУ BALANSITY
              </h2>
              <h3 className="mb-4 font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Что делает Balansity особенным
              </h3>
            </div>
            <div className="max-w-6xl">
              <div className="space-y-0">
                {benefits.map((benefit, index) => (
                  <div key={benefit.title}>
                    <div className="grid md:grid-cols-[38%_62%] gap-12 py-4">
                      <div className="flex items-start">
                        <h4 className="font-serif text-xl md:text-2xl font-semibold text-foreground leading-tight">
                          {benefit.title}
                        </h4>
                      </div>
                      <div className="flex items-start">
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                    {index < benefits.length - 1 && (
                      <div className="border-t border-border/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dark blue middle section with wavy bottom edge - integrated */}
          <div className="relative mt-8" style={{ backgroundColor: 'var(--landing-dark-blue)' }}>
            <svg 
              className="absolute bottom-0 left-0 right-0 w-full h-24 md:h-32 lg:h-40"
              viewBox="0 0 1200 200" 
              preserveAspectRatio="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                d="M 0 200 L 0 0 L 1200 0 L 1200 200 Q 1000 120, 800 150 Q 600 180, 400 140 Q 200 100, 0 160 Z" 
                fill="hsl(var(--muted))"
              />
            </svg>
            <div className="h-16 md:h-24 lg:h-32"></div>
          </div>
        </section>

        {/* Expertise Section */}
        <section id="about" className="relative py-0 overflow-hidden">
          
          {/* Dark blue content section */}
          <div style={{ backgroundColor: 'var(--landing-dark-blue)' }}>
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 py-16 md:py-20">
                {/* Left side - Text content */}
                <div className="px-4 md:px-0">
                  <div className="text-[hsl(45,100%,60%)] text-sm font-semibold uppercase tracking-wide mb-4">
                    НАША ЭКСПЕРТИЗА
                  </div>
                  <h2 className="mb-6 font-serif text-4xl font-bold text-white md:text-5xl">
                    Лидер в области детского психического здоровья
                  </h2>
                  <div className="space-y-4 mb-6">
                    <p className="text-base text-white/90">
                      Доктор Хелен Эггер - соучредитель и главный медицинский и научный директор Balansity. 
                      Она детский психиатр, которая была лидером в области детского психического здоровья 
                      более 30 лет. Ранее она была главой отделения детской и подростковой психиатрии в 
                      Duke Medicine и председателем кафедры детской и подростковой психиатрии и директором 
                      NYU Child Study Center в NYU Langone Health.
                    </p>
                    <p className="text-base text-white/90">
                      Доктор Эггер также является всемирно признанным исследователем в области раннего 
                      детского психического здоровья. Её исследования установили стандарт для измерения 
                      психического здоровья детей и являются основой оценки психического здоровья семьи 
                      Balansity и модели помощи, основанной на измерениях, для всей семьи.
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/#about")}
                    className="bg-[hsl(45,100%,60%)] hover:bg-[hsl(45,100%,55%)] text-[hsl(203,60%,15%)] font-semibold border-none"
                  >
                    Узнать больше
                  </Button>
                </div>
                
                {/* Right side - Photo */}
                <div className="flex items-center justify-center px-4 md:px-0">
                  <img 
                    src={expertImage} 
                    alt="Доктор Хелен Эггер"
                    className="landing-expertise-photo"
                    onError={(e) => {
                      // Fallback если изображение не найдено
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="bg-muted pt-12 pb-2">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                FAQs
              </h2>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left font-semibold text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              
              {/* See more button */}
              <div className="mt-6 text-center" style={{ marginTop: 'calc(1.5rem + 10px)' }}>
                <Button
                  size="lg"
                  onClick={() => navigate("/service")}
                  className="bg-[var(--landing-dark-blue)] hover:bg-[hsl(203,60%,12%)] text-white border-none h-12 px-6 text-base font-semibold"
                >
                  Узнать больше
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section with Wave and Otter */}
        <section className="relative overflow-hidden">
          {/* Dark blue top section */}
          <div className="h-24 md:h-32 lg:h-40 relative" style={{ backgroundColor: 'var(--landing-dark-blue)' }}>
            {/* SVG wave curve */}
            <svg 
              className="absolute bottom-0 left-0 right-0 w-full h-24 md:h-32 lg:h-40"
              viewBox="0 0 1200 300" 
              preserveAspectRatio="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                d="M 0 300 L 0 0 L 1200 0 L 1200 300 Q 1000 180, 800 220 Q 600 160, 400 200 Q 200 140, 0 180 Z" 
                fill="hsl(var(--muted))"
              />
            </svg>
          </div>
          
          {/* Dark blue bottom section with content */}
          <div className="relative pt-4 md:pt-6 lg:pt-8" style={{ backgroundColor: 'var(--landing-dark-blue)' }}>
            <div className="container mx-auto px-4 pb-16 md:pb-20">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="mb-8 font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                  Не ждите, чтобы получить помощь, в которой нуждается ваша семья
                </h2>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate("/service")}
                    className="bg-[hsl(45,100%,60%)] hover:bg-[hsl(45,100%,55%)] text-[hsl(203,60%,15%)] font-semibold border-none h-14 px-8 text-base"
                  >
                    Получить поддержку
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/service")}
                    className="h-14 px-8 text-base border-white text-white hover:bg-white hover:text-[hsl(203,60%,15%)] bg-transparent"
                  >
                    Пройти оценку
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

