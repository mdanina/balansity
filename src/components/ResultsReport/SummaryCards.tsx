import type { Database } from '@/lib/supabase';
import type { ChildCheckupData } from '@/hooks/useResultsData';
import { getStatusText } from '@/utils/resultsCalculations';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Assessment = Database['public']['Tables']['assessments']['Row'];

interface ParentResults {
  anxiety?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  depression?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  total?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface FamilyResults {
  family_stress?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  partner_relationship?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
  coparenting?: { score: number; status: 'concerning' | 'borderline' | 'typical' };
}

interface SummaryCardsProps {
  childrenCheckups: ChildCheckupData[];
  parentAssessment: Assessment | null;
  familyAssessment: Assessment | null;
}

export function SummaryCards({ childrenCheckups, parentAssessment, familyAssessment }: SummaryCardsProps) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Child Cards - показываем всех детей */}
        {childrenCheckups.map((childData) => {
          const childProfile = childData.profile;
          const childResults = childData.results;
          const childAge = childProfile.dob 
            ? new Date().getFullYear() - new Date(childProfile.dob).getFullYear()
            : null;
          
          return (
            <div key={childProfile.id} className="min-w-[320px] flex-1 rounded-lg bg-lavender p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">
                  {childProfile.first_name} {childProfile.last_name || ''}
                </h3>
                {childAge !== null && (
                  <p className="text-sm text-white/90">{childAge} лет</p>
                )}
              </div>
              <div className="space-y-2">
                {childResults.emotional && (
                  <div>
                    <span className="font-medium text-white">
                      {getStatusText(childResults.emotional.status)}
                    </span>
                    <p className="text-sm text-white/90">Эмоции</p>
                  </div>
                )}
                {childResults.conduct && (
                  <div>
                    <span className="font-medium text-white">
                      {getStatusText(childResults.conduct.status)}
                    </span>
                    <p className="text-sm text-white/90">Поведение</p>
                  </div>
                )}
                {childResults.peer_problems && (
                  <div>
                    <span className="font-medium text-white">
                      {getStatusText(childResults.peer_problems.status)}
                    </span>
                    <p className="text-sm text-white/90">Социальное</p>
                  </div>
                )}
                {childResults.hyperactivity && (
                  <div>
                    <span className="font-medium text-white">
                      {getStatusText(childResults.hyperactivity.status)}
                    </span>
                    <p className="text-sm text-white/90">Активность</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* You Card */}
        {parentAssessment && (
          <div className="min-w-[320px] flex-1 rounded-lg bg-secondary p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">Вы</h3>
            </div>
            <div className="space-y-2">
              {parentAssessment.results_summary ? (
                (() => {
                  const parentResults = parentAssessment.results_summary as ParentResults;
                  return (
                    <>
                      {parentResults.anxiety && (
                        <div>
                          <span className="font-medium text-white">
                            {getStatusText(parentResults.anxiety.status)}
                          </span>
                          <p className="text-sm text-white/90">Тревожность</p>
                        </div>
                      )}
                      {parentResults.depression && (
                        <div>
                          <span className="font-medium text-white">
                            {getStatusText(parentResults.depression.status)}
                          </span>
                          <p className="text-sm text-white/90">Депрессия</p>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <>
                  <p className="text-sm text-white/90">
                    Родительская оценка завершена
                  </p>
                  {parentAssessment.completed_at && (
                    <p className="text-xs text-white/80">
                      {new Date(parentAssessment.completed_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Family Card */}
        {familyAssessment && (
          <div className="min-w-[320px] flex-1 rounded-lg bg-sky-blue p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">Семья</h3>
            </div>
            <div className="space-y-2">
              {familyAssessment.results_summary ? (
                (() => {
                  const familyResults = familyAssessment.results_summary as FamilyResults;
                  return (
                    <>
                      {familyResults.family_stress && (
                        <div>
                          <span className="font-medium text-white">
                            {getStatusText(familyResults.family_stress.status)}
                          </span>
                          <p className="text-sm text-white/90">Семейный стресс</p>
                        </div>
                      )}
                      {familyResults.partner_relationship && (
                        <div>
                          <span className="font-medium text-white">
                            {getStatusText(familyResults.partner_relationship.status)}
                          </span>
                          <p className="text-sm text-white/90">Отношения с партнером</p>
                        </div>
                      )}
                      {familyResults.coparenting && (
                        <div>
                          <span className="font-medium text-white">
                            {getStatusText(familyResults.coparenting.status)}
                          </span>
                          <p className="text-sm text-white/90">Совместное воспитание</p>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <>
                  <p className="text-sm text-white/90">
                    Семейная оценка завершена
                  </p>
                  {familyAssessment.completed_at && (
                    <p className="text-xs text-white/80">
                      {new Date(familyAssessment.completed_at).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




