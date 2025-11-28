import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
import { toast } from "sonner";
import { createProfile } from "@/lib/profileStorage";

export default function AddFamilyMember() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("");
  const [sex, setSex] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [referral, setReferral] = useState("");
  const [seekingCare, setSeekingCare] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName && lastName && dateOfBirth && relationship && sex && seekingCare) {
      try {
        await createProfile({
          firstName,
          lastName,
          dateOfBirth,
          relationship: relationship as 'parent' | 'child' | 'partner' | 'sibling' | 'caregiver' | 'other',
          sex: sex as 'male' | 'female' | 'other',
          pronouns,
          referral,
          seekingCare: seekingCare as 'yes' | 'no',
        });
        toast.success("Член семьи успешно добавлен!");
        navigate("/family-members");
      } catch (error) {
        console.error('Error creating profile:', error);
        toast.error('Ошибка при добавлении члена семьи');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам больше о члене семьи
            </h1>
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

            <div className="space-y-2">
              <Label htmlFor="relationship">
                Какое у ВАС отношение к этому человеку? <span className="text-destructive">*</span>
              </Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="relationship" className="h-12 text-base">
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Ребенок</SelectItem>
                  <SelectItem value="partner">Партнер</SelectItem>
                  <SelectItem value="parent">Родитель</SelectItem>
                  <SelectItem value="sibling">Брат/Сестра</SelectItem>
                  <SelectItem value="caregiver">Опекун</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                Пол при рождении <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={sex} onValueChange={setSex} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="male" id="male-add" />
                  <Label htmlFor="male-add" className="flex-1 cursor-pointer font-normal">
                    Мужской
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="female" id="female-add" />
                  <Label htmlFor="female-add" className="flex-1 cursor-pointer font-normal">
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

            <div className="space-y-2">
              <Label htmlFor="referral">
                Был ли этот человек направлен страховой компанией или другой организацией?
              </Label>
              <Select value={referral} onValueChange={setReferral}>
                <SelectTrigger id="referral" className="h-12 text-base">
                  <SelectValue placeholder="Нет направления" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Нет направления</SelectItem>
                  <SelectItem value="insurance">Страховая компания</SelectItem>
                  <SelectItem value="doctor">Врач</SelectItem>
                  <SelectItem value="school">Школа</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>
                Этот человек ищет помощь? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup value={seekingCare} onValueChange={setSeekingCare} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="yes" id="seeking-yes" />
                  <Label htmlFor="seeking-yes" className="flex-1 cursor-pointer font-normal">
                    Да
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border border-input px-4 py-4">
                  <RadioGroupItem value="no" id="seeking-no" />
                  <Label htmlFor="seeking-no" className="flex-1 cursor-pointer font-normal">
                    Нет
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/family-members")}
                className="h-14 flex-1 text-base font-medium"
              >
                Назад
              </Button>
              <Button
                type="submit"
                size="lg"
                className="h-14 flex-1 text-base font-medium"
              >
                Добавить
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
