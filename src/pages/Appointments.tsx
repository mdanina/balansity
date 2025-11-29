import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useAppointmentTypes, useActiveFreeConsultation, useAppointmentsWithType, useCancelAppointment } from "@/hooks/useAppointments";
import { useProfiles } from "@/hooks/useProfiles";
import { Video, Check, Gift, Lock, Calendar, Clock, User, X } from "lucide-react";
import { formatAmount } from "@/lib/payment";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Appointments() {
  const navigate = useNavigate();
  const { data: appointmentTypes, isLoading } = useAppointmentTypes();
  const { data: activeFreeConsultation, isLoading: freeConsultationLoading } = useActiveFreeConsultation();
  const { data: appointmentsWithType, isLoading: appointmentsLoading } = useAppointmentsWithType();
  const { data: profiles } = useProfiles();
  const cancelAppointment = useCancelAppointment();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);

  // Разделяем консультации на бесплатные и платные
  const { freeConsultations, paidConsultations } = useMemo(() => {
    if (!appointmentTypes) return { freeConsultations: [], paidConsultations: [] };
    
    const free = appointmentTypes.filter(type => type.price === 0);
    const paid = appointmentTypes.filter(type => type.price > 0);
    
    return { freeConsultations: free, paidConsultations: paid };
  }, [appointmentTypes]);

  // Фильтруем бесплатные консультации: скрываем если есть активная (scheduled)
  // Показываем если активной нет или она отменена (cancelled)
  const visibleFreeConsultations = useMemo(() => {
    if (!freeConsultations.length) return [];
    
    // Если есть активная бесплатная консультация - скрываем бесплатные из списка
    if (activeFreeConsultation) {
      return [];
    }
    
    return freeConsultations;
  }, [freeConsultations, activeFreeConsultation]);

  // Платные консультации доступны только если есть активная бесплатная
  const paidConsultationsEnabled = !!activeFreeConsultation;

  // Фильтруем предстоящие консультации (только scheduled)
  const upcomingAppointments = useMemo(() => {
    if (!appointmentsWithType) return [];
    return appointmentsWithType.filter(apt => apt.status === 'scheduled');
  }, [appointmentsWithType]);

  // Функция для получения имени профиля
  const getProfileName = (profileId: string | null) => {
    if (!profileId) return "Для меня (родитель)";
    const profile = profiles?.find(p => p.id === profileId);
    if (!profile) return "Профиль не найден";
    return `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`;
  };

  const handleConfirm = () => {
    if (selectedTypeId) {
      navigate(`/appointments/booking?type=${selectedTypeId}`);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment.mutateAsync(appointmentId);
      setCancelDialogOpen(null);
    } catch (error) {
      // Ошибка уже обработана в хуке через toast
    }
  };

  if (isLoading || freeConsultationLoading || appointmentsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Записаться на консультацию</h1>
          <p className="text-muted-foreground">Выберите тип консультации</p>
        </div>

        {/* Шаги */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              1
            </div>
            <span className="font-medium">Выберите тип консультации</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
              2
            </div>
            <span>Выберите дату и время</span>
          </div>
        </div>

        {/* Типы консультаций */}
        {appointmentTypes && appointmentTypes.length > 0 ? (
          <RadioGroup value={selectedTypeId || undefined} onValueChange={setSelectedTypeId}>
            <div className="space-y-4 mb-8">
              {/* Бесплатные консультации */}
              {visibleFreeConsultations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Бесплатные консультации
                  </h2>
                  {visibleFreeConsultations.map((type) => (
                    <Card
                      key={type.id}
                      className={`p-6 cursor-pointer transition-all ${
                        selectedTypeId === type.id
                          ? "border-2 border-primary bg-primary/5"
                          : "border border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedTypeId(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                        <Label
                          htmlFor={type.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold text-foreground">
                                  {type.name}
                                </h3>
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  Бесплатно
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-2">
                                {type.duration_minutes} минут
                              </p>
                              {type.description && (
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-none"
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Видеозвонок
                              </Button>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Платные консультации */}
              {paidConsultations.length > 0 && (
                <div className="space-y-4">
                  {visibleFreeConsultations.length > 0 && (
                    <h2 className="text-lg font-semibold text-foreground mt-6">
                      Платные консультации
                    </h2>
                  )}
                  {paidConsultations.map((type) => {
                    const isDisabled = !paidConsultationsEnabled;
                    return (
                    <Card
                      key={type.id}
                      className={`p-6 transition-all ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed border border-border"
                          : selectedTypeId === type.id
                          ? "border-2 border-primary bg-primary/5 cursor-pointer"
                          : "border border-border hover:border-primary/50 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && setSelectedTypeId(type.id)}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem 
                          value={type.id} 
                          id={type.id} 
                          className="mt-1" 
                          disabled={isDisabled}
                        />
                        <Label
                          htmlFor={type.id}
                          className={`flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-semibold text-foreground">
                                  {type.name}
                                </h3>
                                <span className="text-lg font-bold text-primary">
                                  {formatAmount(type.price)}
                                </span>
                                {isDisabled && (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2">
                                {type.duration_minutes} минут
                              </p>
                              {isDisabled ? (
                                <p className="text-sm text-muted-foreground italic">
                                  Сначала запишитесь на бесплатную консультацию
                                </p>
                              ) : type.description ? (
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-none"
                                disabled={isDisabled}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Видеозвонок
                              </Button>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  );
                  })}
                </div>
              )}
            </div>
          </RadioGroup>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Нет доступных типов консультаций. Пожалуйста, обратитесь к администратору.
            </p>
          </Card>
        )}

        {/* Кнопка подтверждения */}
        {selectedTypeId && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleConfirm}
              className="min-w-[200px]"
            >
              <Check className="h-4 w-4 mr-2" />
              Подтвердить тип консультации
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

