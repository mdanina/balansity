import { useNavigate } from "react-router-dom";
import logoOtters from "@/assets/logo-otters.png";
import otterReading from "@/assets/otter-reading.png";
import otterHearts from "@/assets/otter-hearts.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, Clock } from "lucide-react";
import { getProfiles } from "@/lib/profileStorage";
import { getCompletedAssessment, getAssessmentsForProfile } from "@/lib/assessmentStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface MemberWithAssessment extends Profile {
  checkupAssessment?: Assessment | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<MemberWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profiles = await getProfiles();
        
        // Загружаем статус чекапа для каждого профиля
        const membersWithAssessments = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const checkupAssessment = await getCompletedAssessment(profile.id, 'checkup');
              return { ...profile, checkupAssessment };
            } catch (error) {
              console.error(`Error loading assessment for profile ${profile.id}:`, error);
              return { ...profile, checkupAssessment: null };
            }
          })
        );
        
        setFamilyMembers(membersWithAssessments);
      } catch (error) {
        console.error('Error loading family members:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoOtters} alt="Little Otter" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Little Otter</span>
          </div>
          <Avatar className="h-10 w-10 bg-primary">
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
          </Avatar>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-6 py-16 text-white">
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-teal-400/30 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-teal-400/30 to-transparent" />
        
        <div className="container mx-auto relative z-10 max-w-5xl">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Привет{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-xl md:text-2xl opacity-90">Как вы себя чувствуете сегодня?</p>
        </div>
      </div>

      {/* Main Content */}
        <div className="container mx-auto max-w-5xl px-6 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 overflow-hidden border-2 bg-card p-8 shadow-lg">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="mb-3 text-3xl font-bold text-foreground">
                Добро пожаловать в ваш новый Care Den
              </h2>
              <p className="text-lg text-muted-foreground">
                Немного потерялись?... Позвольте нам помочь, нажмите кнопку, чтобы посмотреть наше вступительное видео.
              </p>
            </div>
            <Button 
              size="lg" 
              className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            >
              Смотреть видео
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : null}

        {/* Portal Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <Card className="group cursor-pointer overflow-hidden border-2 bg-gradient-to-br from-purple-50 to-white p-8 shadow-md transition-all hover:shadow-xl">
            <div className="flex flex-col items-center text-center">
              <img 
                src={otterReading} 
                alt="Little Otter Portal" 
                className="mb-6 h-40 w-auto object-contain"
              />
              <h3 className="mb-2 text-2xl font-bold text-foreground">Little Otter</h3>
              <p className="text-lg font-medium text-muted-foreground">PORTAL</p>
            </div>
          </Card>

          <Card className="group cursor-pointer overflow-hidden border-2 bg-gradient-to-br from-pink-50 to-white p-8 shadow-md transition-all hover:shadow-xl">
            <div className="flex flex-col items-center text-center">
              <img 
                src={otterHearts} 
                alt="Проверка психического здоровья семьи" 
                className="mb-6 h-40 w-auto object-contain"
              />
              <h3 className="mb-2 text-2xl font-bold text-foreground">Психическое здоровье семьи</h3>
              <p className="text-lg font-medium text-muted-foreground">Проверка</p>
            </div>
          </Card>
        </div>

        {/* Your Family Section */}
        <div>
          <h2 className="mb-6 text-3xl font-bold text-foreground">Ваша семья</h2>
          {familyMembers.length === 0 ? (
            <Card className="border-2 bg-card p-8 text-center">
              <p className="text-muted-foreground mb-4">Пока нет членов семьи</p>
              <Button onClick={() => navigate("/family-members")}>
                Добавить члена семьи
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((member) => {
                const age = member.dob 
                  ? new Date().getFullYear() - new Date(member.dob).getFullYear()
                  : null;
                
                const hasCompletedCheckup = member.checkupAssessment?.status === 'completed';
                const checkupDate = member.checkupAssessment?.completed_at 
                  ? new Date(member.checkupAssessment.completed_at).toLocaleDateString('ru-RU')
                  : null;
                
                return (
                  <Card 
                    key={member.id}
                    className="flex items-center gap-4 border-2 bg-card p-6 shadow-sm transition-all hover:shadow-md"
                  >
                    <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600">
                      <div className="flex h-full w-full items-center justify-center text-white">
                        <User className="h-8 w-8" />
                      </div>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-foreground">
                          {member.first_name} {member.last_name || ''}
                        </h3>
                        {hasCompletedCheckup && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Чекап завершен
                          </Badge>
                        )}
                      </div>
                      {age !== null && (
                        <p className="text-muted-foreground mb-1">{age} лет</p>
                      )}
                      {hasCompletedCheckup && checkupDate && (
                        <p className="text-sm text-muted-foreground">
                          Завершен: {checkupDate}
                        </p>
                      )}
                      {!hasCompletedCheckup && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigate(`/checkup-intro/${member.id}`)}
                        >
                          Пройти чекап
                        </Button>
                      )}
                      {hasCompletedCheckup && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigate(`/results-report?profileId=${member.id}`)}
                        >
                          Посмотреть результаты
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
