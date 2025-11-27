import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { parentQuestions, sexOptions, frequencyOptions } from "@/data/parentQuestions";

interface Answer {
  questionId: number;
  value: number | null;
}

export default function ParentQuestions() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    parentQuestions.map((q) => ({ questionId: q.id, value: null }))
  );

  const currentQuestion = parentQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / 6) * 100;

  const getAnswerOptions = () => {
    switch (currentQuestion.answerType) {
      case 'sex':
        return sexOptions;
      case 'frequency':
        return frequencyOptions;
      default:
        return [];
    }
  };

  const currentAnswerOptions = getAnswerOptions();

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      value,
    };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < parentQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        navigate("/family-intro");
      }
    }, 300);
  };

  const handleSkip = () => {
    if (currentQuestionIndex < parentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigate("/family-intro");
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestionIndex]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-medium text-primary-foreground">
              {currentQuestionIndex + 1} / 6
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="rounded-lg bg-secondary/30 px-6 py-3 text-center">
            <span className="font-medium text-secondary-foreground">
              {currentQuestion.category}
            </span>
          </div>

          <div className="space-y-6">
            {currentQuestion.answerType === 'sex' ? (
              <p className="text-center text-muted-foreground">
                Tell us about yourself
              </p>
            ) : (
              <p className="text-center text-muted-foreground">
                During the last two weeks, how often have you been bothered by the following problems:
              </p>
            )}

            <h2 className="text-center text-3xl font-bold text-foreground">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3 pt-8">
              {currentAnswerOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full rounded-lg border border-border bg-card px-6 py-4 text-center text-base font-medium text-card-foreground transition-all hover:border-primary hover:bg-secondary/50 active:scale-[0.98]"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="pt-8 text-center">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
