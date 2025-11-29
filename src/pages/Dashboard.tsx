import { useNavigate } from "react-router-dom";
import logoOtters from "@/assets/logo-otters.png";
import otterReading from "@/assets/otter-reading.png";
import otterHearts from "@/assets/otter-hearts.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, Clock, Settings, MapPin, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { calculateAge } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssessmentsForProfiles, useActiveAssessmentsForProfiles } from "@/hooks/useAssessments";
import { logger } from "@/lib/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo, useCallback } from "react";
import type { Database } from "@/lib/supabase";
type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface MemberWithAssessment extends Profile {
  checkupAssessment?: Assessment | null;
  activeCheckupAssessment?: Assessment | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { setCurrentProfileId, setCurrentProfile } = useCurrentProfile();
  
  // Используем React Query для кеширования
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useProfiles();
  const profileIds = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return [];
    return profiles.map(p => p.id);
  }, [profiles]);
  
  const { 
    data: assessmentsMap, 
    isLoading: assessmentsLoading 
  } = useAssessmentsForProfiles(profileIds, 'checkup');

  const { 
    data: activeAssessmentsMap, 
    isLoading: activeAssessmentsLoading 
  } = useActiveAssessmentsForProfiles(profileIds, 'checkup');

  // Вычисляем members с оценками
  const familyMembers = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return [];
    const assessments = assessmentsMap || {};
    const activeAssessments = activeAssessmentsMap || {};
    return profiles.map(profile => ({
      ...profile,
      checkupAssessment: assessments[profile.id] || null,
      activeCheckupAssessment: activeAssessments[profile.id] || null,
    }));
  }, [profiles, assessmentsMap, activeAssessmentsMap]);

  const loading = profilesLoading || assessmentsLoading || activeAssessmentsLoading;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Проверка возможности прохождения чекапа
  const canStartCheckup = useMemo(() => {
    const children = familyMembers.filter(m => m.type === 'child');
    
    if (children.length === 0) {
      return { allowed: false, reason: 'no_children' };
    }
    
    // Проверяем наличие активных чекапов
    // Если есть активный чекап - можно продолжить в любое время
    const hasActiveCheckup = children.some(child => child.activeCheckupAssessment);
    if (hasActiveCheckup) {
      return { allowed: true, reason: 'active_checkup_exists' };
    }
    
    // Находим последний завершенный чекап среди всех детей
    const completedCheckups = children
      .map(child => child.checkupAssessment)
      .filter(assessment => assessment?.status === 'completed' && assessment.completed_at)
      .map(assessment => new Date(assessment!.completed_at!));
    
    const lastCheckupDate = completedCheckups.length > 0
      ? new Date(Math.max(...completedCheckups.map(d => d.getTime())))
      : null;
    
    // Находим самого нового ребенка (по дате создания)
    const childrenCreatedDates = children
      .map(child => new Date(child.created_at))
      .filter(date => !isNaN(date.getTime()));
    
    const newestChildDate = childrenCreatedDates.length > 0
      ? new Date(Math.max(...childrenCreatedDates.map(d => d.getTime())))
      : null;
    
    // Проверяем условия:
    // 1. Если нет завершенных чекапов - можно пройти
    if (!lastCheckupDate) {
      return { allowed: true, reason: 'no_previous_checkup' };
    }
    
    // 2. Если есть новый ребенок, добавленный после последнего чекапа - можно пройти
    if (newestChildDate && newestChildDate > lastCheckupDate) {
      return { allowed: true, reason: 'new_child_added' };
    }
    
    // 3. Если прошло 30 дней с последнего чекапа - можно пройти
    const daysSinceLastCheckup = Math.floor(
      (Date.now() - lastCheckupDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastCheckup >= 30) {
      return { allowed: true, reason: 'month_passed' };
    }
    
    // 4. Иначе - нельзя пройти
    const daysRemaining = 30 - daysSinceLastCheckup;
    return { 
      allowed: false, 
      reason: 'too_soon',
      daysRemaining,
      lastCheckupDate 
    };
  }, [familyMembers]);

  // Мемоизация обработчика клика
  const handleCheckupClick = useCallback(() => {
    logger.log('Checkup card clicked');
    
    // Находим всех детей
    const children = familyMembers.filter(m => m.type === 'child');
    
    if (children.length === 0) {
      // Нет детей - предлагаем добавить
      navigate("/family-members");
      return;
    }
    
    // Проверяем возможность прохождения чекапа
    if (!canStartCheckup.allowed) {
      if (canStartCheckup.reason === 'too_soon') {
        const daysRemaining = canStartCheckup.daysRemaining || 0;
        const lastCheckupDate = canStartCheckup.lastCheckupDate 
          ? new Date(canStartCheckup.lastCheckupDate).toLocaleDateString('ru-RU')
          : '';
        
        toast.error(
          `Чекап можно пройти только раз в месяц или после добавления нового ребенка. ` +
          `Последний чекап был пройден ${lastCheckupDate}. ` +
          `Повторно можно будет пройти через ${daysRemaining} ${daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}.`
        );
      }
      return;
    }
    
    // Если есть активный чекап - продолжаем его
    if (canStartCheckup.reason === 'active_checkup_exists') {
      const childWithActiveCheckup = children.find(child => child.activeCheckupAssessment);
      if (childWithActiveCheckup) {
        logger.log('Resuming checkup for child:', childWithActiveCheckup.first_name);
        setCurrentProfileId(childWithActiveCheckup.id);
        setCurrentProfile(childWithActiveCheckup);
        navigate(`/checkup-intro/${childWithActiveCheckup.id}`);
        return;
      }
    }
    
    // Разрешаем начать новый чекап
    const firstChild = children[0];
    logger.log('Starting checkup for child:', firstChild.first_name);
    setCurrentProfileId(firstChild.id);
    setCurrentProfile(firstChild);
    navigate(`/checkup-intro/${firstChild.id}`);
  }, [familyMembers, navigate, setCurrentProfileId, setCurrentProfile, canStartCheckup]);

  // Обработка ошибок загрузки
  useEffect(() => {
    if (profilesError) {
      logger.error('Error loading profiles:', profilesError);
      toast.error('Не удалось загрузить данные. Попробуйте обновить страницу.');
    }
  }, [profilesError]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoOtters} alt="Little Otter" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Little Otter</span>
          </div>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative h-10 w-10 rounded-full p-0 hover:bg-accent focus:ring-2 focus:ring-ring"
                  aria-label="Меню профиля"
                >
                  <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
                    <div className="flex h-full w-full items-center justify-center bg-primary hover:bg-primary/90 transition-colors">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 z-50" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Профиль</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/region")}>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Регион</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/family-members")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Члены семьи</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

          <Card 
            className={`group overflow-hidden border-2 p-8 shadow-md transition-all ${
              canStartCheckup.allowed
                ? 'cursor-pointer border-pink-200 bg-gradient-to-br from-pink-50 to-white hover:shadow-xl hover:border-pink-400 hover:scale-[1.02] active:scale-[0.98]'
                : 'cursor-not-allowed border-gray-300 bg-gradient-to-br from-gray-50 to-white opacity-75'
            }`}
            onClick={(e) => {
              if (!canStartCheckup.allowed) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              handleCheckupClick();
            }}
            role="button"
            tabIndex={canStartCheckup.allowed ? 0 : -1}
            onKeyDown={(e) => {
              if (!canStartCheckup.allowed) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCheckupClick();
              }
            }}
          >
            <div 
              className="flex flex-col items-center text-center"
              onClick={(e) => {
                if (!canStartCheckup.allowed) {
                  e.stopPropagation();
                  return;
                }
                e.stopPropagation();
                handleCheckupClick();
              }}
            >
              <img 
                src={otterHearts} 
                alt="Проверка психического здоровья семьи" 
                className={`mb-6 h-40 w-auto object-contain transition-transform pointer-events-none ${
                  canStartCheckup.allowed ? 'group-hover:scale-110' : ''
                }`}
              />
              <h3 className={`mb-2 text-2xl font-bold text-foreground transition-colors pointer-events-none ${
                canStartCheckup.allowed ? 'group-hover:text-pink-600' : 'text-muted-foreground'
              }`}>
                Психическое здоровье семьи
              </h3>
              <p className={`text-lg font-medium pointer-events-none ${
                canStartCheckup.allowed ? 'text-muted-foreground' : 'text-muted-foreground/70'
              }`}>
                {canStartCheckup.allowed && canStartCheckup.reason === 'active_checkup_exists' 
                  ? 'Продолжить проверку' 
                  : 'Проверка'}
              </p>
              {!canStartCheckup.allowed && canStartCheckup.reason === 'too_soon' && (
                <p className="mt-3 text-sm text-muted-foreground/80 pointer-events-none">
                  {canStartCheckup.daysRemaining 
                    ? `Повторно можно будет пройти через ${canStartCheckup.daysRemaining} ${canStartCheckup.daysRemaining === 1 ? 'день' : canStartCheckup.daysRemaining < 5 ? 'дня' : 'дней'}`
                    : 'Чекап можно пройти только раз в месяц или после добавления нового ребенка'
                  }
                </p>
              )}
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
                // Вычисляем данные для каждого члена семьи
                const age = member.dob ? calculateAge(member.dob) : null;
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
