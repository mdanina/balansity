import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

const childWorries = [
  "Фокус и внимание",
  "Грусть и плач",
  "Тревоги и беспокойства",
  "Питание",
  "Сон и режим",
  "Туалет",
  "Сенсорная чувствительность",
  "Гнев и агрессия",
  "Импульсивность",
  "Травма",
  "Горе и потеря",
  "Буллинг",
  "Самооценка",
  "Школа/детский сад",
  "Удары, укусы или пинки",
  "Гендерная или сексуальная идентичность",
  "Сотрудничество",
];

const personalWorries = [
  "Выгорание",
  "Тревожность",
  "Пониженное настроение",
  "Трудности с концентрацией внимания",
  "Общий стресс",
];

const familyWorries = [
  "Разделение/развод",
  "Семейный стресс",
  "Отношения с партнером",
  "Психическое здоровье партнера",
  "Воспитание",
  "Семейный конфликт",
];

export default function Worries() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    child: false,
    personal: false,
    family: false,
  });
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleWorry = (worry: string) => {
    setSelectedWorries((prev) =>
      prev.includes(worry) ? prev.filter((w) => w !== worry) : [...prev, worry]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам о своих беспокойствах
            </h1>
          </div>

          <div className="space-y-4">
            {/* For Child Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("child")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Ребенка</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => childWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.child ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.child && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {childWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For You Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("personal")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Вас</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => personalWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.personal ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.personal && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {personalWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For Your Family Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("family")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Вашей Семьи</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => familyWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.family ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.family && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {familyWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/checkup-intro")}
            className="h-14 w-full text-base font-medium"
          >
            Далее
          </Button>
        </div>
      </div>
    </div>
  );
}
