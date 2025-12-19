import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Filter,
  ArrowLeft,
  FileText
} from "lucide-react";
import { getAllAssessmentsForUser } from "@/lib/assessmentStorage";
import { getProfiles } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface AssessmentWithProfile extends Assessment {
  profile?: Profile | null;
}

const assessmentTypeLabels: Record<string, string> = {
  'checkup': 'Чекап ребенка',
  'parent': 'Чекап родителя',
  'family': 'Чекап семьи',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'completed': { label: 'Завершен', variant: 'default' },
  'in_progress': { label: 'В процессе', variant: 'secondary' },
  'abandoned': { label: 'Прерван', variant: 'destructive' },
};

export default function CheckupHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithProfile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');

  // Загружаем данные
  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      
      if (!user) {
        navigate("/cabinet");
        return;
      }

      try {
        setLoading(true);
        
        // Загружаем все профили и чекапы параллельно
        const [profilesData, assessmentsData] = await Promise.all([
          getProfiles(),
          getAllAssessmentsForUser(),
        ]);

        setProfiles(profilesData);
        
        // Объединяем чекапы с профилями
        const assessmentsWithProfiles: AssessmentWithProfile[] = assessmentsData.map(assessment => ({
          ...assessment,
          profile: assessment.profile_id 
            ? profilesData.find(p => p.id === assessment.profile_id) || null
            : null,
        }));

        setAssessments(assessmentsWithProfiles);
      } catch (error) {
        logger.error('Error loading checkup history:', error);
        toast.error('Ошибка при загрузке истории чекапов');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, navigate]);

  // Фильтруем чекапы
  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      // Фильтр по типу
      if (selectedType !== 'all' && assessment.assessment_type !== selectedType) {
        return false;
      }
      
      // Фильтр по статусу
      if (selectedStatus !== 'all' && assessment.status !== selectedStatus) {
        return false;
      }
      
      // Фильтр по профилю
      if (selectedProfileId !== 'all') {
        if (selectedProfileId === 'no_profile') {
          // Чекапы без профиля (удаленные профили)
          if (assessment.profile_id) return false;
        } else {
          if (assessment.profile_id !== selectedProfileId) return false;
        }
      }
      
      return true;
    });
  }, [assessments, selectedType, selectedStatus, selectedProfileId]);


  const handleViewReport = (assessment: AssessmentWithProfile) => {
    if (assessment.status === 'completed' && assessment.profile_id) {
      navigate(`/results-report/${assessment.profile_id}?assessmentId=${assessment.id}`);
    } else {
      toast.info('Этот чекап еще не завершен или профиль был удален');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Загрузка истории...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Заголовок */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/cabinet")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад в личный кабинет
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">История чекапов</h1>
          </div>
          <p className="text-muted-foreground">
            Просмотр всех прошедших чекапов вашей семьи
          </p>
        </div>

        {/* Фильтры */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Фильтр по типу */}
              <div>
                <label className="mb-2 block text-sm font-medium">Тип чекапа</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="checkup">Чекап ребенка</SelectItem>
                    <SelectItem value="parent">Чекап родителя</SelectItem>
                    <SelectItem value="family">Чекап семьи</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Фильтр по статусу */}
              <div>
                <label className="mb-2 block text-sm font-medium">Статус</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                    <SelectItem value="in_progress">В процессе</SelectItem>
                    <SelectItem value="abandoned">Прерванные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Фильтр по профилю */}
              <div>
                <label className="mb-2 block text-sm font-medium">Профиль</label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все профили" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все профили</SelectItem>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name || ''}
                      </SelectItem>
                    ))}
                    {assessments.some(a => !a.profile_id) && (
                      <SelectItem value="no_profile">
                        Удаленные профили
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список чекапов */}
        {filteredAssessments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">История пуста</h3>
              <p className="text-muted-foreground text-center mb-4">
                {selectedType !== 'all' || selectedStatus !== 'all' || selectedProfileId !== 'all'
                  ? 'Нет чекапов, соответствующих выбранным фильтрам'
                  : 'Вы еще не проходили чекапы. Начните с дашборда!'}
              </p>
              {selectedType !== 'all' || selectedStatus !== 'all' || selectedProfileId !== 'all' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedProfileId('all');
                  }}
                >
                  Сбросить фильтры
                </Button>
              ) : (
                <Button onClick={() => navigate("/cabinet")}>
                  Перейти к дашборду
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredAssessments.map((assessment) => {
              const date = assessment.completed_at || assessment.created_at;
              const dateFormatted = new Date(date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const statusInfo = statusLabels[assessment.status] || statusLabels['in_progress'];
              const typeLabel = assessmentTypeLabels[assessment.assessment_type] || assessment.assessment_type;

              return (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{typeLabel}</CardTitle>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4" />
                          {dateFormatted}
                        </CardDescription>
                        {assessment.profile ? (
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4" />
                            {assessment.profile.first_name} {assessment.profile.last_name || ''}
                          </CardDescription>
                        ) : (
                          <CardDescription className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <User className="h-4 w-4" />
                            Профиль удален
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {assessment.status === 'completed' && assessment.results_summary ? (
                          <span>Результаты рассчитаны</span>
                        ) : assessment.status === 'in_progress' ? (
                          <span>Прогресс: {assessment.current_step || 1} из {assessment.total_steps || '?'} вопросов</span>
                        ) : (
                          <span>Чекап не завершен</span>
                        )}
                      </div>
                      {assessment.status === 'completed' && assessment.profile_id && (
                        <Button
                          onClick={() => handleViewReport(assessment)}
                          size="sm"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Просмотреть отчет
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Статистика */}
        {assessments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {assessments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Завершено</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    {assessments.filter(a => a.status === 'in_progress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">В процессе</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {assessments.filter(a => a.assessment_type === 'checkup').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Чекапов детей</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    {assessments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Всего чекапов</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

