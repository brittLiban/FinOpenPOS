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
import { Loader2Icon } from "lucide-react";
import {
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";

// Helper to safely convert to number
const toNumber = (v: unknown): number =>
  typeof v === "bigint"
    ? Number(v)
    : typeof v === "string"
      ? parseFloat(v)
      : typeof v === "number"
        ? v
        : 0;


export default function Page() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [cashFlow, setCashFlow] = useState<{ date: string; amount: unknown }[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState({});
  const [expensesByCategory, setExpensesByCategory] = useState({});
  const [profitMargin, setProfitMargin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<{ id: number; name: string; in_stock: number; low_stock_threshold: number }[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ date: string; amount: number }[]>([]);
  const [revenueRange, setRevenueRange] = useState<'1d' | '7d' | '30d' | '3mo' | '6mo' | '1y'>('30d');
  const [ordersHistory, setOrdersHistory] = useState<{ date: string; count: number }[]>([]);
  const [ordersRange, setOrdersRange] = useState<'1d' | '7d' | '30d' | '3mo' | '6mo' | '1y'>('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          ordersHistoryRes
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
          fetch(`/api/admin/orders/history?range=${ordersRange}`)
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

        setTotalRevenue(toNumber(revenue.totalRevenue));
        setTotalExpenses(toNumber(expenses.totalExpenses));
        setTotalProfit(toNumber(profit.totalProfit));
        setCashFlow(Object.entries(cashFlowData.cashFlow).map(([date, amount]) => ({ date, amount })));
        setRevenueByCategory(revenueByCategoryData.revenueByCategory);
        setExpensesByCategory(expensesByCategoryData.expensesByCategory);
        setProfitMargin(profitMarginData.profitMargin);
        setLowStock(low);
        setRevenueHistory(revenueHistoryData || []);
        setOrdersHistory(ordersHistoryData || []);
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
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4">
      <div className="grid auto-rows-max items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Low Stock Card at the very top */}
        {Array.isArray(lowStock) && lowStock.length > 0 && (
          <Card className="mb-4 lg:col-span-2">
            <CardHeader>
              <CardTitle>⚠️ Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="font-medium text-destructive">
                      {p.in_stock}/{p.low_stock_threshold}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Orders Over Time</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">See how many orders your business is processing.</div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1 text-xs"
                value={ordersRange}
                onChange={e => setOrdersRange(e.target.value as any)}
                title="Select orders time range"
              >
                <option value="1d">Past Day</option>
                <option value="7d">Past Week</option>
                <option value="30d">Past 30 Days</option>
                <option value="3mo">Past 3 Months</option>
                <option value="6mo">Past 6 Months</option>
                <option value="1y">Past Year</option>
              </select>
              <BarChartIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Orders", color: "#2563eb" } }}>
              <LineChart width={400} height={180} data={ordersHistory} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="count" type="monotone" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
            <div className="text-xs text-muted-foreground mt-2">
              {ordersRange === '1d' && 'Shows orders for the past 24 hours.'}
              {ordersRange === '7d' && 'Shows orders for the past 7 days.'}
              {ordersRange === '30d' && 'Shows orders for the past 30 days.'}
              {ordersRange === '3mo' && 'Shows orders for the past 3 months.'}
              {ordersRange === '6mo' && 'Shows orders for the past 6 months.'}
              {ordersRange === '1y' && 'Shows orders for the past year.'}
            </div>
          </CardContent>
        </Card>
        {Array.isArray(lowStock) && lowStock.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>⚠️ Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="font-medium text-destructive">
                      {p.in_stock}/{p.low_stock_threshold}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}


        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">Track your revenue trends and spot growth opportunities.</div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1 text-xs"
                value={revenueRange}
                onChange={e => setRevenueRange(e.target.value as any)}
              >
                <option value="1d">Past Day</option>
                <option value="7d">Past Week</option>
                <option value="30d">Past 30 Days</option>
                <option value="3mo">Past 3 Months</option>
                <option value="6mo">Past 6 Months</option>
                <option value="1y">Past Year</option>
              </select>
              <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">${toNumber(totalRevenue).toFixed(2)}</div>
            <ChartContainer config={{ amount: { label: "Revenue", color: "#16a34a" } }}>
              <LineChart width={400} height={180} data={revenueHistory} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="amount" type="monotone" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
            <div className="text-xs text-muted-foreground mt-2">
              {revenueRange === '1d' && 'Shows revenue for the past 24 hours.'}
              {revenueRange === '7d' && 'Shows revenue for the past 7 days.'}
              {revenueRange === '30d' && 'Shows revenue for the past 30 days.'}
              {revenueRange === '3mo' && 'Shows revenue for the past 3 months.'}
              {revenueRange === '6mo' && 'Shows revenue for the past 6 months.'}
              {revenueRange === '1y' && 'Shows revenue for the past year.'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${toNumber(totalExpenses).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profit (selling)</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${toNumber(totalProfit).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue by Category</CardTitle>
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PiechartcustomChart data={revenueByCategory} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expenses by Category</CardTitle>
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PiechartcustomChart data={expensesByCategory} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin (selling)</CardTitle>
            <BarChartIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <BarchartChart data={profitMargin} className="aspect-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <LinechartChart data={cashFlow} className="aspect-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DollarSignIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function PiechartcustomChart({ data, ...props }: { data: Record<string, number> } & React.HTMLAttributes<HTMLDivElement>) {
  const chartData = Object.entries(data).map(([category, value]) => ({
    category,
    value,
    fill: `var(--color-${category})`,
  }));

  const chartConfig = Object.fromEntries(
    Object.keys(data).map((category, index) => [
      category,
      {
        label: category,
        color: `hsl(var(--chart-${index + 1}))`,
      },
    ])
  ) as ChartConfig;

  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={chartData} dataKey="value" nameKey="category" outerRadius={80} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

function BarChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function BarchartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  const chartConfig = {
    margin: {
      label: "Margin",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div {...props}>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
          <Bar dataKey="margin" fill="var(--color-margin)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function LinechartChart({ data, ...props }: { data: any[] } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          amount: {
            label: "Amount",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
