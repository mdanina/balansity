import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { checkupQuestions, answerOptions, impactAnswerOptions } from "@/data/checkupQuestions";
import { useAssessment } from "@/hooks/useAssessment";

interface Answer {
  questionId: number;
  value: number | null;
}

const INTERLUDE_QUESTION_INDEX = 20;
const TRANSITION_DELAY_MS = 300;

// Функция для reverse scoring: 4->0, 3->1, 2->2, 1->3, 0->4
function reverseScore(value: number): number {
  if (value < 0 || value > 4) return value; // Для пропущенных (-1) или некорректных значений
  return 4 - value;
}

// Обратная функция для восстановления отображения: 0->4, 1->3, 2->2, 3->1, 4->0
function unreverseScore(value: number): number {
  if (value < 0 || value > 4) return value;
  return 4 - value;
}

export default function CheckupQuestions() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const [searchParams] = useSearchParams();
  const startIndex = parseInt(searchParams.get("start") || "1") - 1;
  
  // Используем хук для работы с оценкой
  const { 
    currentStep, 
    loading, 
    saveAnswer, 
    getSavedAnswer,
    complete 
  } = useAssessment({
    assessmentType: 'checkup',
    totalSteps: checkupQuestions.length,
    profileId: params.profileId,
  });

  // Восстанавливаем индекс вопроса из сохраненного шага или из URL
  const initialIndex = params.profileId && currentStep > 1 
    ? currentStep - 1 
    : startIndex;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Answer[]>(
    checkupQuestions.map((q) => {
      const savedValue = getSavedAnswer(q.id);
      // Если вопрос обратный и есть сохраненное значение, применяем обратное преобразование для отображения
      if (q.isReverse && savedValue !== null && savedValue >= 0) {
        return {
          questionId: q.id,
          value: unreverseScore(savedValue),
        };
      }
      return {
        questionId: q.id,
        value: savedValue,
      };
    })
  );

  // Восстанавливаем ответы при загрузке
  useEffect(() => {
    if (!loading && params.profileId) {
      const restoredAnswers = checkupQuestions.map((q) => {
        const savedValue = getSavedAnswer(q.id);
        // Если вопрос обратный и есть сохраненное значение, применяем обратное преобразование для отображения
        if (q.isReverse && savedValue !== null && savedValue >= 0) {
          return {
            questionId: q.id,
            value: unreverseScore(savedValue),
          };
        }
        return {
          questionId: q.id,
          value: savedValue,
        };
      });
      setAnswers(restoredAnswers);
      
      // Восстанавливаем позицию
      if (currentStep > 1) {
        setCurrentQuestionIndex(currentStep - 1);
      }
    }
  }, [loading, currentStep, params.profileId, getSavedAnswer]);

  // Проверка на существование вопроса
  if (currentQuestionIndex < 0 || currentQuestionIndex >= checkupQuestions.length) {
    navigate("/checkup-intro");
    return null;
  }

  const currentQuestion = checkupQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    navigate("/checkup-intro");
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / checkupQuestions.length) * 100;
  const currentAnswerOptions = currentQuestion.answerType === 'impact' ? impactAnswerOptions : answerOptions;

  const handleAnswer = async (value: number) => {
    // Обновляем локальное состояние
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      value,
    };
    setAnswers(newAnswers);

    // Применяем reverse scoring для обратных вопросов ПРИ СОХРАНЕНИИ
    const valueToSave = currentQuestion.isReverse ? reverseScore(value) : value;

    // Сохраняем в базу данных
    if (params.profileId) {
      await saveAnswer(
        currentQuestion.id,
        `checkup_${currentQuestion.id.toString().padStart(2, '0')}`,
        currentQuestion.category,
        valueToSave, // Сохраняем уже преобразованное значение
        currentQuestion.answerType,
        currentQuestionIndex + 1
      );
    }

    // Автоматически переходим к следующему вопросу
    setTimeout(async () => {
      // Если это вопрос 21, переходим на промежуточный экран
      if (currentQuestionIndex === INTERLUDE_QUESTION_INDEX) {
        navigate("/checkup-interlude");
      } else if (currentQuestionIndex < checkupQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // После последнего вопроса завершаем checkup assessment
        if (params.profileId) {
          await complete();
        }
        // Переходим к вопросам о родителе
        navigate("/parent-intro");
      }
    }, TRANSITION_DELAY_MS);
  };

  const handleSkip = async () => {
    // Сохраняем пропущенный ответ (используем -1 как маркер пропущенного вопроса)
    if (params.profileId) {
      await saveAnswer(
        currentQuestion.id,
        `checkup_${currentQuestion.id.toString().padStart(2, '0')}`,
        currentQuestion.category,
        -1, // -1 означает пропущенный вопрос
        currentQuestion.answerType,
        currentQuestionIndex + 1
      );
    }

    // Обновляем локальное состояние
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      value: -1,
    };
    setAnswers(newAnswers);

    // Переходим к следующему вопросу
    setTimeout(async () => {
      if (currentQuestionIndex === INTERLUDE_QUESTION_INDEX) {
        navigate("/checkup-interlude");
      } else if (currentQuestionIndex < checkupQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // После последнего вопроса завершаем checkup assessment
        if (params.profileId) {
          await complete();
        }
        navigate("/parent-intro");
      }
    }, TRANSITION_DELAY_MS);
  };

  useEffect(() => {
    // Прокручиваем вверх при смене вопроса
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
              {currentQuestionIndex + 1} / {checkupQuestions.length}
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
            {currentQuestion.answerType === 'impact' ? (
              <p className="text-center text-muted-foreground">
                Вызывают ли какие-либо из чувств или поведения вашего ребенка, о которых мы здесь спрашивали...
              </p>
            ) : (
              <p className="text-center text-muted-foreground">
                Пожалуйста, ответьте на эти вопросы о вашем ребенке за последние шесть месяцев.
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
