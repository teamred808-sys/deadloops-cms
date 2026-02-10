import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { getAnalyticsSummary, getDailyAnalytics } from '@/lib/api';
import { AnalyticsSummary, DailyVisitorData } from '@/types/blog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export function AnalyticsWidgets() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyVisitorData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, daily] = await Promise.all([
        getAnalyticsSummary(),
        getDailyAnalytics(30),
      ]);
      setSummary(summaryData);
      setDailyData(daily);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Refresh live count every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const todayChange = summary.visitors_yesterday > 0
    ? ((summary.visitors_today - summary.visitors_yesterday) / summary.visitors_yesterday) * 100
    : 0;

  const statCards = [
    {
      title: 'Today',
      value: summary.visitors_today,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: todayChange,
    },
    {
      title: 'Yesterday',
      value: summary.visitors_yesterday,
      icon: Calendar,
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
    },
    {
      title: 'Last 7 Days',
      value: summary.visitors_7d,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: `avg: ${Math.round(summary.visitors_7d / 7)}/day`,
    },
    {
      title: 'Last 30 Days',
      value: summary.visitors_30d,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      subtitle: `avg: ${Math.round(summary.visitors_30d / 30)}/day`,
    },
    {
      title: 'Active Now',
      value: summary.live_visitors,
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      isLive: true,
    },
  ];

  // Format chart data
  const chartData = dailyData.map((d) => ({
    ...d,
    dateFormatted: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </span>
                {stat.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              {stat.change !== undefined && stat.change !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {stat.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs ${
                      stat.change > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {stat.change > 0 ? '+' : ''}
                    {stat.change.toFixed(1)}% from yesterday
                  </span>
                </div>
              )}
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Visitors Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Visitors (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload as DailyVisitorData & { dateFormatted: string };
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.dateFormatted}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.unique_visitors.toLocaleString()} visitors
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.total_pageviews.toLocaleString()} pageviews
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="unique_visitors"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#visitorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
