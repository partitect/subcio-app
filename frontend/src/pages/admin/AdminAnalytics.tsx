/**
 * Admin Analytics Page - Charts and statistics
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  TrendingUp,
  Users,
  DollarSign,
  FolderKanban,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';
import { GrowthStats } from '../../types/admin';

// Simple Line Chart Component (no external library)
interface ChartDataPoint {
  date: string;
  count: number;
}

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
}

function SimpleLineChart({ data, height = 200, color = '#6366f1' }: SimpleLineChartProps) {
  const theme = useTheme();
  
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1 || 1)) * 100,
    y: 100 - (d.count / maxValue) * 100,
  }));

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = pathData + ` L 100 100 L 0 100 Z`;

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={theme.palette.divider}
            strokeWidth="0.3"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill={alpha(color, 0.1)}
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill={color}
          />
        ))}
      </svg>
      
      {/* Labels */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          px: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {data[0]?.date?.split('-').slice(1).join('/')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data[data.length - 1]?.date?.split('-').slice(1).join('/')}
        </Typography>
      </Box>
    </Box>
  );
}

// Stat Summary Card
interface SummaryCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, value, change, icon, color }: SummaryCardProps) {
  const theme = useTheme();
  
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(color, 0.15),
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: change >= 0 
              ? alpha('#22c55e', 0.1)
              : alpha('#ef4444', 0.1),
          }}
        >
          <TrendingUp 
            size={14} 
            color={change >= 0 ? '#22c55e' : '#ef4444'}
            style={{ transform: change < 0 ? 'rotate(180deg)' : undefined }}
          />
          <Typography
            variant="caption"
            sx={{ 
              color: change >= 0 ? '#22c55e' : '#ef4444',
              fontWeight: 600,
            }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Paper>
  );
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [growthData, setGrowthData] = useState<GrowthStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getGrowthStats(parseInt(period));
        setGrowthData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const handlePeriodChange = (_: any, newPeriod: '7' | '30' | '90' | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('admin.analytics.title', 'Analytics')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('admin.analytics.subtitle', 'Platform usage and growth statistics')}
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="7">7 days</ToggleButton>
          <ToggleButton value="30">30 days</ToggleButton>
          <ToggleButton value="90">90 days</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="New Signups"
            value={growthData?.total_signups || 0}
            change={12}
            icon={<Users size={20} />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Revenue"
            value={adminService.formatCurrency(4280)}
            change={8.5}
            icon={<DollarSign size={20} />}
            color="#22c55e"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Projects Created"
            value={156}
            change={-3}
            icon={<FolderKanban size={20} />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Active Users"
            value={423}
            change={15}
            icon={<TrendingUp size={20} />}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* User Growth Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t('admin.analytics.userGrowth', 'User Growth')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Daily new user registrations over the last {period} days
        </Typography>
        
        {loading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : growthData?.daily_signups && growthData.daily_signups.length > 0 ? (
          <Box sx={{ pb: 4 }}>
            <SimpleLineChart
              data={growthData.daily_signups}
              height={200}
              color={theme.palette.primary.main}
            />
          </Box>
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            No data available
          </Box>
        )}
      </Paper>

      {/* Additional Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('admin.analytics.revenue', 'Revenue Trend')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monthly recurring revenue
            </Typography>
            
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <Box sx={{ pb: 4 }}>
                <SimpleLineChart
                  data={[
                    { date: '2025-01', count: 2100 },
                    { date: '2025-02', count: 2450 },
                    { date: '2025-03', count: 2800 },
                    { date: '2025-04', count: 3200 },
                    { date: '2025-05', count: 3650 },
                    { date: '2025-06', count: 4280 },
                  ]}
                  height={200}
                  color="#22c55e"
                />
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('admin.analytics.projects', 'Projects Created')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Weekly project creation trend
            </Typography>
            
            {loading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <Box sx={{ pb: 4 }}>
                <SimpleLineChart
                  data={[
                    { date: 'W1', count: 45 },
                    { date: 'W2', count: 52 },
                    { date: 'W3', count: 48 },
                    { date: 'W4', count: 61 },
                    { date: 'W5', count: 55 },
                    { date: 'W6', count: 72 },
                  ]}
                  height={200}
                  color="#8b5cf6"
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top Plans */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t('admin.analytics.conversionFunnel', 'Conversion Funnel')}
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          {[
            { label: 'Visitors', value: 10000, color: '#94a3b8' },
            { label: 'Signups', value: 1500, color: '#3b82f6' },
            { label: 'Activated', value: 800, color: '#8b5cf6' },
            { label: 'Paid Users', value: 180, color: '#22c55e' },
          ].map((item, index, arr) => {
            const percentage = (item.value / arr[0].value) * 100;
            return (
              <Box key={item.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: alpha(item.color, 0.2),
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${percentage}%`,
                      bgcolor: item.color,
                      borderRadius: 1,
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </AdminLayout>
  );
}
