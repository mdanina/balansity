export const LandingFooter = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div>
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

