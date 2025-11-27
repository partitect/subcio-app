/**
 * Admin Subscriptions Page - Subscription management
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Button,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  MoreVertical,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';

// Mock subscription data
const mockSubscriptions = [
  {
    id: '1',
    user_email: 'john@example.com',
    user_name: 'John Doe',
    plan: 'pro',
    status: 'active',
    amount: 29,
    started_at: '2025-09-15T00:00:00Z',
    next_billing: '2025-12-15T00:00:00Z',
  },
  {
    id: '2',
    user_email: 'sarah@company.com',
    user_name: 'Sarah Wilson',
    plan: 'unlimited',
    status: 'active',
    amount: 79,
    started_at: '2025-10-01T00:00:00Z',
    next_billing: '2025-12-01T00:00:00Z',
  },
  {
    id: '3',
    user_email: 'mike@youtube.com',
    user_name: 'Mike Chen',
    plan: 'starter',
    status: 'active',
    amount: 9,
    started_at: '2025-11-01T00:00:00Z',
    next_billing: '2025-12-01T00:00:00Z',
  },
  {
    id: '4',
    user_email: 'emma@design.co',
    user_name: 'Emma Davis',
    plan: 'pro',
    status: 'cancelled',
    amount: 29,
    started_at: '2025-06-01T00:00:00Z',
    next_billing: null,
  },
];

export default function AdminSubscriptions() {
  const { t } = useTranslation();
  const theme = useTheme();

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return '#3b82f6';
      case 'pro':
        return '#8b5cf6';
      case 'unlimited':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('admin.subscriptions.title', 'Subscription Management')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('admin.subscriptions.subtitle', 'Monitor and manage user subscriptions')}
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Monthly Revenue
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  $4,280
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha('#22c55e', 0.15),
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DollarSign size={24} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <ArrowUpRight size={14} color="#22c55e" />
              <Typography variant="caption" color="#22c55e" fontWeight={600}>
                +12.5%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Subscribers
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  156
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha('#3b82f6', 0.15),
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={24} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <ArrowUpRight size={14} color="#22c55e" />
              <Typography variant="caption" color="#22c55e" fontWeight={600}>
                +8 new
              </Typography>
              <Typography variant="caption" color="text.secondary">
                this month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Churn Rate
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  2.3%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha('#f59e0b', 0.15),
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={24} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <ArrowDownRight size={14} color="#22c55e" />
              <Typography variant="caption" color="#22c55e" fontWeight={600}>
                -0.5%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                improving
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg. Revenue/User
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  $27.44
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha('#8b5cf6', 0.15),
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={24} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <ArrowUpRight size={14} color="#22c55e" />
              <Typography variant="caption" color="#22c55e" fontWeight={600}>
                +$2.15
              </Typography>
              <Typography variant="caption" color="text.secondary">
                vs last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Plan Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Plan Distribution
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          {[
            { plan: 'Starter', count: 45, color: '#3b82f6', revenue: '$405' },
            { plan: 'Pro', count: 78, color: '#8b5cf6', revenue: '$2,262' },
            { plan: 'Unlimited', count: 33, color: '#f59e0b', revenue: '$2,607' },
          ].map((item) => (
            <Paper
              key={item.plan}
              variant="outlined"
              sx={{
                p: 2,
                minWidth: 160,
                borderColor: alpha(item.color, 0.3),
                bgcolor: alpha(item.color, 0.02),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {item.plan}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: item.color }}>
                {item.count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.revenue}/month
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* Subscriptions Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Subscriptions
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Next Billing</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockSubscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36 }}>
                        {sub.user_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {sub.user_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sub.user_email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.plan}
                      size="small"
                      sx={{
                        bgcolor: alpha(getPlanColor(sub.plan), 0.15),
                        color: getPlanColor(sub.plan),
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      ${sub.amount}/mo
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.status}
                      size="small"
                      color={sub.status === 'active' ? 'success' : 'default'}
                      variant={sub.status === 'active' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {adminService.formatDate(sub.started_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {sub.next_billing 
                        ? adminService.formatDate(sub.next_billing)
                        : '—'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <MoreVertical size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </AdminLayout>
  );
}
