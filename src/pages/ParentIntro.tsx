import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import otterHearts from "@/assets/otter-hearts.png";

export default function ParentIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={5} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">1 / 6</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12">
          <img
            src={otterHearts}
            alt="Otters with hearts"
            className="mx-auto h-64 w-64 object-contain"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Now, we're going to focus on <span className="font-bold">you.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Understanding your mental health is essential to support your entire family's mental health and wellness.
            </p>
            
            <p className="text-sm text-muted-foreground">
              6 questions • 2 min
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/parent-questions")}
            className="h-14 w-full text-base font-medium"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
