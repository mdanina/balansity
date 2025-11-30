import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { checkupQuestions, answerOptions, impactAnswerOptions } from "@/data/checkupQuestions";
import { useAssessment } from "@/hooks/useAssessment";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { getProfile, getProfiles } from "@/lib/profileStorage";
import { getCompletedAssessment } from "@/lib/assessmentStorage";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

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
  const { currentProfileId, setCurrentProfileId, setCurrentProfile } = useCurrentProfile();
  
  // Используем profileId из URL или из контекста
  const profileId = params.profileId || currentProfileId;
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Используем хук для работы с оценкой
  const { 
    currentStep, 
    loading, 
    saveAnswer, 
    getSavedAnswer,
    savedAnswers,
    complete 
  } = useAssessment({
    assessmentType: 'checkup',
    totalSteps: checkupQuestions.length,
    profileId: profileId,
  });

  // Загружаем профиль для отображения имени
  useEffect(() => {
    let cancelled = false;
    
    async function loadProfile() {
      if (profileId) {
        try {
          const loadedProfile = await getProfile(profileId);
          if (!cancelled) {
            setProfile(loadedProfile);
          }
        } catch (error) {
          if (!cancelled) {
            logger.error('Error loading profile:', error);
          }
        }
      }
    }
    loadProfile();
    
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  // Восстанавливаем индекс вопроса из URL параметра start (приоритет) или из сохраненного шага
  // Если есть параметр start в URL, используем его (это значит, что мы вернулись с interlude)
  const hasStartParam = searchParams.has("start");
  const initialIndex = hasStartParam 
    ? startIndex 
    : (profileId && currentStep > 1 ? currentStep - 1 : 0);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Answer[]>(
    checkupQuestions.map((q) => ({ 
      questionId: q.id, 
      value: null 
    }))
  );
  
  // Ref для хранения таймеров, чтобы можно было их очистить
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Восстанавливаем ответы при загрузке (только один раз после загрузки)
  useEffect(() => {
    if (!loading && profileId) {
      // Проверяем, есть ли уже сохраненные ответы
      const hasSavedAnswers = checkupQuestions.some(q => getSavedAnswer(q.id) !== null);
      
      if (hasSavedAnswers) {
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
      }
      
      // Восстанавливаем позицию только если индекс еще не установлен из URL параметра
      // Если есть параметр start в URL, он уже использован в initialIndex
      const urlStartParam = searchParams.get("start");
      if (!urlStartParam && currentStep > 1) {
        // Используем сохраненный шаг только если нет параметра start
        const stepIndex = currentStep - 1;
        if (stepIndex >= 0 && stepIndex < checkupQuestions.length) {
          setCurrentQuestionIndex(stepIndex);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profileId]);

  // Проверка на существование вопроса
  if (!checkupQuestions || checkupQuestions.length === 0) {
    logger.error('checkupQuestions is not defined or empty');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Ошибка загрузки вопросов</p>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex < 0 || currentQuestionIndex >= checkupQuestions.length) {
    navigate("/checkup-intro");
    return null;
  }

  const currentQuestion = checkupQuestions[currentQuestionIndex];
  if (!currentQuestion) {
    navigate("/checkup-intro");
    return null;
  }

  const progress = useMemo(() => 
    ((currentQuestionIndex + 1) / checkupQuestions.length) * 100,
    [currentQuestionIndex, checkupQuestions.length]
  );
  
  const currentAnswerOptions = useMemo(() => 
    currentQuestion.answerType === 'impact' ? impactAnswerOptions : answerOptions,
    [currentQuestion.answerType]
  );

  const handleAnswer = async (value: number) => {
    try {
      if (!currentQuestion) {
        logger.error('Current question is not defined');
        return;
      }

      // Обновляем локальное состояние
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = {
        questionId: currentQuestion.id,
        value,
      };
      setAnswers(newAnswers);

      // Применяем reverse scoring для обратных вопросов ПРИ СОХРАНЕНИИ
      const valueToSave = currentQuestion.isReverse === true ? reverseScore(value) : value;

      // Сохраняем в базу данных
      if (profileId) {
        try {
          await saveAnswer(
            currentQuestion.id,
            `checkup_${currentQuestion.id.toString().padStart(2, '0')}`,
            currentQuestion.category,
            valueToSave, // Сохраняем уже преобразованное значение
            currentQuestion.answerType,
            currentQuestionIndex + 1
          );
        } catch (error) {
          logger.error('Error saving answer:', error);
          // Продолжаем выполнение даже если сохранение не удалось
        }
      }

      // Автоматически переходим к следующему вопросу
      // Очищаем предыдущий таймер, если он есть
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        // Если это вопрос 21, переходим на промежуточный экран
        if (currentQuestionIndex === INTERLUDE_QUESTION_INDEX) {
          if (profileId) {
            navigate(`/checkup-interlude/${profileId}`);
          } else {
            navigate("/checkup-interlude");
          }
        } else if (currentQuestionIndex < checkupQuestions.length - 1) {
          // Переходим к следующему вопросу
          const nextIndex = currentQuestionIndex + 1;
          // Очищаем URL от параметра start, если он есть
          if (profileId) {
            const newUrl = `/checkup-questions/${profileId}`;
            window.history.replaceState({}, '', newUrl);
          }
          setCurrentQuestionIndex(nextIndex);
        } else {
          // После последнего вопроса завершаем checkup assessment
          if (profileId) {
            // Дожидаемся завершения чекапа и обновления кеша перед навигацией
            async function completeAndNavigate() {
              try {
                // Завершаем чекап и ждем обновления кеша
                await complete();
                
                // Проверяем, есть ли еще дети без завершенного чекапа
                const allProfiles = await getProfiles();
                const children = allProfiles.filter(p => p.type === 'child' && p.id !== profileId);
                
                // Находим детей без завершенного чекапа
                const childrenWithoutCheckup = [];
                for (const child of children) {
                  const completedCheckup = await getCompletedAssessment(child.id, 'checkup');
                  if (!completedCheckup || completedCheckup.status !== 'completed') {
                    childrenWithoutCheckup.push(child);
                  }
                }
                
                // Если есть еще дети без чекапа, переходим к следующему
                if (childrenWithoutCheckup.length > 0) {
                  const nextChild = childrenWithoutCheckup[0];
                  setCurrentProfileId(nextChild.id);
                  setCurrentProfile(nextChild);
                  navigate(`/checkup-intro/${nextChild.id}`);
                } else {
                  // Все дети прошли чекап - переходим к вопросам о родителе
                  navigate("/parent-intro");
                }
              } catch (error) {
                logger.error('Error completing assessment or checking next child:', error);
                // В случае ошибки переходим к вопросам о родителе
                navigate("/parent-intro");
              }
            }
            
            completeAndNavigate();
          } else {
            // Переходим к вопросам о родителе
            navigate("/parent-intro");
          }
        }
        timeoutRef.current = null;
      }, TRANSITION_DELAY_MS);
    } catch (error) {
      logger.error('Error in handleAnswer:', error);
    }
  };

  const handleSkip = async () => {
    // Сохраняем пропущенный ответ (используем -1 как маркер пропущенного вопроса)
    if (profileId) {
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
    // Очищаем предыдущий таймер, если он есть
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      if (currentQuestionIndex === INTERLUDE_QUESTION_INDEX) {
        if (profileId) {
          navigate(`/checkup-interlude/${profileId}`);
        } else {
          navigate("/checkup-interlude");
        }
      } else if (currentQuestionIndex < checkupQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // После последнего вопроса завершаем checkup assessment
        if (profileId) {
          await complete();
          
          // Проверяем, есть ли еще дети без завершенного чекапа
          try {
            const allProfiles = await getProfiles();
            const children = allProfiles.filter(p => p.type === 'child' && p.id !== profileId);
            
            // Находим детей без завершенного чекапа
            const childrenWithoutCheckup = [];
            for (const child of children) {
              const completedCheckup = await getCompletedAssessment(child.id, 'checkup');
              if (!completedCheckup || completedCheckup.status !== 'completed') {
                childrenWithoutCheckup.push(child);
              }
            }
            
            // Если есть еще дети без чекапа, переходим к следующему
            if (childrenWithoutCheckup.length > 0) {
              const nextChild = childrenWithoutCheckup[0];
              setCurrentProfileId(nextChild.id);
              setCurrentProfile(nextChild);
              navigate(`/checkup-intro/${nextChild.id}`);
            } else {
              // Все дети прошли чекап - переходим к вопросам о родителе
              navigate("/parent-intro");
            }
          } catch (error) {
            logger.error('Error checking next child:', error);
            // В случае ошибки переходим к вопросам о родителе
            navigate("/parent-intro");
          }
        } else {
          navigate("/parent-intro");
        }
      }
      timeoutRef.current = null;
    }, TRANSITION_DELAY_MS);
  };

  useEffect(() => {
    // Прокручиваем вверх при смене вопроса
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentQuestionIndex]);
  
  // Cleanup таймеров при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
                {profile ? (
                  <>Вызывают ли какие-либо из чувств или поведения {profile.first_name}, о которых мы здесь спрашивали...</>
                ) : (
                  <>Вызывают ли какие-либо из чувств или поведения вашего ребенка, о которых мы здесь спрашивали...</>
                )}
              </p>
            ) : (
              <p className="text-center text-muted-foreground">
                {profile ? (
                  <>Пожалуйста, ответьте на эти вопросы о {profile.first_name} за последние шесть месяцев.</>
                ) : (
                  <>Пожалуйста, ответьте на эти вопросы о вашем ребенке за последние шесть месяцев.</>
                )}
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
