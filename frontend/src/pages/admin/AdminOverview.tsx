/**
 * Admin Dashboard Overview - Main admin dashboard page
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Skeleton,
  Avatar,
  Chip,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Users,
  DollarSign,
  FolderKanban,
  TrendingUp,
  Activity,
  Clock,
  HardDrive,
  UserPlus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';
import { AdminOverviewStats, GrowthStats, ActivityLog } from '../../types/admin';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, trend, loading }: StatCardProps) {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="text" sx={{ mt: 2, width: '60%' }} />
        <Skeleton variant="text" sx={{ width: '40%' }} />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      {/* Background Decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.1),
        }}
      />
      
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: alpha(color, 0.15),
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {icon}
      </Box>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <TrendingUp size={14} color={trend.value >= 0 ? '#22c55e' : '#ef4444'} />
          <Typography
            variant="caption"
            sx={{ color: trend.value >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {trend.label}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// Activity Item Component
interface ActivityItemProps {
  activity: ActivityLog;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <UserPlus size={16} />;
      case 'login':
        return <Activity size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signup':
        return 'success';
      case 'login':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: 'action.hover',
        }}
      >
        {activity.user_email[0].toUpperCase()}
      </Avatar>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500} noWrap>
          {activity.user_email}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {activity.type === 'signup' ? 'New registration' : 'Logged in'}
        </Typography>
      </Box>
      
      <Box sx={{ textAlign: 'right' }}>
        <Chip
          label={activity.type}
          size="small"
          color={getActivityColor(activity.type) as any}
          variant="outlined"
          sx={{ mb: 0.5 }}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          {adminService.getRelativeTime(activity.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
}

// Plan Distribution Component
interface PlanDistributionProps {
  data: Record<string, number>;
  loading?: boolean;
}

function PlanDistribution({ data, loading }: PlanDistributionProps) {
  const theme = useTheme();
  
  const plans = [
    { key: 'free', label: 'Free', color: '#94a3b8' },
    { key: 'starter', label: 'Starter', color: '#3b82f6' },
    { key: 'pro', label: 'Pro', color: '#8b5cf6' },
    { key: 'unlimited', label: 'Unlimited', color: '#f59e0b' },
  ];

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="rectangular" height={12} sx={{ mt: 2, borderRadius: 1 }} />
        <Box sx={{ mt: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="text" sx={{ mt: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Users by Plan
      </Typography>
      
      {/* Stacked Bar */}
      <Box
        sx={{
          display: 'flex',
          height: 12,
          borderRadius: 2,
          overflow: 'hidden',
          mt: 2,
          mb: 3,
        }}
      >
        {plans.map((plan) => {
          const percentage = total > 0 ? (data[plan.key] || 0) / total * 100 : 0;
          return (
            <Box
              key={plan.key}
              sx={{
                width: `${percentage}%`,
                bgcolor: plan.color,
                transition: 'width 0.3s',
              }}
            />
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {plans.map((plan) => (
          <Box key={plan.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 0.5,
                bgcolor: plan.color,
              }}
            />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {plan.label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {data[plan.key] || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: 'right' }}>
              {total > 0 ? Math.round((data[plan.key] || 0) / total * 100) : 0}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default function AdminOverview() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [growth, setGrowth] = useState<GrowthStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, growthData, activityData] = await Promise.all([
          adminService.getOverviewStats(),
          adminService.getGrowthStats(30),
          adminService.getActivityLogs(1, 10),
        ]);
        setStats(statsData);
        setGrowth(growthData);
        setActivities(activityData.activities);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('admin.overview.title', 'Dashboard Overview')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('admin.overview.subtitle', 'Welcome back! Here\'s what\'s happening with your platform.')}
        </Typography>
      </Box>

      {error && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('admin.stats.totalUsers', 'Total Users')}
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.active || 0} active`}
            icon={<Users size={24} />}
            color="#3b82f6"
            trend={{ value: 12, label: 'vs last month' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('admin.stats.mrr', 'Monthly Revenue')}
            value={adminService.formatCurrency(stats?.revenue.mrr || 0)}
            subtitle={`${stats?.revenue.paying_customers || 0} paying customers`}
            icon={<DollarSign size={24} />}
            color="#22c55e"
            trend={{ value: 8.5, label: 'vs last month' }}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('admin.stats.totalProjects', 'Total Projects')}
            value={stats?.usage.total_projects || 0}
            subtitle={`${Math.round(stats?.usage.total_minutes_used || 0)} minutes processed`}
            icon={<FolderKanban size={24} />}
            color="#8b5cf6"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title={t('admin.stats.storageUsed', 'Storage Used')}
            value={adminService.formatBytes((stats?.usage.total_storage_mb || 0) * 1024 * 1024)}
            subtitle="Across all users"
            icon={<HardDrive size={24} />}
            color="#f59e0b"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3}>
        {/* New Users This Month */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <UserPlus size={20} />
              <Typography variant="subtitle1" fontWeight={600}>
                {t('admin.stats.newUsersMonth', 'New Users This Month')}
              </Typography>
            </Box>
            
            {loading ? (
              <>
                <Skeleton variant="text" height={60} />
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mt: 1 }} />
              </>
            ) : (
              <>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {stats?.users.new_this_month || 0}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Signups progress
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {growth?.total_signups || 0} / 100 goal
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(((growth?.total_signups || 0) / 100) * 100, 100)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Plan Distribution */}
        <Grid item xs={12} md={4}>
          <PlanDistribution
            data={stats?.users.by_plan || {}}
            loading={loading}
          />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('admin.stats.recentActivity', 'Recent Activity')}
            </Typography>
            
            {loading ? (
              <Box>
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="50%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : activities.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {activities.slice(0, 5).map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}
