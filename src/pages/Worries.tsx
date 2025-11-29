import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCurrentProfile } from "@/contexts/ProfileContext";
import { updateProfile, getProfile, getProfiles } from "@/lib/profileStorage";
import { toast } from "sonner";

const childWorries = [
  "Фокус и внимание",
  "Грусть и плач",
  "Тревоги и беспокойства",
  "Питание",
  "Сон и режим",
  "Туалет",
  "Сенсорная чувствительность",
  "Гнев и агрессия",
  "Импульсивность",
  "Травма",
  "Горе и потеря",
  "Буллинг",
  "Самооценка",
  "Школа/детский сад",
  "Удары, укусы или пинки",
  "Гендерная или сексуальная идентичность",
  "Сотрудничество",
];

const personalWorries = [
  "Выгорание",
  "Тревожность",
  "Пониженное настроение",
  "Трудности с концентрацией внимания",
  "Общий стресс",
];

const familyWorries = [
  "Разделение/развод",
  "Семейный стресс",
  "Отношения с партнером",
  "Психическое здоровье партнера",
  "Воспитание",
  "Семейный конфликт",
];

export default function Worries() {
  const navigate = useNavigate();
  const params = useParams<{ profileId?: string }>();
  const { currentProfileId, currentProfile, setCurrentProfile } = useCurrentProfile();
  const profileId = params.profileId || currentProfileId;
  
  const [expandedSections, setExpandedSections] = useState({
    child: false,
    personal: false,
    family: false,
  });
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Загружаем существующие worry tags при загрузке из всех профилей
  useEffect(() => {
    async function loadWorryTags() {
      if (profileId) {
        try {
          const profiles = await getProfiles();
          const childProfile = profiles.find(p => p.id === profileId);
          const parentProfile = profiles.find(p => p.type === 'parent');
          const partnerProfile = profiles.find(p => p.type === 'partner');
          
          // Собираем worry tags из всех профилей
          const allWorryTags: string[] = [];
          
          if (childProfile?.worry_tags) {
            allWorryTags.push(...childProfile.worry_tags);
          }
          if (parentProfile?.worry_tags) {
            // Добавляем только personal и family worry tags из профиля родителя
            const parentPersonalWorries = parentProfile.worry_tags.filter(w => personalWorries.includes(w));
            const parentFamilyWorries = parentProfile.worry_tags.filter(w => familyWorries.includes(w));
            allWorryTags.push(...parentPersonalWorries, ...parentFamilyWorries);
          }
          if (partnerProfile?.worry_tags) {
            allWorryTags.push(...partnerProfile.worry_tags);
          }
          
          // Убираем дубликаты
          const uniqueWorryTags = [...new Set(allWorryTags)];
          if (uniqueWorryTags.length > 0) {
            setSelectedWorries(uniqueWorryTags);
          }
        } catch (error) {
          console.error('Error loading worry tags:', error);
        }
      }
    }
    loadWorryTags();
  }, [profileId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleWorry = (worry: string) => {
    setSelectedWorries((prev) =>
      prev.includes(worry) ? prev.filter((w) => w !== worry) : [...prev, worry]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              Расскажите нам о своих беспокойствах
            </h1>
          </div>

          <div className="space-y-4">
            {/* For Child Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("child")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Ребенка</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => childWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.child ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.child && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {childWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For You Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("personal")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Вас</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => personalWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.personal ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.personal && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {personalWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* For Your Family Section */}
            <div className="rounded-lg border border-border bg-card">
              <button
                onClick={() => toggleSection("family")}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">Для Вашей Семьи</span>
                  <Badge variant="secondary" className="rounded-full">
                    {selectedWorries.filter((w) => familyWorries.includes(w)).length}
                  </Badge>
                </div>
                {expandedSections.family ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {expandedSections.family && (
                <div className="border-t border-border p-6">
                  <div className="flex flex-wrap gap-2">
                    {familyWorries.map((worry) => (
                      <Badge
                        key={worry}
                        variant={selectedWorries.includes(worry) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm transition-colors"
                        onClick={() => toggleWorry(worry)}
                      >
                        {worry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={async () => {
              let targetProfileId = profileId;
              
              // Если profileId не передан, пытаемся найти первого ребенка
              if (!targetProfileId) {
                try {
                  const profiles = await getProfiles();
                  const firstChild = profiles.find(p => p.type === 'child');
                  if (firstChild) {
                    targetProfileId = firstChild.id;
                    setCurrentProfileId(firstChild.id);
                    setCurrentProfile(firstChild);
                  } else {
                    toast.error('Не выбран профиль ребенка. Пожалуйста, сначала добавьте ребенка на странице "Члены семьи"');
                    navigate("/family-members");
                    return;
                  }
                } catch (error) {
                  console.error('Error loading profiles:', error);
                  toast.error('Ошибка при загрузке профилей');
                  navigate("/family-members");
                  return;
                }
              }

              try {
                setLoading(true);
                
                // Разделяем worry tags по категориям
                const childWorryTags = selectedWorries.filter(w => childWorries.includes(w));
                const personalWorryTags = selectedWorries.filter(w => personalWorries.includes(w));
                const familyWorryTags = selectedWorries.filter(w => familyWorries.includes(w));
                
                console.log('Saving worry tags:', {
                  childProfileId: targetProfileId,
                  childWorryTags,
                  personalWorryTags,
                  familyWorryTags
                });
                
                // Сохраняем worry tags о ребенке в профиль ребенка
                await updateProfile(targetProfileId, {
                  worryTags: childWorryTags,
                });

                // Загружаем профили один раз для всех операций
                const profiles = await getProfiles();
                const parentProfile = profiles.find(p => p.type === 'parent');
                const partnerProfile = profiles.find(p => p.type === 'partner');

                // Сохраняем worry tags о семье в профиль партнера (если есть) или родителя
                if (partnerProfile) {
                  // Если есть партнер, сохраняем family worry tags в его профиль
                  await updateProfile(partnerProfile.id, {
                    worryTags: familyWorryTags,
                  });
                }

                // Сохраняем worry tags о себе и о семье в профиль родителя
                // ВАЖНО: Делаем ОДНО обновление с правильным объединением всех категорий
                if (parentProfile) {
                  // Получаем существующие worry tags родителя
                  const existingParentWorries = parentProfile.worry_tags || [];
                  
                  // Разделяем существующие на категории
                  const existingPersonalWorries = existingParentWorries.filter(w => personalWorries.includes(w));
                  const existingFamilyWorries = existingParentWorries.filter(w => familyWorries.includes(w));
                  
                  // Объединяем: новые personal + новые family (или существующие family, если нет партнера)
                  // Если есть партнер, family worry tags уже сохранены в его профиль, поэтому не добавляем их в родителя
                  const finalFamilyWorries = partnerProfile ? existingFamilyWorries : familyWorryTags;
                  
                  // Финальный список: personal + family (если нет партнера)
                  const combinedParentWorries = [...new Set([
                    ...personalWorryTags,  // Новые personal worry tags
                    ...finalFamilyWorries  // Family worry tags (новые или существующие)
                  ])];
                  
                  console.log('Saving parent worry tags:', {
                    personalWorryTags,
                    familyWorryTags,
                    hasPartner: !!partnerProfile,
                    finalFamilyWorries,
                    combinedParentWorries
                  });
                  
                  await updateProfile(parentProfile.id, {
                    worryTags: combinedParentWorries,
                  });
                }

                // Обновляем профиль в контексте, если он там есть
                if (currentProfile) {
                  const updatedChildProfile = await getProfile(targetProfileId);
                  if (updatedChildProfile) {
                    setCurrentProfile(updatedChildProfile);
                  }
                }

                toast.success('Беспокойства сохранены');
                
                // Возвращаемся в dashboard (чекап доступен только через кнопку в dashboard)
                navigate("/dashboard");
              } catch (error) {
                console.error('Error saving worry tags:', error);
                toast.error('Ошибка при сохранении беспокойств');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="h-14 w-full text-base font-medium"
          >
            {loading ? 'Сохранение...' : 'Далее'}
          </Button>
        </div>
      </div>
    </div>
  );
}
