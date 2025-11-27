import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const regions = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
];

export default function RegionSelect() {
  const navigate = useNavigate();
  const [region, setRegion] = useState("");

  const handleContinue = () => {
    if (region) {
      // Simulate some regions being unavailable
      if (region === "Омск" || region === "Волгоград") {
        navigate("/coming-soon");
      } else {
        navigate("/profile");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={2} totalSteps={3} label="ДОБРО ПОЖАЛОВАТЬ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              В каком регионе вы живете?
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="region">
                Регион <span className="text-destructive">*</span>
              </Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region" className="h-14 text-base">
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/welcome")}
                className="h-14 flex-1 text-base font-medium"
              >
                Назад
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleContinue}
                disabled={!region}
                className="h-14 flex-1 text-base font-medium"
              >
                Продолжить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
