import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";
import { getCurrentUserData, upsertUserData } from "@/lib/userStorage";

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
  const { user } = useAuth();
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);

  // Загружаем существующий регион
  useEffect(() => {
    async function loadRegion() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUserData();
        if (userData?.region) {
          setRegion(userData.region);
        }
      } catch (error) {
        console.error('Error loading region:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRegion();
  }, [user]);

  const handleContinue = async () => {
    if (region) {
      try {
        setLoading(true);
        
        // Сохраняем регион в таблицу users
        await upsertUserData({ region });

        // Simulate some regions being unavailable
        if (region === "Омск" || region === "Волгоград") {
          navigate("/coming-soon");
        } else {
          navigate("/family-setup");
        }
      } catch (error) {
        console.error('Error saving region:', error);
        toast.error('Ошибка при сохранении региона');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={2} totalSteps={3} label="РЕГИОН" />
        
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
                onClick={() => navigate("/profile")}
                className="h-14 flex-1 text-base font-medium"
              >
                Назад
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleContinue}
                disabled={!region || loading}
                className="h-14 flex-1 text-base font-medium"
              >
                {loading ? 'Сохранение...' : 'Продолжить'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
