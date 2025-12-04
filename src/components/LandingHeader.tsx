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
    { label: "Подростки", href: "/#families" },
    { label: "Родители", href: "/#families" },
    { label: "Планирование, ожидание и послеродовой период", href: "/#families" },
  ];

  const howCareWorksMenu = [
    { label: "Как это работает", href: "/#how-it-works" },
    { label: "Наши услуги", href: "/#services" },
    { label: "Что мы лечим", href: "/#conditions" },
    { label: "Наши результаты", href: "/#results" },
    { label: "Почему Balansity", href: "/#why" },
    { label: "Наша экспертиза", href: "/#about" },
  ];

  return (
    <>
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
                  href="/#testimonials"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  Отзывы
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#faq"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  FAQ
                </a>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <a
                  href="/#about"
                  className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  О нас
                </a>
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
                  href="/#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  Отзывы
                </a>
                <a
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  FAQ
                </a>
                <a
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  О нас
                </a>
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

