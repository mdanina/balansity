import { Link } from "react-router-dom";

export const LandingFooter = () => {
  const footerLinks = {
    families: [
      { label: "Дети 0-2", href: "/#families" },
      { label: "Дети 3-7", href: "/#families" },
      { label: "Дети 8-12", href: "/#families" },
      { label: "Подростки", href: "/#families" },
      { label: "Родители", href: "/#families" },
      { label: "Планирование, ожидание и послеродовой период", href: "/#families" },
    ],
    howCareWorks: [
      { label: "Как это работает", href: "/#how-it-works" },
      { label: "Наши услуги", href: "/#services" },
      { label: "Что мы лечим", href: "/#conditions" },
      { label: "Наши результаты", href: "/#results" },
      { label: "Почему Balansity", href: "/#why" },
      { label: "Наша экспертиза", href: "/#about" },
    ],
    testimonials: [
      { label: "Отзывы семей", href: "/#testimonials" },
    ],
    support: [
      { label: "Часто задаваемые вопросы", href: "/#faq" },
    ],
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
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

          {/* Отзывы */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Отзывы</h3>
            <ul className="space-y-2">
              {footerLinks.testimonials.map((link) => (
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

          {/* Поддержка */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold text-foreground">Поддержка</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
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

