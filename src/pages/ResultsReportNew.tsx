import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import leafDecoration from "@/assets/leaf-decoration.png";
import { ChevronLeft, ChevronRight, Download, MessageCircle, Lightbulb, Minus, Plus, Save } from "lucide-react";
import { getCompletedAssessment, getAssessmentResults, recalculateAssessmentResults, getCompletedAssessmentsForProfiles } from "@/lib/assessmentStorage";
import { getProfile, getProfiles } from "@/lib/profileStorage";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Категории worry tags (должны совпадать с Worries.tsx)
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
import { toast } from "sonner";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface CheckupResults {
  emotional?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  conduct?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  hyperactivity?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  peer_problems?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  prosocial?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  // Три субдомена влияния согласно авторской схеме
  impact_child?: { score: number; status: 'concerning' | 'typical' };
  impact_parent?: { score: number; status: 'concerning' | 'typical' };
  impact_family?: { score: number; status: 'concerning' | 'typical' };
  // Обратная совместимость для старых данных
  impact?: { score: number; status: 'high_impact' | 'medium_impact' | 'low_impact' };
  total_difficulties?: number;
}

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  total?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface ChildCheckupData {
  profile: Profile;
  assessment: Assessment;
  results: CheckupResults;
}

export default function ResultsReportNew() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const [searchParams] = useSearchParams();
  const { currentProfileId } = useCurrentProfile();
  const { user, loading: authLoading } = useAuth();
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [childrenCheckups, setChildrenCheckups] = useState<ChildCheckupData[]>([]);
  const [parentAssessment, setParentAssessment] = useState<Assessment | null>(null);
  const [familyAssessment, setFamilyAssessment] = useState<Assessment | null>(null);
  
  // Для обратной совместимости: если передан profileId, показываем данные этого ребенка
  const selectedProfileId = params.profileId || searchParams.get('profileId') || currentProfileId;
  
  // Мемоизация вычисления selectedChildCheckup
  const selectedChildCheckup = useMemo(() => {
    return selectedProfileId 
      ? childrenCheckups.find(c => c.profile.id === selectedProfileId)
      : childrenCheckups[0]; // Или первый ребенок, если не указан
  }, [selectedProfileId, childrenCheckups]);

  // Мемоизация toggleSection - критично для предотвращения ре-рендеров
  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Загружаем данные всех профилей пользователя и их оценки
  useEffect(() => {
    async function loadResults() {
      if (authLoading) {
        return; // Ждем завершения загрузки авторизации
      }
      
      if (!user) {
        navigate("/dashboard");
        return;
      }

      try {
        setLoading(true);
        
        // Загружаем все профили пользователя
        const profiles = await getProfiles();
        
        // Находим профиль родителя и партнера
        const parent = profiles.find(p => p.type === 'parent');
        const partner = profiles.find(p => p.type === 'partner');
        const children = profiles.filter(p => p.type === 'child');
        
        if (parent) {
          setParentProfile(parent);
        }
        if (partner) {
          setPartnerProfile(partner);
        }
        
        // ОДИН запрос для ВСЕХ завершенных оценок пользователя
        // Это исправляет катастрофическую проблему N+1 запросов!
        const profileIds = profiles.map(p => p.id);
        const { data: allAssessments, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .in('profile_id', profileIds)
          .eq('status', 'completed')
          .in('assessment_type', ['parent', 'family', 'checkup']);

        if (assessmentsError) {
          throw assessmentsError;
        }

        // Разделение по типам оценок
        const parentAssessments = allAssessments?.filter(a => a.assessment_type === 'parent') || [];
        const familyAssessments = allAssessments?.filter(a => a.assessment_type === 'family') || [];
        const checkupAssessments = allAssessments?.filter(a => a.assessment_type === 'checkup') || [];

        // Находим parent и family оценки (приоритет - по профилю родителя, если есть)
        let foundParentAssess: Assessment | null = null;
        let foundFamilyAssess: Assessment | null = null;

        if (parent) {
          // Ищем по профилю родителя
          foundParentAssess = parentAssessments.find(a => a.profile_id === parent.id) || null;
          foundFamilyAssess = familyAssessments.find(a => a.profile_id === parent.id) || null;
        }

        // Если не нашли, берем любую найденную
        if (!foundParentAssess && parentAssessments.length > 0) {
          foundParentAssess = parentAssessments[0]; // Берем первую найденную
        }
        if (!foundFamilyAssess && familyAssessments.length > 0) {
          foundFamilyAssess = familyAssessments[0]; // Берем первую найденную
        }

        // Пересчитываем результаты, если нужно
        const recalculateIfNeeded = async (assessment: Assessment | null): Promise<Assessment | null> => {
          if (!assessment) return null;
          
          const needsRecalc = !assessment.results_summary || 
            Object.keys(assessment.results_summary).length === 0 || 
            (assessment.results_summary as any).status === 'completed';
          
          if (needsRecalc) {
            try {
              await recalculateAssessmentResults(assessment.id);
              // Перезагружаем оценку после пересчета
              const updated = await getCompletedAssessment(assessment.profile_id, assessment.assessment_type);
              return updated;
            } catch (error) {
              logger.error(`Error recalculating ${assessment.assessment_type} assessment:`, error);
              return assessment; // Возвращаем оригинальную, если пересчет не удался
            }
          }
          return assessment;
        };

        foundParentAssess = await recalculateIfNeeded(foundParentAssess);
        foundFamilyAssess = await recalculateIfNeeded(foundFamilyAssess);
        
        // Устанавливаем найденные оценки в state
        if (foundParentAssess) {
          setParentAssessment(foundParentAssess);
        }
        if (foundFamilyAssess) {
          setFamilyAssessment(foundFamilyAssess);
        }
        
        // Обрабатываем checkup оценки для детей (уже загружены одним запросом!)
        const checkupsMap = new Map(checkupAssessments.map(a => [a.profile_id, a]));
        const childrenData: ChildCheckupData[] = [];
        
        for (const child of children) {
          const checkupAssessment = checkupsMap.get(child.id);
          if (checkupAssessment && checkupAssessment.results_summary) {
            childrenData.push({
              profile: child,
              assessment: checkupAssessment,
              results: checkupAssessment.results_summary as CheckupResults,
            });
          }
        }
        
        setChildrenCheckups(childrenData);
        
        // Если нет ни одной завершенной оценки, показываем ошибку
        if (childrenData.length === 0 && !foundParentAssess && !foundFamilyAssess) {
          toast.error('Завершенные оценки не найдены');
          navigate("/dashboard");
        }
      } catch (error) {
        logger.error('Error loading results:', error);
        toast.error('Ошибка при загрузке результатов');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        loadResults();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, navigate]);

  // Функция для получения текста статуса на русском
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'concerning':
      case 'high_impact':
        return 'Тревожно';
      case 'borderline':
      case 'medium_impact':
        return 'Погранично';
      case 'typical':
      case 'low_impact':
        return 'Типично';
      default:
        return 'Неизвестно';
    }
  };

  // Функция для получения цвета статуса
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'concerning':
      case 'high_impact':
        return 'text-red-600 bg-red-100';
      case 'borderline':
      case 'medium_impact':
        return 'text-yellow-600 bg-yellow-100';
      case 'typical':
      case 'low_impact':
        return 'text-primary bg-primary/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  // Функция для расчета процента прогресс-бара (0-100%)
  const getProgressPercentage = (score: number, maxScore: number): number => {
    return Math.min((score / maxScore) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (!selectedChildCheckup && childrenCheckups.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Результаты не найдены</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Вернуться в кабинет
          </Button>
        </div>
      </div>
    );
  }

  // Используем выбранного ребенка или первого доступного
  const currentChild = selectedChildCheckup || childrenCheckups[0];
  const profile = currentChild?.profile;
  const checkupResults = currentChild?.results;
  const checkupAssessment = currentChild?.assessment;

  // Вычисляем возраст
  const age = profile?.dob 
    ? new Date().getFullYear() - new Date(profile.dob).getFullYear()
    : null;

  // Форматируем дату завершения
  const completedDate = checkupAssessment?.completed_at 
    ? new Date(checkupAssessment.completed_at).toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      })
    : 'Неизвестно';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Header with decoration */}
        <div className="relative mb-12">
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute left-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute right-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Ваши результаты
            </h1>
            <p className="text-lg text-muted-foreground">
              {completedDate} {profile && `• ${profile.first_name} ${profile.last_name || ''}`}
            </p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Итоги</h2>
          <p className="text-muted-foreground mb-8">
            {profile && `Эти результаты основаны на опросе из `}
            <span className="font-medium">31 вопроса</span>
            {profile && ` (checkup), который вы заполнили о ${profile.first_name}.`}
            {parentAssessment && ' Родительская оценка завершена.'}
            {familyAssessment && ' Семейная оценка завершена.'}
          </p>

          {/* Cards Carousel */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Child Cards - показываем всех детей */}
              {childrenCheckups.map((childData) => {
                const childProfile = childData.profile;
                const childResults = childData.results;
                const childAge = childProfile.dob 
                  ? new Date().getFullYear() - new Date(childProfile.dob).getFullYear()
                  : null;
                
                return (
                  <div key={childProfile.id} className="min-w-[320px] flex-1 rounded-lg bg-purple-100 p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground">
                        {childProfile.first_name} {childProfile.last_name || ''}
                      </h3>
                      {childAge !== null && (
                        <p className="text-sm text-muted-foreground">{childAge} лет</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {childResults.emotional && (
                        <div>
                          <span className={`font-medium ${getStatusColor(childResults.emotional.status).split(' ')[0]}`}>
                            {getStatusText(childResults.emotional.status)}
                          </span>
                          <p className="text-sm text-muted-foreground">Эмоции (балл: {childResults.emotional.score})</p>
                        </div>
                      )}
                      {childResults.conduct && (
                        <div>
                          <span className={`font-medium ${getStatusColor(childResults.conduct.status).split(' ')[0]}`}>
                            {getStatusText(childResults.conduct.status)}
                          </span>
                          <p className="text-sm text-muted-foreground">Поведение (балл: {childResults.conduct.score})</p>
                        </div>
                      )}
                      {childResults.peer_problems && (
                        <div>
                          <span className={`font-medium ${getStatusColor(childResults.peer_problems.status).split(' ')[0]}`}>
                            {getStatusText(childResults.peer_problems.status)}
                          </span>
                          <p className="text-sm text-muted-foreground">Социальное (балл: {childResults.peer_problems.score})</p>
                        </div>
                      )}
                      {childResults.hyperactivity && (
                        <div>
                          <span className={`font-medium ${getStatusColor(childResults.hyperactivity.status).split(' ')[0]}`}>
                            {getStatusText(childResults.hyperactivity.status)}
                          </span>
                          <p className="text-sm text-muted-foreground">Активность (балл: {childResults.hyperactivity.score})</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* You Card */}
              {parentAssessment && (
                <div className="min-w-[320px] flex-1 rounded-lg bg-teal-100 p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">Вы</h3>
                  </div>
                  <div className="space-y-2">
                    {parentAssessment.results_summary ? (
                      (() => {
                        const parentResults = parentAssessment.results_summary as ParentResults;
                        return (
                          <>
                            {parentResults.anxiety && (
                              <div>
                                <span className={`font-medium ${getStatusColor(parentResults.anxiety.status).split(' ')[0]}`}>
                                  {getStatusText(parentResults.anxiety.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Тревожность (балл: {parentResults.anxiety.score})</p>
                              </div>
                            )}
                            {parentResults.depression && (
                              <div>
                                <span className={`font-medium ${getStatusColor(parentResults.depression.status).split(' ')[0]}`}>
                                  {getStatusText(parentResults.depression.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Депрессия (балл: {parentResults.depression.score})</p>
                              </div>
                            )}
                            {parentResults.total && (
                              <div>
                                <span className={`font-medium ${getStatusColor(parentResults.total.status).split(' ')[0]}`}>
                                  {getStatusText(parentResults.total.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Общий балл: {parentResults.total.score}</p>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Родительская оценка завершена
                        </p>
                        {parentAssessment.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Family Card */}
              {familyAssessment && (
                <div className="min-w-[320px] flex-1 rounded-lg bg-blue-100 p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground">Семья</h3>
                  </div>
                  <div className="space-y-2">
                    {familyAssessment.results_summary ? (
                      (() => {
                        const familyResults = familyAssessment.results_summary as FamilyResults;
                        return (
                          <>
                            {familyResults.family_stress && (
                              <div>
                                <span className={`font-medium ${getStatusColor(familyResults.family_stress.status).split(' ')[0]}`}>
                                  {getStatusText(familyResults.family_stress.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Семейный стресс (балл: {familyResults.family_stress.score})</p>
                              </div>
                            )}
                            {familyResults.partner_relationship && (
                              <div>
                                <span className={`font-medium ${getStatusColor(familyResults.partner_relationship.status).split(' ')[0]}`}>
                                  {getStatusText(familyResults.partner_relationship.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Отношения с партнером (балл: {familyResults.partner_relationship.score})</p>
                              </div>
                            )}
                            {familyResults.coparenting && (
                              <div>
                                <span className={`font-medium ${getStatusColor(familyResults.coparenting.status).split(' ')[0]}`}>
                                  {getStatusText(familyResults.coparenting.status)}
                                </span>
                                <p className="text-sm text-muted-foreground">Совместное воспитание (балл: {familyResults.coparenting.score})</p>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Семейная оценка завершена
                        </p>
                        {familyAssessment.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children's Mental Health - показываем для каждого ребенка */}
        {childrenCheckups.map((childData) => {
          const childProfile = childData.profile;
          const childResults = childData.results;
          
          return (
            <div key={childProfile.id} className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Ментальное здоровье {childProfile.first_name}
              </h2>
              
              {/* Worries Section - только о ребенке */}
              {(() => {
                const childWorryTags = childProfile.worry_tags?.filter(w => childWorries.includes(w)) || [];
                if (childWorryTags.length === 0) return null;
                
                return (
                  <div className="mb-8 border-l-4 border-muted pl-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <span className="text-sm font-medium">●</span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Беспокойства о {childProfile.first_name}</h3>
                    </div>
                    <p className="mb-4 text-muted-foreground">
                      Беспокойства, которыми вы поделились о {childProfile.first_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {childWorryTags.map((worry, index) => (
                        <span key={index} className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                          {worry}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

          {/* Emotional Challenges */}
          {childResults.emotional && (
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Эмоциональные трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.emotional.status)}`}>
                  {getStatusText(childResults.emotional.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={`h-full ${
                      childResults.emotional.status === 'concerning' ? 'bg-red-500' :
                      childResults.emotional.status === 'borderline' ? 'bg-yellow-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.emotional.score, 10)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Балл: {childResults.emotional.score} / 10
                </p>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-emotional-mean']} onOpenChange={() => toggleSection('alice-emotional-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-emotional-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Эмоциональные трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Это означает, что ваш ребенок подвержен повышенному риску тревожного расстройства или депрессии. Чем раньше мы поможем детям, тем быстрее они смогут вернуться на правильный путь и процветать!
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-emotional-do']} onOpenChange={() => toggleSection('alice-emotional-do')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-emotional-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Позвольте вашему ребенку испытывать свои чувства без осуждения.</strong> Когда вы минимизируете чувства вашего ребенка, вы (непреднамеренно) посылаете сообщение, что вы не комфортны с эмоциями вашего ребенка.
                    </li>
                    <li>
                      <strong>Поощряйте вашего ребенка к самосостраданию.</strong> Если вы слышите, как они говорят о себе негативно, переформулируйте, чтобы сосредоточиться на усилиях, а не на достижениях.
                    </li>
                    <li>
                      <strong>Пожалуйста, рассмотрите возможность оценки ментального здоровья.</strong> Little Otter имеет отличные научно обоснованные методы лечения, помогающие детям с эмоциональными трудностями. Мы здесь для вашей семьи.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Behavioral Challenges */}
          {childResults.conduct && (
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Поведенческие трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.conduct.status)}`}>
                  {getStatusText(childResults.conduct.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={`h-full ${
                      childResults.conduct.status === 'concerning' ? 'bg-red-500' :
                      childResults.conduct.status === 'borderline' ? 'bg-yellow-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.conduct.score, 10)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Балл: {childResults.conduct.score} / 10
                </p>
              </div>

            <div className="space-y-3">
              <Collapsible open={openSections['alice-behavioral-mean']} onOpenChange={() => toggleSection('alice-behavioral-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['alice-behavioral-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Поведенческие трудности вашего ребенка <strong>выше, чем у многих детей того же возраста.</strong> Поведенческие трудности обычно являются внешним выражением внутренних эмоциональных переживаний ребенка. Поэтому поведенческие трудности распространены при многих типах проблем, включая тревожность, депрессию и СДВГ.
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['alice-behavioral-do']} onOpenChange={() => toggleSection('alice-behavioral-do')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['alice-behavioral-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <ul className="list-inside space-y-3 text-foreground">
                    <li>
                      <strong>Установите четкие ожидания о том, как вы хотите, чтобы ваш ребенок вел себя.</strong> Сосредоточьтесь на том, чтобы говорить ребенку, что он может делать, и тратьте меньше времени на то, чтобы говорить ему все, что он не может делать. Чем конкретнее, тем лучше!
                    </li>
                    <li>
                      <strong>Сохраняйте спокойствие.</strong> Когда взрослые способны сохранять самообладание, они передают ощущение спокойствия и контроля своему ребенку. Мы должны регулировать свои собственные чувства и поведение, чтобы помочь нашим детям регулировать их чувства и поведение.
                    </li>
                    <li>
                      <strong>Обратитесь за поддержкой.</strong> В Little Otter мы смотрим на общую картину. Специалист Little Otter поможет выяснить первопричину поведенческих трудностей вашего ребенка и разработать персонализированный план ухода.
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}

          {/* Activity Challenges */}
          {childResults.hyperactivity && (
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Трудности с активностью</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.hyperactivity.status)}`}>
                  {getStatusText(childResults.hyperactivity.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={`h-full ${
                      childResults.hyperactivity.status === 'concerning' ? 'bg-red-500' :
                      childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 10)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Балл: {childResults.hyperactivity.score} / 10
                </p>
              </div>

            <Collapsible open={openSections['alice-activity-mean']} onOpenChange={() => toggleSection('alice-activity-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['alice-activity-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  Уровень активности вашего ребенка и способность концентрироваться находятся <strong>в пределах типичного диапазона для детей того же возраста.</strong> Это, вероятно, указывает на то, что ваш ребенок не подвержен значительному риску синдрома дефицита внимания и гиперактивности (СДВГ). Если вы беспокоитесь об уровне активности вашего ребенка или отвлекаемости, оценка может исключить опасения по поводу СДВГ.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
          )}

          {/* Social Challenges */}
          {childResults.peer_problems && (
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Социальные трудности</h3>
              </div>

              <div className="mb-6">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(childResults.peer_problems.status)}`}>
                  {getStatusText(childResults.peer_problems.status)}
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div 
                    className={`h-full ${
                      childResults.peer_problems.status === 'concerning' ? 'bg-red-500' :
                      childResults.peer_problems.status === 'borderline' ? 'bg-yellow-500' :
                      'bg-primary'
                    }`}
                    style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 6)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Балл: {childResults.peer_problems.score} / 6
                </p>
              </div>

            <Collapsible open={openSections['alice-social-mean']} onOpenChange={() => toggleSection('alice-social-mean')}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">Что это значит?</span>
                </div>
                {openSections['alice-social-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                <p className="text-foreground">
                  У вашего ребенка <strong>больше трудностей в отношениях с другими детьми, чем у многих детей того же возраста.</strong> Социальные навыки трудны для некоторых детей. Важно попытаться понять, почему у вашего ребенка возникают трудности со сверстниками. Проблемы ментального здоровья вашего ребенка могут мешать отношениям.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
          )}

          {/* Impact Section - Три субдомена влияния */}
          {(childResults.impact_child || childResults.impact_parent || childResults.impact_family || childResults.impact) && (
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Влияние</h3>
              </div>

              <div className="space-y-4">
                {/* Влияние на ребёнка */}
                {childResults.impact_child && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-foreground">Влияние на ребёнка</span>
                      <span className={`text-sm ${getStatusColor(childResults.impact_child.status)}`}>
                        • {getStatusText(childResults.impact_child.status)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full ${
                          childResults.impact_child.status === 'concerning' ? 'bg-red-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${getProgressPercentage(childResults.impact_child.score, 3)}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Балл: {childResults.impact_child.score} / 3 (порог: ≥ 2)
                    </p>
                  </div>
                )}

                {/* Влияние на родителя */}
                {childResults.impact_parent && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-foreground">Влияние на родителя</span>
                      <span className={`text-sm ${getStatusColor(childResults.impact_parent.status)}`}>
                        • {getStatusText(childResults.impact_parent.status)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full ${
                          childResults.impact_parent.status === 'concerning' ? 'bg-red-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${getProgressPercentage(childResults.impact_parent.score, 6)}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Балл: {childResults.impact_parent.score} / 6 (порог: ≥ 3)
                    </p>
                  </div>
                )}

                {/* Влияние на семью */}
                {childResults.impact_family && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-foreground">Влияние на семью</span>
                      <span className={`text-sm ${getStatusColor(childResults.impact_family.status)}`}>
                        • {getStatusText(childResults.impact_family.status)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full ${
                          childResults.impact_family.status === 'concerning' ? 'bg-red-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${getProgressPercentage(childResults.impact_family.score, 18)}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Балл: {childResults.impact_family.score} / 18 (порог: ≥ 6)
                    </p>
                  </div>
                )}

                {/* Обратная совместимость: старый формат impact */}
                {childResults.impact && !childResults.impact_child && !childResults.impact_parent && !childResults.impact_family && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-medium text-foreground">{childProfile.first_name}</span>
                      <span className={`text-sm ${
                        childResults.impact.status === 'high_impact' ? 'text-red-600' :
                        childResults.impact.status === 'medium_impact' ? 'text-yellow-600' :
                        'text-primary'
                      }`}>
                        • {childResults.impact.status === 'high_impact' ? 'Высокое влияние' :
                            childResults.impact.status === 'medium_impact' ? 'Среднее влияние' :
                            'Низкое влияние'}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div 
                        className={`h-full ${
                          childResults.impact.status === 'high_impact' ? 'bg-red-500' :
                          childResults.impact.status === 'medium_impact' ? 'bg-yellow-500' :
                          'bg-primary'
                        }`}
                        style={{ width: `${getProgressPercentage(childResults.impact.score, 2)}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Балл влияния: {childResults.impact.score} / 2
                    </p>
                  </div>
                )}
              </div>

              <Collapsible open={openSections['impact-mean']} onOpenChange={() => toggleSection('impact-mean')} className="mt-6">
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['impact-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Когда мы говорим о ментальном здоровье, речь идет не о симптомах; речь идет о вашей жизни. Ментальное здоровье вашего ребенка влияет на его жизнь, вашу жизнь и жизнь вашей семьи!
                  </p>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections['impact-do']} onOpenChange={() => toggleSection('impact-do')} className="mt-3">
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-foreground">Что я могу сделать?</span>
                  </div>
                  {openSections['impact-do'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    В Little Otter мы поддерживаем вашего ребенка и вашу семью, чтобы снизить влияние трудностей и укрепить сильные стороны. Проще говоря, мы здесь, чтобы помочь вам и вашей семье процветать!
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Child's Recap */}
          <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-blue-400 to-blue-300">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-bold text-white">Итоги {childProfile.first_name}</h3>
              <div className="h-16 w-16 rounded-full bg-white/20"></div>
            </div>
            <div className="space-y-4 bg-white p-6">
              {childResults.emotional && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Эмоции</span>
                    <span className={`text-sm ${
                      childResults.emotional.status === 'concerning' ? 'text-red-600' :
                      childResults.emotional.status === 'borderline' ? 'text-yellow-600' :
                      'text-primary'
                    }`}>
                      • {getStatusText(childResults.emotional.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full ${
                        childResults.emotional.status === 'concerning' ? 'bg-red-500' :
                        childResults.emotional.status === 'borderline' ? 'bg-yellow-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.emotional.score, 10)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.conduct && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Поведение</span>
                    <span className={`text-sm ${
                      childResults.conduct.status === 'concerning' ? 'text-red-600' :
                      childResults.conduct.status === 'borderline' ? 'text-yellow-600' :
                      'text-primary'
                    }`}>
                      • {getStatusText(childResults.conduct.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full ${
                        childResults.conduct.status === 'concerning' ? 'bg-red-500' :
                        childResults.conduct.status === 'borderline' ? 'bg-yellow-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.conduct.score, 10)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.hyperactivity && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Активность</span>
                    <span className={`text-sm ${
                      childResults.hyperactivity.status === 'concerning' ? 'text-red-600' :
                      childResults.hyperactivity.status === 'borderline' ? 'text-yellow-600' :
                      'text-primary'
                    }`}>
                      • {getStatusText(childResults.hyperactivity.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full ${
                        childResults.hyperactivity.status === 'concerning' ? 'bg-red-500' :
                        childResults.hyperactivity.status === 'borderline' ? 'bg-yellow-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.hyperactivity.score, 10)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.peer_problems && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Социальное</span>
                    <span className={`text-sm ${
                      childResults.peer_problems.status === 'concerning' ? 'text-red-600' :
                      childResults.peer_problems.status === 'borderline' ? 'text-yellow-600' :
                      'text-primary'
                    }`}>
                      • {getStatusText(childResults.peer_problems.status)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div 
                      className={`h-full ${
                        childResults.peer_problems.status === 'concerning' ? 'bg-red-500' :
                        childResults.peer_problems.status === 'borderline' ? 'bg-yellow-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${getProgressPercentage(childResults.peer_problems.score, 6)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {childResults.total_difficulties !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Общий балл трудностей</span>
                    <span className="text-sm text-muted-foreground">
                      {childResults.total_difficulties} / 40
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
            </div>
          );
        })}

        {/* Your Mental Health */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>
          
          {/* Worries Section - о себе - показываем всегда, если есть worry tags */}
          {(() => {
            const personalWorryTags = parentProfile?.worry_tags?.filter(w => personalWorries.includes(w)) || [];
            // Отладка: логируем worry tags
            if (parentProfile?.worry_tags) {
              logger.log('Parent profile worry tags:', {
                allWorryTags: parentProfile.worry_tags,
                personalWorryTags,
                personalWorriesList: personalWorries
              });
            }
            if (personalWorryTags.length > 0) {
              return (
                <div className="mb-8 border-l-4 border-muted pl-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium">●</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Беспокойства о себе</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Беспокойства, которыми вы поделились о себе
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {personalWorryTags.map((worry, index) => (
                      <span key={index} className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                        {worry}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
          {parentAssessment ? (
            <>
              <p className="text-muted-foreground mb-4">
                Результаты родительской оценки {parentAssessment.completed_at 
                  ? new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')
                  : ''}
              </p>
            
            {parentAssessment.results_summary ? (
              (() => {
                const parentResults = parentAssessment.results_summary as ParentResults;
                return (
                  <div className="space-y-6">
                    {parentResults.anxiety && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Тревожность</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.anxiety.status)}`}>
                            {getStatusText(parentResults.anxiety.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {parentResults.anxiety.score} / 6</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              parentResults.anxiety.status === 'concerning' ? 'bg-red-500' :
                              parentResults.anxiety.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(parentResults.anxiety.score, 6)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {parentResults.depression && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Депрессия</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.depression.status)}`}>
                            {getStatusText(parentResults.depression.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {parentResults.depression.score} / 6</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              parentResults.depression.status === 'concerning' ? 'bg-red-500' :
                              parentResults.depression.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(parentResults.depression.score, 6)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {parentResults.total && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Общий балл</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(parentResults.total.status)}`}>
                            {getStatusText(parentResults.total.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {parentResults.total.score} / 12</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              parentResults.total.status === 'concerning' ? 'bg-red-500' :
                              parentResults.total.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(parentResults.total.score, 12)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-6">
                <p className="text-foreground">
                  Родительская оценка завершена, но результаты еще не рассчитаны.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-6">
            <p className="text-muted-foreground">
              Родительская оценка не завершена. Пройдите опрос о себе, чтобы увидеть результаты здесь.
            </p>
          </div>
        )}
        </div>

        {/* Legacy Parent Section - скрываем, если нет данных */}
        {false && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ваше ментальное здоровье</h2>

            {/* Anxiety */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Тревожность</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Типично
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[50%] bg-primary"></div>
                </div>
              </div>

              <Collapsible open={openSections['you-anxiety-mean']} onOpenChange={() => toggleSection('you-anxiety-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['you-anxiety-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Эти результаты показывают, что вы <strong>не испытываете значительных симптомов тревожности.</strong> Один из способов поддерживать эмоциональный баланс - найти способы снизить стресс и создать радость в вашей жизни.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Depression */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Депрессия</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Типично
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[45%] bg-primary"></div>
                </div>
              </div>

              <Collapsible open={openSections['you-depression-mean']} onOpenChange={() => toggleSection('you-depression-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['you-depression-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Эти результаты показывают, что вы <strong>не испытываете высоких депрессивных симптомов.</strong>
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Your Recap */}
            <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-2xl font-bold text-white">Ваши итоги</h3>
                <div className="h-16 w-16 rounded-full bg-white/20"></div>
              </div>
              <div className="space-y-4 bg-white p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Тревожность</span>
                    <span className="text-sm text-primary">• Типично</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[50%] bg-primary"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Депрессия</span>
                    <span className="text-sm text-primary">• Типично</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[45%] bg-primary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Your Family's Mental Health */}
        {familyAssessment ? (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
            <p className="text-muted-foreground mb-4">
              Результаты семейной оценки {familyAssessment.completed_at 
                ? new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')
                : ''}
            </p>
            
            {/* Worries Section - о семье */}
            {(() => {
              // Ищем worry tags о семье в профиле партнера или родителя
              const familyWorryTags = partnerProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || 
                                     parentProfile?.worry_tags?.filter(w => familyWorries.includes(w)) || [];
              if (familyWorryTags.length === 0) return null;
              
              return (
                <div className="mb-8 border-l-4 border-muted pl-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium">●</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Беспокойства о семье</h3>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    Беспокойства, которыми вы поделились о семье
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {familyWorryTags.map((worry, index) => (
                      <span key={index} className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                        {worry}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            {familyAssessment.results_summary ? (
              (() => {
                const familyResults = familyAssessment.results_summary as FamilyResults;
                return (
                  <div className="space-y-6">
                    {familyResults.family_stress && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Семейный стресс</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.family_stress.status)}`}>
                            {getStatusText(familyResults.family_stress.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {familyResults.family_stress.score} / 4</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              familyResults.family_stress.status === 'concerning' ? 'bg-red-500' :
                              familyResults.family_stress.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(familyResults.family_stress.score, 4)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {familyResults.partner_relationship && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Отношения с партнером</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.partner_relationship.status)}`}>
                            {getStatusText(familyResults.partner_relationship.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {familyResults.partner_relationship.score} / 5</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              familyResults.partner_relationship.status === 'concerning' ? 'bg-red-500' :
                              familyResults.partner_relationship.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(familyResults.partner_relationship.score, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {familyResults.coparenting && (
                      <div className="rounded-lg border border-border bg-muted/20 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">Совместное воспитание</h3>
                          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(familyResults.coparenting.status)}`}>
                            {getStatusText(familyResults.coparenting.status)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">Балл: {familyResults.coparenting.score} / 10</p>
                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full ${
                              familyResults.coparenting.status === 'concerning' ? 'bg-red-500' :
                              familyResults.coparenting.status === 'borderline' ? 'bg-yellow-500' :
                              'bg-primary'
                            }`}
                            style={{ width: `${getProgressPercentage(familyResults.coparenting.score, 10)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-6">
                <p className="text-foreground">
                  Семейная оценка завершена, но результаты еще не рассчитаны.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>
            <div className="rounded-lg border border-border bg-muted/20 p-6">
              <p className="text-muted-foreground">
                Семейная оценка не завершена. Пройдите опрос о семье, чтобы увидеть результаты здесь.
              </p>
            </div>
          </div>
        )}

        {/* Legacy Family Section - скрываем, если нет данных */}
        {false && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-8">Ментальное здоровье вашей семьи</h2>

            {/* Worries */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Беспокойства</h3>
              </div>
              <p className="mb-4 text-muted-foreground">Беспокойства, которыми вы поделились о вашей семье</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800">
                  Ментальное здоровье партнера
                </span>
              </div>
            </div>

            {/* Family Stress */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Семейный стресс</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Типично
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[40%] bg-primary"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-stress-mean']} onOpenChange={() => toggleSection('family-stress-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-stress-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Ваша семья в настоящее время справляется с ежедневным жизненным стрессом.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Partner Relationship */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Отношения с партнером</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                  Тревожно
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[90%] bg-red-500"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-partner-mean']} onOpenChange={() => toggleSection('family-partner-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-partner-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Вы сообщили, что в настоящее время испытываете <strong>конфликт или трудности в отношениях с вашим партнером.</strong>
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Co-Parenting */}
            <div className="mb-8 border-l-4 border-muted pl-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium">●</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Совместное воспитание</h3>
              </div>

              <div className="mb-6">
                <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600">
                  Тревожно
                </span>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-red-500"></div>
                </div>
              </div>

              <Collapsible open={openSections['family-coparenting-mean']} onOpenChange={() => toggleSection('family-coparenting-mean')}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-foreground">Что это значит?</span>
                  </div>
                  {openSections['family-coparenting-mean'] ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg bg-muted/30 p-4">
                  <p className="text-foreground">
                    Вы указали, что <strong>сложно работать вместе с вашим со-родителем(ями)</strong> для воспитания вашего ребенка(детей), и это может привести к конфликту.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Your Family's Recap */}
            <div className="mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-400">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-2xl font-bold text-white">Итоги вашей семьи</h3>
                <div className="h-16 w-16 rounded-full bg-white/20"></div>
              </div>
              <div className="space-y-4 bg-white p-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Семейный стресс</span>
                    <span className="text-sm text-primary">• Типично</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[40%] bg-primary"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Я и мой партнер</span>
                    <span className="text-sm text-red-600">• Тревожно</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[90%] bg-red-500"></div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">Совместное воспитание</span>
                    <span className="text-sm text-red-600">• Тревожно</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[85%] bg-red-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Saved Notice */}
        <div className="mb-8 rounded-lg border border-border bg-muted/20 p-6">
          <div className="flex items-center gap-3">
            <Save className="h-6 w-6 text-primary" />
            <p className="text-foreground">
              Этот отчет сохранен в вашей{" "}
              <a href="#" className="font-medium text-primary underline hover:no-underline">
                Истории отчетов
              </a>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="w-full max-w-md"
          >
            Перейти к вашей истории отчетов
          </Button>
        </div>
      </div>
    </div>
  );
}
