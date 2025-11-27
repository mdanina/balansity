import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { User, Plus } from "lucide-react";
import otterRelaxed from "@/assets/otter-relaxed.png";

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  avatar?: string;
}

export default function FamilyMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([
    {
      id: "1",
      firstName: "Мария",
      lastName: "Данина",
      age: 39,
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <StepIndicator currentStep={3} totalSteps={4} label="ПРОФИЛЬ СЕМЬИ" />
        
        <div className="space-y-8">
          <div className="text-center">
            <img
              src={otterRelaxed}
              alt="Выдра"
              className="mx-auto mb-6 h-32 w-32 object-contain"
            />
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Члены семьи
            </h1>
            <p className="text-muted-foreground">
              Добавьте столько членов семьи, сколько хотите! Вы сможете добавлять и управлять
              членами семьи в вашем кабинете.
            </p>
          </div>

          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <Avatar className="h-14 w-14">
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.age} лет</p>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/add-family-member")}
              className="h-14 w-full text-base font-medium"
            >
              <Plus className="mr-2 h-5 w-5" />
              Добавить члена семьи
            </Button>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/family-setup")}
              className="h-14 flex-1 text-base font-medium"
            >
              Назад
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={() => navigate("/worries")}
              className="h-14 flex-1 text-base font-medium"
            >
              Далее
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
