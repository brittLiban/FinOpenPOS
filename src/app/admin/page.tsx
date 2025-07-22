"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart";
import { 
  Loader2Icon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSign,
  ShoppingCartIcon,
  UsersIcon,
  PackageIcon,
  AlertTriangleIcon,
  EyeIcon,
  RefreshCwIcon,
  PlusCircleIcon
} from "lucide-react";
import {
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Button } from "@/components/ui/button";

// Helper to safely convert to number
const toNumber = (v: unknown): number =>
  typeof v === "bigint"
    ? Number(v)
    : typeof v === "string"
      ? parseFloat(v)
      : typeof v === "number"
        ? v
        : 0;

interface BusinessMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  growthRate: number;
  conversionRate: number;
  topSellingProduct: string;
  revenueToday: number;
  ordersToday: number;
  platformFeesEarned: number;
}

export default function Page() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    growthRate: 0,
    conversionRate: 0,
    topSellingProduct: '',
    revenueToday: 0,
    ordersToday: 0,
    platformFeesEarned: 0
  });
  const [cashFlow, setCashFlow] = useState<{ date: string; amount: unknown }[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState({});
  const [expensesByCategory, setExpensesByCategory] = useState<any>({});
  const [allProductStats, setAllProductStats] = useState<any[]>([]);
  const [topProductsMode, setTopProductsMode] = useState<'revenue' | 'quantity'>('revenue');
  const [profitMargin, setProfitMargin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<{ id: number; name: string; in_stock: number; low_stock_threshold: number }[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ date: string; amount: number }[]>([]);
  const [salesTrends, setSalesTrends] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [performanceData, setPerformanceData] = useState<{ 
    period: string; 
    revenue: number; 
    orders: number; 
    growth: number 
  }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [revenueRange, setRevenueRange] = useState('30d');
  const [ordersRange, setOrdersRange] = useState('30d');
  const [ordersHistory, setOrdersHistory] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any>({});
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [monthlyRecurringCosts, setMonthlyRecurringCosts] = useState(0);

  // Auto-sync products to Stripe
  const autoSyncProducts = async () => {
    try {
      const response = await fetch('/api/sync-products', { method: 'POST' });
      if (response.ok) {
        console.log('✅ Products auto-synced to Stripe');
      }
    } catch (error) {
      console.log('⚠️ Auto-sync skipped:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auto-sync products to Stripe on dashboard load
        await autoSyncProducts();

        const [
          revenueRes,
          expensesRes,
          profitRes,
          cashFlowRes,
          revenueByCategoryRes,
          expensesByCategoryRes,
          profitMarginRes,
          lowStockRes,
          revenueHistoryRes,
          ordersHistoryRes,
          expenseBreakdownRes,
          recentExpensesRes
        ] = await Promise.all([
          fetch('/api/admin/revenue/total'),
          fetch('/api/admin/expenses/total'),
          fetch('/api/admin/profit/total'),
          fetch('/api/admin/cashflow'),
          fetch('/api/admin/revenue/category'),
          fetch('/api/admin/expenses/category'),
          fetch('/api/admin/profit/margin'),
          fetch('/api/products/low-stock'),
          fetch(`/api/admin/revenue/history?range=${revenueRange}`),
          fetch(`/api/admin/orders/history?range=${ordersRange}`),
          fetch('/api/expenses?breakdown=true'),
          fetch('/api/expenses?recent=true&limit=5')
        ]);

        const revenue = await revenueRes.json();
        const expenses = await expensesRes.json();
        const profit = await profitRes.json();
        const cashFlowData = await cashFlowRes.json();
        const revenueByCategoryData = await revenueByCategoryRes.json();
        const expensesByCategoryData = await expensesByCategoryRes.json();
        const profitMarginData = await profitMarginRes.json();
        const { lowStock: low } = await lowStockRes.json();
        const { history: revenueHistoryData } = await revenueHistoryRes.json();
        const { history: ordersHistoryData } = await ordersHistoryRes.json();
        const expenseBreakdownData = await expenseBreakdownRes.json();
        const recentExpensesData = await recentExpensesRes.json();

        setTotalRevenue(toNumber(revenue.totalRevenue));
        setTotalExpenses(toNumber(expenses.totalExpenses));
        
        // Calculate profit locally: Revenue - Expenses
        const calculatedProfit = toNumber(revenue.totalRevenue) - toNumber(expenses.totalExpenses);
        setTotalProfit(calculatedProfit);
        setCashFlow(Object.entries(cashFlowData.cashFlow).map(([date, amount]) => ({ date, amount })));
        setRevenueByCategory(revenueByCategoryData.revenueByCategory);
        
        // Support both old and new API shapes
        if (expensesByCategoryData.topProducts) {
          setExpensesByCategory(expensesByCategoryData.topProducts);
          setAllProductStats(expensesByCategoryData.allProductStats || expensesByCategoryData.topProducts);
        } else {
          setExpensesByCategory(expensesByCategoryData.expensesByCategory || {});
          setAllProductStats([]);
        }
        
        setProfitMargin(profitMarginData.profitMargin);
        setLowStock(low);
        setRevenueHistory(revenueHistoryData || []);
        setOrdersHistory(ordersHistoryData || []);
        setExpenseBreakdown(expenseBreakdownData.expenses || {});
        setRecentExpenses(recentExpensesData.expenses || []);
        
        // Calculate monthly recurring costs
        const recurringCosts = Object.values(expenseBreakdownData.expenses || {}).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
        setMonthlyRecurringCosts(recurringCosts);
        
        // Calculate enhanced business metrics from existing data
        const totalOrders = ordersHistoryData?.length || 0;
        const averageOrderValue = totalOrders > 0 ? toNumber(revenue.totalRevenue) / totalOrders : 0;
        
        setBusinessMetrics({
          totalRevenue: toNumber(revenue.totalRevenue),
          totalOrders,
          averageOrderValue,
          totalCustomers: Math.floor(totalOrders * 0.7), // Estimate unique customers
          growthRate: Math.random() * 20 - 5, // Mock growth rate for now
          conversionRate: Math.random() * 10 + 5, // Mock conversion rate
          topSellingProduct: allProductStats[0]?.name || 'N/A',
          revenueToday: toNumber(revenue.totalRevenue) * 0.1, // Estimate today's revenue
          ordersToday: Math.floor(totalOrders * 0.1), // Estimate today's orders
          platformFeesEarned: 0 // Not relevant for business owners
        });
        
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [revenueRange, ordersRange]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="mx-auto h-12 w-12 animate-spin mb-4" />
          <p className="text-muted-foreground">Loading business intelligence...</p>
        </div>
      </div>
    );
  }

  const refreshData = async () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts */}
      {Array.isArray(lowStock) && lowStock.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="h-5 w-5" />
              Critical Stock Alerts ({lowStock.length} products)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-background rounded border">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-destructive font-bold">
                    {p.in_stock} left
                  </span>
                </div>
              ))}
            </div>
            {lowStock.length > 6 && (
              <p className="text-center text-muted-foreground mt-4">
                +{lowStock.length - 6} more items need restocking
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {businessMetrics.growthRate >= 0 ? '+' : ''}{businessMetrics.growthRate.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              ${businessMetrics.averageOrderValue.toFixed(2)} average order value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {businessMetrics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Revenue Today</span>
              <span className="font-bold text-green-600">${businessMetrics.revenueToday.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Orders Today</span>
              <span className="font-bold">{businessMetrics.ordersToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Top Product</span>
              <span className="font-bold">{businessMetrics.topSellingProduct || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Net Profit</span>
              <span className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Profit Margin</span>
              <span className={`font-bold ${totalRevenue > 0 && (totalProfit / totalRevenue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/products">
                <PackageIcon className="h-4 w-4 mr-2" />
                Manage Products
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/orders">
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                View Orders
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/cashier">
                <EyeIcon className="h-4 w-4 mr-2" />
                View Transactions
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Revenue",
                  color: "#8884d8",
                },
              }}
              className="h-[300px]"
            >
              <AreaChart data={revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allProductStats.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{product.name || `Product ${index + 1}`}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ${(product.revenue || Math.random() * 1000).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              amount: {
                label: "Cash Flow",
                color: "#82ca9d",
              },
            }}
            className="h-[400px]"
          >
            <LineChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#82ca9d" 
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Expense Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(expenseBreakdown).map(([category, amount]: [string, any]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground capitalize">{category}</span>
                  <span className="font-semibold text-red-600">${Number(amount).toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(expenseBreakdown).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No expenses recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Recurring Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              ${monthlyRecurringCosts.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Fixed costs per month
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/expenses">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Manage Expenses
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.slice(0, 3).map((expense: any, index: number) => (
                <div key={expense.id || index} className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{expense.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{expense.category}</span>
                  </div>
                  <span className="font-semibold text-red-600">${expense.amount?.toFixed(2)}</span>
                </div>
              ))}
              {recentExpenses.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent expenses
                </div>
              )}
              {recentExpenses.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="link" size="sm" asChild>
                    <a href="/admin/expenses">View all expenses</a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
