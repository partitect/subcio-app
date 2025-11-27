/**
 * Admin Projects Page - Project management
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search,
  MoreVertical,
  Play,
  Eye,
  Trash2,
  Calendar,
  Film,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';

// Mock data for projects
const mockProjects = [
  {
    id: '1',
    name: 'Marketing Video Q4',
    user_email: 'john@example.com',
    status: 'completed',
    duration_seconds: 180,
    created_at: '2025-11-25T10:30:00Z',
    preset: 'Neon Glow',
  },
  {
    id: '2',
    name: 'Product Demo',
    user_email: 'sarah@company.com',
    status: 'processing',
    duration_seconds: 420,
    created_at: '2025-11-26T14:15:00Z',
    preset: 'Minimal White',
  },
  {
    id: '3',
    name: 'Tutorial Episode 5',
    user_email: 'mike@youtube.com',
    status: 'completed',
    duration_seconds: 890,
    created_at: '2025-11-26T09:45:00Z',
    preset: 'Anime Style',
  },
  {
    id: '4',
    name: 'Social Media Clip',
    user_email: 'emma@tiktok.com',
    status: 'failed',
    duration_seconds: 60,
    created_at: '2025-11-27T16:00:00Z',
    preset: 'Bold Impact',
  },
];

export default function AdminProjects() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const filteredProjects = mockProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('admin.projects.title', 'Project Management')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('admin.projects.subtitle', 'View and manage all user projects')}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Projects', value: '1,234', icon: <Film size={18} />, color: '#3b82f6' },
          { label: 'Processing', value: '12', icon: <Clock size={18} />, color: '#f59e0b' },
          { label: 'This Week', value: '156', icon: <Calendar size={18} />, color: '#22c55e' },
        ].map((stat) => (
          <Paper
            key={stat.label}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 180,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(stat.color, 0.15),
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder={t('admin.projects.searchPlaceholder', 'Search by project name or user...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Projects Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Preset</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Film size={18} />
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {project.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{project.user_email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={project.preset} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDuration(project.duration_seconds)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      size="small"
                      color={getStatusColor(project.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {adminService.getRelativeTime(project.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Eye size={16} />
                    </IconButton>
                    <IconButton size="small">
                      <Play size={16} />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Trash2 size={16} />
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
