import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import leafDecoration from "@/assets/leaf-decoration.png";
import { ChevronLeft, ChevronRight, Download, MessageCircle, Lightbulb } from "lucide-react";

export default function ResultsReport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Header with decoration */}
        <div className="relative mb-12">
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute left-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          <img 
            src={leafDecoration} 
            alt="" 
            className="absolute right-0 top-0 h-24 w-24 object-contain opacity-50"
          />
          
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Your Results
            </h1>
            <p className="text-lg text-muted-foreground">
              Today • Completed by Dan, Mar
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-12 rounded-lg border border-border bg-secondary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="text-primary">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 7v10c0 5.5 3.84 7.7 8 9 4.16-1.3 8-3.5 8-9V7l-8-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <p className="text-foreground">
              This summary provides an overview of your results. For a comprehensive analysis,{" "}
              <a href="#" className="font-medium text-primary underline hover:no-underline">
                Download the full report
              </a>{" "}
              at no cost using the code FAMILY.
            </p>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Summary</h2>
          <p className="text-muted-foreground mb-8">
            These findings are based on the <span className="font-medium">39 question</span> checkup you completed about your family.
          </p>

          {/* Cards Carousel */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* AI Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-purple-100 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-white p-3">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">AI</h3>
                    <p className="text-sm text-muted-foreground">11 years</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Concerning</span>
                    <p className="text-sm text-muted-foreground">Behaviors</p>
                    <p className="text-sm text-muted-foreground">Social</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Typical</span>
                    <p className="text-sm text-muted-foreground">Emotions</p>
                    <p className="text-sm text-muted-foreground">Activity</p>
                  </div>
                </div>
              </div>

              {/* You Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-teal-100 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-white p-3">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">You</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Concerning</span>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Typical</span>
                    <p className="text-sm text-muted-foreground">Anxiety</p>
                    <p className="text-sm text-muted-foreground">Depression</p>
                  </div>
                </div>
              </div>

              {/* Family Card */}
              <div className="min-w-[320px] flex-1 rounded-lg bg-blue-100 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-white p-3">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Family</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Concerning</span>
                    <p className="text-sm text-muted-foreground">Family Stress</p>
                    <p className="text-sm text-muted-foreground">Co-Parenting</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Typical</span>
                    <p className="text-sm text-muted-foreground">Me & My Partner</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-full max-w-xl rounded-full bg-muted">
              <div className="h-full w-1/3 rounded-full bg-primary"></div>
            </div>
          </div>
        </div>

        {/* AI's Mental Health Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">AI's Mental Health</h2>
          
          {/* Emotional Challenges */}
          <div className="mb-8 rounded-lg border border-border p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">1</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Emotional Challenges</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                Typical
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 bg-primary"></div>
              </div>
            </div>

            {/* Expandable sections */}
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">What does this mean?</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-foreground">What can I do?</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Unlock Report */}
            <div className="mt-6 rounded-lg bg-muted/30 p-6">
              <div className="mb-4 flex items-center gap-3">
                <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2"/>
                </svg>
                <h4 className="font-medium text-foreground">See the rest of AI's report</h4>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                To see how AI scored on Behavioral Challenges, Activity Challenges and Social Challenges, purchase the full report.
              </p>
              <Button size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Unlock Full Report With Promo Code: FAMILY
              </Button>
            </div>
          </div>

          {/* Behavioral Challenges */}
          <div className="mb-8 rounded-lg border border-border p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">2</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Behavioral Challenges</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-600">
                Concerning
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-4/5 bg-red-500"></div>
              </div>
            </div>

            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded-lg bg-purple-50 p-4 text-left hover:bg-purple-100">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-foreground">What does this mean?</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button className="flex w-full items-center justify-between rounded-lg bg-blue-50 p-4 text-left hover:bg-blue-100">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-foreground">What can I do?</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Activity Challenges */}
          <div className="rounded-lg border border-border p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="text-sm font-medium">3</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Activity Challenges</h3>
            </div>

            <div className="mb-6">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                Typical
              </span>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 bg-primary"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex-1"
          >
            Return to Dashboard
          </Button>
          <Button
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex-1"
          >
            View Full Results
          </Button>
        </div>
      </div>
    </div>
  );
}
