import { useState, useEffect } from 'react';

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  cashFlow: Array<{ date: string; amount: number }>;
  profitMargin: Array<{ date: string; margin: number }>;
  lowStock: Array<{ id: number; name: string; in_stock: number; low_stock_threshold: number }>;
  revenueHistory: Array<{ date: string; amount: number }>;
  ordersHistory: Array<{ date: string; count: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
}

export function useDashboardData(revenueRange: string = '30d', ordersRange: string = '30d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/admin/dashboard?revenueRange=${revenueRange}&ordersRange=${ordersRange}`,
          {
            // Add cache headers for better performance
            headers: {
              'Cache-Control': 'max-age=300', // 5 minutes cache
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [revenueRange, ordersRange]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/admin/dashboard?revenueRange=${revenueRange}&ordersRange=${ordersRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
