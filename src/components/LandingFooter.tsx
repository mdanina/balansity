import { Link } from "react-router-dom";

export const LandingFooter = () => {
  const footerLinks = {
    families: [
      { label: "Дети 0-2", href: "/#families" },
      { label: "Дети 3-7", href: "/#families" },
      { label: "Дети 8-12", href: "/#families" },
      { label: "Подростки 13-18", href: "/#families" },
      { label: "Родители", href: "/#families" },
      { label: "Планирование, ожидание и послеродовой период", href: "/#families" },
    ],
    howCareWorks: [
      { label: "Как это работает", href: "/#how-it-works" },
      { label: "Наши услуги", href: "/#services" },
      { label: "Что мы лечим", href: "/#conditions" },
      { label: "Наша команда", href: "/#about" },
      { label: "Почему виртуальная терапия работает", href: "/#why" },
      { label: "Оценка психического здоровья семьи", href: "/#how-it-works" },
    ],
    pricing: [
      { label: "Цены и страховка", href: "/#pricing" },
    ],
    partners: [
      { label: "Педиатры и клиницисты", href: "/#partners" },
      { label: "Страховые компании", href: "/#pricing" },
      { label: "Медицинские системы", href: "/#partners" },
      { label: "Стратегические партнеры", href: "/#partners" },
      { label: "Направить в Balansity", href: "/#partners" },
    ],
    programs: [
      { label: "RAFT Программа: Расстройство аутистического спектра", href: "/#programs" },
    ],
    resources: [
      { label: "Блог", href: "/#resources" },
      { label: "Центр ресурсов", href: "/#resources" },
      { label: "Инструменты", href: "/#resources" },
      { label: "Скрининговые тесты", href: "/#resources" },
      { label: "События и вебинары", href: "/#resources" },
    ],
    publications: [
      { label: "Отчеты и технические документы", href: "/#publications" },
      { label: "Пресса и новости", href: "/#press" },
    ],
    about: [
      { label: "О нас", href: "/#about" },
      { label: "Магазин", href: "/#shop" },
      { label: "Карьера", href: "/#careers" },
      { label: "Связаться с нами (Семьи)", href: "/#contact" },
      { label: "Связаться с нами (Партнеры)", href: "/#contact-partners" },
    ],
  };

  const locations = [
    "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
    "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
    "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград"
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Для семей */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Для семей</h3>
            <ul className="space-y-2">
              {footerLinks.families.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Как работает */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Как работает</h3>
            <ul className="space-y-2">
              {footerLinks.howCareWorks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Цены */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Цены</h3>
            <ul className="space-y-2">
              {footerLinks.pricing.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Для партнеров */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Для партнеров</h3>
            <ul className="space-y-2">
              {footerLinks.partners.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <h4 className="mt-4 mb-2 font-serif text-xs font-semibold text-foreground">Программы</h4>
            <ul className="space-y-2">
              {footerLinks.programs.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ресурсы */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Ресурсы</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <h4 className="mt-4 mb-2 font-serif text-xs font-semibold text-foreground">Публикации</h4>
            <ul className="space-y-2">
              {footerLinks.publications.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* О нас */}
        <div className="mt-8">
          <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">О нас</h3>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {footerLinks.about.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Locations */}
        <div className="mt-8">
          <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Регионы</h3>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
            {locations.map((location) => (
              <span key={location} className="text-sm text-muted-foreground">
                {location}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">© {new Date().getFullYear()} Balansity. Все права защищены.</p>
              <p className="font-medium text-foreground">Связаться с нами: <a href="tel:+74951234567" className="hover:text-primary transition-colors">+7 (495) 123-45-67</a></p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="/#terms" className="hover:text-foreground transition-colors">
                Условия использования
              </a>
              <a href="/#privacy" className="hover:text-foreground transition-colors">
                Политика конфиденциальности
              </a>
              <a href="/#privacy-notice" className="hover:text-foreground transition-colors">
                Уведомление о конфиденциальности
              </a>
              <a href="/#california" className="hover:text-foreground transition-colors">
                Уведомление для потребителей Калифорнии
              </a>
              <a href="/#sitemap" className="hover:text-foreground transition-colors">
                Карта сайта
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-3">
              Если вы, ваш ребенок или кто-то из ваших знакомых находится в кризисной ситуации, позвоните по номеру 112, 
              обратитесь в ближайшее отделение неотложной помощи или свяжитесь со следующими национальными ресурсами. Вы не одни.
            </p>
            <div className="grid gap-2 md:grid-cols-2 text-xs text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">Кризисный центр 24/7</p>
                <p>Позвоните по номеру <a href="tel:88002000122" className="text-primary hover:underline">8-800-200-01-22</a></p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Кризисная линия поддержки</p>
                <p>Отправьте SMS на номер <a href="sms:4420" className="text-primary hover:underline">4420</a></p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">
            <p>
              Медицинские практики, аффилированные с Balansity, независимо принадлежат и управляются лицензированными врачами, 
              которые предоставляют услуги, используя телемедицинскую платформу Balansity. Для получения дополнительной информации 
              о взаимоотношениях между Balansity и медицинскими практиками нажмите <a href="/#medical-practices" className="text-primary hover:underline">здесь</a>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

