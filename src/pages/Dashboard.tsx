import { TestimonialSection } from "@/components/TestimonialSection";
import logoOtters from "@/assets/logo-otters.png";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <TestimonialSection />
      
      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-2xl space-y-12">
          <div className="flex items-center gap-3">
            <img src={logoOtters} alt="Little Otter" className="h-12 w-12" />
            <span className="text-2xl font-bold text-primary">Little Otter</span>
          </div>

          <div>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-foreground">
              Поздравляем с первым шагом!
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Мы вместе с вами на всем пути. Little Otter здесь, чтобы предоставить вам и вашей
              семье комплексный, персонализированный подход к психическому здоровью, независимо
              от того, на каком этапе вы находитесь.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Расскажите нам о своей семье
                </h3>
                <p className="text-muted-foreground">
                  Создайте новую семейную учетную запись и расскажите нам больше о каждом члене
                  вашей семьи.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Пройдите ФМЗП
                </h3>
                <p className="text-muted-foreground">
                  Пройдите проприетарную семейную проверку психического здоровья (ФМЗП) Little
                  Otter и узнайте, что делать или когда беспокоиться.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Запланируйте консультацию
                </h3>
                <p className="text-muted-foreground">
                  Запланируйте вводный звонок с одним из членов нашей команды, чтобы просмотреть
                  ваши результаты и получить индивидуальный план помощи.
                </p>
              </div>
            </div>
          </div>

          <Button size="lg" className="h-14 w-full text-base font-medium sm:w-auto sm:px-12">
            Начать
          </Button>
        </div>
      </div>
    </div>
  );
}
