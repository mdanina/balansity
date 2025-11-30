import { useQuery } from '@tanstack/react-query';
import { getMetrics, type Metrics, type MetricsPeriod } from '@/lib/admin/metrics';

export function useAdminMetrics(period?: MetricsPeriod) {
  return useQuery<Metrics>({
    queryKey: ['admin-metrics', period],
    queryFn: () => getMetrics(period),
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 5 * 60 * 1000, // Обновлять каждые 5 минут
  });
}

