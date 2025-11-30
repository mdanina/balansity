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
  try {
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
  } catch (error) {
    console.error('Error in getMetrics:', error);
    // Возвращаем пустые метрики вместо падения
    return {
      users: {
        total: 0,
        newThisPeriod: 0,
        activeThisPeriod: 0,
        byRegion: [],
        marketingConsent: 0,
      },
      profiles: {
        total: 0,
        byType: [],
        averageFamilySize: 0,
        childrenByAge: [],
      },
      assessments: {
        total: 0,
        completed: 0,
        abandoned: 0,
        inProgress: 0,
        byType: [],
        conversionRate: 0,
        averageCompletionTime: null,
        paid: 0,
        byWorryTags: [],
      },
      appointments: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        inProgress: 0,
        byType: [],
      },
      payments: {
        totalRevenue: 0,
        revenueThisPeriod: 0,
        successful: 0,
        failed: 0,
        averageCheck: 0,
        byMethod: [],
      },
      packages: {
        sold: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
      },
    };
  }
}

async function getUsersMetrics(startDate: string, endDate: string) {
  try {
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, region, marketing_consent, created_at');
    
    if (allUsersError) {
      console.error('Error fetching all users:', allUsersError);
      throw allUsersError;
    }

    const { data: newUsers, error: newUsersError } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (newUsersError) {
      console.error('Error fetching new users:', newUsersError);
      throw newUsersError;
    }

    // Активные пользователи - те, кто создал оценку или записался на консультацию за период
    const { data: activeAssessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('profile_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (assessmentsError) {
      console.error('Error fetching active assessments:', assessmentsError);
      throw assessmentsError;
    }

    const { data: activeAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (appointmentsError) {
      console.error('Error fetching active appointments:', appointmentsError);
      throw appointmentsError;
    }

    const activeUserIds = new Set<string>();
    
    // Добавляем пользователей из оценок - ИСПРАВЛЕНО: один запрос вместо N+1
    if (activeAssessments && activeAssessments.length > 0) {
      const profileIds = activeAssessments
        .map(a => a.profile_id)
        .filter((id): id is string => Boolean(id));
      
      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id')
          .in('id', profileIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Продолжаем без профилей
        } else if (profiles) {
          profiles.forEach(profile => {
            if (profile.user_id) {
              activeUserIds.add(profile.user_id);
            }
          });
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
  } catch (error) {
    console.error('Error in getUsersMetrics:', error);
    return {
      total: 0,
      newThisPeriod: 0,
      activeThisPeriod: 0,
      byRegion: [],
      marketingConsent: 0,
    };
  }
}

async function getProfilesMetrics() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('type, dob, user_id');

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

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
  } catch (error) {
    console.error('Error in getProfilesMetrics:', error);
    return {
      total: 0,
      byType: [],
      averageFamilySize: 0,
      childrenByAge: [],
    };
  }
}

async function getAssessmentsMetrics(startDate: string, endDate: string) {
  try {
    const { data: allAssessments, error } = await supabase
      .from('assessments')
      .select('id, assessment_type, status, is_paid, started_at, completed_at, worry_tags')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('Error fetching assessments:', error);
      throw error;
    }

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
  } catch (error) {
    console.error('Error in getAssessmentsMetrics:', error);
    return {
      total: 0,
      completed: 0,
      abandoned: 0,
      inProgress: 0,
      byType: [],
      conversionRate: 0,
      averageCompletionTime: null,
      paid: 0,
      byWorryTags: [],
    };
  }
}

async function getAppointmentsMetrics(startDate: string, endDate: string) {
  try {
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, status, appointment_type_id, scheduled_at')
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
    }

    if (!appointments || appointments.length === 0) {
      return {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        inProgress: 0,
        byType: [],
      };
    }

    const scheduled = appointments.filter((a) => a.status === 'scheduled');
    const completed = appointments.filter((a) => a.status === 'completed');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');
    const noShow = appointments.filter((a) => a.status === 'no_show');
    const inProgress = appointments.filter((a) => a.status === 'in_progress');

    // По типам консультаций - оптимизировано: запрашиваем только если есть appointments
    const typeIds = [...new Set(appointments.map((a) => a.appointment_type_id).filter(Boolean))];
    let types: Array<{ id: string; name: string }> = [];
    
    if (typeIds.length > 0) {
      const { data: typesData, error: typesError } = await supabase
        .from('appointment_types')
        .select('id, name')
        .in('id', typeIds);

      if (typesError) {
        console.error('Error fetching appointment types:', typesError);
        // Продолжаем без типов
      } else {
        types = typesData || [];
      }
    }

    const byType: Record<string, number> = {};
    appointments.forEach((a) => {
      const type = types.find((t) => t.id === a.appointment_type_id);
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
  } catch (error) {
    console.error('Error in getAppointmentsMetrics:', error);
    return {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      inProgress: 0,
      byType: [],
    };
  }
}

async function getPaymentsMetrics(startDate: string, endDate: string) {
  try {
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method, created_at');

    if (allPaymentsError) {
      console.error('Error fetching all payments:', allPaymentsError);
      throw allPaymentsError;
    }

    const { data: periodPayments, error: periodPaymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, payment_method')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (periodPaymentsError) {
      console.error('Error fetching period payments:', periodPaymentsError);
      throw periodPaymentsError;
    }

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
  } catch (error) {
    console.error('Error in getPaymentsMetrics:', error);
    return {
      totalRevenue: 0,
      revenueThisPeriod: 0,
      successful: 0,
      failed: 0,
      averageCheck: 0,
      byMethod: [],
    };
  }
}

async function getPackagesMetrics() {
  try {
    // Оптимизировано: один запрос для purchases с join к packages через package_id
    // Загружаем все purchases с нужными данными
    const { data: allPurchases, error: purchasesError } = await supabase
      .from('package_purchases')
      .select('id, package_id, sessions_remaining');

    if (purchasesError) {
      console.error('Error fetching package purchases:', purchasesError);
      throw purchasesError;
    }

    if (!allPurchases || allPurchases.length === 0) {
      return {
        sold: 0,
        sessionsUsed: 0,
        sessionsRemaining: 0,
      };
    }

    // Получаем уникальные package_id
    const packageIds = [...new Set(allPurchases.map(p => p.package_id).filter(Boolean))];
    
    // Загружаем packages одним запросом
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, session_count')
      .in('id', packageIds);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      throw packagesError;
    }

    const totalSessions = (allPurchases || []).reduce((sum, p) => sum + p.sessions_remaining, 0);

    // Подсчитываем использованные сессии
    let sessionsUsed = 0;
    (allPurchases || []).forEach((purchase) => {
      const pkg = packages?.find((p) => p.id === purchase.package_id);
      if (pkg) {
        sessionsUsed += pkg.session_count - purchase.sessions_remaining;
      }
    });

    return {
      sold: allPurchases.length,
      sessionsUsed,
      sessionsRemaining: totalSessions,
    };
  } catch (error) {
    console.error('Error in getPackagesMetrics:', error);
    return {
      sold: 0,
      sessionsUsed: 0,
      sessionsRemaining: 0,
    };
  }
}

