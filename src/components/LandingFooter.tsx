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
              <a href="/#sitemap" className="hover:text-foreground transition-colors">
                Карта сайта
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

