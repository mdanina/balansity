import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppointment, useAppointmentType } from "@/hooks/useAppointments";
import { usePackage } from "@/hooks/usePackages";
import { useCreatePayment, usePayment } from "@/hooks/usePayments";
import { formatAmount } from "@/lib/payment";
import { Loader2, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const packageId = searchParams.get("package_id");
  const type = searchParams.get("type"); // "appointment" или "package"
  const paymentId = searchParams.get("payment_id");

  const { data: appointment } = useAppointment(appointmentId);
  const appointmentTypeId = appointment?.appointment_type_id;
  const { data: appointmentType } = useAppointmentType(appointmentTypeId || null);
  const { data: pkg } = usePackage(packageId);
  const { data: existingPayment } = usePayment(paymentId);
  const createPayment = useCreatePayment();

  const [isProcessing, setIsProcessing] = useState(false);

  // Определяем, что оплачиваем
  const paymentItem = type === "appointment" ? appointment : pkg;
  const amount = type === "appointment"
    ? appointmentType?.price || 0
    : pkg?.price || 0;

  useEffect(() => {
    // Если есть существующий платеж и он завершен, перенаправляем на подтверждение
    if (existingPayment && existingPayment.status === "completed") {
      if (type === "appointment" && appointmentId) {
        navigate(`/appointments/confirmation?appointment_id=${appointmentId}`);
      } else if (type === "package" && packageId) {
        navigate(`/appointments/confirmation?package_id=${packageId}`);
      }
    }
  }, [existingPayment, type, appointmentId, packageId, navigate]);

  const handlePayment = async () => {
    if (!paymentItem) {
      toast.error("Не удалось определить детали заказа");
      return;
    }

    // Если консультация бесплатная, пропускаем оплату
    if (type === "appointment" && amount === 0) {
      // Для бесплатной консультации просто переходим к подтверждению
      if (appointmentId) {
        navigate(`/appointments/confirmation?appointment_id=${appointmentId}`);
      }
      return;
    }

    if (amount === 0) {
      toast.error("Не удалось определить сумму платежа");
      return;
    }

    setIsProcessing(true);

    try {
      // Создаем платеж
      const result = await createPayment.mutateAsync({
        amount,
        currency: "RUB",
        paymentMethod: "yookassa", // По умолчанию ЮKassa, можно сделать выбор
        metadata: {
          type,
          appointment_id: appointmentId,
          package_id: packageId,
        },
      });

      // Если есть URL для редиректа на оплату, переходим туда
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        // Для MVP: симулируем успешную оплату
        // В реальном приложении здесь будет редирект на платежную систему
        toast.success("Платеж обрабатывается...");
        
        // Симуляция успешной оплаты (для MVP)
        setTimeout(() => {
          if (type === "appointment" && appointmentId) {
            navigate(`/appointments/confirmation?appointment_id=${appointmentId}&payment_id=${result.payment.id}`);
          } else if (type === "package" && packageId) {
            navigate(`/appointments/confirmation?package_id=${packageId}&payment_id=${result.payment.id}`);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Ошибка при создании платежа");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!paymentItem) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {type === "appointment" ? "Консультация" : "Пакет"} не найден
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Вернуться в кабинет
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Оплата</h1>
          <p className="text-muted-foreground">
            Подтвердите детали и завершите оплату
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Детали заказа</h2>
          
          {type === "appointment" && appointment && appointmentType && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип консультации:</span>
                <span className="font-medium">{appointmentType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Длительность:</span>
                <span className="font-medium">{appointmentType.duration_minutes} минут</span>
              </div>
              {appointment.scheduled_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата и время:</span>
                  <span className="font-medium">
                    {new Date(appointment.scheduled_at).toLocaleString("ru-RU")}
                  </span>
                </div>
              )}
            </div>
          )}

          {type === "package" && pkg && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Пакет:</span>
                <span className="font-medium">{pkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Количество сессий:</span>
                <span className="font-medium">{pkg.session_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип консультации:</span>
                <span className="font-medium">{pkg.appointment_type?.name}</span>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Итого:</span>
            <span className="text-2xl font-bold text-primary">
              {formatAmount(amount)}
            </span>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Способ оплаты
          </h2>
          <p className="text-muted-foreground">
            Оплата будет произведена через ЮKassa
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            После нажатия кнопки "Оплатить" вы будете перенаправлены на страницу оплаты
          </p>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || createPayment.isPending}
            className="flex-1"
            size="lg"
          >
            {isProcessing || createPayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : amount === 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Подтвердить (бесплатно)
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Оплатить {formatAmount(amount)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

