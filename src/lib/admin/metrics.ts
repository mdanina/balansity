// Утилиты для расчета метрик продукта
import { supabase } from '@/lib/supabase';

export interface Metrics {
  users: {
    total: number;
    newThisPeriod: number;
    activeThisPeriod: number;
    byRegion: Array<{ region: string | null; count: number }>;
    marketingConsent: number;
  };
  profiles: {
    total: number;
    byType: Array<{ type: string; count: number }>;
    averageFamilySize: number;
    childrenByAge: Array<{ ageRange: string; count: number }>;
  };
  assessments: {
    total: number;
    completed: number;
    abandoned: number;
    inProgress: number;
    byType: Array<{ type: string; count: number }>;
    conversionRate: number;
    averageCompletionTime: number | null;
    paid: number;
    byWorryTags: Array<{ tag: string; count: number }>;
  };
  appointments: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
    inProgress: number;
    byType: Array<{ type: string; count: number }>;
  };
  payments: {
    totalRevenue: number;
    revenueThisPeriod: number;
    successful: number;
    failed: number;
    averageCheck: number;
    byMethod: Array<{ method: string; count: number }>;
  };
  packages: {
    sold: number;
    sessionsUsed: number;
    sessionsRemaining: number;
  };
}

export interface MetricsPeriod {
  startDate: string;
  endDate: string;
}

// Получение метрик за период
export async function getMetrics(period?: MetricsPeriod): Promise<Metrics> {
  const startDate = period?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = period?.endDate || new Date().toISOString();

  // Параллельно загружаем все метрики
  const [
    usersMetrics,
    profilesMetrics,
    assessmentsMetrics,
    appointmentsMetrics,
    paymentsMetrics,
    packagesMetrics,
  ] = await Promise.all([
    getUsersMetrics(startDate, endDate),
    getProfilesMetrics(),
    getAssessmentsMetrics(startDate, endDate),
    getAppointmentsMetrics(startDate, endDate),
    getPaymentsMetrics(startDate, endDate),
    getPackagesMetrics(),
  ]);

  return {
    users: usersMetrics,
    profiles: profilesMetrics,
    assessments: assessmentsMetrics,
    appointments: appointmentsMetrics,
    payments: paymentsMetrics,
    packages: packagesMetrics,
  };
}

