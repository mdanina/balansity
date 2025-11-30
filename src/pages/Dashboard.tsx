import { useNavigate } from "react-router-dom";
import consultationIllustration from "@/assets/friendly-and-clean-vector-style-illustration-of-a-.png";
import checkupIllustration from "@/assets/minimalistic-and-friendly-vector-style-illustratio (1).png";
import abstractBackground from "@/assets/abstract-vector-style-background-with-soft-organic.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, Clock, MapPin, Users, LogOut, Tag, History, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { calculateAge } from "@/lib/profileStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssessmentsForProfiles, useActiveAssessmentsForProfiles } from "@/hooks/useAssessments";
import { useAppointmentsWithType, useCancelAppointment } from "@/hooks/useAppointments";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const { data: appointmentsWithType } = useAppointmentsWithType();
  const cancelAppointment = useCancelAppointment();
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  
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

  // Показываем загрузку только если нет данных И идет загрузка
  // Если есть кешированные данные, показываем контент сразу
  const isLoadingProfiles = profilesLoading && !profiles;
  const isLoadingAssessments = assessmentsLoading && assessmentsMap === undefined && profileIds.length > 0;
  const isLoadingActiveAssessments = activeAssessmentsLoading && activeAssessmentsMap === undefined && profileIds.length > 0;
  const loading = isLoadingProfiles || isLoadingAssessments || isLoadingActiveAssessments;

  // Получаем имя родителя для приветствия
  const parentName = useMemo(() => {
    if (!profiles || !Array.isArray(profiles)) return null;
    const parentProfile = profiles.find(p => p.type === 'parent');
    return parentProfile?.first_name || null;
  }, [profiles]);

  // Фильтруем предстоящие консультации (только scheduled)
  const upcomingAppointments = useMemo(() => {
    if (!appointmentsWithType) return [];
    return appointmentsWithType.filter(apt => apt.status === 'scheduled');
  }, [appointmentsWithType]);

  // Функция для получения имени профиля
  const getProfileName = useCallback((profileId: string | null) => {
    if (!profileId) return "Для меня (родитель)";
    const profile = profiles?.find(p => p.id === profileId);
    if (!profile) return "Профиль не найден";
    return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  }, [profiles]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment.mutateAsync(appointmentId);
      setCancelDialogOpen(null);
    } catch (error) {
      // Ошибка уже обработана в хуке через toast
    }
  };

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
            <span className="text-xl font-serif font-bold text-foreground">Balansity</span>
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
                <DropdownMenuItem onClick={() => navigate("/worries", { state: { from: 'dashboard' } })}>
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Ключевые трудности</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/region", { state: { from: 'dashboard' } })}>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Регион</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/family-members", { state: { from: 'dashboard' } })}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Члены семьи</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/checkup-history")}>
                  <History className="mr-2 h-4 w-4" />
                  <span>История чекапов</span>
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
      <div 
        className="relative overflow-hidden px-6 py-36 text-white"
        style={{
          backgroundImage: `url(${abstractBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay для читаемости текста */}
        <div className="absolute inset-0 bg-teal-600/70" />
        
        <div className="container mx-auto relative z-10 max-w-5xl">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Привет{parentName ? `, ${parentName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-xl md:text-2xl opacity-90">Как вы себя чувствуете сегодня?</p>
          </div>
          
          <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
            <Card className="overflow-hidden border-2 bg-card/90 backdrop-blur-sm p-6 md:p-8 shadow-lg">
              <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                <div>
                  <h2 className="mb-3 text-2xl md:text-3xl font-bold text-foreground">
                    Добро пожаловать в ваш личный кабинет
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Немного потерялись?...<br />
                    Позвольте нам помочь, нажмите кнопку, чтобы посмотреть наше вступительное видео.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
                >
                  Смотреть видео
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <div className="container mx-auto max-w-5xl px-6 py-8">
        {/* Предстоящие консультации */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ваши предстоящие консультации
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Дата и время</p>
                          <p className="font-medium">
                            {format(new Date(appointment.scheduled_at), "d MMMM yyyy 'в' HH:mm", {
                              locale: ru,
                            })}
                          </p>
                        </div>
                      </div>
                      {appointment.appointment_type && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Тип консультации</p>
                            <p className="font-medium">
                              {appointment.appointment_type.name} ({appointment.appointment_type.duration_minutes} минут)
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Для кого</p>
                          <p className="font-medium">{getProfileName(appointment.profile_id)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <AlertDialog open={cancelDialogOpen === appointment.id} onOpenChange={(open) => setCancelDialogOpen(open ? appointment.id : null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Отменить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Отменить консультацию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите отменить консультацию? Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Нет, оставить</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Да, отменить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}


        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : null}

        {/* Portal Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <Card 
            className="group cursor-pointer overflow-hidden border-2 bg-gradient-to-br from-accent/10 to-white p-8 shadow-md transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate("/appointments")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate("/appointments");
              }
            }}
          >
            <div className="flex flex-col items-center text-center">
              <img 
                src={consultationIllustration} 
                alt="Balansity Portal" 
                className="mb-6 h-40 w-auto object-contain transition-transform pointer-events-none group-hover:scale-110"
              />
              <h3 className="mb-2 text-2xl font-bold text-foreground transition-colors pointer-events-none group-hover:text-accent">
                Получить консультацию
              </h3>
            </div>
          </Card>

          <Card 
            className={`group overflow-hidden border-2 p-8 shadow-md transition-all ${
              canStartCheckup.allowed
                ? 'cursor-pointer border-soft-pink/30 bg-gradient-to-br from-soft-pink/10 to-white hover:shadow-xl hover:border-soft-pink/50 hover:scale-[1.02] active:scale-[0.98]'
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
                src={checkupIllustration} 
                alt="Проверка психического здоровья семьи" 
                className={`mb-6 h-40 w-auto object-contain transition-transform pointer-events-none ${
                  canStartCheckup.allowed ? 'group-hover:scale-110' : ''
                }`}
              />
              <h3 className={`mb-2 text-2xl font-bold text-foreground transition-colors pointer-events-none ${
                canStartCheckup.allowed ? 'group-hover:text-soft-pink' : 'text-muted-foreground'
              }`}>
                Психологический чекап семьи
              </h3>
              {canStartCheckup.allowed && canStartCheckup.reason === 'active_checkup_exists' && (
                <p className={`text-lg font-medium pointer-events-none ${
                  canStartCheckup.allowed ? 'text-muted-foreground' : 'text-muted-foreground/70'
                }`}>
                  Продолжить проверку
                </p>
              )}
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
                    <Avatar className="h-16 w-16 bg-gradient-to-br from-sky-blue/80 to-sky-blue">
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
                          <Badge variant="default" className="bg-success text-success-foreground">
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
