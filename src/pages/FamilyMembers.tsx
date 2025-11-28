import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import otterRelaxed from "@/assets/otter-relaxed.png";
import { getProfiles, deleteProfile } from "@/lib/profileStorage";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
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
  const { setCurrentProfileId, setCurrentProfile } = useCurrentProfile();
  const [members, setMembers] = useState<Profile[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const profiles = await getProfiles();
        setMembers(profiles);
      } catch (error) {
        console.error('Error loading family members:', error);
        toast.error('Ошибка при загрузке членов семьи');
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      setDeleteId(null);
      toast.success("Член семьи удален");
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Ошибка при удалении члена семьи');
    }
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
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Пока нет членов семьи</p>
              </div>
            ) : (
              members.map((member) => {
                // Вычисляем возраст из даты рождения
                const age = member.dob 
                  ? new Date().getFullYear() - new Date(member.dob).getFullYear()
                  : null;
                
                return (
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
                        {member.first_name} {member.last_name || ''}
                      </p>
                      {age !== null && (
                        <p className="text-sm text-muted-foreground">{age} лет</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* Кнопка для начала опроса (только для детей) */}
                      {member.type === 'child' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setCurrentProfileId(member.id);
                            setCurrentProfile(member);
                            navigate(`/checkup-intro`);
                          }}
                        >
                          Начать опрос
                        </Button>
                      )}
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
                );
              })
            )}

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