async function getUsersMetrics(startDate: string, endDate: string) {
  const { data: allUsers } = await supabase.from('users').select('id, region, marketing_consent, created_at');
  const { data: newUsers } = await supabase
    .from('users')
    .select('id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Активные пользователи - те, кто создал оценку или записался на консультацию за период
  const { data: activeAssessments } = await supabase
    .from('assessments')
    .select('profile_id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { data: activeAppointments } = await supabase
    .from('appointments')
    .select('user_id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const activeUserIds = new Set<string>();
  
  // Добавляем пользователей из оценок
  if (activeAssessments) {
    for (const assessment of activeAssessments) {
      if (assessment.profile_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', assessment.profile_id)
          .single();
        if (profile?.user_id) {
          activeUserIds.add(profile.user_id);
        }
      }
    }
  }

  // Добавляем пользователей из консультаций
  if (activeAppointments) {
    activeAppointments.forEach((apt) => {
      if (apt.user_id) {
        activeUserIds.add(apt.user_id);
      }
    });
  }

  // Распределение по регионам
  const byRegion = (allUsers || []).reduce((acc, user) => {
    const region = user.region || 'Не указан';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: allUsers?.length || 0,
    newThisPeriod: newUsers?.length || 0,
    activeThisPeriod: activeUserIds.size,
    byRegion: Object.entries(byRegion).map(([region, count]) => ({ region, count })),
    marketingConsent: (allUsers || []).filter((u) => u.marketing_consent).length,
  };
}

async function getProfilesMetrics() {
  const { data: profiles } = await supabase.from('profiles').select('type, dob, user_id');

  const byType = (profiles || []).reduce((acc, profile) => {
    acc[profile.type] = (acc[profile.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Распределение детей по возрастам
  const children = (profiles || []).filter((p) => p.type === 'child' && p.dob);
  const childrenByAge = children.reduce((acc, child) => {
    if (!child.dob) return acc;
    const age = Math.floor((Date.now() - new Date(child.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const ageRange = age < 3 ? '0-2' : age < 6 ? '3-5' : age < 10 ? '6-9' : age < 14 ? '10-13' : '14+';
    acc[ageRange] = (acc[ageRange] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Средний размер семьи
  const usersWithProfiles = new Set((profiles || []).map((p) => p.user_id));
  const averageFamilySize =
    usersWithProfiles.size > 0
      ? (profiles || []).length / usersWithProfiles.size
      : 0;

  return {
    total: profiles?.length || 0,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    averageFamilySize: Math.round(averageFamilySize * 10) / 10,
    childrenByAge: Object.entries(childrenByAge).map(([ageRange, count]) => ({ ageRange, count })),
  };
}

async function getAssessmentsMetrics(startDate: string, endDate: string) {
  const { data: allAssessments } = await supabase
    .from('assessments')
    .select('id, assessment_type, status, is_paid, started_at, completed_at, worry_tags')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const completed = (allAssessments || []).filter((a) => a.status === 'completed');
  const abandoned = (allAssessments || []).filter((a) => a.status === 'abandoned');
  const inProgress = (allAssessments || []).filter((a) => a.status === 'in_progress');

  const byType = (allAssessments || []).reduce((acc, assessment) => {
    acc[assessment.assessment_type] = (acc[assessment.assessment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Конверсия
  const total = allAssessments?.length || 0;
  const conversionRate = total > 0 ? (completed.length / total) * 100 : 0;

  // Среднее время прохождения
  const completedWithTimes = completed.filter(
    (a) => a.started_at && a.completed_at
  );
  const averageCompletionTime =
    completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, a) => {
          const time = new Date(a.completed_at!).getTime() - new Date(a.started_at!).getTime();
          return sum + time;
        }, 0) / completedWithTimes.length / (1000 * 60) // в минутах
      : null;

  // Worry tags
  const worryTagsCount: Record<string, number> = {};
  (allAssessments || []).forEach((a) => {
    if (a.worry_tags) {
      const tags = typeof a.worry_tags === 'object' && !Array.isArray(a.worry_tags)
        ? Object.values(a.worry_tags).flat()
        : Array.isArray(a.worry_tags)
        ? a.worry_tags
        : [];
      tags.forEach((tag: string) => {
        worryTagsCount[tag] = (worryTagsCount[tag] || 0) + 1;
      });
    }
  });

  return {
    total,
    completed: completed.length,
    abandoned: abandoned.length,
    inProgress: inProgress.length,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageCompletionTime: averageCompletionTime ? Math.round(averageCompletionTime) : null,
    paid: (allAssessments || []).filter((a) => a.is_paid).length,
    byWorryTags: Object.entries(worryTagsCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  };
}

async function getAppointmentsMetrics(startDate: string, endDate: string) {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, status, appointment_type_id, scheduled_at')
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate);

  const scheduled = (appointments || []).filter((a) => a.status === 'scheduled');
  const completed = (appointments || []).filter((a) => a.status === 'completed');
  const cancelled = (appointments || []).filter((a) => a.status === 'cancelled');
  const noShow = (appointments || []).filter((a) => a.status === 'no_show');
  const inProgress = (appointments || []).filter((a) => a.status === 'in_progress');

  // По типам консультаций
  const typeIds = new Set((appointments || []).map((a) => a.appointment_type_id));
  const { data: types } = await supabase
    .from('appointment_types')
    .select('id, name')
    .in('id', Array.from(typeIds));

  const byType: Record<string, number> = {};
  (appointments || []).forEach((a) => {
    const type = types?.find((t) => t.id === a.appointment_type_id);
    const typeName = type?.name || 'Неизвестно';
    byType[typeName] = (byType[typeName] || 0) + 1;
  });

  return {
    scheduled: scheduled.length,
    completed: completed.length,
    cancelled: cancelled.length,
    noShow: noShow.length,
    inProgress: inProgress.length,
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
  };
}

async function getPaymentsMetrics(startDate: string, endDate: string) {
  const { data: allPayments } = await supabase
    .from('payments')
    .select('id, amount, status, payment_method, created_at');

  const { data: periodPayments } = await supabase
    .from('payments')
    .select('id, amount, status, payment_method')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const successful = (allPayments || []).filter((p) => p.status === 'completed');
  const failed = (allPayments || []).filter((p) => p.status === 'failed');

  const totalRevenue = successful.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const revenueThisPeriod = (periodPayments || [])
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const averageCheck = successful.length > 0 ? totalRevenue / successful.length : 0;

  const byMethod = (allPayments || []).reduce((acc, payment) => {
    const method = payment.payment_method || 'Неизвестно';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueThisPeriod: Math.round(revenueThisPeriod * 100) / 100,
    successful: successful.length,
    failed: failed.length,
    averageCheck: Math.round(averageCheck * 100) / 100,
    byMethod: Object.entries(byMethod).map(([method, count]) => ({ method, count })),
  };
}

async function getPackagesMetrics() {
  const { data: purchases } = await supabase
    .from('package_purchases')
    .select('id, sessions_remaining');

  const totalSessions = (purchases || []).reduce((sum, p) => sum + p.sessions_remaining, 0);

  // Подсчитываем использованные сессии (общее количество сессий в пакете минус оставшиеся)
  // Для этого нужно знать изначальное количество сессий в пакете
  const { data: packages } = await supabase.from('packages').select('id, session_count');
  const { data: allPurchases } = await supabase
    .from('package_purchases')
    .select('id, package_id, sessions_remaining');

  let sessionsUsed = 0;
  (allPurchases || []).forEach((purchase) => {
    const pkg = packages?.find((p) => p.id === purchase.package_id);
    if (pkg) {
      sessionsUsed += pkg.session_count - purchase.sessions_remaining;
    }
  });

  return {
    sold: purchases?.length || 0,
    sessionsUsed,
    sessionsRemaining: totalSessions,
  };
}

