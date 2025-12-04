import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/noroot (2).png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import "@/components/landing/Landing.css";

export const LandingHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const familiesMenu = [
    { label: "Дети 0-2", href: "/#families" },
    { label: "Дети 3-7", href: "/#families" },
    { label: "Дети 8-12", href: "/#families" },
    { label: "Подростки 13-18", href: "/#families" },
    { label: "Родители", href: "/#families" },
    { label: "Планирование, ожидание и послеродовой период", href: "/#families" },
  ];

  const howCareWorksMenu = [
    { label: "Как это работает", href: "/#how-it-works" },
    { label: "Наши услуги", href: "/#services" },
    { label: "Что мы лечим", href: "/#conditions" },
    { label: "Наша команда", href: "/#about" },
    { label: "Почему виртуальная терапия работает", href: "/#why" },
    { label: "Оценка психического здоровья семьи", href: "/#how-it-works" },
  ];

  const partnersMenu = [
    { label: "Педиатры и клиницисты", href: "/#partners" },
    { label: "Страховые компании", href: "/#pricing" },
    { label: "Медицинские системы", href: "/#partners" },
    { label: "Стратегические партнеры", href: "/#partners" },
    { label: "Направить в Balansity", href: "/#partners" },
    { label: "RAFT Программа: Расстройство аутистического спектра", href: "/#programs" },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="landing-top-banner">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Balansity предоставляет комплексные услуги для детей и семей.{" "}
            <a href="/#about">Узнать больше</a>
          </p>
        </div>
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Balansity" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Для семей</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {familiesMenu.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Как работает</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                    {howCareWorksMenu.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#pricing"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  Цены
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Для партнеров</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                    {partnersMenu.map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <a
                            href={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{item.label}</div>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#resources"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  Ресурсы
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>О нас</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/#about"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          )}
                        >
                          <div className="text-sm font-medium leading-none">О нас</div>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          href="/#shop"
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          )}
                        >
                          <div className="text-sm font-medium leading-none">Магазин</div>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Кабинет
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Войти
                </Button>
                <Button onClick={() => navigate("/service")}>
                  Получить поддержку
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-8">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Для семей</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    {familiesMenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Как работает</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    {howCareWorksMenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <a
                  href="/#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  Цены
                </a>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Для партнеров</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    {partnersMenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <a
                  href="/#resources"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  Ресурсы
                </a>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">О нас</p>
                  <div className="flex flex-col space-y-2 ml-4">
                    <a
                      href="/#about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-foreground transition-colors hover:text-primary"
                    >
                      О нас
                    </a>
                    <a
                      href="/#shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-foreground transition-colors hover:text-primary"
                    >
                      Магазин
                    </a>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  {user ? (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/dashboard");
                      }}
                    >
                      Кабинет
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full mb-2"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/login");
                        }}
                      >
                        Войти
                      </Button>
                      <Button
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/service");
                        }}
                      >
                        Получить поддержку
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    </>
  );
};

