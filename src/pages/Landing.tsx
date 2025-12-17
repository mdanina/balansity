import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);

  const testimonials = [
    {
      text: "Наш психолог была такой доброй и понимающей. Я вижу, как мой ребенок стал увереннее, спокойнее. Это просто чудо, честно говоря.",
      author: "Мама 7-летней дочери, завершившей курс"
    },
    {
      text: "Сыну 8 лет, и я вижу огромный прогресс. Мне очень нравится, что через приложение я всегда могу посмотреть, как идут дела, когда у него сессии, пообщаться с психологом. Очень удобно для работающей мамы.",
      author: "Мама 8-летнего сына, проходящего лечение"
    },
    {
      text: "У меня двое детей — 9 и 6 лет. Не всегда есть возможность возить их на очные консультации, особенно когда работаешь. Balansity — это спасение. Дети получают помощь дома, а я вижу, как их поддерживают и как они меняются.",
      author: "Мама двоих детей, завершивших курс"
    },
    {
      text: "Мы с Balansity уже два года. Оба моих ребенка — подростки, 13 и 11 лет — получают здесь помощь. Я вижу, как они стали справляться со своими проблемами, как изменилась атмосфера в семье. Это действительно изменило нашу жизнь к лучшему.",
      author: "Мама 13-летнего и 11-летнего ребенка, проходящих лечение"
    },
    {
      text: "Сын очень тревожный был, проблемы в школе, с одноклассниками. Я не знала, что делать. Сейчас вижу, как он раскрывается, как ему комфортно с психологом. Он сам ждет сессий. Это так успокаивает — знать, что он в надежных руках.",
      author: "Мама 10-летнего сына, проходящего лечение"
    },
    {
      text: "Современные дети сталкиваются с такими проблемами, о которых мы в их возрасте даже не думали. Я рада, что есть специалисты, которые понимают это и помогают нашим детям справляться. Вижу, как дочка учится управлять своими эмоциями.",
      author: "Мама 9-летней дочери, проходящей лечение"
    },
    {
      text: "Кажется, что как мама ты должна все знать и уметь помочь. Но иногда просто не понимаешь, что происходит с ребенком. Психологи Balansity видят то, что я не замечала, и помогают всей семье.",
      author: "Мама 12-летнего ребенка, проходящего лечение"
    },
    {
      text: "Я очень довольна результатами. Воспитание — это сложно, особенно когда не знаешь, как правильно поступить. Здесь я могу просто написать или позвонить, и мне всегда помогут разобраться в ситуации.",
      author: "Мама 6-летнего ребенка, проходящего лечение"
    },
    {
      text: "Balansity — это совсем другой подход. Сыну 7 лет, он научился справляться со своей тревогой, и главное — ему нравится. Он даже играет в игры, которые ему дал психолог. Для меня важно, чтобы у ребенка с детства было здоровое отношение к психологической помощи.",
      author: "Мама 7-летнего сына, проходящего лечение"
    },
    {
      text: "Пробовали другие онлайн-сервисы, но здесь совсем другой уровень. Очень удобно, что можно заниматься из дома, в комфортной обстановке. Сын ходил в школьного психолога, но там не всегда было удобно по времени. А здесь все подстраивается под наш график.",
      author: "Мама 11-летнего сына, проходящего лечение"
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

  // Детализация помощи для каждой возрастной группы
  const ageGroupDetails: Record<string, { subtitle: string; intro: string; challenges: { title: string; description: string }[] }> = {
    "0-2": {
      subtitle: "Почувствуйте уверенность в уходе за вашим малышом",
      intro: "Улучшите психическое здоровье вашего ребенка еще до того, как он научится говорить. Мы можем помочь.",
      challenges: [
        { title: "Питание и кормление", description: "Помогаем вам растить здоровых и счастливых едоков." },
        { title: "Трудности с успокоением", description: "Учим вас ухаживать за младенцами и малышами, которых сложно успокоить." },
        { title: "Ко-регуляция", description: "Обучаем вас поддерживать эмоциональную регуляцию между вами и вашим малышом." },
        { title: "Сон и режим дня", description: "Помогаем вашей семье выработать здоровые привычки сна, чтобы все высыпались." },
        { title: "Укрепление отношений", description: "Поддерживаем развитие здоровых семейных отношений, чтобы ваши дети чувствовали себя в безопасности." },
        { title: "Игра", description: "Учим вас строить отношения и развивать здоровое исследование через творческую игру." },
        { title: "Выражение эмоций", description: "Направляем ваших детей в определении, выражении и управлении чувствами." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." }
      ]
    },
    "3-7": {
      subtitle: "Дайте вашим детям то, что им нужно для процветания",
      intro: "Даже маленькие дети сталкиваются с трудными эмоциями и отношениями. Мы можем помочь.",
      challenges: [
        { title: "Сон и режим дня", description: "Помощь в управлении истериками перед сном, трудностями с засыпанием и ночными кошмарами." },
        { title: "Поведенческие проблемы", description: "Учим вас распознавать и управлять как типичным, так и тревожным поведением." },
        { title: "Гиперактивность и внимание", description: "Помогаем справляться с трудностями воспитания маленьких детей и распознавать признаки СДВГ." },
        { title: "Тревога и страхи", description: "Выявление и терапия тревоги разлуки, социальной тревоги, беспокойства и страхов." },
        { title: "Грусть", description: "Помогаем вам распознать типичную и тревожную грусть, и как помочь ребенку почувствовать себя лучше." },
        { title: "Управление большими чувствами", description: "Учим вашего ребенка определять, выражать и управлять сильными эмоциями здоровым способом." }
      ]
    },
    "8-12": {
      subtitle: "Помогите вашим детям жить самыми счастливыми и здоровыми жизнями",
      intro: "Ваш ребенок испытывает трудности в школе или дома? Мы здесь, чтобы помочь.",
      challenges: [
        { title: "Дружба", description: "Помогаем вашему ребенку развить социальные навыки для поиска и поддержания друзей." },
        { title: "Поведенческие проблемы", description: "Работаем с вами и вашим ребенком над развитием навыков понимания и управления тревожным поведением." },
        { title: "Внимание и концентрация", description: "Раннее выявление и терапия СДВГ для предотвращения негативных последствий в школе, дома и с друзьями." },
        { title: "Тревога и страхи", description: "Выявление и терапия беспокойства, страхов, социальной тревоги, тревоги разлуки и ОКР." },
        { title: "Грусть", description: "Выявление и терапия детской депрессии." },
        { title: "Регуляция сильных эмоций", description: "Направляем вашего ребенка в определении, выражении и управлении большими чувствами здоровым способом." },
        { title: "Отказ от школы", description: "Работаем с вами, вашим ребенком и школой для поддержки успешного возвращения к учебе." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." },
        { title: "Питание", description: "Выявление и терапия расстройств пищевого поведения и проблем с образом тела." },
        { title: "Гендерная идентичность", description: "Поддержка и принятие гендерной идентичности вашего ребенка." },
        { title: "Буллинг", description: "Работа с психическим здоровьем детей, столкнувшихся с травлей." }
      ]
    },
    "13-18": {
      subtitle: "Поддержите психическое здоровье вашего подростка",
      intro: "Подростки часто сталкиваются с трудностями, преодолевая жизненные вызовы. Мы можем помочь.",
      challenges: [
        { title: "Депрессия", description: "Помогаем распознать, когда это больше, чем обычная грусть, и получить необходимую помощь." },
        { title: "Тревожность", description: "Терапия тревожных расстройств включая генерализованную, социальную тревогу, фобии и ОКР." },
        { title: "Рискованное поведение", description: "Помогаем выявить и управлять поведением, опасным для здоровья и безопасности подростка." },
        { title: "СДВГ", description: "Диагностика и терапия СДВГ. Обучение социальным и организационным навыкам." },
        { title: "Управление стрессом", description: "Учим вас и вашего подростка справляться со стрессом." },
        { title: "Давление сверстников и буллинг", description: "Направляем подростка в преодолении социальных вызовов и развитии здоровых отношений." },
        { title: "Интернет и соцсети", description: "Помогаем вашей семье выработать здоровые отношения с интернетом и социальными сетями." },
        { title: "Самоповреждение", description: "Терапия подростков, которые причиняют себе вред или испытывают суицидальные мысли." },
        { title: "Работа с травмой", description: "Помогаем вашему ребенку и семье пережить трудный опыт." }
      ]
    },
    "Родители": {
      subtitle: "Поддержка вашего психического здоровья — как родителя, партнера и человека",
      intro: "Баланс между жизнью, работой, воспитанием и отношениями — непростая задача. Мы здесь для вас.",
      challenges: [
        { title: "Депрессия", description: "Выявление и терапия депрессии и других расстройств настроения." },
        { title: "Тревожность", description: "Выявление и терапия тревожных расстройств." },
        { title: "СДВГ у взрослых", description: "Выявление и терапия СДВГ у взрослых." },
        { title: "ПТСР", description: "Поддержка в выявлении и терапии ПТСР и других проблем, связанных со стрессом и травмой." },
        { title: "Конфликты в отношениях", description: "Улучшение качества ваших отношений через семейное консультирование." },
        { title: "Семейные отношения", description: "Улучшение коммуникации и сотрудничества между всеми членами семьи." },
        { title: "Совместное воспитание", description: "Поддержка со-родителей в достижении согласия друг с другом." },
        { title: "Баланс работы и жизни", description: "Помогаем установить здоровые границы и личные ожидания для успеха во всех ролях." }
      ]
    },
    "Планирование, ожидание и послеродовой период": {
      subtitle: "Помогаем вам вырастить здоровую семью",
      intro: "Расширение семьи — это одновременно волнительно и страшно. Мы поможем справиться со всеми большими переменами.",
      challenges: [
        { title: "Лечение бесплодия", description: "Поддержка на вашем пути к зачатию." },
        { title: "Первый раз родители", description: "Направляем вас в этом волнительном и иногда стрессовом переходе." },
        { title: "Пренатальное и послеродовое здоровье", description: "Выявление и терапия депрессии, тревоги и других проблем от зачатия до первых лет жизни ребенка." },
        { title: "Проблемы партнера", description: "Выявление и терапия психического здоровья пап и других партнеров." },
        { title: "Потеря беременности", description: "Поддержка в переживании утраты." },
        { title: "Усыновление", description: "Помогаем вашей семье пройти через радости и трудности усыновления ребенка." },
        { title: "Суррогатное материнство", description: "Поддержка вашей семьи на пути суррогатного материнства." }
      ]
    }
  };

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
                <Card
                  key={group.age}
                  className="hover:shadow-lg transition-shadow flex flex-row items-center p-8 cursor-pointer"
                  onClick={() => setSelectedAgeGroup(group.age)}
                >
                  <img
                    src={group.image}
                    alt={group.title}
                    className="landing-age-group-image flex-shrink-0"
                  />
                  <div className="flex-1 ml-6">
                    <CardTitle className="font-serif text-xl mb-3">{group.title}</CardTitle>
                    <CardDescription className="mb-4 text-base">{group.description}</CardDescription>
                    <button
                      className="text-sm font-medium text-primary hover:underline underline-offset-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgeGroup(group.age);
                      }}
                    >
                      Узнать больше
                    </button>
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
                      Наталья Владимировна Кисельникова — ведущий методолог Balansity, кандидат психологических наук, психолог-исследователь с более чем 15-летним опытом руководства междисциплинарными проектами в сфере психического здоровья.
                    </p>
                    <p className="text-base text-white/90">
                      Она имеет степень MSc in Psychosocial Studies (Birkbeck, University of London) и специализируется на разработке и внедрении программ психического благополучия, основанных на данных, включая цифровые инструменты оценки, профилактики и поддержки. Ранее Наталья руководила исследовательскими и прикладными проектами в области B2B-программ ментального здоровья, психологической диагностики и внедрения ИИ-решений для анализа психоэмоциональных состояний.
                    </p>
                    <p className="text-base text-white/90">
                      В Balansity Наталья отвечает за стратегическую архитектуру продукта, включая модель оценки психического здоровья семьи, маршрутизацию помощи и интеграцию научно обоснованных подходов в масштабируемую цифровую платформу.
                    </p>
                  </div>
                </div>

                {/* Right side - Photo */}
                <div className="flex items-center justify-center px-4 md:px-0">
                  <img 
                    src={expertImage} 
                    alt="Наталья Владимировна Кисельникова"
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

        {/* Age Group Details Popup */}
        <Dialog open={selectedAgeGroup !== null} onOpenChange={(open) => !open && setSelectedAgeGroup(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedAgeGroup && ageGroupDetails[selectedAgeGroup] && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl md:text-3xl">
                    {ageGroups.find(g => g.age === selectedAgeGroup)?.title}
                  </DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    {ageGroupDetails[selectedAgeGroup].subtitle}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <p className="text-muted-foreground mb-6">
                    {ageGroupDetails[selectedAgeGroup].intro}
                  </p>

                  <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">
                    С чем мы помогаем
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {ageGroupDetails[selectedAgeGroup].challenges.map((challenge, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted">
                        <h5 className="font-semibold text-foreground mb-1">{challenge.title}</h5>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      onClick={() => {
                        setSelectedAgeGroup(null);
                        navigate("/service");
                      }}
                      className="landing-cta-primary-new h-12 px-6"
                    >
                      Получить поддержку
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setSelectedAgeGroup(null)}
                      className="h-12 px-6"
                    >
                      Назад
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <LandingFooter />
    </div>
  );
}

