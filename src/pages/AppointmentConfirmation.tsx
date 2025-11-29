import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointment, useAppointmentType } from "@/hooks/useAppointments";
import { usePackagePurchase, usePackage } from "@/hooks/usePackages";
import { useProfiles } from "@/hooks/useProfiles";
import { CheckCircle2, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export default function AppointmentConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const packageId = searchParams.get("package_id");
  const paymentId = searchParams.get("payment_id");

  const { data: appointment, isLoading: appointmentLoading } = useAppointment(appointmentId);
  const appointmentTypeId = appointment?.appointment_type_id;
  const { data: appointmentType } = useAppointmentType(appointmentTypeId || null);
  const { data: packagePurchase, isLoading: packageLoading } = usePackagePurchase(packageId);
  const packageIdFromPurchase = packagePurchase?.package_id;
  const { data: pkg } = usePackage(packageIdFromPurchase || null);
  const { data: profiles } = useProfiles();

  const isLoading = appointmentLoading || packageLoading;

  // Находим профиль по ID для отображения имени
  const profile = appointment?.profile_id 
    ? profiles?.find(p => p.id === appointment.profile_id)
    : null;
  
  const profileDisplayName = profile 
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`
    : appointment?.profile_id 
      ? null // Если профиль не найден, но ID есть
      : "Для меня (родитель)";

  useEffect(() => {
    // Если нет ни консультации, ни покупки пакета, перенаправляем
    if (!isLoading && !appointment && !packagePurchase) {
      navigate("/dashboard");
    }
  }, [appointment, packagePurchase, isLoading, navigate]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            {appointment ? "Консультация записана!" : "Пакет успешно приобретен!"}
          </h1>

          <p className="text-muted-foreground mb-8">
            {appointment
              ? "Ваша консультация успешно записана и оплачена"
              : "Ваш пакет сессий успешно приобретен"}
          </p>

          {/* Детали консультации */}
          {appointment && (
            <div className="mb-8 space-y-4 text-left bg-muted/50 p-6 rounded-lg">
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

              {appointmentType && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Тип консультации</p>
                    <p className="font-medium">
                      {appointmentType.name} ({appointmentType.duration_minutes} минут)
                    </p>
                  </div>
                </div>
              )}

              {profileDisplayName && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Для кого</p>
                    <p className="font-medium">{profileDisplayName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Детали пакета */}
          {packagePurchase && pkg && (
            <div className="mb-8 space-y-4 text-left bg-muted/50 p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Пакет</p>
                  <p className="font-medium">{pkg.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Оставшиеся сессии</p>
                  <p className="font-medium">{packagePurchase.sessions_remaining} сессий</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Вернуться в кабинет
            </Button>
            {appointment && (
              <Button onClick={() => navigate("/appointments")}>
                Записаться еще
              </Button>
            )}
            {packagePurchase && (
              <Button onClick={() => navigate("/packages")}>
                Посмотреть пакеты
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

