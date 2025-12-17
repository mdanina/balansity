import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getCurrentUserData, upsertUserData } from "@/lib/userStorage";
import { getProfiles, createProfile, updateProfile } from "@/lib/profileStorage";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [seekingCare, setSeekingCare] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загружаем существующие данные пользователя и профиля родителя
  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        const userData = await getCurrentUserData();
        if (userData) {
          setPhone(userData.phone || "");
          setMarketingConsent(userData.marketing_consent || false);
        }

        // Загружаем профиль родителя, если он существует
        const profiles = await getProfiles();
        const parentProfile = profiles.find(p => p.type === 'parent');
        if (parentProfile) {
          setFirstName(parentProfile.first_name || "");
          setLastName(parentProfile.last_name || "");
          setDateOfBirth(parentProfile.dob || "");
          setSex(parentProfile.gender || "");
          setPronouns(parentProfile.pronouns || "");
          setSeekingCare(parentProfile.seeking_care || "");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && dateOfBirth && sex && seekingCare && phone) {
      try {
        setLoading(true);
        
        // Сохраняем данные пользователя в таблицу users
        await upsertUserData({
          phone,
          marketing_consent: marketingConsent,
        });

        // Проверяем, есть ли уже профиль родителя
        const profiles = await getProfiles();
        const parentProfile = profiles.find(p => p.type === 'parent');

        if (parentProfile) {
          // Обновляем существующий профиль
          await updateProfile(parentProfile.id, {
            firstName,
            lastName,
            dateOfBirth,
            relationship: 'parent',
            sex: sex as 'male' | 'female' | 'other',
            pronouns,
            seekingCare: seekingCare as 'yes' | 'no',
          });
          toast.success("Профиль успешно обновлен!");
        } else {
          // Создаем новый профиль родителя
          await createProfile({
            firstName,
            lastName,
            dateOfBirth,
            relationship: 'parent',
            sex: sex as 'male' | 'female' | 'other',
            pronouns,
            seekingCare: seekingCare as 'yes' | 'no',
          });
          toast.success("Профиль успешно создан!");
        }

        // Определяем, откуда пришли: редактирование из меню или первичная настройка
        const isEditing = location.state?.from === 'dashboard';
        
        if (isEditing) {
          // Редактирование из меню → возвращаемся в Dashboard
          navigate("/dashboard");
        } else {
          // Первичная настройка → продолжаем поток
          navigate("/region");
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        toast.error('Ошибка при сохранении профиля');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={1} totalSteps={3} label="ПРОФИЛЬ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам больше о себе
            </h1>
            <p className="text-muted-foreground">
              Данные используются только для облегчения лечения, в соответствии с нашей политикой
              конфиденциальности.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Имя <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Фамилия <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Дата рождения <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label>
                Пол при рождении <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={sex} onValueChange={setSex} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="flex-1 cursor-pointer font-normal">
                    Мужской
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="flex-1 cursor-pointer font-normal">
                    Женский
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronouns">Местоимения</Label>
              <Select value={pronouns} onValueChange={setPronouns}>
                <SelectTrigger id="pronouns" className="h-12 text-base">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">Он/его</SelectItem>
                  <SelectItem value="she">Она/её</SelectItem>
                  <SelectItem value="they">Они/их</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                Вы ищете помощь для себя? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={seekingCare} onValueChange={setSeekingCare} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex-1 cursor-pointer font-normal">
                    Да
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex-1 cursor-pointer font-normal">
                    Нет
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Номер телефона <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="sms"
                  checked={smsConsent}
                  onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                />
                <Label htmlFor="sms" className="text-sm leading-relaxed">
                  Установив этот флажок, вы соглашаетесь получать SMS-уведомления о вашем лечении
                  от Balansity. Частота сообщений варьируется. Могут применяться тарифы
                  на сообщения и данные. Вы можете ответить STOP, чтобы отказаться в любое время.
                  Политика конфиденциальности.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                />
                <Label htmlFor="marketing" className="text-sm leading-relaxed">
                  Я согласен получать <strong>периодические маркетинговые</strong> письма о
                  программах, предложениях и обновлениях Balansity.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-14 w-full text-base font-medium"
            >
              {loading ? 'Сохранение...' : 'Продолжить'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
