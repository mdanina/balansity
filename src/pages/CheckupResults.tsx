import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, BookOpen, Calendar } from "lucide-react";

export default function CheckupResults() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Спасибо за завершение опроса!
            </h1>
            <p className="text-lg text-muted-foreground">
              Мы проанализировали ваши ответы и готовы предоставить персонализированные рекомендации
              для вашей семьи.
            </p>
          </div>

          <Card className="border-2 border-primary/20">
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Ваши результаты готовы
                </h2>
                <p className="text-muted-foreground">
                  Наша команда специалистов изучит ваши ответы и подготовит индивидуальный план ухода
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
                  <BookOpen className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground">Ресурсы</h3>
                  <p className="text-sm text-muted-foreground">
                    Доступ к полезным материалам
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
                  <Calendar className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground">Консультация</h3>
                  <p className="text-sm text-muted-foreground">
                    Запланируйте встречу со специалистом
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-lg border border-border p-4 text-center">
                  <CheckCircle2 className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground">План ухода</h3>
                  <p className="text-sm text-muted-foreground">
                    Персонализированные рекомендации
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Следующие шаги</h3>
            
            <div className="space-y-3">
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">
                      Просмотрите свои результаты
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ознакомьтесь с подробным анализом ответов в вашем личном кабинете
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">
                      Запланируйте консультацию
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Обсудите результаты с нашим навигатором по уходу
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-foreground">
                      Начните лечение
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Получите доступ к командному плану ухода и ресурсам
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="flex-1 text-base"
            >
              Вернуться на главную
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/results-report")}
              className="flex-1 text-base"
            >
              Перейти к результатам
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
