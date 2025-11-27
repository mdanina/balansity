import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import otterCouch from "@/assets/otter-couch.png";

export default function CheckupInterlude() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-muted/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={71} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">22 / 31</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-20">
        <div className="space-y-12">
          <img
            src={otterCouch}
            alt="Otter on couch"
            className="mx-auto h-80 w-80 object-contain"
          />
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-foreground">
              Next, we'll be asking how these emotions and behaviors <span className="font-bold">impact AI</span> and your family.
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Your child's challenges can impact their development and functioning and your family's quality of life. This is when it is important to get help and support.
            </p>
            
            <p className="text-sm text-muted-foreground">
              31 questions • 3 min
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/checkup-questions?start=22")}
            className="h-14 w-full text-base font-medium"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
