import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { parentQuestions, sexOptions, frequencyOptions } from "@/data/parentQuestions";
import { useAssessment } from "@/hooks/useAssessment";

interface Answer {
  questionId: number;
  value: number | null;
}

const TRANSITION_DELAY_MS = 300;

export default function ParentQuestions() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  
  const { 
    currentStep, 
    loading, 
    saveAnswer, 
    getSavedAnswer,
    complete 
  } = useAssessment({
    assessmentType: 'parent',
    totalSteps: parentQuestions.length,
    profileId: params.profileId,
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    parentQuestions.map((q) => ({ 
      questionId: q.id, 
      value: null 
    }))
  );

  // Восстанавливаем ответы при загрузке
  useEffect(() => {
    if (!loading && params.profileId) {
      const restoredAnswers = parentQuestions.map((q) => ({
        questionId: q.id,
        value: getSavedAnswer(q.id),
      }));
      setAnswers(restoredAnswers);
      
      if (currentStep > 1) {
        setCurrentQuestionIndex(currentStep - 1);
      }
    }
  }, [loading, currentStep, params.profileId, getSavedAnswer]);

  if (currentQuestionIndex < 0 || currentQuestionIndex >= parentQuestions.length) {
    navigate("/parent-intro");
    return null;
  }

  const currentQuestion = parentQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    navigate("/parent-intro");
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / parentQuestions.length) * 100;

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

  const handleAnswer = async (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      value,
    };
    setAnswers(newAnswers);

    // Сохраняем в базу данных
    if (params.profileId) {
      await saveAnswer(
        currentQuestion.id,
        `parent_${currentQuestion.id.toString().padStart(2, '0')}`,
        currentQuestion.category,
        value,
        currentQuestion.answerType,
        currentQuestionIndex + 1
      );
    }

    setTimeout(() => {
      if (currentQuestionIndex < parentQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Завершаем оценку
        if (params.profileId) {
          complete();
        }
        navigate("/family-intro");
      }
    }, TRANSITION_DELAY_MS);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="border-b border-border bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-medium text-primary-foreground">
              {currentQuestionIndex + 1} / {parentQuestions.length}
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
                Расскажите о себе
              </p>
            ) : (
              <p className="text-center text-muted-foreground">
                В течение последних двух недель, как часто вас беспокоили следующие проблемы:
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
                Пропустить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
