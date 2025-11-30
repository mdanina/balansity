import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAppointmentType, useActiveFreeConsultation } from "@/hooks/useAppointments";
import { useProfiles } from "@/hooks/useProfiles";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { markFreeConsultationAsUsed } from "@/lib/appointmentStorage";
import { formatAmount } from "@/lib/payment";
import {
  createMoscowDateTime,
  formatAppointmentTime,
  formatAppointmentTimeOnly,
  getMoscowNow,
  TIMEZONES,
  getUserTimezone,
} from "@/lib/moscowTime";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Clock, AlertCircle, Globe } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Генерация доступных временных слотов
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentTypeId = searchParams.get("type");
  
  const { data: appointmentType, isLoading: typeLoading } = useAppointmentType(appointmentTypeId);
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: activeFreeConsultation, isLoading: freeConsultationLoading } = useActiveFreeConsultation();
  const createAppointment = useCreateAppointment();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    // Загружаем сохраненную временную зону или используем локальную
    const saved = localStorage.getItem("appointment_timezone");
    return saved || getUserTimezone();
  });

  // Сохраняем выбранную временную зону в localStorage
  useEffect(() => {
    localStorage.setItem("appointment_timezone", selectedTimezone);
  }, [selectedTimezone]);

  const isLoading = typeLoading || profilesLoading || freeConsultationLoading;
  
  // Проверяем, является ли консультация платной
  const isPaid = appointmentType && appointmentType.price > 0;
  
  // Если платная консультация и нет активной бесплатной - блокируем
  const isBlocked = isPaid && !activeFreeConsultation;

  // Фильтруем профили - для консультации можно выбрать ребенка или оставить пустым (для родителя)
  const availableProfiles = useMemo(() => {
    if (!profiles) return [];
    return [
      { id: "__parent__", name: "Для меня (родитель)" },
      ...profiles.filter(p => p.type === 'child').map(p => ({
        id: p.id,
        name: `${p.first_name}${p.last_name ? ` ${p.last_name}` : ''}`
      }))
    ];
  }, [profiles]);

  // Фильтруем доступные даты для платных консультаций (используем московское время)
  const isDateDisabled = useMemo(() => {
    return (date: Date) => {
      const moscowNow = getMoscowNow();
      moscowNow.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Блокируем прошлые даты (сравниваем даты без времени)
      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      const moscowNowOnly = new Date(moscowNow.getFullYear(), moscowNow.getMonth(), moscowNow.getDate());
      
      if (checkDateOnly < moscowNowOnly) return true;
      
      // Если платная консультация и есть активная бесплатная
      if (isPaid && activeFreeConsultation) {
        const freeDate = new Date(activeFreeConsultation.scheduled_at);
        const freeDateOnly = new Date(freeDate.getFullYear(), freeDate.getMonth(), freeDate.getDate());
        
        // Блокируем даты раньше даты бесплатной консультации
        if (checkDateOnly < freeDateOnly) return true;
      }
      
      return false;
    };
  }, [isPaid, activeFreeConsultation]);

  // Фильтруем доступное время для платных консультаций (используем московское время)
  const availableTimeSlots = useMemo(() => {
    if (!isPaid || !activeFreeConsultation || !selectedDate) {
      return TIME_SLOTS;
    }
    
    const freeDate = new Date(activeFreeConsultation.scheduled_at);
    // Получаем время бесплатной консультации в московском времени
    const freeDateMoscow = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(freeDate);
    
    const freeYear = parseInt(freeDateMoscow.find(p => p.type === 'year')?.value || '0');
    const freeMonth = parseInt(freeDateMoscow.find(p => p.type === 'month')?.value || '0') - 1;
    const freeDay = parseInt(freeDateMoscow.find(p => p.type === 'day')?.value || '0');
    const freeHour = parseInt(freeDateMoscow.find(p => p.type === 'hour')?.value || '0');
    const freeMinute = parseInt(freeDateMoscow.find(p => p.type === 'minute')?.value || '0');
    
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const freeDateOnly = new Date(freeYear, freeMonth, freeDay);
    freeDateOnly.setHours(0, 0, 0, 0);
    
    // Если выбрана дата бесплатной консультации
    if (selectedDateOnly.getTime() === freeDateOnly.getTime()) {
      // Время должно быть после времени бесплатной консультации (в московском времени)
      const freeTime = freeHour * 60 + freeMinute;
      return TIME_SLOTS.filter(time => {
        const [hours, minutes] = time.split(":").map(Number);
        const timeMinutes = hours * 60 + minutes;
        return timeMinutes > freeTime;
      });
    }
    
    return TIME_SLOTS;
  }, [isPaid, activeFreeConsultation, selectedDate]);

  const handleConfirm = async () => {
    if (!appointmentTypeId || !selectedDate || !selectedTime) {
      return;
    }

    // Интерпретируем выбранное время как московское время
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = createMoscowDateTime(selectedDate, hours, minutes);

    try {
      const appointment = await createAppointment.mutateAsync({
        appointmentTypeId,
        scheduledAt,
        profileId: selectedProfileId === "__parent__" ? null : selectedProfileId || null,
      });

      // Если консультация бесплатная, устанавливаем флаг и переходим к подтверждению
      if (appointmentType && appointmentType.price === 0) {
        try {
          await markFreeConsultationAsUsed();
        } catch (error) {
          console.error("Error marking free consultation as used:", error);
          // Не прерываем процесс, если не удалось установить флаг
        }
        navigate(`/appointments/confirmation?appointment_id=${appointment.id}`);
      } else {
        // Переходим на страницу оплаты
        navigate(`/payment?appointment_id=${appointment.id}&type=appointment`);
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
    }
  };

  const canConfirm = selectedDate && selectedTime && appointmentTypeId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!appointmentType) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Тип консультации не найден
            </p>
            <Button onClick={() => navigate("/appointments")}>
              Вернуться к выбору типа
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Если платная консультация и нет активной бесплатной - показываем ошибку
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/appointments")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Card className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Сначала запишитесь на бесплатную консультацию
            </h2>
            <p className="text-muted-foreground mb-6">
              Платные консультации доступны только после записи на бесплатную консультацию.
            </p>
            <Button onClick={() => navigate("/appointments")}>
              Вернуться к выбору типа
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/appointments")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Выберите дату и время
          </h1>
          <p className="text-muted-foreground">
            {appointmentType.name} • {appointmentType.duration_minutes} минут • {formatAmount(appointmentType.price)}
          </p>
        </div>

        {/* Шаги */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium">
              1
            </div>
            <span>Выберите тип консультации</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              2
            </div>
            <span className="font-medium">Выберите дату и время</span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Календарь */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <Label className="text-lg font-semibold">Выберите дату</Label>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              locale={ru}
              className="rounded-md border"
            />
            {isPaid && activeFreeConsultation && (
              <p className="text-sm text-muted-foreground mt-4">
                Минимальная доступная дата: {formatAppointmentTime(activeFreeConsultation.scheduled_at, selectedTimezone).split(' в ')[0]}
              </p>
            )}
            
            {/* Селектор временной зоны */}
            <div className="mt-4 space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Временная зона для отображения
              </Label>
              <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Время записи сохраняется в московском времени (MSK, UTC+3)
              </p>
            </div>
          </Card>

          {/* Выбор времени и профиля */}
          <div className="space-y-6">
            {/* Время */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Выберите время</Label>
              </div>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите время" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Нет доступного времени для выбранной даты
                    </div>
                  )}
                </SelectContent>
              </Select>
              {isPaid && activeFreeConsultation && selectedDate && (
                (() => {
                  const freeDate = new Date(activeFreeConsultation.scheduled_at);
                  // Получаем дату бесплатной консультации в московском времени
                  const freeDateMoscow = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Moscow',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).formatToParts(freeDate);
                  
                  const freeYear = parseInt(freeDateMoscow.find(p => p.type === 'year')?.value || '0');
                  const freeMonth = parseInt(freeDateMoscow.find(p => p.type === 'month')?.value || '0') - 1;
                  const freeDay = parseInt(freeDateMoscow.find(p => p.type === 'day')?.value || '0');
                  
                  const selectedDateOnly = new Date(selectedDate);
                  selectedDateOnly.setHours(0, 0, 0, 0);
                  const freeDateOnly = new Date(freeYear, freeMonth, freeDay);
                  freeDateOnly.setHours(0, 0, 0, 0);
                  
                  if (selectedDateOnly.getTime() === freeDateOnly.getTime()) {
                    return (
                      <p className="text-sm text-muted-foreground mt-2">
                        Минимальное доступное время: {formatAppointmentTimeOnly(activeFreeConsultation.scheduled_at, selectedTimezone)}
                      </p>
                    );
                  }
                  return null;
                })()
              )}
            </Card>

            {/* Профиль */}
            {availableProfiles.length > 1 && (
              <Card className="p-6">
                <Label className="text-lg font-semibold mb-4 block">
                  Для кого консультация?
                </Label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите профиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Информация о выборе */}
            {selectedDate && selectedTime && (
              <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-2">Выбранное время:</h3>
                <p className="text-muted-foreground">
                  {(() => {
                    // Создаем временную метку для предпросмотра
                    const [hours, minutes] = selectedTime.split(":").map(Number);
                    const previewDate = createMoscowDateTime(selectedDate, hours, minutes);
                    return formatAppointmentTime(previewDate, selectedTimezone);
                  })()}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Время будет сохранено как {selectedTime} (MSK, UTC+3)
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Кнопка подтверждения */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={!canConfirm || createAppointment.isPending}
            className="min-w-[200px]"
          >
            {createAppointment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Запись...
              </>
            ) : (
              "Подтвердить запись"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

