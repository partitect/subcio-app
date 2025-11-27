/**
 * Admin Users Management - User list and management page
 */

import { useState, useEffect, useCallback } from 'react';
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
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Tooltip,
  Checkbox,
  alpha,
  useTheme,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Search,
  MoreVertical,
  Edit,
  Ban,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  Crown,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../components/admin/AdminLayout';
import * as adminService from '../../services/adminService';
import { AdminUser, UserFilters, AdminUserUpdate } from '../../types/admin';
import { UserRole, SubscriptionPlan } from '../../types/auth';

// Role/Plan Badge Component
const RoleBadge = ({ role }: { role: UserRole }) => {
  const config: Record<UserRole, { color: string; icon: React.ReactNode }> = {
    user: { color: '#94a3b8', icon: null },
    moderator: { color: '#3b82f6', icon: <Shield size={12} /> },
    admin: { color: '#8b5cf6', icon: <Shield size={12} /> },
    super_admin: { color: '#f59e0b', icon: <Crown size={12} /> },
  };

  const { color, icon } = config[role] || config.user;

  return (
    <Chip
      label={role.replace('_', ' ')}
      size="small"
      icon={icon as any}
      sx={{
        bgcolor: alpha(color, 0.15),
        color: color,
        fontWeight: 600,
        textTransform: 'capitalize',
        '& .MuiChip-icon': { color: 'inherit' },
      }}
    />
  );
};

const PlanBadge = ({ plan }: { plan: SubscriptionPlan }) => {
  const colors: Record<SubscriptionPlan, string> = {
    free: '#94a3b8',
    starter: '#3b82f6',
    pro: '#8b5cf6',
    unlimited: '#f59e0b',
  };

  return (
    <Chip
      label={plan}
      size="small"
      sx={{
        bgcolor: alpha(colors[plan] || '#94a3b8', 0.15),
        color: colors[plan] || '#94a3b8',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    />
  );
};

// Edit User Dialog
interface EditUserDialogProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (userId: number, data: AdminUserUpdate) => Promise<void>;
}

function EditUserDialog({ open, user, onClose, onSave }: EditUserDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AdminUserUpdate>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        plan: user.plan,
        role: user.role,
        is_active: user.is_active,
        is_verified: user.is_verified,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('admin.users.editUser', 'Edit User')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label={t('admin.users.name', 'Name')}
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
          />
          <TextField
            label={t('admin.users.email', 'Email')}
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>{t('admin.users.plan', 'Plan')}</InputLabel>
            <Select
              value={formData.plan || 'free'}
              label="Plan"
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as SubscriptionPlan })}
            >
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="starter">Starter</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="unlimited">Unlimited</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('admin.users.role', 'Role')}</InputLabel>
            <Select
              value={formData.role || 'user'}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Typography variant="body2">{t('admin.users.active', 'Active')}</Typography>
              </Box>
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={formData.is_verified ?? false}
                  onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                />
                <Typography variant="body2">{t('admin.users.verified', 'Verified')}</Typography>
              </Box>
            </FormControl>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<UserFilters>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; user: AdminUser } | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.listUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        ...filters,
      });
      setUsers(response.users);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
    setMenuAnchor({ el: event.currentTarget, user });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    handleMenuClose();
  };

  const handleSaveUser = async (userId: number, data: AdminUserUpdate) => {
    try {
      await adminService.updateUser(userId, data);
      setSuccess('User updated successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleBan = async (user: AdminUser) => {
    handleMenuClose();
    try {
      if (user.is_active) {
        await adminService.banUser(user.id);
        setSuccess(`User ${user.email} has been banned`);
      } else {
        await adminService.unbanUser(user.id);
        setSuccess(`User ${user.email} has been unbanned`);
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleResetUsage = async (user: AdminUser) => {
    handleMenuClose();
    try {
      await adminService.resetUserUsage(user.id);
      setSuccess(`Usage reset for ${user.email}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to reset usage');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    handleMenuClose();
    if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      try {
        await adminService.deleteUser(user.id);
        setSuccess(`User ${user.email} has been deleted`);
        fetchUsers();
      } catch (err: any) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(users.map((u) => u.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('admin.users.title', 'User Management')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('admin.users.subtitle', 'Manage and monitor all user accounts')}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder={t('admin.users.searchPlaceholder', 'Search by email or name...')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
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
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('admin.users.plan', 'Plan')}</InputLabel>
            <Select
              value={filters.plan || ''}
              label="Plan"
              onChange={(e) => setFilters({ ...filters, plan: e.target.value as SubscriptionPlan || undefined })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="starter">Starter</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="unlimited">Unlimited</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('admin.users.role', 'Role')}</InputLabel>
            <Select
              value={filters.role || ''}
              label="Role"
              onChange={(e) => setFilters({ ...filters, role: e.target.value as UserRole || undefined })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('admin.users.status', 'Status')}</InputLabel>
            <Select
              value={filters.is_active === undefined ? '' : filters.is_active ? 'active' : 'inactive'}
              label="Status"
              onChange={(e) => {
                const val = e.target.value;
                setFilters({
                  ...filters,
                  is_active: val === '' ? undefined : val === 'active',
                });
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < users.length}
                    checked={users.length > 0 && selected.length === users.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>{t('admin.users.user', 'User')}</TableCell>
                <TableCell>{t('admin.users.plan', 'Plan')}</TableCell>
                <TableCell>{t('admin.users.role', 'Role')}</TableCell>
                <TableCell>{t('admin.users.status', 'Status')}</TableCell>
                <TableCell>{t('admin.users.usage', 'Usage')}</TableCell>
                <TableCell>{t('admin.users.lastLogin', 'Last Login')}</TableCell>
                <TableCell align="right">{t('admin.users.actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton variant="rectangular" height={60} />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('admin.users.noUsers', 'No users found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    selected={selected.includes(user.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={user.avatar_url || undefined}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.email[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {user.name || 'No name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={user.plan} />
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Chip
                          icon={<CheckCircle size={14} />}
                          label="Active"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          icon={<XCircle size={14} />}
                          label="Inactive"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.monthly_exports_used} / {user.monthly_exports_limit} videos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {adminService.formatBytes(user.storage_used_mb * 1024 * 1024)} storage
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {adminService.getRelativeTime(user.last_login)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreVertical size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuAnchor && handleEdit(menuAnchor.user)}>
          <Edit size={16} style={{ marginRight: 8 }} />
          {t('admin.users.edit', 'Edit')}
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleBan(menuAnchor.user)}>
          <Ban size={16} style={{ marginRight: 8 }} />
          {menuAnchor?.user.is_active 
            ? t('admin.users.ban', 'Ban User')
            : t('admin.users.unban', 'Unban User')
          }
        </MenuItem>
        <MenuItem onClick={() => menuAnchor && handleResetUsage(menuAnchor.user)}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          {t('admin.users.resetUsage', 'Reset Usage')}
        </MenuItem>
        <MenuItem 
          onClick={() => menuAnchor && handleDelete(menuAnchor.user)}
          sx={{ color: 'error.main' }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          {t('admin.users.delete', 'Delete')}
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <EditUserDialog
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />
    </AdminLayout>
  );
}
