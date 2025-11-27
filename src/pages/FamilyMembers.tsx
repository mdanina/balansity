import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import otterRelaxed from "@/assets/otter-relaxed.png";
import { getFamilyMembers, deleteFamilyMember, FamilyMember } from "@/lib/familyStorage";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FamilyMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setMembers(getFamilyMembers());
  }, []);

  const handleDelete = (id: string) => {
    deleteFamilyMember(id);
    setMembers(getFamilyMembers());
    setDeleteId(null);
    toast.success("Член семьи удален");
  };

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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/edit-family-member/${member.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteId(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить члена семьи?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Данные члена семьи будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
