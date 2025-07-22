import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const revenueRange = searchParams.get('revenueRange') || '30d';
  const ordersRange = searchParams.get('ordersRange') || '30d';

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Execute all dashboard queries in parallel using a single connection
    const [
      transactionsData,
      lowStockData,
      revenueHistoryData,
      ordersHistoryData,
      revenueByCategoryData,
      expensesByCategoryData
    ] = await Promise.all([
      // Get all transactions for calculations
      supabase
        .from('transactions')
        .select('amount, type, category, created_at')
        .eq('status', 'completed')
        .eq('user_uid', user.id)
        .order('created_at', { ascending: true }),
      
      // Get low stock products
      supabase
        .from('products')
        .select('id, name, in_stock, low_stock_threshold, archived')
        .eq('user_uid', user.id)
        .eq('archived', false),
      
      // Get revenue history
      supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('type', 'income')
        .eq('user_uid', user.id)
        .eq('status', 'completed')
        .gte('created_at', getStartDate(revenueRange as any))
        .order('created_at', { ascending: true }),
      
      // Get orders history
      supabase
        .from('orders')
        .select('id, created_at')
        .eq('user_uid', user.id)
        .eq('status', 'completed')
        .gte('created_at', getStartDate(ordersRange as any))
        .order('created_at', { ascending: true }),
      
      // Get revenue by category
      supabase
        .from('order_items')
        .select('quantity, price, product_id, products(category)')
        .gt('quantity', 0),
      
      // Get expenses by category (top selling products)
      supabase
        .from('order_items')
        .select('quantity, price, product_id, products(name)')
        .gt('quantity', 0)
    ]);

    // Process all data
    const transactions = transactionsData.data || [];
    const sellingTransactions = transactions.filter(t => t.category === 'selling');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalRevenue = sellingTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalProfit = totalRevenue - totalExpenses;

    // Filter low stock products in memory
    const lowStock = (lowStockData.data || []).filter(product => {
      const inStock = Number(product.in_stock);
      const threshold = Number(product.low_stock_threshold);
      return !isNaN(inStock) && !isNaN(threshold) && inStock <= threshold;
    });

    // Process cash flow
    const cashFlow = transactions.reduce((acc: Record<string, number>, transaction) => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + transaction.amount;
      return acc;
    }, {});

    // Process profit margin series
    const profitMarginSeries = calculateProfitMarginSeries(transactions);

    // Process revenue history
    const revenueHistory = groupByDay(revenueHistoryData.data || []);
    
    // Process orders history
    const ordersHistory = groupOrdersByDay(ordersHistoryData.data || []);

    // Process revenue by category
    const revenueByCategory = processRevenueByCategory(revenueByCategoryData.data || []);

    // Process top selling products
    const topProducts = processTopProducts(expensesByCategoryData.data || []);

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      totalProfit,
      cashFlow: Object.entries(cashFlow).map(([date, amount]) => ({ date, amount })),
      profitMargin: profitMarginSeries,
      lowStock,
      revenueHistory,
      ordersHistory,
      revenueByCategory,
      topProducts
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

// Helper functions
type Range = '1d' | '7d' | '30d' | '3mo' | '6mo' | '1y';

function getStartDate(range: Range): string {
  const now = new Date();
  switch (range) {
    case '1d':
      now.setDate(now.getDate() - 1);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '3mo':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now.toISOString().split('T')[0];
}

function calculateProfitMarginSeries(transactions: any[]) {
  const grouped: Record<string, { selling: number, expenses: number }> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.created_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = { selling: 0, expenses: 0 };
    }
    
    if (transaction.category === 'selling') {
      grouped[date].selling += transaction.amount;
    } else if (transaction.type === 'expense') {
      grouped[date].expenses += transaction.amount;
    }
  });

  return Object.entries(grouped).map(([date, data]) => ({
    date,
    margin: data.selling > 0 ? ((data.selling - data.expenses) / data.selling) * 100 : 0
  }));
}

function groupByDay(data: any[]) {
  const grouped: Record<string, number> = {};
  data.forEach(row => {
    const day = row.created_at.split('T')[0];
    grouped[day] = (grouped[day] || 0) + row.amount;
  });
  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
}

function groupOrdersByDay(data: any[]) {
  const grouped: Record<string, number> = {};
  data.forEach(row => {
    const day = row.created_at.split('T')[0];
    grouped[day] = (grouped[day] || 0) + 1;
  });
  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

function processRevenueByCategory(data: any[]) {
  const revenueByCategory: Record<string, number> = {};
  data.forEach(item => {
    const category = Array.isArray(item.products) ? 
      (item.products[0]?.category || 'Uncategorized') : 
      (item.products?.category || 'Uncategorized');
    const revenue = (item.price || 0) * (item.quantity || 0);
    revenueByCategory[category] = (revenueByCategory[category] || 0) + revenue;
  });
  return Object.entries(revenueByCategory).map(([category, revenue]) => ({ category, revenue }));
}

function processTopProducts(data: any[]) {
  const productStats: Record<string, { name: string, revenue: number, quantity: number }> = {};
  data.forEach(item => {
    let name = 'Unnamed';
    if (item.products && typeof item.products === 'object') {
      name = Array.isArray(item.products) ? 
        (item.products[0]?.name || 'Unnamed') : 
        (item.products.name || 'Unnamed');
    }
    const revenue = (item.price || 0) * (item.quantity || 0);
    const quantity = item.quantity || 0;
    if (productStats[name]) {
      productStats[name].revenue += revenue;
      productStats[name].quantity += quantity;
    } else {
      productStats[name] = { name, revenue, quantity };
    }
  });
  return Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}
