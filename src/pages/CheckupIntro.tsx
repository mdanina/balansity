import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import otterSchool from "@/assets/otter-school.png";

export default function CheckupIntro() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={3} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">1 / 31</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12 text-center">
          <img
            src={otterSchool}
            alt="Выдра с рюкзаком"
            className="mx-auto h-80 w-80 object-contain"
          />
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Давайте сосредоточимся на ребенке.
            </h1>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (params.profileId) {
                navigate(`/checkup-questions/${params.profileId}`);
              } else {
                navigate("/checkup");
              }
            }}
            className="h-14 w-full max-w-md text-base font-medium"
          >
            Начнем
          </Button>
        </div>
      </div>
    </div>
  );
}
